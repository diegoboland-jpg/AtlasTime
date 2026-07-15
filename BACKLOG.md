# AtlasTime backlog

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
- [ ] Add automated import/export and storage-migration tests.

## v0.5: global place discovery

- [x] Replace the bundled city selector with global city search.
- [x] Add debounced typeahead, keyboard navigation, and loading, empty, and error states.
- [x] Return stable place IDs, city, country, latitude, longitude, and IANA timezone data.
- [x] Cache successful city and timezone results locally with a seven-day TTL.
- [x] Distinguish duplicate city names with administrative region and country labels.
- [x] Add provider attribution and configurable commercial endpoint support.
- [ ] Add automated tests for daylight-saving transitions and non-hour-offset time zones.
- [ ] Add an offline fallback for recently used places beyond cached search queries.

### Provider decision

- Prototype: Open-Meteo Geocoding API, which returns global translated place results and IANA timezones.
- Free public endpoint: evaluation and non-commercial use, subject to rate limits and attribution.
- Commercial path: configure `VITE_GEOCODING_API_URL` and `VITE_GEOCODING_API_KEY` for Open-Meteo's customer endpoint, or replace the provider module.
- Privacy: search text is sent to the configured geocoding provider; saved people and planner state remain local.

## Later product work

- Full assistive-technology testing on physical devices.
- Calendar integrations only after the planner workflow is validated.
- Authentication, synchronized data, invitations, and team workspaces only after local-first validation.

## Explicitly out of scope through v0.7

- Backend services or cloud persistence.
- Authentication and accounts.
- Calendar authorization or automatic meeting creation.
- Contact imports and messaging-provider APIs.
