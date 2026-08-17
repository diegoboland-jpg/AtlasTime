# Kikroo v1.15 — protected beta scope

## Outcome

Kikroo 1.15 is not a feature-volume release. It makes the existing product safe and understandable enough for a controlled external beta while preserving evidence and decisions needed to protect the product identity and assets.

## Product increment

### 1. Tester trust surface

- Provide an easily reachable **About & privacy** surface showing the Kikroo name, exact version, beta status, privacy notice, and feedback instructions.
- Explain which information stays in the browser and which optional actions contact Kikroo's server or external providers.
- Never display a registered trademark symbol unless registration is granted.

Acceptance:

- A first-time tester can reach the privacy explanation from every mobile workspace in at most two actions.
- Version and beta status match the deployed build metadata.
- Copy distinguishes local groups, share-link content, busy/free server records, and calendar-provider access.

### 2. Privacy-safe diagnostic summary

- Let a tester copy a diagnostic summary containing app version, install/display mode, platform category, language, time-zone identifier, connection state, and service-worker/update state.
- Exclude names, emails, phone numbers, group labels, meeting text, calendar identifiers, tokens, URLs containing private tokens, and busy/free periods.

Acceptance:

- Automated tests prove the summary does not contain data from sample people, groups, meeting fields, or authorization material.
- The tester previews the diagnostic text before copying it.

### 3. Beta feedback workflow

- Present structured instructions matching `BETA_VALIDATION_PLAN.md`.
- Give feedback a severity, test-session code, reproducible steps, expected/actual result, and optional redacted screenshot.
- Keep sending under the tester's control; Kikroo must not silently transmit feedback or diagnostics.

Acceptance:

- The user explicitly chooses the destination and action.
- Closing the feedback surface sends nothing.
- Feedback guidance warns against including calendar details, private links, credentials, or other people's personal data.

### 4. Brand and release evidence

- Maintain `IP_ASSET_REGISTER.md`, `BRAND_PROTECTION_PLAN.md`, and `THIRD_PARTY_NOTICES.md` with each beta release.
- Create a release evidence folder outside Git containing approved logo masters, screenshots, filing/search records, and signing recovery information.

Acceptance:

- Every public visual asset maps to an inventory row and evidence owner.
- Required third-party notices are present in the release source.
- Legal applicant, territory, and filing classes remain explicit decision gates until approved.

## Out of scope for 1.15

- Filing or paying for a trademark application.
- Claiming legal clearance or registration.
- Public Google Play/App Store production release.
- Accounts, cloud synchronization, advertising analytics, or behavioral profiling.
- Reading event titles/descriptions or silently sending invitations/feedback.
- Patent filing or claiming ownership of the underlying scheduling idea.

## Definition of done

1. The four product increment sections meet their acceptance criteria.
2. The protected-beta validation release gate passes.
3. No P0/P1 beta finding remains open.
4. The owner approves the privacy contact, legal applicant decision, and external-beta distribution list.
5. Tests/build pass on the release commit and the deployed version matches it.
