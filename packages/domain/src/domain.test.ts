import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addMember,
  applyCommand,
  createMember,
  rankStops,
  type Trip,
  type Command,
} from "./index";
import { seedStops } from "./stops";
const now = Date.now();
function fixture(): Trip {
  return {
    id: "trip",
    code: "ABC234",
    hostId: "a",
    destination: "gangneung",
    demo: false,
    revision: 1,
    proposalSequence: 0,
    createdAt: now,
    expiresAt: now + 100000,
    status: "forming",
    members: [
      createMember(
        "a",
        { name: "A", vehicle: "ev", level: 20, source: "manual" },
        now,
      ),
      createMember(
        "b",
        { name: "B", vehicle: "ice", level: 60, source: "manual" },
        now,
      ),
    ],
    proposal: null,
    completedAt: null,
  };
}
const run = (t: Trip, id: string, c: Command) =>
  applyCommand(t, id, c, seedStops, now);
test("ranking combines cars, hard connector and detour constraints", () => {
  const t = fixture();
  t.members[1].needs = ["food", "rest"];
  t.members[1].required = ["food"];
  const ranked = rankStops(t.members, seedStops);
  assert.equal(ranked[0].stop.id, "munmak");
  assert.deepEqual(ranked[0].covered, ["charge", "food", "rest"]);
  assert.ok(!ranked.some((r) => r.stop.id === "yeoju"));
  t.members[0].connector = "chademo";
  assert.deepEqual(
    rankStops(t.members, seedStops).map((r) => r.stop.id),
    ["hoengseong"],
  );
  t.members[0].maxDetour = 3;
  assert.equal(rankStops(t.members, seedStops).length, 0);
});
test("missing telemetry does not invent charge or range", () => {
  const t = fixture();
  t.members[0].level = null;
  assert.ok(rankStops(t.members, seedStops).some((r) => r.stop.id === "yeoju"));
});
test("every member must approve; handoff and arrival stay individual", () => {
  let t = run(fixture(), "a", { type: "propose", stopId: "munmak" });
  t = run(t, "a", { type: "vote", version: 1, decision: "approve" });
  assert.equal(t.status, "voting");
  t = run(t, "b", { type: "vote", version: 1, decision: "approve" });
  assert.equal(t.status, "agreed");
  assert.ok(t.members.every((m) => m.navigation === "idle"));
  t = run(t, "a", {
    type: "navigation",
    version: 1,
    status: "opening",
    attempt: "c8a6a0b1-bf77-4fa8-85b5-6e0369e86123",
  });
  t = run(t, "a", {
    type: "navigation",
    version: 1,
    status: "opened",
    attempt: "c8a6a0b1-bf77-4fa8-85b5-6e0369e86123",
  });
  assert.equal(t.members[1].navigation, "idle");
  t = run(t, "a", { type: "arrive", version: 1 });
  assert.throws(() => run(t, "a", { type: "finish" }), /WAITING_ARRIVALS/);
  t = run(t, "b", { type: "arrive", version: 1 });
  t = run(t, "a", { type: "finish" });
  assert.equal(t.status, "completed");
  assert.throws(
    () => run(t, "a", { type: "propose", stopId: "munmak" }),
    /TRIP_ENDED/,
  );
});
test("rejection closes votes; re-proposal never inherits old approvals", () => {
  let t = run(fixture(), "a", { type: "propose", stopId: "munmak" });
  t = run(t, "a", { type: "vote", version: 1, decision: "approve" });
  t = run(t, "b", { type: "vote", version: 1, decision: "reject" });
  assert.equal(t.proposal?.status, "rejected");
  assert.throws(
    () => run(t, "a", { type: "vote", version: 1, decision: "approve" }),
    /VOTING_CLOSED/,
  );
  t = run(t, "a", { type: "propose", stopId: "hoengseong" });
  assert.equal(t.proposal?.version, 2);
  assert.deepEqual(t.proposal?.votes, {});
  assert.throws(
    () => run(t, "a", { type: "vote", version: 1, decision: "approve" }),
    /STALE_PROPOSAL/,
  );
});
test("membership and needs changes invalidate voting proposals", () => {
  let t = run(fixture(), "a", { type: "propose", stopId: "munmak" });
  t = addMember(
    t,
    createMember(
      "c",
      { name: "C", vehicle: "ice", source: "manual", level: null },
      now,
    ),
    now,
  );
  assert.equal(t.proposal, null);
  t = run(t, "a", { type: "propose", stopId: "munmak" });
  t = run(t, "b", {
    type: "needs",
    input: {
      needs: ["rest"],
      required: [],
      connector: "ccs1",
      maxDetour: 10,
      accessible: false,
      threshold: 25,
      level: 60,
    },
  });
  assert.equal(t.status, "forming");
  assert.equal(t.proposal, null);
});
test("host, capacity, expiration and transitions are enforced", () => {
  const t = fixture();
  assert.throws(
    () => run(t, "b", { type: "propose", stopId: "munmak" }),
    /Only the host/,
  );
  assert.throws(
    () =>
      run(t, "a", {
        type: "navigation",
        version: 1,
        status: "opened",
        attempt: "c8a6a0b1-bf77-4fa8-85b5-6e0369e86123",
      }),
    /STALE_PROPOSAL/,
  );
  t.members = Array.from({ length: 6 }, (_, i) => ({
    ...t.members[0],
    id: String(i),
  }));
  assert.throws(() => addMember(t, t.members[0], now), /GROUP_FULL/);
  t.expiresAt = now - 1;
  assert.throws(() => run(t, "0", { type: "leave" }), /TRIP_ENDED/);
});
test("leaving transfers host and removes obsolete consensus", () => {
  let t = run(fixture(), "a", { type: "propose", stopId: "munmak" });
  t = run(t, "a", { type: "leave" });
  assert.equal(t.hostId, "b");
  assert.equal(t.members.length, 1);
  assert.equal(t.proposal, null);
});
test("an older Maps attempt cannot overwrite a newer handoff", () => {
  let t = run(fixture(), "a", { type: "propose", stopId: "munmak" });
  t = run(t, "a", { type: "vote", version: 1, decision: "approve" });
  t = run(t, "b", { type: "vote", version: 1, decision: "approve" });
  const first = "c8a6a0b1-bf77-4fa8-85b5-6e0369e86123",
    second = "e2b9b7c7-06b1-48d6-b267-09d1112f2d36";
  t = run(t, "a", {
    type: "navigation",
    version: 1,
    status: "opening",
    attempt: first,
  });
  t = run(t, "a", {
    type: "navigation",
    version: 1,
    status: "opening",
    attempt: second,
  });
  assert.throws(
    () =>
      run(t, "a", {
        type: "navigation",
        version: 1,
        status: "failed",
        attempt: first,
      }),
    /STALE_HANDOFF/,
  );
  t = run(t, "a", {
    type: "navigation",
    version: 1,
    status: "opened",
    attempt: second,
  });
  assert.equal(t.members[0].navigation, "opened");
});
