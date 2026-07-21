# Project Atlas Data and API Design

**Version:** 1.0  
**Status:** MVP contract  
**Last updated:** 2026-07-21

## 1. Scope

The MVP is local-first and has no Atlas server API or relational database. This document defines the canonical client data, persistence schema, geocoding boundary, share format, validation, and future server seams.

## 2. Canonical domain entities

### Person

```ts
type Person = {
  id: string;
  name: string;
  city: string;
  country?: string;
  countryCode?: string;
  timeZone: string;      // IANA identifier
  workStart: number;     // local hour, inclusive
  workEnd: number;       // local hour, exclusive
  placeId?: string;
  latitude?: number;
  longitude?: number;
  favorite?: boolean;
  color?: string;
};
```

MVP invariants:

- id is non-empty and unique within a group.
- name is trimmed and 1–80 visible characters.
- city comes from a selected geocoder result.
- countryCode, when present, is uppercase ISO 3166-1 alpha-2.
- timeZone is a supported IANA identifier.
- 0 ≤ workStart < workEnd ≤ 24 for the initial same-day schedule model.
- Provider IDs and coordinates are metadata, never the time-zone authority.

### WorkingSchedule

The current model stores one daily interval. The forward-compatible model is:

```ts
type LocalTime = { hour: number; minute: number };

type WorkingInterval = {
  start: LocalTime;
  end: LocalTime;
};

type WorkingSchedule = {
  weekDays: Partial<Record<0 | 1 | 2 | 3 | 4 | 5 | 6, WorkingInterval[]>>;
};
```

Do not migrate until per-day schedules enter scope. When introduced, retain a migration from workStart/workEnd.

### PlannerState

```ts
type PlannerState = {
  date: string;              // YYYY-MM-DD
  hour: number;              // UTC hour, may include .25/.5/.75
  title: string;
  durationMinutes: 30 | 45 | 60 | 90 | 120;
  location: string;
  notes: string;
  participantIds?: string[];
};
```

Limits:

- title: 120 characters
- location: 160 characters
- notes: 1,000 characters

### SavedGroup

```ts
type SavedGroup = {
  id: string;
  name: string;
  people: Person[];
  planner: PlannerState;
  updatedAt: string;         // ISO instant
};
```

Limits:

- name: 1–80 characters
- people: 30 maximum for imported shares; recommended interactive target 25

## 3. Local persistence

Current keys:

- `atlastime.groups.v1`
- `atlastime.active-group.v1`
- Legacy: `atlastime.people.v1`
- Legacy: `atlastime.planner.v1`

Rules:

- Storage JSON is untrusted input.
- Reads validate, normalize, and cap collections.
- Writes contain canonical domain data only.
- A malformed record must not prevent other recoverable records from loading.
- Migrations are deterministic and idempotent.
- User data is never cleared as an implicit response to a parse error.

Future settings key:

```ts
type SettingsV1 = {
  version: 1;
  timeFormat: "system" | "12h" | "24h";
  theme: "system" | "light" | "dark";
  locale: string;
  weekStartsOn: 0 | 1 | 6;
};
```

Store as `atlastime.settings.v1`.

## 4. Geocoding adapter

### Internal request

```ts
searchGlobalCities(query: string, signal: AbortSignal): Promise<CityOption[]>
```

### CityOption

```ts
type CityOption = {
  id?: string;
  label: string;
  city: string;
  country: string;
  countryCode?: string;
  timeZone: string;
  latitude?: number;
  longitude?: number;
  source?: "network" | "offline";
};
```

### Validation

Reject results with:

- Missing city, country, or time zone
- Invalid or unsupported IANA time zone
- Non-finite coordinates when supplied
- Unsupported URL or markup content
- Duplicates after canonical place/time-zone comparison

Provider data is mapped once in the service. UI components receive CityOption only.

### Provider request

Open-Meteo parameters should request:

- Search name
- Result count
- Language/locale when supported
- JSON format

