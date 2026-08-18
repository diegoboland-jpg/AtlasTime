# Kikroo backlog

## v1.17: Android home-screen widget

- [x] Add a six-entry, resizable Android home-screen widget using the reviewed v1 snapshot.
- [x] Add âˆ’30 minute, Now, +30 minute, and Open Kikroo actions without changing the saved planner.
- [x] Add fresh, stale, expired, offline-safe, and empty widget states.
- [x] Accept widget snapshots only through a Digital Asset Links `use_as_origin` relationship and reject unreviewed fields.
- [x] Store the snapshot in app-private Android preferences and keep it out of logs, analytics, backups, and network calls.
- [x] Add a reproducible overlay step to every Bubblewrap initialization and fail bundle generation when the overlay is absent.
- [ ] Build the signed 1.17.0 App Bundle and install it through Google Play Internal Testing.
- [ ] Verify snapshot sync, widget resizing, 200% font size, reboot, offline reopen, Play update, and all four actions on two physical Android phones.
- [ ] Record screenshot evidence for zero, one, six, stale, expired, labels, and times-only states.

## v1.16: Google Play internal beta

- [x] Define the v1.16 product increment, explicit non-goals, evidence requirements, and measurable release gate.
- [ ] Complete the v1.15 exit report with a proceed/limited-extension decision and no open P0/P1 issue.
- [ ] Build and verify a signed `com.badie.kikroo` App Bundle without placing signing material in Git.
- [ ] Create the private Play internal-testing application, store declarations, tester list, and release.
- [ ] Publish Digital Asset Links with the Play app-signing SHA-256 certificate and validate a browser-bar-free launch.
- [ ] Validate Google/Outlook OAuth return, disconnect, availability revocation, offline reopen, and back navigation on two Android devices.
- [ ] Prove one Play update preserves groups, people, working hours, planner state, and preferences on both devices.
- [x] Recognize corporate time-zone abbreviations such as `IST`, `EST`, `CST`, and `PT`; whenever an abbreviation can represent more than one region, require a fresh region choice for every new or edited entry and store only its selected IANA time zone.
- [x] Present iPhone installation help in a safe-area-aware modal above the app header, with a reachable close control, internal scrolling, and explicit Safari / Add to Home Screen guidance.
- [x] Define and security-review the privacy-safe native-widget snapshot contract; do not ship a widget in v1.16.

## v1.15: protected beta

- [x] Create an IP asset register covering the name, tagline, logo, app icons, code, visual system, Android identity, integrations, signing material, and third-party assets.
- [x] Document the trademark-clearance and filing decision gates without claiming registration or legal clearance.
- [x] Preserve release-facing third-party notices and the existing Flag Icons license.
- [x] Draft a beta privacy notice based on the implemented local storage, sharing, calendar, and encrypted availability behavior.
- [x] Define a six-session cross-device tester protocol, severity model, feedback record, and release gate.
- [x] Define the v1.15 product increment and measurable acceptance criteria.
- [x] Define the next increment, v1.16 Google Play internal beta, with measurable acceptance evidence.
- [x] Approve a Brazilian company as the intended applicant and Brazil as the first filing territory; exact corporate identifiers remain a pre-filing gate outside Git.
- [x] Confirm the controlled-domain beta contact as `support@kikroo.com`.
- [ ] Confirm operational-log retention and scheduled deletion of expired hosted availability records. Availability-request links already expire after seven days by default.
- [x] Compare Brazil/direct foreign filings with the Madrid route and record the six-month priority strategy.
- [ ] Complete live professional trademark clearance and final goods/services wording before filing.
- [ ] Complete and archive live INPI/WIPO similarity searches with professional review.
- [x] Implement the About & privacy surface and privacy-safe diagnostic summary.
- [x] Add an explicit review-before-copy feedback template with session, reproduction, severity, and redaction fields.
- [x] Add a checksum-backed release-evidence generator, tester invitation, release checklist, and exit-report template.
- [x] Add an explicit Person / Team or group / Place selector before the name and persist the entry type safely.
- [x] Let people and teams define local working hours while adding or editing without resetting existing hours.
- [ ] Run the two-wave protected-beta protocol to at least five completed distinct testers and publish the exit report (current starting evidence: three approached, one completed).

## v1.11: mobile visual navigation and planning clarity

