import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { WebSocket } from "ws";
import { buildApp } from "./app";
import { Store } from "./store";
import type { Trip, Command } from "../../../packages/domain/src/index";
const credential = () => randomBytes(32).toString("hex");
const profile = { name: "테스트", vehicle: "ev", level: 21, source: "manual" };
test(
  "HTTP + WebSocket two-client lifecycle, concurrency, auth, persistence, reconnect",
  { timeout: 15000 },
  async () => {
    const dir = mkdtempSync(join(tmpdir(), "convoy-test-"));
    const path = join(dir, "state.sqlite");
    let store = new Store(path);
    let app = await buildApp(store);
    let ws: WebSocket | undefined;
    try {
      await app.listen({ host: "127.0.0.1", port: 0 });
      const addr = app.server.address();
      assert.ok(addr && typeof addr === "object");
      const a = credential(),
        b = credential();
      const request = async (
        method: "GET" | "POST",
        url: string,
        token: string,
        payload?: unknown,
      ) =>
        app.inject({
          method,
          url,
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
          payload: payload === undefined ? undefined : JSON.stringify(payload),
        });
      const createId = randomUUID();
      const create = await request("POST", "/trips", a, {
        requestId: createId,
        profile,
        destination: "gangneung",
      });
      assert.equal(create.statusCode, 200);
      const host = create.json() as { trip: Trip; memberId: string };
      const duplicate = await request("POST", "/trips", a, {
        requestId: createId,
        profile,
        destination: "gangneung",
      });
      assert.equal(duplicate.json().trip.id, host.trip.id);
      const conflict = await request("POST", "/trips", a, {
        requestId: createId,
        profile,
        destination: "gyeongpo",
      });
      assert.equal(conflict.statusCode, 409);
      assert.equal(
        (await request("GET", `/trips/${host.trip.id}`, b)).statusCode,
        401,
      );
      assert.equal(
        (
          await request("POST", "/join", b, {
            requestId: randomUUID(),
            code: "bad",
            profile,
          })
        ).statusCode,
        400,
      );
      assert.equal(
        (
          await request("POST", "/join", b, {
            requestId: randomUUID(),
            code: "ZZZZZZ",
            profile,
          })
        ).statusCode,
        404,
      );
      ws = new WebSocket(`ws://127.0.0.1:${addr.port}/sync`);
      const snapshots: Trip[] = [];
      await new Promise<void>((resolve, reject) => {
        ws!.once("open", () => {
          ws!.send(
            JSON.stringify({
              type: "subscribe",
              tripId: host.trip.id,
              token: a,
            }),
          );
        });
        ws!.on("message", (raw) => {
          snapshots.push(JSON.parse(raw.toString()).trip);
          resolve();
        });
        ws!.once("error", reject);
      });
      const joined = (
        await request("POST", "/join", b, {
          requestId: randomUUID(),
          code: host.trip.code,
          profile: { ...profile, name: "동행", vehicle: "ice", level: 60 },
        })
      ).json() as { trip: Trip; memberId: string };
      let trip = joined.trip;
      assert.equal(trip.members.length, 2);
      const command = async (
        token: string,
        c: Command,
        revision = trip.revision,
        id = randomUUID(),
      ) =>
        request("POST", `/trips/${trip.id}/commands`, token, {
          requestId: id,
          revision,
          command: c,
        });
      assert.equal(
        (await command(a, { type: "propose", stopId: "munmak" }, 1)).json()
          .code,
        "STALE_TRIP",
      );
      trip = (await command(a, { type: "propose", stopId: "munmak" })).json();
      const votes = await Promise.all([
        command(a, { type: "vote", version: 1, decision: "approve" }),
        command(b, { type: "vote", version: 1, decision: "approve" }),
      ]);
      assert.ok(votes.every((r) => r.statusCode === 200));
      trip = (await request("GET", `/trips/${trip.id}`, a)).json();
      assert.equal(trip.status, "agreed");
      assert.ok(trip.members.every((m) => m.navigation === "idle"));
      assert.equal(
        (await command(b, { type: "vote", version: 0, decision: "approve" }))
          .statusCode,
        400,
      );
      trip = (
        await command(a, {
          type: "navigation",
          version: 1,
          status: "opening",
          attempt: "c8a6a0b1-bf77-4fa8-85b5-6e0369e86123",
        })
      ).json();
      trip = (
        await command(a, {
          type: "navigation",
          version: 1,
          status: "opened",
          attempt: "c8a6a0b1-bf77-4fa8-85b5-6e0369e86123",
        })
      ).json();
      assert.equal(trip.members[1].navigation, "idle");
      const arriveId = randomUUID(),
        rev = trip.revision;
      trip = (
        await command(a, { type: "arrive", version: 1 }, rev, arriveId)
      ).json();
      const after = trip.revision;
      const repeated = await command(
        a,
        { type: "arrive", version: 1 },
        rev,
        arriveId,
      );
      assert.equal(repeated.json().revision, after);
      assert.equal(
        (await command(a, { type: "finish" })).json().code,
        "WAITING_ARRIVALS",
      );
      trip = (await command(b, { type: "arrive", version: 1 })).json();
      trip = (await command(a, { type: "finish" })).json();
      assert.equal(trip.status, "completed");
      await new Promise((r) => setTimeout(r, 40));
      assert.ok(snapshots.some((t) => t.status === "agreed"));
      assert.ok(snapshots.some((t) => t.status === "completed"));
      ws.terminate();
      await app.close();
      store.close();
      store = new Store(path);
      app = await buildApp(store);
      const restored = await request("GET", `/trips/${trip.id}`, b);
      assert.equal(restored.json().status, "completed");
      assert.equal(restored.json().members.length, 2);
      await app.listen({ host: "127.0.0.1", port: 0 });
      const restoredAddress = app.server.address();
      assert.ok(restoredAddress && typeof restoredAddress === "object");
      ws = new WebSocket(`ws://127.0.0.1:${restoredAddress.port}/sync`);
      const resumed = await new Promise<Trip>((resolve, reject) => {
        ws!.once("open", () =>
          ws!.send(
            JSON.stringify({ type: "subscribe", tripId: trip.id, token: b }),
          ),
        );
        ws!.once("message", (raw) => resolve(JSON.parse(raw.toString()).trip));
        ws!.once("error", reject);
      });
      assert.equal(resumed.status, "completed");
      assert.equal(resumed.revision, trip.revision);
    } finally {
      ws?.terminate();
      await app.close();
      store.close();
      rmSync(dir, { recursive: true, force: true });
    }
  },
);
test("demo actor uses real versioned commands and is unavailable in real trips", async () => {
  const store = new Store(":memory:");
  const app = await buildApp(store);
  try {
    const token = credential();
    const headers = { authorization: `Bearer ${token}` };
    const c = await app.inject({
      method: "POST",
      url: "/trips",
      headers,
      payload: {
        requestId: randomUUID(),
        profile: { ...profile, source: "demo" },
        destination: "gangneung",
        demo: true,
      },
    });
    let trip = c.json().trip as Trip;
    assert.equal(trip.members.length, 2);
    trip = (
      await app.inject({
        method: "POST",
        url: `/trips/${trip.id}/commands`,
        headers,
        payload: {
          requestId: randomUUID(),
          revision: trip.revision,
          command: { type: "propose", stopId: "munmak" },
        },
      })
    ).json();
    trip = (
      await app.inject({
        method: "POST",
        url: `/trips/${trip.id}/demo`,
        headers,
        payload: { action: "reject" },
      })
    ).json();
    assert.equal(trip.proposal?.status, "rejected");
    const real = await app.inject({
      method: "POST",
      url: "/trips",
      headers,
      payload: {
        requestId: randomUUID(),
        profile,
        destination: "gangneung",
        demo: false,
      },
    });
    const denied = await app.inject({
      method: "POST",
      url: `/trips/${real.json().trip.id}/demo`,
      headers,
      payload: { action: "approve" },
    });
    assert.equal(denied.statusCode, 403);
    assert.equal(denied.json().code, "DEMO_ONLY");
  } finally {
    await app.close();
    store.close();
  }
});
test("a car can leave and rejoin with its original device credential", async () => {
  const store = new Store(":memory:");
  const app = await buildApp(store);
  try {
    const a = credential(),
      b = credential();
    const first = store.create(
      a,
      randomUUID(),
      { name: "Host", vehicle: "ev", level: null, source: "manual" },
      "gangneung",
      false,
    );
    const guest = store.join(b, randomUUID(), first.trip.code, {
      name: "Guest",
      vehicle: "ice",
      level: null,
      source: "manual",
    });
    const left = store.command(
      guest.trip.id,
      b,
      randomUUID(),
      { type: "leave" },
      guest.trip.revision,
    );
    assert.equal(left.members.length, 1);
    assert.throws(() => store.auth(left.id, b), /Member has left/);
    const back = store.join(b, randomUUID(), left.code, {
      name: "Back again",
      vehicle: "ice",
      level: null,
      source: "manual",
    });
    assert.equal(back.memberId, guest.memberId);
    assert.equal(store.auth(back.trip.id, b).memberId, back.memberId);
    assert.equal(back.trip.members.length, 2);
    const response = await app.inject({
      method: "GET",
      url: `/trips/${back.trip.id}`,
      headers: { authorization: `Bearer ${b}` },
    });
    assert.equal(response.statusCode, 200);
  } finally {
    await app.close();
    store.close();
  }
});
