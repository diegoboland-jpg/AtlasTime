# AtlasTime changelog

## 1.9.0 — deployment operations and recovery

- Audit production settings before deployment, including HTTPS, persistent paths, complete OAuth credentials, callback origins, and independent encryption keys.
- Create and verify encrypted availability backups without printing private names or busy intervals.
- Restore only after an explicit confirmation and preserve the previous encrypted file for recovery.
- Add container-compatible operational commands and document a practical path to public hosting and native-store releases.

## 1.8.0 — production hosting foundation

- Encrypt persisted availability-request records with AES-256-GCM and fail closed if ciphertext is altered.
- Require HTTPS and a dedicated record-encryption key whenever the connected server runs in production mode.
- Add a provider-neutral multi-stage container build and persistent data-volume boundary.
- Add restrictive same-origin security headers and a privacy-safe deployment health endpoint.
- Document production secrets, OAuth callback updates, backups, persistence, and physical-device acceptance.

## 1.7.0 — organizer multi-calendar planning

- Add a first-class Outlook Calendar connection to the organizer's Handoff workspace.
- Combine Google and Outlook occupied/free blocks in a single planner visualization.
- Keep the Microsoft permission read-only and continue discarding all event details.
- Preserve confirmed availability from one provider when the other provider is unavailable.
- Keep recipient-controlled Google and Outlook sharing from v1.6 unchanged.

## 1.6.0 — combined Google and Outlook availability

- Add a Microsoft OAuth authorization-code flow with state, PKCE, encrypted HttpOnly token storage, and same-origin mutation protection.
- Read only the Microsoft Graph fields required to derive busy intervals and discard all event metadata.
- Let recipients share Google, Outlook, or both through one private availability request.
- Replace a provider's previous response on resubmission and merge overlapping blocks across providers.
- Expire previously shared results so outdated busy blocks stop affecting recommendations.
- Keep the Outlook gateway optional until Microsoft Entra credentials are configured and physically validated.

## 1.5.0 — availability-aware planning

- Cache organizer-protected shared busy/free results in the current browser.
- Exclude confirmed calendar conflicts from the available-person count and add a strong scoring penalty.
- Move the best-time recommendation away from known busy windows.
- Show calendar-conflict labels in compact planner cards and the detailed 24-hour comparison.
- Preserve privacy-safe uncertainty: absent, pending, expired, declined, revoked, or out-of-window results are never presented as confirmed free time.

## 1.4.0 — secure availability sharing

- Generate cryptographically random seven-day availability links and persist only hashed public tokens.
- Keep a separate local management key for organizer-only result access and revocation.
- Add a minimal recipient consent page that reveals no contact details beyond the intended display name and requested time window.
- Let recipients explicitly authorize Google availability and submit sanitized busy/free intervals only.
- Keep event titles, descriptions, locations, attendees, and OAuth tokens out of availability-request records.
- Validate submitted intervals against the requested window and hide them from the public link.
- Persist local server records outside source control; production deployment still requires durable encrypted storage and HTTPS.

## 1.3.0 — availability requests

- Store optional phone numbers in the local contact directory and import them from selected device contacts, vCards, or CSV files.
- Add a clear Request availability action for contactable people.
- Prepare recipient-controlled SMS, WhatsApp, native-share, and copy handoffs without sending anything automatically.
- Request only busy/free sharing and link to the provider's official instructions; no event titles or details are requested.
- Record the local request state so users can see that a handoff was prepared.
- Keep private expiring consent links, response callbacks, revocation, and Outlook availability for the hosted follow-up.

## 1.2.0 — consent-based availability

- Add a separate, explicit Google permission for occupied/free availability.
- Read only busy intervals from the organizer's primary calendar; event titles, descriptions, and locations never enter AtlasTime.
- Visualize the selected UTC day in 48 half-hour blocks and warn when the selected meeting overlaps an occupied period.
- Treat permission-denied or unavailable calendars as unknown, never as free.
- Keep direct event creation, drafts, and `.ics` handoff working independently.
- Align the All-day event control with the Date, Start, and Finish controls.

## 1.1.0 — connected-calendar preview

AtlasTime 1.1 preserves the local-first planner while adding an optional, explicitly authorized Google Calendar path.

### Connected Google Calendar

- Connect through an OAuth authorization-code flow protected by state and PKCE.
- Keep client secrets and refresh tokens out of the browser bundle.
- Show clear unavailable, disconnected, connected, failure, and recovery states.
- Review the complete event and selected invitees before direct creation.
- Create the event on the user's primary calendar and open the resulting Google event.
- Revoke provider access and clear AtlasTime's connection cookie on disconnect.
- Keep Google and Outlook drafts plus `.ics` export available without signing in.

### Developer setup

- Serve the PWA and Google Calendar gateway from one origin.
- Configure credentials through server-only environment variables.
- Follow the illustrated local Google Cloud setup and validation guide.
- Defer calendar reading and free/busy permission to the separate v1.2 consent decision.

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
