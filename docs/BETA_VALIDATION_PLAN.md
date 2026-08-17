# Kikroo protected-beta validation plan

**Target release:** 1.15
**Test window:** 2026-08-17 to 2026-08-21
**Completion gate:** at least five completed distinct testers across at least two Android devices, one iPhone, and one desktop browser. Invitations alone do not count. See `TESTER_RECRUITMENT_PLAN.md`.

## Test objective

Prove that a new tester can install Kikroo, understand its privacy boundaries, create a useful group, find a humane time, and recover from common mistakes without exposing sensitive information or losing local data unexpectedly.

## Tester invitation rules

- Share only the approved staging URL or internal-store link.
- State clearly that this is a beta and that data may be reset.
- Ask testers to use sample meetings and consenting contacts.
- Do not request calendar screenshots containing event titles.
- Do not request passwords, provider codes, private availability links, encryption keys, or signing information.
- Give each tester an anonymous identifier such as `T01`; do not publish their name in issue titles.

## Test sessions

### A. Install and reopen

1. Open the approved Kikroo URL.
2. Install or add it to the home screen.
3. Close and reopen it from the icon.
4. Confirm the Kikroo identity, current local time, version, and first workspace.

Pass: opens without browser chrome where supported, retains local data, and returns to **At a glance**.

### B. Group and people

1. Create and rename a group.
2. Add a location-only entry and a person.
3. Verify name, location, time-zone abbreviation, flag treatment, and current time.
4. Edit working hours and travel location.
5. Remove an entry and confirm the result.

Pass: no overlapping text, every card remains the same size, city/time zone stays valid, and group changes persist after reopening.

### C. Find a good time

1. Open the planner.
2. Choose a date, exact start/finish, quick duration, and all-day mode.
3. Move the persistent time slider and use **Now**.
4. Compare participants and choose a recommended window.

Pass: local times update consistently, one slider is visible, the quality state is understandable, and **Now** restores current time.

### D. Calendar handoff

1. Create a meeting title, location/link, and notes using sample text.
2. Open Google and Outlook drafts and export an `.ics` file.
3. Optional: connect a personal test calendar and inspect busy/free availability.
4. Disconnect and confirm the app no longer reports a connection.

Pass: date/time/duration and selected invitees are carried into the draft; direct creation requires final confirmation; disconnected state is unambiguous.

### E. Consent-based availability

1. Use a consenting test person with sample contact details.
2. Create a private availability link.
3. Open it on a second device, review the privacy explanation, and share sample busy/free blocks.
4. Refresh status, use the blocks in planning, then revoke the link.

Pass: no event titles/details are displayed, expiry is visible, revocation works, and a revoked link cannot share again.

### F. Offline and update behavior

1. Reopen the installed app after one successful online load.
2. Temporarily disable connectivity and inspect saved groups.
3. Restore connectivity and install the next waiting update when prompted.

Pass: saved content remains usable offline, online-only actions explain the limitation, and update recovery does not erase local groups.

## Feedback record

Use one record per finding:

```text
Tester ID:
Date/time and time zone:
Device / OS:
Browser or installed app:
Kikroo version:
Test session (A–F):
Steps performed:
Expected result:
Actual result:
Severity (P0/P1/P2/P3):
Screenshot attached (yes/no; personal data removed):
Could the tester continue (yes/no):
```

Severity:

- **P0:** security/privacy incident or destructive data loss; stop the beta.
- **P1:** core journey impossible with no workaround; block release.
- **P2:** important defect with a workaround; schedule before broader beta.
- **P3:** visual/copy improvement; prioritize with evidence from multiple testers.

## v1.15 release gate

- [ ] At least five distinct testers complete sessions A–C and one structured feedback record.
- [ ] 100% of sessions A–C pass on the primary Android test phone.
- [ ] Sessions A–C pass on at least one iPhone and one desktop browser.
- [ ] No open P0 or P1 finding.
- [ ] No unexplained loss of a saved group after restart/update.
- [ ] Calendar and availability tests use consenting test accounts only.
- [ ] Privacy notice is accessible to testers and has an identified contact channel.
- [ ] `npm test -- --run` and `npm run build` pass on the exact release commit.
- [ ] Render health and deployed version match the release commit.
- [ ] Asset register and third-party notices are reviewed.

## Exit report

At the end of the test window, record cohort/device coverage, sessions completed, defect counts by severity, privacy incidents (including zero), unresolved risks, and the explicit release decision: proceed, limited extension, or stop and correct.
