# Architecture

## Workspaces and state

`apps/mobile` contains Expo Router routes, root-state screens in `src/screens`, TanStack Query server state, a small Zustand session store and platform providers. `packages/domain` contains Zod contracts, ranking and the pure trip state machine. `apps/server` runs Fastify, WebSocket and SQLite. `scripts/peer.ts` is a real second API client for local verification.

The native iOS project and Podfile.lock are checked in. Pods, build products, machine-specific `.xcode.env.local` and xcuserdata are ignored. Bundle ID is `app.convoystop.companion`, minimum generated iOS deployment target is 16.4, portrait iPhone only. Expo configuration is the source of truth for regeneration.

## Authoritative transitions

The server stores each trip snapshot in SQLite with WAL. A transaction reads the current snapshot, validates a command, increments the revision, saves it and records the request receipt. Broadcasts happen after commit. One Node process owns the local database. This is not a horizontally scaled deployment.

Creating and joining use a stable request ID for safe retries. Commands have scoped receipts and reject reuse of the same ID with different payloads. Needs, proposals, leaving and finishing require the current trip revision. Independent votes can arrive concurrently because the proposal version, rather than the global revision, determines whether they are current.

A proposal starts with zero votes. Every member must approve. Rejection closes it. Changing needs or participants invalidates it. New proposal versions never inherit old votes. Once agreed, needs and joining are locked. A departing member resets agreement for the remaining convoy and transfers host ownership if necessary.

Every member has an individual navigation status, a navigation attempt ID and an arrival flag. A late result from an older Maps attempt cannot overwrite a newer attempt. Opening Maps does not approve a stop or confirm arrival. Only the host can finish, after every remaining member has arrived.

## Sync and offline behavior

WebSocket authenticates in its first message; credentials are absent from URLs. It sends a committed snapshot on subscription and after changes. The app also refetches every five seconds and after foregrounding. Cache reconciliation ignores older revisions, including delayed HTTP responses arriving after a newer WebSocket snapshot. Local cache writes also require the currently active trip ID. Reconnect retries back off to 15 seconds; the visible Reconnect action retries immediately.

The client stores preferences, non-secret trip IDs and a last-known snapshot in AsyncStorage. SecureStore holds the random 256-bit device credential. Onboarding/session transitions persist before changing navigation guards. The native index screen stays mounted across onboarding, home and trip state changes. Its content is selected from the persisted session, so back cannot reopen onboarding or an ended session. Protected routes control the availability of create/join modals and trip-only needs/recommendation screens. An index anchor provides a root underneath modal links. The hero image is decoded before the root layout dismisses the splash screen.

Offline snapshots are labeled as old information and mutations fail or remain disabled. Votes and proposals are not queued. A single exception is the OS Maps result: the app persists a version- and attempt-scoped receipt, then delivers it after foreground/reconnect. A missing receipt remains visibly incomplete; no success is invented. Clearing a trip locally removes its pending handoff receipt.

## Providers

- `VehicleDataProvider` returns source, level, sample time and a deliberately null range. `ManualVehicleProvider` and `DemoVehicleProvider` are the only implemented sources.
- `StopProvider` returns typed stops. The server instantiates `SeedStopProvider`; `Store` accepts its stop list, and the API exposes the same dataset.
- `NavigationProvider` defines handoff. `IOSNavigationProvider` opens an Apple Maps URL through iOS Linking. It loads no vehicle SDK.

A future AAOS package must implement an authorized Pleos bridge, permissions, native lifecycle and its own verification. Shared React Native code does not provide AAOS compatibility. Ordinary Android phones need their own navigation adapter and any separately authorized telemetry source. Neither is implemented or claimed in this phase.

## Ranking

For every car, filter mandatory services, energy threshold requirements, connector compatibility, accessibility and maximum illustrative detour. Rank remaining stops by satisfied needs across cars, then subtract additional minutes. The weights are explicit and deterministic: 20 points per satisfied car need, minus one per additional minute. A low percentage only triggers a service requirement, never a distance estimate. UI shows covered needs and additional minutes with their illustrative provenance.

## Local server access

A device generates a random bearer credential. The database stores its SHA-256 hash and membership; requests and WebSockets validate it. API inputs have Zod schemas, bounded bodies and rate limits. No login, email, GPS, vehicle VIN or account credentials are collected. Invites are six unambiguous characters, capacity six cars, expiry 24 hours. Runtime credentials, databases and environment values are ignored by Git.

The local HTTP configuration is for simulator/LAN development. Public hosting requires HTTPS/WSS, restricted ATS configuration, operational backups, retention controls and deployment hardening. No hosting account or public endpoint was created.
