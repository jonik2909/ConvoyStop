# Verification evidence

The public reviewer set includes the final `recordings/07-persistent-root-release.mov`, app screenshots, motion inspection images and validation reports. Earlier recordings listed below remain in the local QA archive. External design-reference captures and the original build log containing machine paths are excluded from publication. `validation/release-build-public.log` contains the build result with local machine paths replaced.

Screenshots are raw iOS Simulator captures, not marketing mockups. Recordings are continuous simulator recordings with pauses during inspection and, in the first recording, the original Maps backgrounding issue before its fix.

- `screenshots/01-welcome-light.png`: first iPhone 17 Pro welcome review. Footer was subsequently shortened.
- `screenshots/02-recommendation-light.png`: group-ranked stops, explicit illustrative provenance.
- `screenshots/03-apple-maps-handoff.png`: real system Maps opened; location permission declined, so Maps requested a start point. No guidance-start claim.
- `screenshots/04-complete-light.png` and `05-complete-dark.png`: complete demo journey.
- `screenshots/06-offline-restored.png`: saved group after server stop and app relaunch.
- `screenshots/07-agreed-dark.png` and `08-agreed-dark-xxxl.png`: real two-client agreement, dark and large type.
- `screenshots/09-se-welcome-light.png`: small-screen finding, corrected by compact welcome spacing in the final source.
- `recordings/01-demo-flow.mov`: full first demo pass including discovery and retest of Maps handoff.
- `recordings/02-real-two-client.mov`: real API peer and iOS, rejection, re-proposal, server restart, persisted relaunch and finish.
- `motion/01-transition-contact-sheet.jpg`: selected scene frames from the first recording. `01-scene-times.log` gives source timestamps.

Final-pass evidence and limitations are recorded in docs/PROGRESS.md. Simulator recordings have variable frame cadence. They do not establish 60fps on physical hardware; no such claim is made.

## Final corrections and follow-up captures

- `10-se-welcome-fixed.png`: compact welcome with visible primary action.
- `11-reduce-motion-enabled.png`: system Reduce Motion enabled.
- `12-se-keyboard-long-name.png`: focused field visible above the SE keyboard.
- `13-final-se-complete.png`: retained scroll position finding, subsequently fixed.
- `14-final-pro-complete-fixed.png`: completion after the final event-state retest.
- `15-final-home-dark.png`: final Pro app left ready for a new trip.
- `16-final-se-complete-fixed.png`: final build installed and reopened on SE, completion starts at the top.
- `03-final-se-release.mov`: onboarding and home inspection.
- `04-se-reduced-motion-inspection.mov`: complete SE flow with Reduce Motion, including the completion-scroll finding.
- `05-final-pro-release.mov`: final Pro flow and completion-scroll correction retest.
- `motion/05-final-contact-sheet.jpg`: final onboarding/Pro scene samples inspected after the recordings.

The recordings confirm functional transitions and provide visual samples. Interrupted sheet drags and edge swipes could not be exercised by the available coordinate input API. Native button/back/sheet-close paths were exercised. Physical-device 60fps and a public-production backend are outside the verified result.

## Authoritative final pass

- `recordings/07-persistent-root-release.mov` is the final root-state flow after the navigation refinement. It starts at onboarding on a fresh SE install and exercises create, alternative proposal, both approvals, both arrivals, finish and home. Maps background/reconnect behavior is separately shown in recordings 01 and 04.
- `screenshots/18-persistent-root-se-complete.png` shows the final completion layout.
- `motion/07-persistent-contact-sheet.jpg` contains final selected scene frames. Earlier contact sheets intentionally retain the findings that led to corrections.
- `validation/frame-scan.json` scans every decoded frame's content area for nearly uniform empty content; it does not measure FPS or gesture quality.

The source and final release preserve the same Korean UI and data boundaries tested throughout the earlier passes.