- [x] Keep every people-management card the same size and remove the unintended card tilt.
- [x] Reserve the calendar-availability row even when a contact still needs email or phone details.
- [x] Replace platform-dependent flag emoji backdrops with clean embedded vector flag treatments based on saved country or timezone.
- [x] Preserve time-of-day colors and readable foreground content over every decorative flag.
- [x] Make the floating 24-hour slider translucent and give Now clear hover, focus, and pressed states.
- [x] Color and label the selected meeting window from excellent through poor availability, including a distinct best-available state.
- [x] Add swipeable mobile workspaces for Everyone's Time, saved groups, people, Find a good time, and calendar handoff.
- [x] Add visible previous/next controls, section dots, wraparound navigation, and return to the main panel when the app is reopened.
- [x] Preserve vertical scrolling inside each mobile workspace and avoid taking over the time slider gesture.
- [ ] Validate the new swipe deck, card sizing, flag treatment, and quality colors on the physical Android phone.
- [ ] Validate reopening behavior and swipe navigation on an installed iPhone PWA.

## v1.12: Android store packaging

- [x] Confirm the privacy-conscious application ID `com.badie.kikroo` and retain the existing Render HTTPS origin before publishing to Play.
- [x] Add store-ready PNG and maskable icons to the manifest and offline cache.
- [x] Serve Digital Asset Links from package and certificate settings kept outside source control.
- [x] Add a reproducible Android release configuration and automated readiness check.
- [ ] Generate a signed Android App Bundle from the public PWA using a Trusted Web Activity wrapper.
- [ ] Publish Digital Asset Links using the release-signing certificate fingerprint.
- [ ] Prepare store icons, feature graphic, screenshots, privacy disclosure, and data-safety answers.
- [ ] Complete internal Play testing before requesting production review.

## v1.10: public staging readiness

- [x] Select Render as the first staging target based on Docker, managed TLS, persistent-disk, snapshot, and health-check support.
- [x] Add a Render Blueprint that deploys only after GitHub checks pass and mounts a 1 GB persistent data disk.
- [x] Initialize mounted storage as root, then drop the running application to the unprivileged Node user.
- [x] Derive the public origin and Google/Microsoft callback paths from Render's generated hostname.
- [x] Add regression coverage for deployment artifacts and Render-derived production settings.
- [x] Provide a numbered, illustrated setup guide covering deployment, OAuth, phone testing, and encrypted backup.
- [ ] Merge v1.9 and v1.10 before creating the Render Blueprint.
- [ ] Accept the paid Render web-service and persistent-disk charges.
- [ ] Complete the public staging and cross-network physical-phone checklist.

## v1.9: deployment operations and recovery

- [x] Add a production-readiness audit for HTTPS, persistence, OAuth completeness, redirect origins, and independent encryption keys.
- [x] Create ciphertext-only availability backups with a companion SHA-256 checksum.
- [x] Verify backup authenticity by decrypting with the configured key without printing private records.
- [x] Require an explicit restore confirmation and preserve the previous encrypted data file before replacement.
- [x] Add container-compatible check, backup, verify, and restore commands.
- [x] Document the staged path from public HTTPS hosting to Google Play, TestFlight/App Store, and native widgets.
- [ ] Select the public hosting provider, domain, persistent volume, and protected off-host backup destination.
- [ ] Perform a complete backup-and-restore drill on the selected staging host.
- [ ] Add automated off-host backup scheduling only after the host and retention policy are selected.

## v1.8: production hosting foundation

- [x] Encrypt persisted availability-request records with authenticated AES-256-GCM encryption.
- [x] Migrate readable local development records to ciphertext on the next write.
- [x] Require an independent storage-encryption key and HTTPS origin in production mode.
- [x] Add a provider-neutral container build with a persistent data-volume boundary.
- [x] Add a privacy-safe health endpoint and restrictive production security headers.
- [x] Document secrets, OAuth callback changes, persistent storage, backup, and acceptance checks.
- [ ] Select a public HTTPS hosting provider and create its production environment.
- [ ] Move from the single-instance encrypted file to a transactional encrypted database before horizontal scaling.
- [ ] Validate private links and both OAuth providers on the public domain from a physical phone.

## v1.7: organizer multi-calendar planning

- [x] Add a visible Outlook connection card to the organizer's Handoff workspace.
- [x] Keep Outlook access read-only and limited to occupied/free calendar blocks.
- [x] Combine confirmed Google and Outlook busy intervals in one organizer availability strip.
- [x] Preserve partial results when one connected provider is temporarily unavailable.
- [x] Keep provider event names, descriptions, locations, attendees, and identifiers out of the browser response.
- [ ] Validate a personal Google calendar and personal Outlook calendar together on Windows.
- [ ] Document and validate organization-admin denial for a managed Microsoft 365 calendar.

