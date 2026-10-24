import { z } from "zod";

export const needSchema = z.enum(["charge", "fuel", "food", "rest", "toilet"]);
export type Need = z.infer<typeof needSchema>;
export const vehicleSchema = z.enum(["ev", "ice"]);
export const profileSchema = z.object({
  name: z.string().trim().min(1).max(20),
  vehicle: vehicleSchema,
  level: z.number().int().min(0).max(100).nullable().default(null),
  source: z.enum(["manual", "demo", "unavailable"]).default("manual"),
});
export const needsSchema = z
  .object({
    needs: z
      .array(needSchema)
      .max(5)
      .transform((v) => [...new Set(v)]),
    required: z
      .array(needSchema)
      .max(5)
      .transform((v) => [...new Set(v)]),
    connector: z.enum(["ccs1", "chademo"]).default("ccs1"),
    maxDetour: z.number().int().min(0).max(20),
    accessible: z.boolean().default(false),
    threshold: z.number().int().min(5).max(60).default(25),
    level: z.number().int().min(0).max(100).nullable(),
  })
  .refine(
    (v) => v.required.every((n) => v.needs.includes(n)),
    "Required needs must be selected",
  );
export type NeedsInput = z.infer<typeof needsSchema>;
export const destinationSchema = z.enum(["gangneung", "gyeongpo", "anmok"]);
export type Destination = z.infer<typeof destinationSchema>;
export const destinations = {
  gangneung: { ko: "강릉역", en: "Gangneung Station" },
  gyeongpo: { ko: "경포해변", en: "Gyeongpo Beach" },
  anmok: { ko: "안목해변", en: "Anmok Beach" },
} as const;
export type TelemetrySource = "manual" | "demo" | "unavailable";
export interface Member {
  id: string;
  name: string;
  vehicle: "ev" | "ice";
  source: TelemetrySource;
  level: number | null;
  telemetryAt: number;
  needs: Need[];
  required: Need[];
  connector: "ccs1" | "chademo";
  maxDetour: number;
  accessible: boolean;
  threshold: number;
  navigation: "idle" | "opening" | "opened" | "failed";
  navigationAttempt: string | null;
  arrived: boolean;
  joinedAt: number;
}
export interface Stop {
  id: string;
  name: string;
  en: string;
  region: string;
  lat: number;
  lng: number;
  services: Need[];
  connectors: ("ccs1" | "chademo")[];
  accessible: boolean;
  detourMinutes: number;
  corridor: "seoul-gangneung";
  provenance: "illustrative";
}
export interface RankedStop {
  stop: Stop;
  score: number;
  covered: Need[];
  totalNeeds: number;
  reasons: string[];
}
export interface Proposal {
  version: number;
  stopId: string;
  status: "voting" | "rejected" | "agreed";
  votes: Record<string, "approve" | "reject">;
  createdAt: number;
}
export interface Trip {
  id: string;
  code: string;
  hostId: string;
  destination: Destination;
  demo: boolean;
  revision: number;
  proposalSequence: number;
  createdAt: number;
  expiresAt: number;
  status: "forming" | "voting" | "agreed" | "completed";
  members: Member[];
  proposal: Proposal | null;
  completedAt: number | null;
}
export interface Session {
  tripId: string;
  memberId: string;
  token: string;
}
export interface AuthResult {
  session: Session;
  trip: Trip;
}
export type Command =
  | { type: "needs"; input: NeedsInput }
  | { type: "propose"; stopId: string }
  | { type: "vote"; version: number; decision: "approve" | "reject" }
  | {
      type: "navigation";
      version: number;
      status: Member["navigation"];
      attempt: string;
    }
  | { type: "arrive"; version: number }
  | { type: "finish" }
  | { type: "leave" };
