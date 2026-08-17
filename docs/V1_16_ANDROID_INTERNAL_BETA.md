# Kikroo v1.16 — Google Play internal beta

## Outcome

Kikroo 1.16 moves the accepted v1.15 protected web beta into a real, private Google Play internal-testing track. It proves installation, verified app links, OAuth return, updates, offline reopen, and local-data continuity on Android before any public store launch.

v1.16 begins only after the v1.15 exit report records **proceed** or an explicitly limited extension with no open P0/P1 issue.

## Product increment

### 1. Reproducible signed Android bundle

- Build a Trusted Web Activity bundle using the permanent application ID `com.badie.kikroo`.
- Use version name `1.16.0` and a monotonically increasing Play version code selected at release time.
- Keep the upload key, passwords, Play signing certificate, and recovery material outside Git with two protected backups.

Acceptance evidence:

- `npm test -- --run`, `npm run build`, and `npm run android:check` pass on the tagged commit.
- The generated `.aab` reports the expected application ID, version, host, icons, and start URL.
- Repository and bundle scans find no `.jks`, password, OAuth secret, token-encryption key, tester identity, or calendar content.
- A second authorized custodian can locate the recovery instructions without receiving the password in source control.

### 2. Private Google Play distribution

- Create the Play application and enable Play App Signing.
- Upload the bundle only to **Internal testing**.
- Complete store identity, content rating, Data safety, support contact, and privacy-policy fields from implemented behavior rather than marketing assumptions.

Acceptance evidence:

- At least two authorized tester accounts can opt in and install from the Play link.
- The store listing shows **Kikroo**, the approved logo, correct screenshots, beta wording, support channel, and privacy URL.
- Data-safety answers distinguish browser-local contact/planner data, hosted encrypted availability records, external geocoding, and optional Google/Microsoft access.
- No production/public rollout is active.

### 3. Verified Android app links and connected services

- Publish Digital Asset Links using the Google Play **app-signing SHA-256** certificate fingerprint.
- Keep Google and Microsoft redirect origins aligned with the hosted Kikroo origin.
- Preserve minimum busy/free calendar access and explicit disconnect/revoke controls.

Acceptance evidence:

- The Play-installed app opens without a browser address bar on both test devices.
- `/.well-known/assetlinks.json` contains `com.badie.kikroo` and the active Play fingerprint but no private signing material.
- Google and Outlook connect, return to Kikroo, show occupied/free state, and disconnect successfully on a physical phone.
- A revoked or expired availability link cannot submit new availability.

### 4. Update and resilience proof

- Test an update from one internal build to a higher version code.
- Preserve local groups, people, working hours, selected date/hour, theme, and planner drafts through the update.
- Keep an intelligible offline state and recovery path.

Acceptance evidence:

- Saved sample data survives Play update on both Android devices.
- Offline reopen shows cached app content and clearly identifies online-only actions.
- Back navigation does not unexpectedly exit during the primary group/planner/handoff journey.
- The app returns to **At a glance** after a fresh launch and has no duplicate persistent time slider.
- No unexplained blank screen, horizontal overflow, or P0/P1 finding remains.

### 5. Native-widget architecture decision

v1.16 does not ship a home-screen widget. It defines and validates the safe data contract required for the next native increment:

- selected group identifier and display label;
- device time plus up to six saved locations and their time-zone identifiers;
- one recommended humane time and freshness timestamp;
- theme and privacy-safe status only;
- no calendar token, email, phone, meeting notes, private link, or raw busy/free interval.

Acceptance evidence:

- A reviewed architecture note chooses the Android snapshot storage/bridge, refresh schedule, stale-data treatment, and tap-through behavior.
- A static small/medium widget prototype is legible at Android font scaling up to 200%.
- Security review proves the snapshot cannot expose calendar authorization or contact data.
- The owner decides whether native Android widget implementation is v1.17 or follows iOS TestFlight work.

## Release gate

- [ ] v1.15 exit decision permits v1.16.
- [ ] Legal owner, privacy/support contact, and beta distribution list are approved.
- [ ] Two Android devices install through the private Play link.
- [ ] One Play update preserves all required local data on both devices.
- [ ] OAuth, disconnect, revoke, offline reopen, app links, and back navigation pass.
- [ ] Store declarations match the current beta privacy notice and implementation.
- [ ] No open P0/P1 issue and no unresolved secret/signing-material exposure.
- [ ] Evidence bundle, signed-build custody record, and internal-test report are archived.

## Explicitly out of scope

- Public Google Play production rollout.
- Apple TestFlight or App Store submission.
- Native Android/iOS home-screen widget implementation.
- Accounts, cross-device cloud synchronization, advertising, or behavioral analytics.
- Reading calendar event titles/descriptions or silently sending invitations.
