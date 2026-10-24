import Database from "better-sqlite3";
import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import {
  addMember,
  applyCommand,
  createMember,
  DomainError,
  TRIP_TTL,
  type Trip,
  type Command,
  type Destination,
  type Member,
  type TelemetrySource,
  type Stop,
} from "../../../packages/domain/src/index";
import { seedStops } from "../../../packages/domain/src/stops";
export const hash = (s: string) => createHash("sha256").update(s).digest("hex");
interface Profile {
  name: string;
  vehicle: "ev" | "ice";
  level: number | null;
  source: TelemetrySource;
}
export class Store {
  db: Database.Database;
  constructor(
    path: string,
    public readonly stops: Stop[] = seedStops,
  ) {
    if (path !== ":memory:")
      mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new Database(path);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("busy_timeout = 5000");
    this.db
      .exec(`CREATE TABLE IF NOT EXISTS trips (id TEXT PRIMARY KEY, code TEXT UNIQUE, revision INTEGER, data TEXT);
      CREATE TABLE IF NOT EXISTS members (trip TEXT, id TEXT, credential TEXT, PRIMARY KEY(trip,id));
      CREATE TABLE IF NOT EXISTS receipts (scope TEXT, id TEXT, fingerprint TEXT, result TEXT, created INTEGER, PRIMARY KEY(scope,id));`);
  }
  close() {
    this.db.close();
  }
  get(id: string): Trip {
    const row = this.db.prepare("SELECT data FROM trips WHERE id=?").get(id) as
      { data: string } | undefined;
    if (!row) throw new DomainError("GROUP_NOT_FOUND", "Group not found", 404);
    return JSON.parse(row.data);
  }
  save(trip: Trip) {
    this.db
      .prepare(
        "INSERT INTO trips VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision,data=excluded.data",
      )
      .run(trip.id, trip.code, trip.revision, JSON.stringify(trip));
  }
  auth(id: string, token: string): { trip: Trip; memberId: string } {
    const row = this.db
      .prepare(
        "SELECT id,credential FROM members WHERE trip=? AND credential=?",
      )
      .get(id, hash(token)) as { id: string; credential: string } | undefined;
    if (
      !row ||
      !timingSafeEqual(Buffer.from(row.credential), Buffer.from(hash(token)))
    )
      throw new DomainError("UNAUTHORIZED", "Invalid session", 401);
    const trip = this.get(id);
    if (!trip.members.some((m) => m.id === row.id))
      throw new DomainError("NOT_MEMBER", "Member has left", 403);
    return { trip, memberId: row.id };
  }
  private receipt<T>(
    scope: string,
    id: string,
    input: unknown,
    run: () => T,
  ): T {
    return this.db.transaction(() => {
      const fingerprint = hash(JSON.stringify(input));
      const row = this.db
        .prepare(
          "SELECT fingerprint,result FROM receipts WHERE scope=? AND id=?",
        )
        .get(scope, id) as { fingerprint: string; result: string } | undefined;
      if (row) {
        if (row.fingerprint !== fingerprint)
          throw new DomainError("IDEMPOTENCY_CONFLICT");
        return JSON.parse(row.result) as T;
      }
      const result = run();
      this.db
        .prepare("INSERT INTO receipts VALUES (?,?,?,?,?)")
        .run(scope, id, fingerprint, JSON.stringify(result), Date.now());
      return result;
    })();
  }
  create(
    token: string,
    requestId: string,
    profile: Profile,
    destination: Destination,
    demo: boolean,
  ) {
    return this.receipt(
      `create:${hash(token)}`,
      requestId,
      { profile, destination, demo },
      () => {
        const now = Date.now();
        const member = createMember(randomUUID(), profile, now);
        let code = "";
        do {
          code = Array.from(
            randomBytes(6),
            (b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32],
          ).join("");
        } while (
          this.db.prepare("SELECT id FROM trips WHERE code=?").get(code)
        );
        const trip: Trip = {
          id: randomUUID(),
          code,
          hostId: member.id,
          destination,
          demo,
          revision: 1,
          proposalSequence: 0,
          createdAt: now,
          expiresAt: now + TRIP_TTL,
          status: "forming",
          members: [member],
          proposal: null,
          completedAt: null,
        };
        if (demo) {
          const other = createMember(
            `demo-${randomUUID()}`,
            { name: "지우의 차", vehicle: "ice", source: "demo", level: 54 },
            now,
          );
          other.needs = ["food", "rest"];
          other.required = ["food"];
          trip.members.push(other);
        }
        this.save(trip);
        this.db
          .prepare("INSERT INTO members VALUES (?,?,?)")
          .run(trip.id, member.id, hash(token));
        return { trip, memberId: member.id };
      },
    );
  }
  join(token: string, requestId: string, code: string, profile: Profile) {
    return this.receipt(
      `join:${hash(token)}`,
      requestId,
      { code, profile },
      () => {
        const row = this.db
          .prepare("SELECT id FROM trips WHERE code=?")
          .get(code) as { id: string } | undefined;
        if (!row)
          throw new DomainError("GROUP_NOT_FOUND", "Group not found", 404);
        const trip = this.get(row.id);
        const existing = this.db
          .prepare("SELECT id FROM members WHERE trip=? AND credential=?")
          .get(trip.id, hash(token)) as { id: string } | undefined;
        if (existing && trip.members.some((m) => m.id === existing.id))
          return { trip, memberId: existing.id };
        const member = createMember(
          existing?.id ?? randomUUID(),
          profile,
          Date.now(),
        );
        const next = addMember(trip, member, Date.now());
        this.save(next);
        this.db
          .prepare(
            "INSERT INTO members VALUES (?,?,?) ON CONFLICT(trip,id) DO UPDATE SET credential=excluded.credential",
          )
          .run(next.id, member.id, hash(token));
        return { trip: next, memberId: member.id };
      },
    );
  }
  command(
    tripId: string,
    token: string,
    requestId: string,
    cmd: Command,
    revision: number,
  ) {
    return this.receipt(
      `command:${tripId}:${hash(token)}`,
      requestId,
      { cmd, revision },
      () => {
        const { trip, memberId } = this.auth(tripId, token);
        if (
          ["needs", "propose", "finish", "leave"].includes(cmd.type) &&
          trip.revision !== revision
        )
          throw new DomainError("STALE_TRIP");
        const next = applyCommand(trip, memberId, cmd, this.stops, Date.now());
        this.save(next);
        return next;
      },
    );
  }
  demoStep(
    tripId: string,
    hostToken: string,
    action: "approve" | "reject" | "arrive",
  ): Trip {
    return this.db.transaction(() => {
      const { trip, memberId } = this.auth(tripId, hostToken);
      if (!trip.demo || trip.hostId !== memberId)
        throw new DomainError("DEMO_ONLY", "Demo host only", 403);
      const other = trip.members.find(
        (m) => m.source === "demo" && m.id.startsWith("demo-"),
      ) as Member | undefined;
      if (!other || !trip.proposal) throw new DomainError("NO_PROPOSAL");
      let next: Trip;
      if (action === "arrive") {
        next = applyCommand(
          trip,
          other.id,
          { type: "arrive", version: trip.proposal.version },
          this.stops,
          Date.now(),
        );
      } else
        next = applyCommand(
          trip,
          other.id,
          { type: "vote", version: trip.proposal.version, decision: action },
          this.stops,
          Date.now(),
        );
      this.save(next);
      return next;
    })();
  }
  prune(now = Date.now()) {
    this.db.transaction(() => {
      const rows = this.db
        .prepare(
          "SELECT id FROM trips WHERE json_extract(data,'$.expiresAt') < ?",
        )
        .all(now - TRIP_TTL) as { id: string }[];
      for (const r of rows) {
        this.db.prepare("DELETE FROM members WHERE trip=?").run(r.id);
        this.db.prepare("DELETE FROM trips WHERE id=?").run(r.id);
      }
      this.db
        .prepare("DELETE FROM receipts WHERE created < ?")
        .run(now - 2 * TRIP_TTL);
    })();
  }
}
