# Progress

## Current verified result, 2026-10-24

The iOS implementation and main simulator flows are complete. Standalone release builds run on iPhone 17 Pro iOS 26.5 and iPhone SE iOS 26.4 with Metro stopped. Eleven tests, typecheck and lint pass. The local server is running on 127.0.0.1:8787.

Real two-client synchronization, rejection/re-proposal, persistence/reconnect, manual/demo provenance, per-car Maps handoff/arrival and finishing were exercised. The final persistent-root pass is recording 07. Screenshots and logs are indexed in evidence/README.md.

Known verification limits: no physical-device FPS claim, coordinate-driven edge swipe/interrupted sheet drags were unavailable, no public hosting or App Store distribution. Five Expo CLI dependency audit entries remain documented in SECURITY.md. Live vehicle data and live POI availability are outside this implementation.

## 2026-10-24, bootstrap

- Goal activated through create_goal.
- Existing checkout verified empty, master has no commits. No ancestor AGENTS.md found.
- Xcode 26.4.1 and iOS 26.4/26.5/27 simulators available. Sandbox requires escalated simctl access; user's simulator authorization applies.
- Node 22.23.2, npm 10.9.8. Registry reports Expo 58.0.19.
- Expo scaffold installing under apps/mobile. Design skill and unslop read; no Appllama MCP available.
- Not yet implemented or verified: app, server, sync, domain, native build, screenshots, motion.

## Domain and server milestone

- Implemented SQLite authoritative snapshots, bearer device credentials stored as hashes, command receipts and monotonic revisions.
- 9 meaningful tests passed, including real HTTP + WebSocket two-client approval, individual Maps/arrival states, persistence after reopen, invalid codes and stale proposals.
- Root and mobile TypeScript checks plus ESLint pass as of initial UI implementation.
- Expo SDK 58 / React Native 0.88 / React 19.3 installed. Router 58 owns its navigation exports, so theme and removal hooks use expo-router rather than a separate navigation context.
- Original car asset generated with built-in imagegen and copied to apps/mobile/assets/car-studio.png. Prompt: unbranded silver touring crossover, three-quarter studio photograph, dark #101418 backdrop, no logos or text. No third-party vehicle marketing image reused in the app.
- Native CocoaPods installed; initial debug build running. Screens and motion remain unverified until simulator review.

## Simulator and sync milestone

- iPhone 17 Pro, iOS 26.5: debug native build succeeded, then standalone Release build succeeded. Release reopened with Metro stopped.
- Full demo flow completed in simulator through Apple Maps, individual arrivals and finish. Original full-flow recording retained.
- A real non-demo API peer created a group; iOS joined by code. Peer proposal appeared live; iOS approved; peer rejection closed it. Version 2 showed 0/2 approvals, then reached agreement with both clients.
- Server was stopped, iOS terminated and relaunched. Saved snapshot remained visible with an offline label and disabled mutations. Restarting the same SQLite server and tapping Reconnect restored the live group. Peer finish moved iOS to completion.
- Fixed a real backgrounding defect found during Maps handoff. Only the OS result is now retried with proposal version and navigation attempt ID. Retested: returning from Maps showed only that car's Maps-open request, while the other car stayed at its own approval state.
- 10 domain/API tests pass after adding navigation-attempt isolation. TypeScript and ESLint pass.
- Dark mode and Dynamic Type XXXL screenshots inspected. No text overlap observed in the agreed-stop view. iPhone SE iOS 26.4 booted and release launched; welcome review found the CTA too low, so compact spacing was added.
- Video scene contact sheet inspected. Removed duplicate imperative navigation after Protected-guard changes to address a brief empty frame during onboarding. Persistence now completes before route guard changes.
- Remaining verification in progress: final release on SE and Pro after these fixes, keyboard and modal gestures, Reduce Motion, video reinspection, final documentation and checks.

## Final release review

