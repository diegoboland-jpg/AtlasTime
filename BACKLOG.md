# AtlasTime backlog

## Next: global place discovery

- Replace the bundled city list with global city search.
- Add debounced typeahead, keyboard navigation, and loading, empty, and error states.
- Evaluate a geocoding provider that returns stable city, country, latitude, and longitude data.
- Resolve IANA time zones from coordinates through a dedicated timezone lookup service.
- Cache successful city and timezone results locally to reduce repeated lookups.
- Handle duplicate city names, aliases, accented names, and translated labels.
- Document provider rate limits, attribution requirements, privacy considerations, and offline behavior.
- Test daylight-saving transitions and time zones with non-hour offsets.

## Later product work

- Saved groups and shareable scheduling links.
- Accessibility and mobile usability testing.
- Calendar integrations only after the planner workflow is validated.
- Authentication, synchronized data, invitations, and team workspaces only after local-first validation.

## Explicitly out of scope for v0.4

- Backend services or cloud persistence.
- Authentication and accounts.
- Calendar authorization or automatic meeting creation.
- Contact imports and messaging-provider APIs.
