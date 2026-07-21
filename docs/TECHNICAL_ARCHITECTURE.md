# Project Atlas Technical Architecture

**Version:** 1.0  
**Status:** Implementation baseline  
**Product:** Project Atlas / AtlasTime  
**Last updated:** 2026-07-21

## 1. Architecture goals

AtlasTime must make cross-time-zone planning fast, correct, private, accessible, and usable offline after initial location resolution. The MVP favors a client-only architecture: no account, server database, calendar authorization, or personal-data backend.

Quality targets:

- Interactive shell visible in under 2 seconds on a typical mobile connection
- Timeline interaction targeting 60 FPS
- Correct IANA time-zone and daylight-saving behavior
- Local-first persistence and graceful storage failure
- WCAG 2.2 AA
- A clean migration path to optional synchronization and integrations

## 2. Current technology baseline

- React 19 with TypeScript
- Vite 6
- Native Intl.DateTimeFormat for time-zone conversion
- Open-Meteo geocoding for global city lookup and IANA time-zone metadata
- Browser localStorage for groups, people, planner state, and cached places
- Vitest and jsdom for automated tests
- Progressive Web App service worker and install experience
- Lucide React icons
- Shareable URL-fragment payloads for portable group invitations

No state-management framework, component framework, application server, or database is required for MVP.

## 3. System context

```text
User
  |
  v
AtlasTime PWA
  |-- React presentation and interaction
  |-- Domain services: time, overlap, groups, sharing
  |-- Local persistence and cached cities
  |
  +--> Open-Meteo geocoding (city lookup only)
  |
  +--> Browser/OS Intl time-zone database
```

Names and working schedules remain local. City queries sent to the geocoder must never include a person's name or group metadata.

## 4. Frontend boundaries

### 4.1 Application shell

Responsibilities:

- Own active workspace and group state
- Coordinate navigation and primary overlays
- Persist state through repository functions
- Provide the selected instant to all time displays
- Handle PWA install/update states

The shell should orchestrate components, not contain time-zone algorithms or storage parsing.

### 4.2 Presentation components

Components render one user-facing responsibility: add person, person card, group management, timeline, meeting planner, handoff, mobile overview, installation, update notice, and shared-import banner.

Rules:

- Props use domain types, not raw storage JSON.
- Components do not access localStorage directly.
- Components do not call the geocoder except through the location service.
- Complex keyboard behavior is encapsulated with the component it serves.
- Mobile and desktop views consume the same domain state and calculations.

### 4.3 Domain modules

- `time.ts`: instant construction, local formatting, work-hour scoring, recommendations
- `groups.ts`: persistence, schema normalization, legacy migration, share serialization
- `cities.ts`: trusted known-place metadata and recent-place lookup
- `services/geocoding.ts`: provider request, response mapping, validation, caching
- `types.ts`: canonical domain contracts
- `id.ts`: collision-resistant client identifiers
- `pwa.ts`: service-worker lifecycle integration

Domain functions should remain deterministic where possible and be unit tested without rendering React.

## 5. Time model

### 5.1 Canonical representation

- Instants are JavaScript Date objects or UTC epoch milliseconds at runtime.
- Persisted planning dates use ISO local-date strings, `YYYY-MM-DD`.
- Persisted zones use IANA identifiers such as `America/Sao_Paulo`.
- Working-hour values are local wall-clock hours in the person's zone.
- Display formatting is locale-aware and never used as stored data.

UTC offsets and abbreviations must not be persisted as authoritative because they change with date and time-zone rules.

### 5.2 DST correctness

Every displayed or scored local time is derived from the selected UTC instant plus the person's IANA time zone through Intl. The system must not calculate time by adding a fixed offset.

Tests must cover:

- Spring-forward skipped times
- Autumn repeated times
- Half-hour and quarter-hour zones
- International Date Line
- Selected meetings crossing local dates

### 5.3 Meeting recommendations

The recommendation engine is a pure domain service. Inputs:

- Participants
- Selected calendar date
- Duration
- Candidate granularity

Outputs:

- Fully shared working windows
- Participant availability and inconvenience score
- Local start/end for review
- Explicit outside-hours status where no full overlap exists

The existing single-hour score is an MVP baseline. It must evolve to score the complete requested duration rather than only the start hour.

## 6. Location and time-zone resolution

### 6.1 Provider

Open-Meteo geocoding is the MVP provider. The service adapter prevents provider response fields from leaking into UI and domain types.

### 6.2 Selection contract

Free text is never a saved location. A saved person requires a selected result containing:

- Stable provider or derived place identifier
- Canonical city
- Country and ISO country code when available
- IANA time zone
- Coordinates when available for future disambiguation

The UI displays the zone as resolved, read-only information. There is no arbitrary manual zone selector.

### 6.3 Request behavior

- Begin at two meaningful characters
- Debounce 250–350 ms
- Cancel superseded requests with AbortController
- Validate provider responses
- Cap displayed results
- Cache recent successful selections
- Fall back to cached results when offline
- Retain form data on failure
- Attribute the provider where required

### 6.4 Future provider portability

The adapter exposes an internal `searchCities(query, signal)` contract. A future provider switch must not require changes to Person, the add form's selection semantics, or persistence.

## 7. Persistence architecture

