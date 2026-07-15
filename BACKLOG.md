# AtlasTime backlog

## v0.10: mobile-device readiness and UI cleanup

- [x] Move the person-card delete action into a dedicated non-overlapping grid slot.
- [x] Keep the action accessible and touch-friendly on desktop and mobile.
- [x] Add regression coverage for control order and non-overlay layout rules.
- [x] Add a one-command local-network preview for real-phone testing.
- [x] Document Windows, Wi-Fi, firewall, and phone-browser setup.
- [x] Add a practical portrait, landscape, long-content, sharing, and export checklist.
- [ ] Complete hands-on testing on at least one iPhone and one Android phone.
- [ ] Build an installable PWA after real-device feedback is addressed.

## v0.9: meeting handoff and calendar-file export

- [x] Save a meeting title and duration with each group.
- [x] Migrate existing groups and shared links to safe title and duration defaults.
- [x] Generate a copyable summary with UTC and every participant's local-time range.
- [x] Download a standards-based `.ics` calendar file without account authorization.
- [x] Escape calendar text and calculate event end times across UTC date boundaries.
- [x] Add automated summary, calendar-file, persistence, and migration coverage.
- [ ] Add optional meeting notes and location fields after handoff usability feedback.

## v0.8: reliability and automated tests

- [x] Add a repeatable automated test command with browser-like storage support.
- [x] Test daylight-saving transitions and 30/45-minute timezone offsets.
- [x] Test meeting scoring, empty-group behavior, storage migration, and persistence.
- [x] Test Unicode share-link round trips and malformed payload rejection.
- [x] Test exact-query caching and offline error behavior.
- [x] Fall back to matching places saved during the previous 30 days when the network fails.
- [ ] Add component-level keyboard and accessibility regression tests.

## v0.7: accessibility and mobile usability

- [x] Add a keyboard skip link and consistent high-visibility focus states.
- [x] Improve city-search combobox semantics and screen-reader status announcements.
- [x] Add descriptive names and value text to slider and timeline controls.
- [x] Keep timeline identity visible while scrolling horizontally.
- [x] Increase touch targets and improve mobile group, form, hero, and footer layouts.
- [x] Support reduced-motion and forced-color preferences.
- [x] Add a clear empty state for new groups.
- [ ] Complete hands-on testing with VoiceOver, NVDA, and TalkBack.

## v0.6: saved groups and shareable schedules

- [x] Save multiple named groups locally in the browser.
- [x] Switch, create, rename, and safely delete groups.
- [x] Preserve each group's people, working hours, selected date, and selected hour.
- [x] Migrate existing v0.5 browser data into the first saved group.
- [x] Create portable share links without a backend.
- [x] Warn that share links contain names, locations, time zones, and working hours.
- [x] Require an explicit import so shared links never overwrite local data automatically.
- [x] Add automated import/export and storage-migration tests.

## v0.5: global place discovery

- [x] Replace the bundled city selector with global city search.
- [x] Add debounced typeahead, keyboard navigation, and loading, empty, and error states.
- [x] Return stable place IDs, city, country, latitude, longitude, and IANA timezone data.
- [x] Cache successful city and timezone results locally with a seven-day TTL.
- [x] Distinguish duplicate city names with administrative region and country labels.
- [x] Add provider attribution and configurable commercial endpoint support.
- [x] Add automated tests for daylight-saving transitions and non-hour-offset time zones.
- [x] Add an offline fallback for recently used places beyond cached search queries.

### Provider decision

- Prototype: Open-Meteo Geocoding API, which returns global translated place results and IANA timezones.
- Free public endpoint: evaluation and non-commercial use, subject to rate limits and attribution.
- Commercial path: configure `VITE_GEOCODING_API_URL` and `VITE_GEOCODING_API_KEY` for Open-Meteo's customer endpoint, or replace the provider module.
- Privacy: search text is sent to the configured geocoding provider; saved people and planner state remain local.

## Later product work

- Full assistive-technology testing on physical devices.
- Calendar integrations only after the planner workflow is validated.
- Authentication, synchronized data, invitations, and team workspaces only after local-first validation.

## Explicitly out of scope through v0.10

- Backend services or cloud persistence.
- Authentication and accounts.
- Calendar authorization or automatic meeting creation; v0.9 only downloads a local `.ics` file.
- Contact imports and messaging-provider APIs.