- `npm run verify` passed: root/mobile typecheck, ESLint and 11 tests. Added a regression test for leaving and rejoining with the same device credential, and a real WebSocket subscription after database/server reopen.
- iPhone SE iOS 26.4: system Reduce Motion switched on, app restarted, long Korean car name typed with keyboard visible, unsaved edit discarded, native back used, alternative stop proposed, both decisions accepted, real Maps opened, per-car arrival and finish completed.
- Compact welcome spacing keeps the primary action visible on SE. Normal native home title replaced the large title after review found excessive empty header space on SE.
- The final SE completion review found retained ScrollView position clipping the flag. Completed and active journeys now use distinct Page keys so the completed state starts at the top. Final Pro event-state retest is in progress.
- Coordinate drag/scroll operations in the computer-use tool returned `noWindowsAvailable`, even after raising the simulator. Native AX button, form, keyboard, sheet controls and back navigation worked. Edge-swipe and interrupted sheet-drag quality therefore remain a manual gesture QA limitation, not a verified claim.
- No physical-device frame-rate measurement was performed. Simulator motion was recorded and sampled; no claim of sustained 60fps is made.
- Expo CLI dependency audit findings are preserved in docs/SECURITY.md and evidence/validation/npm-audit.json. They were not hidden by a forced SDK downgrade.

## Persistent root and final closure

- Video inspection showed that merely removing duplicate redirects did not remove every empty root frame. Root navigation was changed to keep one native index screen mounted. Welcome, home and trip content now reflect durable session state inside it; only deeper tasks use guarded native routes. Recording 07 was inspected after a fresh SE install and a full create/propose/approve/arrive/finish cycle. The previously observed empty content frames were absent from the sampled transitions.
- The car image is decoded to an Expo ImageRef during splash preparation, so re-creating the completion page does not expose an empty hero while decoding. Splash dismissal waits for the root's first layout.
- The final recording shows the completed page at the top with the car visible, followed by home without the previous empty-root transition. The SE completion page scrolls to reach its lower action; this is expected on a small screen.
- English fallback was shown in simulator and restored to Korean. Reduce Motion testing was completed on SE and its original off setting restored. Pro retains the tested dark appearance preference.
- Final source checks pass with 11 tests. The same final release is installed on both simulators. Runtime test credentials/database stay ignored. Native source, Podfile.lock, screenshots, continuous recordings, frame samples and verification logs are retained in the project.
- No background monitor, cloud service, messages, public deployment or contest submission was created.

Final frame scan decoded 641 frames from recording 07. No nearly uniform content frames were detected at the documented threshold. This supports the empty-root fix; it is not an FPS measurement.

## Competition preparation, 2026-10-24

- Rechecked the official Hyundai Motor Group vehicle app competition submission guide, FAQ, rules, judging criteria, notices and downloadable DOCX. First-round proposal-only entry is allowed; prototype recordings are optional. Deadline is November 15 at 23:59 KST according to the official form.
- Prepared a Korean application from the official DOCX for an individual university-student entry. Personal operator details remain in ignored `submission/private/`, and the judging section contains none of the applicant's identity or contact information.
- The proposal separates the implemented iOS companion from a planned Kotlin AAOS client and Pleos SDK integration. It makes no claim of an implemented Automotive APK, live telemetry, public backend or acquired users. Pilot MAU and repeat-use numbers are labeled as validation targets.
- Rendered and inspected all five application pages, corrected the long Latin surname's table fit, preserved the source legal text and every non-editable package part. All eight plain-text content controls remain intact. Consent options, personal signature and signature date remain blank for the applicant.
- Prepared local email text and a review ZIP with the application and an unchanged copy of final recording 07, duration approximately 2 minutes 39 seconds. Verified ZIP contents and file hashes. No Gmail draft, external upload or email submission was made. The user explicitly requires approval before sending; personal consent/signature and final approval remain pending.
- Simulator state was not changed during submission preparation.

## Signature and public-source preparation, 2026-10-24

- The applicant saved consent selection and signature date, then supplied a handwritten signature image and asked for placement. A separate signed DOCX retains those saved choices and embeds the supplied PNG byte-for-byte in the signature cell. Transparent margins are cropped by document placement metadata. All document text and unrelated package parts are preserved.
- Inspected all five rendered pages; only the signature page differs from the applicant-saved source. Signed documents and signature data remain in ignored `submission/private/`. Email submission still requires the user's final approval.
- The user requested public GitHub source sharing. The public reviewer set keeps the final demo and app screenshots. Earlier raw recordings, external design-reference captures, machine-specific build logs, local editor settings and all application paperwork are excluded. A public build log replaces local home/workspace paths with neutral labels.