export const commandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("needs"), input: needsSchema }),
  z.object({ type: z.literal("propose"), stopId: z.string().min(1).max(60) }),
  z.object({
    type: z.literal("vote"),
    version: z.number().int().positive(),
    decision: z.enum(["approve", "reject"]),
  }),
  z.object({
    type: z.literal("navigation"),
    version: z.number().int().positive(),
    status: z.enum(["opening", "opened", "failed"]),
    attempt: z.string().uuid(),
  }),
  z.object({ type: z.literal("arrive"), version: z.number().int().positive() }),
  z.object({ type: z.literal("finish") }),
  z.object({ type: z.literal("leave") }),
]);
export class DomainError extends Error {
  constructor(
    public code: string,
    message = code,
    public status = 409,
  ) {
    super(message);
  }
}
export const MAX_MEMBERS = 6;
export const TRIP_TTL = 24 * 60 * 60 * 1000;
export function createMember(
  id: string,
  profile: z.infer<typeof profileSchema>,
  now: number,
): Member {
  return {
    id,
    ...profile,
    telemetryAt: now,
    needs: [],
    required: [],
    connector: "ccs1",
    maxDetour: 10,
    accessible: false,
    threshold: 25,
    navigation: "idle",
    navigationAttempt: null,
    arrived: false,
    joinedAt: now,
  };
}
export function activeNeeds(m: Member): Need[] {
  const needs = [...m.needs];
  if (m.level !== null && m.level <= m.threshold)
    needs.push(m.vehicle === "ev" ? "charge" : "fuel");
  return [...new Set(needs)];
}
export function rankStops(members: Member[], stops: Stop[]): RankedStop[] {
  const allNeeds = [...new Set(members.flatMap(activeNeeds))];
  return stops
    .filter((stop) =>
      members.every((m) => {
        const required = [...m.required];
        if (m.level !== null && m.level <= m.threshold)
          required.push(m.vehicle === "ev" ? "charge" : "fuel");
        return (
          stop.detourMinutes <= m.maxDetour &&
          (!m.accessible || stop.accessible) &&
          required.every((n) => stop.services.includes(n)) &&
          (!required.includes("charge") ||
            stop.connectors.includes(m.connector))
        );
      }),
    )
    .map((stop) => {
      const covered = allNeeds.filter(
        (n) =>
          stop.services.includes(n) &&
          (n !== "charge" ||
            members
              .filter((m) => activeNeeds(m).includes("charge"))
              .every((m) => stop.connectors.includes(m.connector))),
      );
      const coverage = members.reduce(
        (sum, m) =>
          sum + activeNeeds(m).filter((n) => covered.includes(n)).length,
        0,
      );
      return {
        stop,
        covered,
        totalNeeds: allNeeds.length,
        score: coverage * 20 - stop.detourMinutes,
        reasons: [...covered, `detour:${stop.detourMinutes}`],
      };
    })
    .sort((a, b) => b.score - a.score || a.stop.id.localeCompare(b.stop.id));
}
function resetProposal(trip: Trip) {
  trip.proposal = null;
  trip.status = "forming";
  for (const m of trip.members) {
    m.navigation = "idle";
    m.navigationAttempt = null;
    m.arrived = false;
  }
}
export function addMember(trip: Trip, member: Member, now: number): Trip {
  if (trip.status === "completed" || trip.expiresAt <= now)
    throw new DomainError("TRIP_ENDED");
  if (trip.status === "agreed") throw new DomainError("TRIP_LOCKED");
  if (trip.members.length >= MAX_MEMBERS) throw new DomainError("GROUP_FULL");
  const next = structuredClone(trip);
  next.members.push(member);
  resetProposal(next);
  next.revision++;
  return next;
}
export function applyCommand(
  trip: Trip,
  memberId: string,
  cmd: Command,
  stops: Stop[],
  now: number,
): Trip {
  const next = structuredClone(trip);
  const me = next.members.find((m) => m.id === memberId);
  if (!me) throw new DomainError("NOT_MEMBER", "Not a member", 403);
  if (next.status === "completed" || next.expiresAt <= now)
    throw new DomainError("TRIP_ENDED");
  const proposal = next.proposal;
  const assertVersion = (version: number) => {
    if (!proposal || proposal.version !== version)
      throw new DomainError("STALE_PROPOSAL");
  };
  switch (cmd.type) {
    case "needs": {
      if (next.status === "agreed") throw new DomainError("TRIP_LOCKED");
      const input = needsSchema.parse(cmd.input);
      if (
        (me.vehicle === "ev" && input.needs.includes("fuel")) ||
        (me.vehicle === "ice" && input.needs.includes("charge"))
      )
        throw new DomainError(
          "INVALID_NEEDS",
          "Need does not match vehicle",
          400,
        );
      Object.assign(me, input, { telemetryAt: now });
      resetProposal(next);
      break;
    }
    case "propose": {
      if (next.hostId !== me.id)
        throw new DomainError("HOST_ONLY", "Only the host can propose", 403);
      if (next.status === "agreed") throw new DomainError("TRIP_LOCKED");
      if (next.members.length < 2) throw new DomainError("NEED_COMPANION");
      if (!rankStops(next.members, stops).some((r) => r.stop.id === cmd.stopId))
        throw new DomainError("NO_MATCH");
      next.proposalSequence++;
      next.proposal = {
        version: next.proposalSequence,
        stopId: cmd.stopId,
        status: "voting",
        votes: {},
        createdAt: now,
      };
      next.status = "voting";
      for (const m of next.members) {
        m.navigation = "idle";
        m.navigationAttempt = null;
        m.arrived = false;
      }
      break;
    }
    case "vote": {
      assertVersion(cmd.version);
      if (proposal!.status !== "voting") throw new DomainError("VOTING_CLOSED");
      proposal!.votes[me.id] = cmd.decision;
      if (cmd.decision === "reject") {
        proposal!.status = "rejected";
        next.status = "forming";
      } else if (
        next.members.every((m) => proposal!.votes[m.id] === "approve")
      ) {
        proposal!.status = "agreed";
        next.status = "agreed";
      }
      break;
    }
    case "navigation": {
      assertVersion(cmd.version);
      if (next.status !== "agreed") throw new DomainError("NOT_AGREED");
      if (me.arrived) throw new DomainError("ALREADY_ARRIVED");
      if (cmd.status !== "opening" && me.navigationAttempt !== cmd.attempt)
        throw new DomainError("STALE_HANDOFF");
      if (cmd.status !== "opening" && me.navigation !== "opening")
        throw new DomainError("INVALID_TRANSITION");
      me.navigation = cmd.status;
      me.navigationAttempt = cmd.attempt;
      break;
    }
    case "arrive": {
      assertVersion(cmd.version);
      if (next.status !== "agreed") throw new DomainError("NOT_AGREED");
      me.arrived = true;
      break;
    }
    case "finish": {
      if (next.hostId !== me.id)
        throw new DomainError("HOST_ONLY", "Only the host can finish", 403);
      if (next.status !== "agreed" || !next.members.every((m) => m.arrived))
        throw new DomainError("WAITING_ARRIVALS");
      next.status = "completed";
      next.completedAt = now;
      break;
    }
    case "leave": {
      next.members = next.members.filter((m) => m.id !== me.id);
      if (!next.members.length) {
        next.status = "completed";
        next.completedAt = now;
      } else {
        if (next.hostId === me.id) next.hostId = next.members[0].id;
        resetProposal(next);
      }
      break;
    }
  }
  next.revision++;
  return next;
}
