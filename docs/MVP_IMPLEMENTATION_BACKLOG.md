# Project Atlas MVP Implementation Backlog

**Version:** 1.0  
**Status:** Prioritized from PRD, UX Specification, and repository audit  
**Last updated:** 2026-07-21

## Current baseline

Already present:

- React/Vite/TypeScript PWA
- Multiple locally saved groups
- Global city autocomplete through Open-Meteo
- Automatic read-only IANA time-zone resolution
- Recent/offline place fallback
- Keyboard-operable city results
- DST-safe Intl formatting
- Current and selected local times
- Working-hour editing
- Hour scoring and recommendation
- Meeting handoff fields and portable share links
- Local persistence, legacy migration, PWA install/update states
- Unit tests for time zones, storage, and sharing

The approved city/time-zone requirement is therefore implemented. Remaining work should refine and validate it rather than reintroduce manual zone entry.

## P0 — Correctness and trust

### ATLAS-001 Duration-aware recommendations

**Outcome:** A 90-minute meeting is recommended only when the complete 90 minutes fits the stated availability.

Acceptance:

- Candidate scoring evaluates the full selected duration.
- Supported durations: 30, 45, 60, 90, 120 minutes.
- Candidate increment is 30 minutes initially.
- Full-overlap results rank above outside-hours results.
- Local start/end and day offsets are shown.
- Tests cover half-hour zones and DST boundaries.

### ATLAS-002 Validate untrusted time zones

**Outcome:** Corrupt storage or imported links cannot crash Intl formatting.

Acceptance:

- Time-zone validation occurs during storage/share normalization.
- Invalid people are rejected or repaired only from trusted known-place data.
- User receives a recoverable import/storage message.
- Tests include malformed and hostile zone strings.

### ATLAS-003 Storage failure handling

**Outcome:** Users understand when changes may not persist.

Acceptance:

- Reads and writes distinguish unavailable storage, quota, and malformed data.
- In-memory work remains usable.
- Non-blocking banner explains persistence risk.
- No implicit data clearing.

### ATLAS-004 Align product claims and versions

**Outcome:** README, visible badge, footer, package version, and implemented scope agree.

Acceptance:

- One version source feeds visible UI where practical.
- README documents city search, automatic zone resolution, groups, shares, and PWA behavior.
- Future features are clearly separated.
- Encoding artifacts in visible strings are removed.

## P1 — Complete the approved MVP experience

### ATLAS-005 Edit person and city

- Edit name and city from a focused sheet.
- Changing city requires selecting a valid result.
- Time zone updates automatically.
- Cancel preserves saved data.
- Existing working hours remain unless explicitly changed.

### ATLAS-006 Remove with Undo

- Removal is immediately reversible for at least six seconds.
- Undo restores order and all data.
- Keyboard focus returns predictably.
- Screen readers receive removal and restoration announcements.

### ATLAS-007 Favorites and accessible reordering

- Favorite/unfavorite from row and edit surface.
- Favorites appear first.
- Pointer drag is optional.
- Move up/down/top/bottom actions are always available.
- Order persists.

### ATLAS-008 Participant-aware planner

- Select which people participate.
- Default selects all visible people.
- Recommendation updates immediately.
- At least two selected zones are required for shared-overlap claims.
- Participant selection persists within the planner draft.

### ATLAS-009 Settings

- System/light/dark theme
- System/12h/24h time format
- Locale-ready formatting
- Week-start preference
- Versioned persistence
- Clear-all-data confirmation

### ATLAS-010 Empty-state onboarding

- First-use value statement matches UX Specification.
- Primary Add person action is unambiguous.
- A one-time, dismissible timeline hint appears after first addition.
- No tutorial carousel.

## P1 — Accessibility and responsive quality

### ATLAS-011 Timeline keyboard model and text equivalent

- Left/Right moves 30 minutes.
- Shift modifies by one hour.
- Now control is accessible.
- Selected instant is announced without excessive live updates.
- Every person's local time is available as structured text.

### ATLAS-012 City combobox audit

- Test result count, active option, Escape, blur, retry, and selection invalidation.
- Duplicate city labels remain distinguishable.
- Loading and no-result messages are announced.
- Touch targets meet minimum size.

### ATLAS-013 Mobile primary-screen validation

- Local time, people overview, selected-time control, and availability summary remain discoverable.
- No essential hover behavior.
- 320 px reflow and 200% zoom pass.
- On-screen keyboard does not hide form completion controls.

### ATLAS-014 Contrast, reduced motion, and forced colors

- Verify both themes to WCAG 2.2 AA.
- Working/overlap state does not rely on color.
- Reduced-motion mode removes spatial animation.
- Forced-colors mode preserves selected and working states.

## P1 — Automated confidence

### ATLAS-015 Add-person component tests

- Debounce and abort
- Provider success/error/retry
- Free text cannot submit
- Editing after selection clears selection
- Keyboard navigation and Enter
- Accessible status messages

### ATLAS-016 Recommendation tests

- Duration coverage
- No-overlap behavior
- Ranking fairness
- DST start/end
- 30/45-minute offsets
- Cross-midnight local dates

### ATLAS-017 Primary-flow end-to-end tests

- Add São Paulo and Singapore
- Find and copy a meeting
- Reload and verify persistence
- Remove and undo
- Import a share safely
- Offline return visit
- Keyboard-only smoke path

## P2 — Performance and maintainability

### ATLAS-018 Separate application orchestration

Move group commands and planner commands from the main App component into focused hooks/repositories without changing behavior.

### ATLAS-019 Render performance budget

- Profile 25-person group.
- Live clock updates no more often than visible precision requires.
- Selected-time drag remains responsive.
- Avoid premature virtualization.

### ATLAS-020 Centralized content and version metadata

Prepare user-facing strings for localization and remove duplicated release labels.

### ATLAS-021 Architecture decision records

Record material decisions under `docs/decisions/`, beginning with client-only MVP, Open-Meteo, share fragments, and localStorage.

## P2 — Release readiness

### ATLAS-022 Privacy and data explanation

- Explain local storage and share-link exposure.
- Document Open-Meteo city queries.
- Confirm no names/schedules are sent to the provider.
- Add public privacy copy before distribution.

### ATLAS-023 Production security headers

- Content Security Policy
- Referrer Policy
- MIME sniffing protection
- Permissions Policy denying unused capabilities
- Hosting-specific configuration

### ATLAS-024 PWA release checks

- Install on supported desktop/mobile browsers.
- Offline shell and cached people work.
- Updates preserve active work.
- Icons and theme colors pass platform review.

## Recommended delivery order

1. ATLAS-001 through ATLAS-004
2. ATLAS-015 and ATLAS-016 alongside correctness work
3. ATLAS-005 through ATLAS-010
4. ATLAS-011 through ATLAS-014
5. ATLAS-017
6. ATLAS-018 through ATLAS-024

## Definition of done

A backlog item is done only when:

- Acceptance criteria pass
- Relevant automated tests pass
- Keyboard and responsive behavior are checked when UI changes
- Documentation matches behavior
- No arbitrary manual time-zone selection is introduced
- Main remains buildable and releasable