## v1.6: combined Google and Outlook availability

- [x] Add a server-side Microsoft authorization-code flow with state, PKCE, encrypted HttpOnly refresh-token storage, and same-origin mutation checks.
- [x] Request only delegated calendar-read access and query Microsoft Graph for start, end, busy state, and cancellation state.
- [x] Strip all event subjects, locations, attendees, descriptions, and identifiers before returning busy intervals.
- [x] Let recipients share Google, Outlook, or both from the same private request.
- [x] Replace an individual provider's earlier submission while merging overlapping blocks across providers.
- [x] Expire previously shared results and stop returning their old busy blocks.
- [ ] Validate Microsoft Entra credentials with personal Outlook and an organization-managed Microsoft 365 account.
- [ ] Document tenant-admin denial and organization policy behavior during physical-device acceptance.

## v1.5: availability-aware recommendations

- [x] Cache organizer-protected shared busy/free results in the current browser.
- [x] Exclude confirmed calendar conflicts from a person's available count.
- [x] Penalize confirmed conflicts so recommendations move toward genuinely open windows.
- [x] Mark shared-calendar conflicts in the compact planner rows and detailed timeline.
- [x] Keep missing, pending, expired, declined, and out-of-window data unknown rather than treating it as free.
- [x] Add Outlook recipient authorization and combine authorized providers.
- [ ] Replace local result caching with encrypted durable production storage before public hosting.

## v1.4: secure availability sharing

- [x] Generate private opaque request links with automatic expiration.
- [x] Store only token hashes and keep a separate organizer management key.
- [x] Add organizer revocation and protected result retrieval endpoints.
- [x] Add a recipient consent page with explicit Google authorization.
- [x] Store only validated busy/free intervals inside the requested window.
- [x] Keep event titles, descriptions, locations, attendees, and OAuth tokens out of request records.
- [x] Merge returned busy/free blocks into person rows and recommendation scoring.
- [x] Add Outlook recipient authorization and busy/free submission.
- [ ] Replace the local JSON store with encrypted durable production storage before public hosting.
- [ ] Deploy to an HTTPS origin and validate cross-device links outside the local network.

## v1.3: recipient-controlled availability requests

- [x] Store optional phone numbers in local contacts and saved groups.
- [x] Import phone numbers from user-selected device contacts, vCards, and CSV files.
- [x] Add Request availability to contactable person cards.
- [x] Prepare SMS, WhatsApp, native-share, and copy handoffs without sending automatically.
- [x] Ask only for busy/free access and avoid event titles, descriptions, or locations.
- [x] Record when a request handoff was prepared.
- [ ] Replace provider instructions with a private, opaque, expiring AtlasTime consent link after secure HTTPS hosting exists.
- [ ] Let recipients explicitly connect Google or Outlook and return busy/free blocks to the requesting group.
- [ ] Add shared, declined, expired, blocked, and revoked state callbacks from the hosted consent service.
- [ ] Add revocation controls and automatically exclude expired availability.
- [ ] Validate SMS, WhatsApp, native share, and copy on Android, iPhone, and installed Windows.

## v1.0: local-first planner release

- [x] Complete global place discovery, saved groups, humane-time scoring, exact durations, and all-day planning.
- [x] Provide responsive installed-PWA experiences for phone and Windows layouts.
- [x] Export complete `.ics` events and open prefilled Google and Outlook calendar drafts without account access.
- [x] Align package, visible UI, service-worker cache, README, and release documentation to version 1.0.0.
- [x] Add a repeatable v1.0 physical-device acceptance checklist.
- [ ] Complete the required Android and installed-Windows acceptance checks.
- [ ] Complete an iPhone/Safari compatibility check when an iPhone is available.
- [ ] Publish the `v1.0.0` Git tag and GitHub release after acceptance.

## v1.1: optional connected calendars

- [x] Add a local AtlasTime contact directory with optional email addresses and editable current/travel locations.
- [x] Import user-selected names, emails, and available city hints through the one-off device Contact Picker when supported, with manual and vCard/CSV fallbacks.
- [x] Keep local details editable inside AtlasTime and explain that PWA edits never modify a phone or account source contact.
- [x] Migrate saved groups and shared snapshots safely when optional c{ë_t¶‰žËkºwµçyMatch ? <AvailabilityConsentPage token={availabilityMatch[1]} /> : <PlannerApp />;
}

