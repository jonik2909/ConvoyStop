import { randomBytes, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Trip, Command } from "../packages/domain/src/index";
const base = process.env.CONVOY_API ?? "http://127.0.0.1:8787";
const path = resolve(".runtime/peer.json");
interface Peer {
  token: string;
  tripId: string;
  memberId: string;
}
let peer: Peer;
async function api<T>(url: string, body?: unknown): Promise<T> {
  const r = await fetch(base + url, {
    method: body ? "POST" : "GET",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${peer.token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.code);
  return data as T;
}
const action = process.argv[2] ?? "status";
if (action === "create") {
  peer = { token: randomBytes(32).toString("hex"), tripId: "", memberId: "" };
  const result = await api<{ trip: Trip; memberId: string }>("/trips", {
    requestId: randomUUID(),
    profile: {
      name: "테스트 동행",
      vehicle: "ice",
      source: "manual",
      level: null,
    },
    destination: "gangneung",
    demo: false,
  });
  peer.tripId = result.trip.id;
  peer.memberId = result.memberId;
  mkdirSync(resolve(".runtime"), { recursive: true, mode: 0o700 });
  writeFileSync(path, JSON.stringify(peer), { mode: 0o600 });
  const trip = await api<Trip>(`/trips/${peer.tripId}/commands`, {
    requestId: randomUUID(),
    revision: result.trip.revision,
    command: {
      type: "needs",
      input: {
        needs: ["food", "rest"],
        required: ["food"],
        level: null,
        connector: "ccs1",
        threshold: 25,
        maxDetour: 10,
        accessible: false,
      },
    },
  });
  console.log(
    JSON.stringify({
      code: trip.code,
      status: trip.status,
      members: trip.members.length,
    }),
  );
} else {
  peer = JSON.parse(readFileSync(path, "utf8")) as Peer;
  let trip = await api<Trip>(`/trips/${peer.tripId}`);
  const version = trip.proposal?.version ?? 0;
  let command: Command | undefined;
  if (action === "propose")
    command = { type: "propose", stopId: process.argv[3] ?? "munmak" };
  if (action === "approve" || action === "reject")
    command = { type: "vote", version, decision: action };
  if (action === "arrive") command = { type: "arrive", version };
  if (action === "finish") command = { type: "finish" };
  if (action === "leave") command = { type: "leave" };
  if (command)
    trip = await api<Trip>(`/trips/${peer.tripId}/commands`, {
      requestId: randomUUID(),
      revision: trip.revision,
      command,
    });
  console.log(
    JSON.stringify(
      {
        code: trip.code,
        status: trip.status,
        revision: trip.revision,
        proposal: trip.proposal,
        members: trip.members.map((m) => ({
          name: m.name,
          source: m.source,
          navigation: m.navigation,
          arrived: m.arrived,
        })),
      },
      null,
      2,
    ),
  );
}
