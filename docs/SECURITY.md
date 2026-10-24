# Local deployment and dependency status

The app/server are verified as a local simulator/LAN product. No public production deployment, App Store submission or signing account was configured.

The server binds loopback by default, hashes device credentials, validates input sizes and schemas, limits HTTP request rates and authenticates WebSocket subscriptions. The device credential stays in SecureStore. Runtime SQLite files, the disposable API peer credential and local environment files are ignored.

Before a public release, configure HTTPS/WSS and remove the local-development `NSAllowsArbitraryLoads` exception in app.json, regenerate iOS and build again. Configure hosting, monitoring, backups and the desired retention policy. The current setup intentionally has no account-based recovery: reinstallation can lose the local trip pointer, and a user can rejoin a still-active trip using its invite code.

## Dependency audit, 2026-10-24

The installed SDK's npm audit reports five high-severity entries in the Expo CLI dependency chain. The reported packages include node-forge 1.4.0 and the CLI's Zod 3.25.76. The server uses Zod 4.6.7. See evidence/validation/npm-audit.json for the exact report.

These Node CLI packages are not part of the iOS JavaScript runtime. Metro was bound to localhost during development and was stopped for standalone Release verification. No public development server was exposed. The registry's node-forge version was checked and remained 1.4.0; npm's suggested Expo downgrade would replace the selected SDK, so no forced downgrade was applied. Recheck and update compatible tooling before public distribution.

Simulator verification does not replace physical-device performance profiling, independent security review or validation of the illustrative stop dataset.
