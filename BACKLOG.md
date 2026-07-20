# AtlasTime backlog

## v0.24: country-aware tile identity

- [x] Preserve country name and ISO alpha-2 country code when a city is selected from global search.
- [x] Carry validated optional country metadata through local persistence and share links.
- [x] Add a subtle diagonal flag crop behind roughly 35% of each filled time tile while keeping time and status text primary.
- [x] Hide decorative flags in forced-colors mode and keep them out of the accessibility tree.
- [x] Never infer a flag from a timezone; older entries without dependable country metadata remain visually unchanged.
- [ ] Compare flag opacity and crop on physical Windows, Android, and iPhone displays.

## v0.23: reliable installed-app updates

- [x] Detect when a newer AtlasTime service worker is installed and waiting.
- [x] Show a clear in-app update notice on installed Windows, Android, and iPhone PWAs.
- [x] Let the user activate the update immediately and reload without clearing locally saved groups.
- [x] Check again when the app regains focus and retain offline app-shell behavior.
- [x] Add a repeatable old-version-to-new-version test guide.
- [ ] Validate the complete update flow on the installed Windows PWA and one physical phone.

### Branch-retention policy

- Keep `main`, any active development branch, and the 10 most recently merged feature branches as a temporary safety buffer.
- Preserve important milestones as Git tags or GitHub releases; major versions do not need permanent feature branches.
- Never delete an unmerged branch or a branch with unique work.
- Do not begin automatic branch deletion yet. Review the policy after v1.0 or when the branch list becomes difficult to navigate.

## v0.22: desktop PWA parity

- [x] Use the animated Everyone's Time overview as the primary experience on installed Windows and desktop browsers.
- [x] Show six overview slots in a desktop-friendly 3 × 2 grid while retaining the phone's 2 × 3 grid.
- [x] Keep live-versus-exploring time behavior, vector scenes, and empty add slots consistent across screen sizes.
- [x] Keep the shared 24-hour slider visible while scrolling on desktop and phone.
- [x] Remove the older desktop hero and duplicate in-page slider from the primary flow.

## v0.21: six-slot mobile overview

- [x] Show a stable two-column, three-row grid with six visible slots in Everyone's time.
- [x] Fill unused slots with accessible plus-button invitations that open the existing add-entry form.
- [x] Keep the first six entries visible and let larger groups scroll inside the overview.
- [x] Avoid an unnecessary keyboard scroll stop until a group contains more than six entries.
- [ ] Validate the six-slot height and add invitation on a physical Android phone and iPhone.

## v0.20: accurate live time and calmer mobile planning

- [x] Show the exact current minute in every compact time tile while the overview is idle.
- [x] Switch all compact tiles and the device card together only while the user explores, then return them to live time after 20 seconds or with Now.
- [x] Add 30-minute increments to the primary desktop and mobile sliders.
- [x] Use neutral local-time defaults of 12:00-14:59 for lunch and 19:00-21:59 for dinner.
- [x] Reduce the mobile recommendation panel to a quiet planner shortcut without duplicating a recommended time.
- [ ] Validate the meal windows with people from different regions before making them configurable by locale or personal preference.

### Future visual review

- Explore a subtle country-flag crop covering roughly 25-35% of each tile after place results retain dependable country metadata.
- Test diagonal and left-edge treatments at low opacity; time, status, and accessibility contrast must remain primary.
- Avoid inferring a flag from a timezone alone because one timezone can represent multiple countries or territories.

## v0.19: compact overview resilience

- [x] Expose the compact group as a semantic list with complete spoken summaries for every time card.
- [x] Keep overflowing groups keyboard-scrollable without adding an unnecessary tab stop for small groups.
- [x] Add an extreme text-zoom reflow that stacks cards and slider controls instead of clipping them.
- [x] Add component and stylesheet regression coverage for long labels, overflowing groups, and large-text layouts.
- [x] Refresh the PWA cache generation and guard it with a version regression test so installed previews do not stay on an older interface.
- [ ] Validate 200% text zoom and a six-entry group on physical Android and iPhone devices.

## v0.18: clearer time tiles and meal scenes

- [x] Replace the afternoon artwork with a descending sun and visible sky arc that reads differently from morning and midday.
- [x] Cycle each compact tile between its name and location every three seconds with a fade transition instead of overlapping both labels.
- [x] Preserve both name and location for assistive technology and show both without motion when reduced motion is preferred.
- [x] Try distinct meal concepts: a bowl and spoon for lunch, and a plate with clearer solid fork and knife silhouettes for dinner.
- [ ] Compare the lunch and dinner concepts on physical phones and choose whether both remain or one visual language becomes standard.

## v0.17: vector scene depth and polish

- [x] Increase the visual weight and opacity of the time-of-day vector scenes so the artwork feels more solid while preserving text contrast.
- [x] Refine scene composition, color, and scale across small and large phone widths.
- [ ] Validate the stronger artwork in daylight and dark viewing conditions before finalizing its contrast levels.

