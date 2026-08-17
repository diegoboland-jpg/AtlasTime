# Kikroo v1.15 protected-beta release checklist

Use this checklist for the exact commit distributed to testers. A green build alone does not authorize release.

## Owner decisions

- [x] Legal applicant/asset owner recorded as the approved Brazilian company; sensitive corporate evidence remains outside Git.
- [x] First trademark territory approved: Brazil.
- [x] Public privacy/support contact approved: `support@kikroo.com`.
- [ ] External contributors and any required assignments confirmed.
- [ ] Tester distribution list approved; testers receive anonymous IDs.

## Brand and asset evidence

- [ ] Live INPI and WIPO similarity searches exported and reviewed; no clearance claim inferred from indexed search results.
- [ ] Candidate Classes 9 and 42 wording reviewed professionally for the actual goods/services.
- [ ] Approved word mark and logo variants match the application and store assets.
- [ ] `npm run evidence:release -- <protected-folder>` completed.
- [ ] Editable logo master, original panel, prompt/selection evidence, and human edits added to the protected evidence folder.
- [ ] Evidence folder has two tested backups; no secrets or personal tester data are included.

## Product and privacy gate

- [ ] About & privacy is reachable from every mobile workspace in one action.
- [ ] Version displayed in the app matches `package.json`, Android metadata, changelog, and service-worker cache.
- [ ] Diagnostic is previewed before copying and contains only allow-listed facts.
- [ ] Feedback includes tester ID, session, steps, expected/actual result, severity, and screenshot-redaction warning.
- [ ] Closing About & privacy sends no feedback or diagnostic.
- [ ] Privacy notice names the approved controller/contact and accurate retention periods before public-store distribution.

## Technical gate

- [ ] `npm test -- --run` passes on the release commit.
- [ ] `npm run build` passes on the release commit.
- [ ] Android readiness check reports `com.badie.kikroo` and version `1.15.0`.
- [ ] Render health and visible version match the release commit.
- [ ] Install, reopen, offline, update, Google disconnect, Outlook disconnect, and availability-link revocation are tested.

## Beta decision

- [ ] Sessions A–C pass on the primary Android phone, one iPhone, and one desktop browser.
- [ ] Sessions D–F have documented results.
- [ ] No open P0 or P1 issue.
- [ ] Privacy incidents are recorded, including an explicit zero when none occurred.
- [ ] Owner records one decision: **proceed**, **limited extension**, or **stop and correct**.
