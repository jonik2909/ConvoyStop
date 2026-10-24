# Design direction

Premium automotive companion: graphite, silver, cool neutral surfaces and one acid-lime accent. Large Korean headline, small metadata, a purposeful car hero and road diagram. No decorative gradients, emoji chrome or dashboard tile grids.

Pattern research: Kia Connect feature guides and Hyundai Bluelink user manual show vehicle-led home hierarchy, succinct status rows, clear navigation handoff and platform controls. Adapt the hierarchy rather than copying screens or brand assets. Appllama MCP was not available on 2026-10-24.

Native stack titles; short tasks use form sheets; onboarding completion and finished sessions replace the old route. Controls ≥44pt. Continuous corners: 8 for fields, 16 for sections, pill for primary actions. Motion under 300ms for state changes, 120ms press springs, native transitions and sheet gestures. Reduce Motion removes spatial movement. Use system font, SF Symbols and tabular numbers.

References consulted 2026-10-24:

- https://connect.kia.com/eu/customer-support/feature-guides/
- https://www.hyundai.com/content/dam/hyundai/au/en/owning/manuals/bluelink-manuals/Bluelink-App-User-Manual-AUS.pdf
- https://docs.expo.dev/versions/latest/
- https://docs.expo.dev/router/advanced/stack/

Pending visual evidence and iteration notes belong in PROGRESS.md. No frame-rate claims without measurements.

## Final visual review

Light and dark iPhone Pro screenshots, XXXL Dynamic Type, a small SE screen, keyboard and native modal states were inspected. The SE welcome uses compact spacing, and home uses a normal native title. The completed journey recreates its scroll container to start at the top.

Purposeful motion uses Reanimated press springs, car-row entry and proposal cross-fades. Reduce Motion was enabled in iOS Settings and exercised in the SE recording. Native navigation and sheet controls remain system owned. Coordinate-driven drag verification was unavailable in the computer-use tool; interrupted drags and edge-swipe feel remain manual QA, with no claim of measured device frame rate.

Original car asset: `apps/mobile/assets/car-studio.png`, generated with the built-in imagegen tool. Final prompt direction: premium studio photograph of one unbranded silver touring crossover, front three-quarter view facing left, whole silhouette, soft overhead lighting, graphite #101418 floor/backdrop, no text, logos or UI. The generated source was copied into the workspace. Icon artwork is project-native geometric lane/car artwork.

Session changes use a persistent native root instead of removing and recreating the entire navigator screen. This eliminated the empty-root transition found in recordings. Normal push/pop and modal presentations remain native. The splash stays until the initial root layout and decoded car asset are ready.