## v0.16: visual time-of-day tiles

- [x] Link the device-time card to the 24-hour slider while exploring, then return the full overview to live time after 20 seconds or with Now.
- [x] Clearly distinguish Current time from Exploring time so a shifted device clock is never mislabeled as live.
- [x] Classify every displayed local hour as night, morning, lunch time, afternoon, dinner time, or evening.
- [x] Apply animated, period-aware color treatments while preserving working-hours status and the two-column mobile grid.
- [x] Add scalable vector scenes for sunrise and coffee, daylight and clouds, meal-time utensils, sunset, moonrise, and stars.
- [x] Respect the existing reduced-motion preference for all new transitions.
- [x] Add boundary and normalization tests for the time-of-day model.
- [ ] Validate the visual language with users in different regions before making meal periods configurable.

## v0.15: focused planning and progressive disclosure

- [x] Keep Everyone's Time as the primary mobile experience and show the best-scoring hour directly within it.
- [x] Offer direct Use time and Compare all hours actions without duplicating every participant time.
- [x] Keep the detailed date, recommendation context, and 24-hour comparison collapsed until requested.
- [x] Preserve the planning engine and local calendar-file handoff without adding calendar authorization.
- [x] Add regression coverage for collapsed and expanded planner states.
- [ ] Validate the simplified flow with first-time users before introducing calendar integrations.

## v0.14: mobile and accessibility regression coverage

- [x] Add keyboard navigation for the phone planner's hour picker, including Arrow keys, Home, and End.
- [x] Enforce 44px touch targets for install, delete, work-hour, slider, and timeline controls.
- [x] Add a narrow-layout reflow for compact time cards and planner participant rows.
- [x] Add automated regression coverage for keyboard behavior, touch sizing, narrow reflow, reduced motion, forced colors, and visible focus.
- [ ] Complete hands-on testing with VoiceOver, NVDA, and TalkBack on physical devices.

## v0.13: mobile planner ergonomics

- [x] Redesign the group hour-matching view for phone widths so participant names, selected times, and availability remain easy to scan without a dense horizontal table.
- [x] Use a snap-scrolling UTC hour picker plus stacked local-time cards with touch targets of at least 44px; avoid conflicts with the floating time slider.
- [ ] Validate the redesigned planner on at least one Android phone and one iPhone.

## v0.12: compact mobile time overview

- [x] Add an in-app, widget-style overview that keeps the device's local time, every person/location time, and the primary 24-hour slider together in the first mobile viewport.
- [x] Show both live local time and the selected meeting time without duplicating planner state.
- [x] Use a compact responsive strip or grid for small groups, with touch-friendly horizontal overflow for larger groups.
- [x] Keep names, locations, day changes, work-hour status, and the selected hour readable at phone widths.
- [x] Preserve the full editable person cards below the compact overview instead of hiding working-hour controls.
- [x] Keep the real device clock and time zone fixed above slider-controlled meeting-time tiles.
- [x] Return the mobile slider to current time after 20 seconds of inactivity or immediately with the Now button.
- [x] Animate selected-time changes on the tiles while respecting reduced-motion preferences.
- [x] Keep the mobile time slider visible as a floating control while the rest of the app scrolls.
- [x] Add responsive and accessibility regression coverage for compact, overflow, and large-text layouts.
- [ ] Validate the overview on at least one Android phone and one iPhone before marking the milestone complete.

This milestone refers to a widget-style view inside the PWA. Native Android or iOS home-screen widgets remain future work until web-app validation is complete.

## v0.11: installable PWA preview

- [x] Add a web app manifest, standalone display mode, theme metadata, and scalable app icon.
- [x] Add a same-origin offline shell without caching third-party city-search requests.
- [x] Add install guidance for Chromium browsers and iPhone Safari.
- [x] Add a production network-preview command and physical-device checklist.
- [ ] Validate installation, relaunch, updates, and offline reopening on an iPhone.
- [ ] Validate installation, relaunch, updates, and offline reopening on an Android phone.
- [ ] Add dedicated PNG icons and store-ready assets after the visual identity is approved.

## v0.10: mobile-device readiness and UI cleanup

- [x] Move the person-card delete action into a dedicated non-overlapping grid slot.
- [x] Move the primary 24-hour slider directly below the people cards and above planner analysis.
- [x] Keep the action accessible and touch-friendly on desktop and mobile.
- [x] Add regression coverage for control order and non-overlay layout rules.
- [x] Add a one-command local-network preview for real-phone testing.
- [x] Document Windows, Wi-Fi, firewall, and phone-browser setup.
- [x] Add a practical portrait, landscape, long-content, sharing, and export checklist.
- [ ] Complete hands-on testing on at least one iPhone and one Android phone.
- [x] Build an installable PWA preview for real-device validation.

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

## Explicitly out of scope through v0.11

- Backend services or cloud persistence.
- Authentication and accounts.
- Calendar authorization or automatic meeting creation; v0.9 only downloads a local `.ics` file.
- Contact imports and messaging-provider APIs.

