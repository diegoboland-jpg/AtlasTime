# AtlasTime changelog

## 1.0.0 — release candidate

AtlasTime 1.0 completes the local-first humane meeting planner.

### Planning

- Compare live local times across people, teams, and locations.
- Search globally for cities and resolve validated IANA time zones.
- Explore a synchronized 24-hour timeline with exact-minute Start and Finish controls.
- Score complete meeting durations against editable working hours and early/late discomfort.
- Create timed or true all-day plans and preserve selected dates and times.

### Groups and sharing

- Save multiple groups locally without an account or backend.
- Share portable group snapshots with an explicit privacy warning.
- Add, edit, remove, and undo participant changes.
- Keep six compact overview slots with animated time-of-day scenes and country identity.

### Calendar handoff

- Copy or share timezone-aware meeting details.
- Open prefilled Google Calendar and Outlook Calendar drafts.
- Export a complete standards-based `.ics` event for Apple and device calendars.

### Installed app and quality

- Install AtlasTime as a PWA on supported desktop and phone browsers.
- Reopen the saved planner offline after an initial online load.
- Detect waiting app updates without clearing locally saved groups.
- Cover time-zone, daylight-saving, persistence, sharing, components, and PWA behavior with automated tests and CI.

### Deliberately not included

- Accounts, cloud synchronization, calendar reading, automatic event creation, contact import, invitations, or team workspaces.
- Native App Store or Play Store packages.

These capabilities are candidates for post-v1.0 releases and will remain optional so the local-first planner continues to work without signing in.
