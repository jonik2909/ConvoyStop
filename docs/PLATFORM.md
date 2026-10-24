# Platform and challenge references

Reviewed on 2026-10-24. This iOS companion implements manual/demo providers and real group synchronization. It does not load Pleos Connect SDK and is not presented as an Android Automotive submission.

The official Vehicle SDK introduction says its Vehicle Service runs on Android Automotive OS. The getting-started guide uses an Android Studio Automotive project and the Pleos emulator. The challenge development guide names Java/Kotlin and refers developers to current SDK conditions. These facts establish the platform boundary used in this repository.

Primary references:

- https://document.pleos.ai/en/docs/pleos-only/getting-started
- https://document.pleos.ai/en/docs/pleos-only/create-my-project
- https://document.pleos.ai/en/docs/pleos-only/connect-sdk-pleos/Vehicle/intro
- https://document.pleos.ai/en/docs/pleos-only/connect-sdk-pleos/Vehicle/vehicle/ai.pleos.playground.vehicle.api/ev-battery/entry
- https://document.pleos.ai/en/docs/pleos-only/connect-sdk-pleos/Vehicle/vehicle/ai.pleos.playground.vehicle.api/fuel/entry
- https://document.pleos.ai/en/docs/pleos-only/connect-sdk-pleos/NaviHelper/intro
- https://document.pleos.ai/en/docs/pleos-only/vehicle-app-planning-guide/api-compatibility-availability
- https://document.pleos.ai/en/docs/pleos-only/vehicle-app-planning-guide/driver-distraction-guideline
- https://appdevchallenge.auto-hmg.io/guide/development
- https://appdevchallenge.auto-hmg.io/guide/judging-awards

The judging guide lists optional first-round demo/source/APK artifacts and requires a working app before the second PT stage. This repository makes no claim that an iOS companion satisfies an Automotive APK requirement. Recheck current deadlines, access grants, vehicle capabilities and SDK availability before planning that separate deliverable. No SDK access was requested and no vehicle connectivity was measured.

## First-round submission checked on 2026-10-24

The official home, submission guide, FAQ, judging guide and application DOCX confirm applications run from 2026-10-21 through 2026-11-15. The DOCX specifies 23:59; the website says schedules use KST. Submission is by email to the address in the official guide. The completed application is the proposal. Demo recordings are optional and mockups/prototypes are accepted; this does not establish that an iOS implementation meets a Pleos/AAOS APK requirement or guarantees artifact bonus points.

The official form has separate operator-only personal details and anonymous project material. Every participant must personally select consent, sign and date it. Individual participation uses the representative row. Team entries may have up to five people and must CC all members.

The current entry package uses the existing iOS recording, the public source repository at https://github.com/jonik2909/ConvoyStop and a development plan for a separate Kotlin AAOS client. The repository contains no APK. Source sharing is supplementary evidence, without a claim that it satisfies the guide's source-plus-APK artifact tier. The judging guide evaluates vehicle-specific value, creativity, SDK/API use and business prospects. Actual SDK integration remains a material gap for that criterion. First-round finalists must demonstrate a working app at the offline PT on December 3–4; selected exhibition teams must provide a working APK. The first-round application was emailed on 2026-10-24 after the applicant's final approval. Organizer acknowledgement has not been recorded.

Additional official references:

- https://appdevchallenge.auto-hmg.io/
- https://appdevchallenge.auto-hmg.io/guide/submission
- https://appdevchallenge.auto-hmg.io/faq
- https://appdevchallenge.auto-hmg.io/guide/rules
- https://appdevchallenge.auto-hmg.io/downloads/contest-application-consent.docx
- https://appdevchallenge.auto-hmg.io/notice/c0a1a000-2026-4923-8000-000000000006

The original DOCX SHA-256 is `07be893d58b0e96ab7788f0d189d6829f0e59a2cee4bc18cb90ec37eeda2f5fd`. Private operator details and application review files belong only in ignored `submission/private/`, never in the public source or anonymous judging section. Sending requires the user's explicit final confirmation.
