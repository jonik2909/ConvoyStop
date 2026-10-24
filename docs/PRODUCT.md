# ConvoyStop

Two or more cars, one shared stop. Combine charging/fuel, food and rest needs; explain a group recommendation; collect every car's decision before agreement.

Flow: welcome → create Seoul–Gangneung trip or join code → group → needs → recommendation and alternatives → versioned approvals/rejection → agreed stop → individual Apple Maps handoff → individual arrival → finish.

## Scope and assumptions

Default short Korean copy interprets the user's 'Korean-like' request. English strings are available through a dictionary. No login required. Route and stops are a small illustrative Korean corridor dataset. Manual input is the default vehicle source. Explicit demo mode adds a synthetic second car through the same server state machine; it is visibly labeled.

No live vehicle connection, location tracking, route ETA, charger occupancy, confirmed opening hours or safe-range prediction. Navigation opens Apple Maps with the selected coordinates and destination label. Opening Maps does not prove guidance began. Arrival is user-confirmed.

The Pleos challenge may require Android Automotive work beyond this iOS companion. Do not describe iOS as a substitute contest APK.

## Failure cases

Invalid/expired/full/ended group; missing auth; stale proposal version; rejection; no stop satisfying hard constraints; connection loss; cached stale data; server restart; app relaunch; failed navigation opening; missing telemetry. Every case must provide a useful next action.