The adapter must:

- URL-encode the query
- use HTTPS
- honor AbortSignal
- handle non-2xx responses
- impose a reasonable timeout
- avoid retries on every keystroke
- cache only successful normalized results

No person's name, group name, work schedule, meeting title, or notes are sent.

## 5. Recent-place cache

Cache a small least-recently-used collection of successfully selected CityOption values.

Recommended contract:

- Maximum 50 places
- Versioned key
- Deduplicate by stable ID or normalized city/country/timeZone
- Update last-used timestamp only on explicit selection
- Match offline queries case- and accent-insensitively
- Never treat arbitrary typed text as a selected city

## 6. Share payload

```ts
type SharedGroupPayloadV1 = {
  version: 1;
  name: string;
  people: Person[];
  planner: PlannerState;
};
```

Transport:

```text
https://atlas.example/#share=<base64url-encoded-json>
```

Requirements:

- Fragment only
- UTF-8-safe base64url encoding
- Maximum decoded size
- Strict version dispatch
- Normalize through the same safe parsers used by storage
- Generate fresh group/person IDs on import
- Never execute imported content
- Never auto-import or overwrite
- Clear fragment after import or dismissal

A share is a snapshot. Updates do not propagate.

## 7. Time and recommendation APIs

Recommended domain contracts:

```ts
type MeetingCandidate = {
  start: Date;
  end: Date;
  durationMinutes: number;
  availablePersonIds: string[];
  unavailablePersonIds: string[];
  penalty: number;
  score: number;
  fullyAvailable: boolean;
};

findMeetingCandidates(input: {
  people: Person[];
  date: string;
  durationMinutes: number;
  incrementMinutes?: 15 | 30 | 60;
}): MeetingCandidate[];
```

Algorithm rules:

- Score every interval covered by the duration.
- A fully available candidate fits entirely inside every participant's local schedule.
- Rank fully available before outside-hours candidates.
- Then minimize aggregate inconvenience.
- Then prefer distance to collective workday center.
- Then prefer earlier time.
- Return calculations as structured data; formatting remains in UI.

## 8. Errors

Domain errors should be typed and user messages mapped at the UI boundary.

Categories:

- GEOCODING_OFFLINE
- GEOCODING_RATE_LIMITED
- GEOCODING_UNAVAILABLE
- INVALID_TIME_ZONE
- STORAGE_UNAVAILABLE
- STORAGE_QUOTA
- SHARE_INVALID
- SHARE_UNSUPPORTED_VERSION
- SHARE_TOO_LARGE

Do not expose raw provider responses or stack traces to users.

## 9. Future Atlas service API

No server should be introduced solely to mirror localStorage. When accounts or live collaboration enter scope, the initial resources are:

- `/v1/users/me`
- `/v1/workspaces`
- `/v1/groups`
- `/v1/groups/{groupId}/people`
- `/v1/groups/{groupId}/planner`
- `/v1/share-links`

Baseline requirements:

- OAuth/OIDC authentication
- Workspace-scoped authorization on every resource
- Idempotency keys for mutation retries
- Cursor pagination
- Optimistic concurrency through revision or ETag
- Soft-delete window followed by verifiable deletion
- Audit events for sharing and membership changes
- Encryption in transit and at rest
- Regional/privacy assessment before storing personal data

Location search should remain client-to-provider unless privacy, reliability, commercial terms, or rate limits justify a proxy.

## 10. Future relational model

Potential tables:

- users
- workspaces
- workspace_members
- groups
- people
- working_schedules
- planner_drafts
- share_links
- audit_events

Store authoritative time zones as IANA strings. Never store a fixed UTC offset as the person's zone.

## 11. Compatibility policy

- Add optional fields without changing existing meaning.
- Increment stored/share version for breaking changes.
- Support reading at least the immediately previous persisted version.
- Reject future share versions with a clear explanation.
- Keep migrations covered by fixtures.
- Separate product release version from schema versions.
