# Project Atlas UX Specification

**Document version:** 1.0  
**Status:** Approved foundation for MVP design and implementation  
**Product:** Project Atlas / AtlasTime  
**Owner:** Atlas Labs  
**Last updated:** 2026-07-21

## 1. Purpose

This specification translates the approved Product Requirements Document and Atlas Design Manifesto into an implementation-ready user experience for the Project Atlas MVP.

Atlas helps people coordinate across time zones without performing mental conversion. Its central experience is a visual timeline that makes local time, working hours, and shared availability immediately understandable.

This document defines:

- Information architecture and navigation
- Core user journeys and interaction rules
- Screen-level requirements and textual wireframes
- Responsive behavior
- Reusable design-system foundations
- Accessibility, motion, content, and error-handling standards
- Component behavior and UX acceptance criteria

## 2. Product experience principles

All product decisions must follow these principles.

### 2.1 One screen, one job

Each screen has one clear primary purpose:

- **Home:** Understand everyone's time at a glance.
- **Add person:** Find and add someone quickly.
- **Edit person:** Maintain personal and working-hour details.
- **Meeting planner:** Find the best shared time.
- **Settings:** Personalize the experience.

### 2.2 Time zones should disappear

Users select a real city. Atlas resolves its country, IANA time zone, UTC offset, and daylight-saving behavior. The MVP must not offer arbitrary manual time-zone selection.

### 2.3 Progressive disclosure

The shortest successful path asks only for essential information. Advanced choices appear only when useful.

For example, adding a person initially requires:

- Name
- City

Working hours, color, and avatar remain optional and use intelligent defaults.

### 2.4 Immediate feedback

Every user action must have an observable response within 100 ms where technically practical. Operations that take longer show an inline progress state without blocking unrelated actions.

### 2.5 Forgiveness

Destructive changes offer undo when practical. Validation explains how to recover. User-entered data must not disappear because a modal was closed accidentally or a request failed.

### 2.6 Calm precision

Atlas should feel calm, intelligent, reliable, professional, global, and modern. It must avoid clutter, novelty for its own sake, manipulative prompts, and decorative motion.

## 3. MVP experience scope

### 3.1 Included

- Add, edit, remove, favorite, and reorder people
- Search and select valid cities
- Resolve time zone automatically from the selected city
- Handle daylight-saving time automatically
- Display current local time for every person
- Compare a selected date across a 24-hour visual timeline
- Display and edit working hours
- Highlight shared working-hour overlap
- Recommend a meeting window
- Select meeting duration
- Persist data locally
- Support light, dark, and system themes
- Support 12-hour and 24-hour formats
- Responsive desktop, tablet, and mobile layouts
- Keyboard and screen-reader access
- Reduced-motion behavior
- Offline use for previously resolved data

### 3.2 Excluded from MVP

- Accounts and cloud synchronization
- Team workspaces
- Shared calendars and availability
- Google, Microsoft, Slack, Teams, Zoom, or other integrations
- AI scheduling
- Notifications
- Organization administration
- Cross-device sharing
- Travel-aware scheduling
- Regional holiday intelligence

Excluded capabilities must not create dead-end navigation in the MVP. They may appear only in product documentation, not as disabled interface controls.

## 4. Users and primary jobs

### 4.1 Remote employee

**Job:** Compare colleagues' local times and avoid scheduling outside working hours.

### 4.2 Freelancer or consultant

**Job:** Know when international clients are likely to be available and communicate appropriately.

### 4.3 Project manager or recruiter

**Job:** Find shared availability across several locations with minimal effort.

### 4.4 Person with family abroad

**Job:** See whether now is a good time to call without doing time-zone arithmetic.

The interface must use plain, inclusive language that works equally well for professional and personal use. Prefer “people” over “team members” and “availability” over “resource capacity.”

## 5. Information architecture

```text
Atlas
├── Home / Timeline
│   ├── Person details
│   ├── Add person
│   ├── Edit person
│   ├── Reorder people
│   └── Remove person + Undo
├── Meeting planner
│   ├── Participant selection
│   ├── Date selection
│   ├── Duration selection
│   └── Suggested windows
└── Settings
    ├── Time format
    ├── Theme
    ├── Language
    ├── Week start
    ├── Data and privacy
    └── About
```