### 7.1 MVP storage

localStorage is appropriate for the current small, local-only data set. All access is behind the group repository.

The repository:

- Parses untrusted JSON defensively
- Applies length and count limits
- Normalizes country codes
- Validates time zones before use
- Migrates legacy keys
- Falls back safely on corruption
- Separates stored schema version from UI version

### 7.2 Storage evolution

Use explicit versioned keys and migrations. Additive optional fields are preferred. A migration must be idempotent and preserve recoverable data.

Move to IndexedDB only when one of these becomes true:

- Local data exceeds practical localStorage limits
- Offline city indexing becomes materially larger
- Atomic multi-record updates are required
- Export/import contains binary assets
- Background synchronization is introduced

### 7.3 Future cloud synchronization

Cloud sync is a post-MVP capability behind a repository interface. The client-only repository remains supported. Synchronization will require authentication, encryption in transit, access control, deletion semantics, conflict policy, auditability, and a separate threat model.

## 8. Share links

Share payloads live in the URL fragment so they are not automatically sent to the host server. They contain a portable copy, not a live shared workspace.

Requirements:

- Explicit consent before creation
- Clear disclosure of included data
- Versioned payload
- Strict parsing, size limits, and schema validation
- New identifiers on import
- No automatic overwrite of local groups
- No secrets, tokens, or executable content

URL fragments can still be exposed through screenshots, clipboard history, browser history, or recipients. The UX must state that anyone with the link can read its contents.

## 9. PWA and offline behavior

The service worker caches only application assets and explicitly safe provider responses. Update activation must not interrupt an active form or discard unsaved state.

Offline:

- The shell loads
- Saved groups remain available
- Time calculations continue locally
- Recent cached cities can be selected
- New uncached city lookup explains that connectivity is required

Cache version changes must not delete user data.

## 10. Security and privacy

- Treat localStorage, URL fragments, imported share data, and provider responses as untrusted.
- Render user text through React escaping.
- Validate IANA time zones before passing them to Intl.
- Apply input length and collection limits.
- Use HTTPS for provider requests.
- Do not use HTML injection APIs for user content.
- Do not place names or schedules in analytics.
- Do not request contacts, calendar, location, microphone, or camera permissions in MVP.
- External launch links use safe rel attributes.
- Introduce a Content Security Policy before public production launch.

## 11. Accessibility architecture

Accessibility is a component contract:

- City search follows the ARIA combobox/listbox pattern.
- Timeline has keyboard control and structured text equivalents.
- Drag-and-drop always has button and keyboard alternatives.
- Modal focus is contained and restored.
- Dynamic results use restrained live regions.
- Reduced-motion and forced-color preferences are supported.
- Responsive DOM order must match reading and focus order.

Automated checks are necessary but do not replace keyboard and screen-reader validation.

## 12. Performance strategy

- Keep selected-time calculations memoized.
- Update live clocks once per minute unless seconds are visible.
- Avoid rerendering every person during unrelated form input.
- Virtualize only after profiling shows a need; preserve focus semantics.
- Keep geocoding requests abortable and deduplicated.
- Lazy-load future settings or integration surfaces.
- Establish a supported MVP target of 25 people per group and 30 in imported shares.

Performance changes require measurement rather than speculative complexity.

## 13. Testing strategy

### Unit

- Time conversion and DST transitions
- Duration-aware overlap calculations
- Ranking and tie breaking
- Storage normalization and migrations
- Share serialization and hostile payload rejection
- Provider mapping and cache behavior

### Component

- City combobox keyboard and screen-reader state
- Add/edit validation
- Remove and undo
- Person reordering
- Planner participant/duration behavior
- Error and offline states

### End-to-end

- First launch to first person
- Add two distant cities and find a meeting
- Reload and verify persistence
- Import a share without overwriting data
- Offline return visit
- Keyboard-only primary flows

### Manual

- VoiceOver and NVDA smoke tests
- 200% zoom and 320 px reflow
- Reduced motion, forced colors, and dark theme
- Representative mobile touch devices

## 14. Delivery and branching

- Main remains releasable.
- Product changes use focused branches and reviewable pull requests.
- Documentation-only corrections may be committed directly when risk is low.
- Build and tests must pass before merge.
- Release version and visible badge are derived from one source to avoid drift.
- Architecture decisions that change these boundaries receive a short decision record under `docs/decisions/`.

## 15. Architectural decisions

1. Client-only PWA for MVP.
2. React, TypeScript, and Vite remain the implementation stack.
3. Intl plus IANA identifiers is the time-zone authority.
4. Open-Meteo is isolated behind a geocoding adapter.
5. localStorage remains the MVP persistence layer.
6. URL-fragment shares are portable copies, not collaboration.
7. No manual time-zone selection.
8. No backend until accounts, live sharing, or integrations justify it.
9. Accessibility and privacy are architectural constraints, not polish tasks.

## 16. Immediate technical priorities

1. Make meeting recommendation duration-aware.
2. Add edit-person support with city re-resolution.
3. Add recoverable removal with Undo.
4. Add favorite and keyboard-accessible reordering.
5. Add theme/time-format settings and versioned persistence.
6. Add component and end-to-end tests around the primary journeys.
7. Align README claims and visible version labels with the implemented product.
