# Kikroo v1.17 Android widget architecture

## Decision

v1.16 defined and tested the privacy-safe snapshot. v1.17 implements the first native Android home-screen widget and prepares it for the same private Play track. The widget does not read browser storage, calendar tokens, or the connected server directly.

## Snapshot boundary

The web app creates a versioned `WidgetSnapshot` containing only:

- generation, freshness, and expiry timestamps;
- device time zone and currently explored instant;
- selected group identifier and, when labels are enabled, its display label;
- up to six entries with display label, place, country code, IANA time zone, and local working-hour range;
- an optional recommendation containing only start time and aggregate available/total counts;
- `sky` or `midnight` theme and `labels` or `times-only` privacy mode.

The snapshot must never contain email, phone, contact ID, calendar provider, OAuth token, availability-request state, raw busy/free periods, meeting title, meeting location, notes, invitation links, or share links. `times-only` mode also removes group labels, entry labels, places, and country codes.

The contract is implemented in `src/widgetSnapshot.ts`. Its schema version starts at `1`, caps entries at six, and expires after 24 hours.

## Android bridge and storage

The v1.17 Android host establishes a verified-origin message channel between the Kikroo HTTPS experience and its trusted Android package. The native side:

1. accept messages only from the Digital Asset Links-verified Kikroo origin;
2. accept only the supported snapshot version and reject unknown fields, oversized strings, invalid time zones, more than six entries, or timestamps outside the allowed range;
3. write the validated snapshot to app-private Android storage using a single atomic replacement;
4. notify the widget provider only after the write succeeds;
5. never upload the snapshot or include it in diagnostics, backups, logs, or analytics.

The tracked native source lives in `android/widget-overlay`. `npm run android:init` regenerates the Bubblewrap TWA, then applies this overlay, pins the required Android browser libraries, replaces the generic launcher with Kikroo's verified-channel launcher, and registers the widget provider. Generated Android output and signing material remain outside Git.

The widget provider reads only this app-private snapshot. It never opens the web database or calendar connection state.

## Refresh and stale states

- **Fresh:** generated less than 15 minutes ago. Show all permitted content.
- **Stale:** 15 minutes to 24 hours old. Continue calculating local clock times from saved IANA zones, label the recommendation as potentially outdated, and show the last-updated age.
- **Expired:** 24 hours or older. Hide the recommendation and prompt **Open Kikroo to refresh**. Saved zones may still render current clocks, but no availability claim is shown.
- A successful app open writes a fresh snapshot. OS-approved background refresh may update display clocks, but it must not fetch calendars or connected-server data from the widget.

## Interaction workaround

The web slider is not embedded in the native widget. The reviewed widget actions are:

- **Previous 30 min** - move the widget's explored instant back by 30 minutes;
- **Now** - restore the current instant;
- **Next 30 min** - move the explored instant forward by 30 minutes;
- **Open Kikroo** - open the matching group in the full app for the complete slider and planner.

The native widget changes only its displayed instant. It does not silently modify the saved planner or create calendar events.

## v1.17 delivery gate

- [ ] Small and medium Android layouts remain legible at 200% font scaling on physical devices.
- [ ] Six entries, empty states, labels mode, and times-only mode are covered by physical screenshot evidence.
- [x] Origin validation, size limits, allow-listed fields, IANA zones, and timestamp bounds are enforced by native code; device evidence remains pending.
- [ ] `Previous 30 min`, `Now`, `Next 30 min`, and app tap-through work on two physical Android devices.
- [ ] Fresh, stale, expired, offline, reboot, and Play-update behavior are evidenced.
- [ ] No widget test output, Android log, or crash report contains prohibited fields.

## iPhone follow-up

The schema can inform a later WidgetKit implementation, but iPhone requires a separate native container, App Group storage, signing, TestFlight validation, and App Store review. Android widget delivery does not imply that the iPhone widget is complete.