### 5.1 Navigation model

Desktop and tablet use a compact left navigation rail or top application bar depending on available width. Mobile uses a bottom navigation bar with:

- **Time**
- **Planner**
- **Settings**

“Add person” is a prominent contextual action on Home, not a permanent navigation destination.

### 5.2 Navigation rules

- Home is the initial destination.
- Browser Back or platform Back closes the current overlay before leaving the current destination.
- Draft form data is retained while an overlay remains in the navigation history.
- Deep linking is not required for locally stored entities in the MVP.
- The currently active destination is visually and programmatically identified.
- Navigation never depends on color alone.

## 6. Global application shell

### 6.1 Desktop

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Atlas                  [Today, Tue 21 Jul]        [−] [100%] [+] [⚙]│
├────────────┬─────────────────────────────────────────────────────────┤
│ Time       │ Timeline toolbar                                      │
│ Planner    │ Date controls · Now · Zoom · Add person               │
│ Settings   ├─────────────────────────────────────────────────────────┤
│            │ Person rows and synchronized 24-hour timeline          │
│            │                                                         │
└────────────┴─────────────────────────────────────────────────────────┘
```

### 6.2 Mobile

```text
┌──────────────────────────────┐
│ Atlas        Tue 21 Jul  [+] │
├──────────────────────────────┤
│ Compact people/time overview │
│                              │
│ Selected-time slider         │
│ Shared availability summary  │
├──────────────────────────────┤
│  Time    Planner   Settings  │
└──────────────────────────────┘
```

### 6.3 Persistent global states

The shell supports:

- Loading the locally saved roster
- Empty roster
- Populated roster
- Offline
- Storage unavailable
- Unexpected recoverable error

Offline status appears as a quiet, non-blocking indicator. It must explain that saved people remain available and that searching for uncached cities may be limited.

## 7. Core journeys

## 7.1 First launch and onboarding

### Goal

Help a first-time user understand Atlas and add the first person in under two minutes.

### Flow

1. User opens Atlas.
2. Home displays the empty state with a concise value statement.
3. User selects **Add a person**.
4. Atlas opens the Add person sheet or dialog.
5. User enters a name and selects a city from search results.
6. Atlas previews the resolved location, current local time, and time zone.
7. User selects **Add person**.
8. The sheet closes and the person appears on the timeline.
9. A brief, dismissible hint explains dragging or selecting time on the timeline.
10. The hint never reappears automatically after dismissal.

### Empty-state copy

**Heading:** See everyone's time at a glance  
**Body:** Add someone by city. Atlas will handle the time zone and daylight saving automatically.  
**Primary action:** Add a person

Do not introduce a multi-page tutorial. The working interface is the onboarding.

## 7.2 Add a person

### Entry points

- Home primary action
- Header add button
- Empty-state action

### Required fields

- **Name:** 1–80 visible characters after trimming
- **City:** selected from a valid search result

### Optional fields

- Working hours
- Color
- Avatar

### City search behavior

- Search starts after two meaningful characters.
- Input uses a 250–350 ms debounce.
- Results prioritize exact name matches, then population or relevance.
- Each result shows city, administrative region when useful, and country.
- Results with duplicate city names must be distinguishable.
- Keyboard users can traverse results with arrow keys, select with Enter, and close with Escape.
- Screen readers receive the result count and active-option changes.
- Free text is not considered a valid selection.
- Editing the city text after selection clears the resolved city and disables submission until another valid result is selected.
- Atlas stores a stable place identifier, canonical city name, country code, IANA time zone, and coordinates when available.
- No manual time-zone field is shown.

### Resolved-location preview

After a valid selection, display:

- Canonical city and country
- Current local time
- Time-zone abbreviation when reliable
- UTC offset for the selected date
- A subtle note when daylight-saving rules affect the offset

Do not expose raw IANA identifiers as the primary label. They may appear as secondary diagnostic information in Edit person.

### Defaults

- Working hours: 09:00–17:00, Monday–Friday
- Color: automatically assigned from the accessible palette
- Avatar: initials derived from the entered name

### Success

The new row animates into place using a short opacity and position transition. Focus moves to the new person's row or to a confirmation announcement, depending on input modality.

### Errors

- No matches: suggest checking spelling or adding a region/country.
- Search unavailable: retain all typed data and offer Retry.
- Duplicate person: allow it, but gently indicate that a matching name and city already exists.
- Storage failure: keep the new person in memory and explain that changes may not persist after closing Atlas.

## 7.3 Edit a person

Selecting a person row opens a details sheet. The primary information is visible first; advanced properties are collapsed.

Editable properties:

- Name
- City
- Working schedule
- Favorite status
- Color
- Avatar

Changing city immediately refreshes the preview, but is not saved until the user selects **Save changes**. Cancel restores the previous saved state.

If a time-zone rule changes between sessions, Atlas uses the current authoritative rule and shows the updated local time without asking the user to intervene.

## 7.4 Remove and undo

1. User chooses **Remove person** from the person's overflow menu or Edit screen.
2. Atlas asks for confirmation only when undo cannot be guaranteed.
3. Otherwise, the row is removed immediately.
4. A toast states “[Name] removed” with an **Undo** action for at least 6 seconds.
5. Undo restores the person to the previous order and state.

Bulk removal is outside MVP scope.

## 7.5 Favorite and reorder

- Favorite is available from the row and Edit person.
- Favorited people sort above non-favorites by default.
- Within each group, users can reorder people.
- Drag-and-drop has keyboard alternatives: **Move up**, **Move down**, **Move to top**, and **Move to bottom**.
- Reordering is saved immediately.
- The user's explicit order wins over automatic alphabetical sorting.

## 7.6 Explore time on Home

### Default state

- Selected date is today.
- Selected time is now, rounded only for visual placement—not for labels.
- Current-time marker updates at least once per minute.
- Each row shows the person's local date and time at the selected instant.
- Day changes are explicitly labeled, such as **Mon −1 day** or **Wed +1 day**.

### Timeline interaction

- Drag horizontally to explore time.
- Mouse wheel or trackpad horizontal gestures pan the timeline.
- Pinch or controls change zoom where supported.
- Keyboard Left/Right changes the selected time by 30 minutes.
- Shift+Left/Right changes it by one hour.
- Home/End moves to the start/end of the displayed day.
- **Now** returns to the current instant and today's date.
- Snapping defaults to 30 minutes. At high zoom, 15-minute snapping is permitted.
- Exact selected time is always visible in a pinned label.
- Dragging cannot produce hidden or ambiguous day changes.

### Timeline layers

From back to front:

1. Day background
2. Non-working hours
3. Working-hour blocks
4. Shared-overlap highlight
5. Hour and day grid
6. Selected-time cursor
7. Current-time marker
8. Focus and hover indicators

Working hours and overlap must use pattern, border, label, or contrast in addition to color.

## 7.7 Find a meeting

### Entry points

- **Find a time** from Home
- Planner navigation destination
- Selecting a shared-overlap block

### Flow

1. Atlas opens Planner with all visible people selected by default.
2. User changes participants if needed.
3. User selects a date.
4. User selects meeting duration.
5. Atlas calculates intersections across participant working schedules.
6. Suggested windows appear in chronological order.
7. User selects a window.
8. Atlas shows a review summary in every participant's local time.
9. MVP completion action is **Copy meeting times**.

Calendar-event creation and invitations are outside MVP scope.

### Participant selection

- All people are initially selected when there are two or more.
- The local user may be represented as **You** with the device time zone.
- At least two time zones must participate for overlap recommendations to be meaningful.
- Selection changes update results immediately.

### Duration

Provide accessible preset controls:

- 30 minutes
- 45 minutes
- 1 hour
- 90 minutes
- 2 hours

A custom duration is optional only if it can be implemented without increasing MVP complexity. The default is 1 hour.

### Recommendation rules

A valid suggested window:

- Fits entirely within each selected participant's working hours
- Fits the requested duration
- Uses the selected date as viewed in the user's local time
- Correctly handles date boundaries and daylight-saving transitions

If multiple windows are valid, rank by:

1. Least inconvenience across participants
2. Closest to the center of collective working hours
3. Earliest chronological start

The interface must label suggestions as recommendations, not guarantees of real calendar availability.

### No-overlap state

**Heading:** No shared working time on this date  
**Body:** Try another date, shorten the meeting, or adjust the selected people.  
**Actions:** Previous day, Next day, Change duration

Atlas may show a “least inconvenient” option only when clearly labeled **Outside working hours** and never preselected.

### Meeting review

The review shows:

- Date and duration
- User's local start and end
- Every participant's local start and end
- Day-offset labels
- Participants outside configured working hours, if any
- **Copy meeting times** action

Copied content is plain text and includes time zones or city labels to avoid ambiguity.

## 8. Screen specifications

## 8.1 Home / Timeline

### Primary job

Understand everyone's time and shared availability at a glance.

### Required regions

- Application header
- Date and time controls
- People roster
- Synchronized timeline
- Shared availability summary
- Add person action
- Find a time action

### Desktop wireframe

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Atlas  Time                   Tue 21 Jul 2026     [Now] [− 100% +]  [+]│
├─────────────────────┬───────────────────────────────────────────────────┤
│ People              │ 00  03  06  09  12  15  18  21  24              │
│                     │                  │ selected                        │
│ ★ Ana               │ ░░░░░░████████░░│░░░░░░  São Paulo 14:00       │
│   São Paulo         │                  │                                │
│   Ken               │ ░░████████░░░░░░│░░░░░░  Singapore 01:00 +1    │
│   Singapore         │                  │                                │
│                     │       shared overlap                              │
├─────────────────────┴───────────────────────────────────────────────────┤
│ Best shared window: 09:00–11:00 your time          [Find a time]       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Row content priority

1. Name
2. Current or selected local time
3. City
4. Local day difference
5. Working status
6. Favorite and overflow actions

On narrow screens, city may move to secondary text. Name and local time must remain visible.

### Empty, loading, and error states

States occupy the content region without removing navigation or Settings access. Skeletons should resemble rows and avoid indefinite shimmer; reduced-motion mode uses static placeholders.

## 8.2 Add/Edit person sheet

### Primary job

Create or maintain one person.

```text
┌────────────────────────────────────┐
│ Add a person                   [×] │
│ Name                               │
│ [________________________________] │
│ City                               │
│ [Search city_____________________] │
│   Singapore · Singapore            │
│   Singapore, Michigan · USA        │
│                                    │
│ Selected: Singapore, Singapore     │
│ Local time: 01:00 · UTC+08:00      │
│                                    │
│ ▸ Working hours and appearance     │
│                                    │
│                   [Cancel] [Add]   │
└────────────────────────────────────┘
```

Desktop uses a modal or right-side sheet no wider than 520 px. Mobile uses a full-height sheet. The primary action remains visible above the on-screen keyboard when practical.

## 8.3 Meeting planner

### Primary job

Find a suitable shared meeting window.

```text
┌──────────────────────────────────────────────────────────────────┐
│ Meeting planner                                                  │
│ People: [You ×] [Ana ×] [Ken ×] [+]                              │
│ Date: [Tue 21 Jul]  Duration: [30m] [45m] [1h] [90m] [2h]       │
├──────────────────────────────────────────────────────────────────┤
│ Shared working time                                              │
│ [09:00────10:00]  Best fit                                       │
│ [10:00────11:00]                                                 │
│                                                                  │
│ Selected: 09:00–10:00                                            │
│ You 09:00 · Ana 10:00 · Ken 21:00                               │
│                                           [Copy meeting times]    │
└──────────────────────────────────────────────────────────────────┘
```

On mobile, controls stack above suggestions. The selected suggestion remains visible while reviewing local times.

## 8.4 Settings

### Primary job

Personalize Atlas.

Sections:

- **Time and region:** 12/24-hour format, language, week start
- **Appearance:** System/Light/Dark, reduced motion follows system by default
- **Data and privacy:** local-storage explanation, export placeholder only if implemented, clear all data
- **About:** version and product information

**Clear all data** is destructive and requires explicit confirmation describing exactly what will be removed. It cannot imply cloud deletion because the MVP has no cloud account.

## 9. Responsive behavior

### 9.1 Breakpoints

Breakpoints are behavioral guidelines, not device labels:

- **Compact:** below 600 px
- **Medium:** 600–1023 px
- **Expanded:** 1024 px and above

Components should respond to available space rather than user-agent detection.

### 9.2 Compact layout

- Bottom navigation
- One-column content
- Full-height forms
- Timeline uses a selected-time slider and horizontally scrollable detail
- People summary, local time, and selected-time control fit within one primary screen where practical
- Touch targets are at least 44 × 44 CSS px
- No hover-only functionality

### 9.3 Medium layout

- Navigation may use bottom bar or compact rail
- Person identity remains pinned while the timeline scrolls
- Planner may use two columns when space permits

### 9.4 Expanded layout

- Persistent navigation rail
- Person list and timeline visible together
- Planner uses controls/results plus a review panel
- Content width remains readable; timeline may expand fluidly

## 10. Design system foundation

The values below are implementation tokens. Final brand exploration may refine hues while preserving contrast and semantic roles.

## 10.1 Color roles

### Light theme

- Canvas: #F7F8FA
- Surface: #FFFFFF
- Surface subtle: #F0F2F5
- Text primary: #15181E
- Text secondary: #5D6573
- Border: #D8DDE6
- Accent: #315EFB
- Accent hover: #254BD1
- Focus ring: #315EFB
- Success: #16794C
- Warning: #9A6700
- Danger: #C52A32

### Dark theme

- Canvas: #0F1115
- Surface: #171A20
- Surface subtle: #20242C
- Text primary: #F4F6F8
- Text secondary: #AEB6C2
- Border: #343A46
- Accent: #7B9CFF
- Accent hover: #9AB2FF
- Focus ring: #9AB2FF
- Success: #52C28B
- Warning: #E5B94B
- Danger: #FF7A82

### Person colors

Use a curated palette tested against both themes. Person colors are identifiers, not status indicators. Always pair color with a name, initials, position, or pattern.

### Contrast

- Normal text: minimum 4.5:1
- Large text: minimum 3:1
- Meaningful non-text controls and graphics: minimum 3:1 against adjacent colors
- Disabled controls must remain legible and must not be the only way information is communicated

## 10.2 Typography

Use a system-first sans-serif stack for speed and native rendering.

- Display: 32/40, semibold
- Page title: 24/32, semibold
- Section title: 18/26, semibold
- Body: 16/24, regular
- Small: 14/20, regular
- Caption: 12/16, medium
- Time display: tabular numerals, 16/24 or larger
- Timeline labels: tabular numerals, minimum 12/16

Avoid weights below 400. Text must support 200% zoom without loss of content or function.

## 10.3 Spacing

Base unit: 4 px.

Preferred scale:

- 4, 8, 12, 16, 24, 32, 40, 48, 64

Primary page gutters:

- Compact: 16 px
- Medium: 24 px
- Expanded: 32 px

## 10.4 Shape and elevation

- Small radius: 6 px
- Control radius: 8 px
- Card radius: 12 px
- Sheet radius: 16 px on exposed corners
- Use borders before shadows
- Shadows indicate temporary elevation such as menus, sheets, and dragged items

## 10.5 Icons

- Use a single outlined icon family
- Default size: 20 px
- Provide visible labels for unfamiliar actions
- Every icon-only control has an accessible name and tooltip on hover/focus
- Flags must not represent time zones or languages; cities and countries are named in text

## 11. Component specifications

## 11.1 Buttons

Variants:

- Primary
- Secondary
- Quiet
- Danger
- Icon

States:

- Rest
- Hover
- Active
- Focus-visible
- Disabled
- Busy

Busy buttons retain their width, expose progress to assistive technology, and prevent duplicate submission. Only one primary button should appear per focused task region.

## 11.2 Text inputs

Inputs include persistent labels; placeholders are examples, never substitutes for labels. Validation appears inline after interaction or on submission, not while the user is still composing a valid value.

## 11.3 City combobox

The city field follows the accessible combobox pattern:

- Input owns or controls a listbox
- Active result uses active-descendant semantics or equivalent focus management
- Result count is announced politely
- Selection is explicit
- Loading and no-result states are announced
- Highlighting matched text does not reduce readability

## 11.4 Person row

Required interactive affordances:

- Select/open details
- Favorite
- Reorder
- Overflow menu
- Timeline inspection

Nested controls must not cause the entire row action accidentally. On touch, swipe gestures may be supplementary but never the only path.

## 11.5 Timeline

The timeline is a composite widget with:

- A visible cursor
- Text equivalent for selected time
- Keyboard controls
- Programmatically associated person rows
- Non-color representation of working and non-working intervals
- Stable labels during pan and zoom
- Virtualization when needed without breaking focus order

## 11.6 Toast

Toasts are reserved for completed, reversible, or non-blocking events. They do not contain critical information that disappears permanently. Screen readers receive polite announcements. Undo actions remain keyboard reachable.

## 11.7 Dialogs and sheets

- Focus moves inside on open
- Focus is trapped only for modal content
- Escape closes when safe
- Closing returns focus to the trigger
- Destructive confirmation names the action and affected data
- Unsaved edits prompt before discard when meaningful

## 12. Motion and feedback

### 12.1 Timing

- Micro feedback: 100–150 ms
- Standard transition: 180–240 ms
- Sheet or modal: 220–300 ms
- Avoid transitions longer than 400 ms

### 12.2 Easing

Use ease-out for entering elements and ease-in for exiting elements. Timeline movement should track the pointer directly while dragging and settle without decorative bounce.

### 12.3 Reduced motion

When reduced motion is requested:

- Replace movement with short opacity changes or immediate state changes
- Disable parallax, bounce, and large spatial transitions
- Do not auto-scroll except to preserve focus visibility
- Keep all functional feedback intact

### 12.4 Performance

- Direct manipulation should target 60 frames per second.
- Avoid rerendering all person rows every second.
- Current-time labels may update once per minute.
- Pan and zoom feedback must remain responsive under the supported MVP roster size.

Recommended MVP design target: up to 25 people without degraded interaction.

## 13. Accessibility requirements

Atlas targets WCAG 2.2 AA.

### 13.1 Keyboard

All workflows must be completable without a pointer. Focus order follows the visual task order. Focus is never lost after add, edit, remove, reorder, navigation, or responsive-layout changes.

### 13.2 Screen readers

- Pages and overlays have clear names.
- Local-time values include date, city, and offset context.
- Timeline graphics have a structured text alternative.
- Dynamic changes use restrained live-region announcements.
- Decorative graphics are hidden from assistive technology.

Example accessible time label:

“Ana, São Paulo: Tuesday 21 July, 2:00 PM, three hours behind your time, within working hours.”

### 13.3 Zoom and reflow

At 200% zoom, no content or functionality is lost. At a 320 CSS px viewport, content reflows without two-dimensional page scrolling; the timeline itself may scroll horizontally as an intentional data region.

### 13.4 Touch and pointer

Targets are at least 44 × 44 CSS px where practical. Drag interactions have click/tap and keyboard alternatives. Cancellation is possible before a drag commits.

### 13.5 Cognitive accessibility

- Use familiar language
- Keep dates unambiguous
- Show city and country when duplicate names exist
- Never rely on time-zone abbreviations alone
- Keep controls near the content they affect
- Avoid unexpected context changes

## 14. Content design

### 14.1 Voice

Atlas is concise, calm, direct, and helpful. It does not blame the user or over-celebrate routine actions.

Prefer:

- “Choose a city from the results.”
- “We couldn't search for cities. Check your connection and try again.”
- “No shared working time on this date.”

Avoid:

- “Invalid input.”
- “Something went wrong!”
- “Awesome! You successfully added a user!”

### 14.2 Date and time

- Respect the selected 12/24-hour preference.
- Always pair ambiguous cross-zone times with a date or day offset.
- Use locale-aware formatting.
- Avoid time-zone abbreviations as the sole identifier.
- When clocks change, explain the effect in plain language if it changes a proposed meeting.

## 15. Data, offline, and privacy experience

### 15.1 Local storage

The MVP stores people and preferences locally in the browser or device. Settings must state this clearly.

### 15.2 Offline behavior

When offline:

- Existing people and cached city/time-zone information remain usable.
- Timeline calculations continue locally.
- City search uses cached results if available.
- Atlas states when new location lookup requires a connection.
- Edits to existing local data remain available.

### 15.3 Privacy

- Request no contacts, calendar, or location permissions in the MVP.
- Do not infer the user's precise location without consent.
- Device time zone may be used as a default only when clearly labeled **You** or **Your time**.
- Do not transmit locally stored people unless required for city lookup; city requests must not include a person's name.

## 16. Edge cases

The implementation and QA plans must cover:

- Same city name in multiple countries or regions
- City aliases and localized names
- Half-hour and quarter-hour offsets
- Day crossing and International Date Line
- Daylight-saving start and end, including repeated or skipped local times
- Regions that change time-zone policy
- A person whose work shift crosses midnight
- Weekends and non-Monday week starts
- No shared overlap
- One-person roster
- Long names and city labels
- Right-to-left language readiness
- 25-person roster
- Offline city search
- Corrupted or unavailable local storage
- Device clock or time-zone change while Atlas is open

For MVP, split working shifts and rotating schedules may be deferred, but the data model and interface must not falsely imply support.

## 17. Analytics and success measurement

If privacy-respecting analytics are added, measure events without recording names, searched city text, or personal schedules.

Key product measures:

- Time from first launch to first person added
- Completion rate for Add person
- Time to first meeting recommendation
- No-overlap frequency
- City-search failure rate
- Undo usage after removal
- Timeline interaction performance
- Crash-free sessions

Success targets from the PRD:

- First people added in under 2 minutes
- Meeting found in under 30 seconds
- App launch under 2 seconds
- Crash rate below 0.2%
- App-store rating above 4.7 when native distribution exists

## 18. UX acceptance criteria

The MVP UX is ready for release when all conditions below are met.

### Person management

- A first-time user can add a person by entering a name and selecting a valid city.
- The time zone is resolved automatically and cannot be arbitrarily mismatched with the city.
- Duplicate city names are distinguishable.
- Add, edit, favorite, reorder, remove, and undo work with keyboard and pointer input.
- Saved people survive application restart.

### Timeline

- All rows represent the same selected instant.
- Current time, selected time, date changes, working hours, and overlap are distinguishable.
- Half-hour and quarter-hour offsets render accurately.
- Daylight-saving transitions do not produce incorrect meeting times.
- Timeline exploration has keyboard and text-equivalent access.
- Interaction remains responsive with 25 people.

### Planner

- Users can select participants, date, and duration.
- Only windows that fit the stated rules are recommended as shared working time.
- No-overlap guidance offers useful next steps.
- Review displays the meeting time for every selected person with day context.
- Copied meeting text is unambiguous.

### Responsive and accessible experience

- Core tasks work at compact, medium, and expanded widths.
- Content supports 200% zoom and 320 CSS px reflow.
- Light and dark themes meet contrast requirements.
- Reduced-motion preferences are honored.
- Automated accessibility checks pass, followed by manual keyboard and screen-reader testing.
- No essential interaction depends only on color, hover, drag, or gesture.

### Quality and trust

- Loading, empty, offline, error, and storage-failure states are designed and implemented.
- Destructive actions are recoverable or explicitly confirmed.
- No excluded future feature appears as a misleading active control.
- Privacy language accurately describes local data storage and network use.

## 19. Implementation handoff

Design and engineering should produce the following artifacts from this specification:

1. High-fidelity Home, Add/Edit person, Planner, and Settings layouts at compact and expanded widths.
2. Interactive prototype covering first launch, adding two people, timeline exploration, meeting selection, removal, and undo.
3. Design tokens mapped to the implementation theme.
4. Reusable components for person rows, city combobox, timeline, working-hour blocks, suggestions, sheets, dialogs, and toasts.
5. Location/time-zone service contract using stable place identifiers and IANA time zones.
6. Accessibility annotations for composite components.
7. Test cases derived from Section 18 and the edge cases in Section 16.

## 20. Open decisions for design validation

These items do not block the specification but require prototype or usability validation before final visual implementation:

- Whether desktop navigation is best represented by a slim rail or compact top-level tabs
- Whether mobile time exploration should prioritize a slider, direct timeline drag, or both
- The clearest visualization for shared overlap when more than five people are visible
- Whether the local user should always appear as a pinned **You** row
- Whether 30-minute or 1-hour snapping is the best first-use default
- The maximum number of suggested meeting windows shown before progressive disclosure

Decisions must be evaluated against speed of comprehension, accessibility, and the “one screen, one job” principle—not visual novelty.

---

This document is the UX source of truth for the Atlas MVP. When it conflicts with the current prototype, the approved PRD and this specification define the intended product behavior unless a later decision record explicitly supersedes them.
