# AtlasTime

AtlasTime is a local-first Progressive Web App for people coordinating calls across time zones. It replaces manual conversion with synchronized local times, working-hour comparison, and meeting recommendations.

## Current release

**Version:** 0.27

### Implemented

- Add a person, location, or team through global city search
- Automatically resolve the selected city's IANA time zone
- Prevent arbitrary city/time-zone mismatches
- Handle daylight-saving rules through the browser's Intl time-zone data
- Show current and selected local times
- Explore a 24-hour UTC timeline in hourly and half-hour steps
- Configure working hours and compare availability
- Recommend a humane meeting hour
- Save multiple groups locally
- Add meeting title, duration, location, and notes
- Create portable share links with an explicit privacy warning
- Import shared groups without overwriting local data
- Install as a PWA and return to saved data offline
- Use recent cached places when network city search is unavailable
- Launch WhatsApp, Zoom, Telegram, or Viber
- Use keyboard-accessible city autocomplete and reduced-motion/forced-color support

## Important privacy model

AtlasTime does not require an account. Groups, people, schedules, and meeting drafts are stored in the current browser.

City search uses Open-Meteo. The search sends location text, not a person's name, group name, schedule, meeting title, or notes.

Share links contain a portable copy of the group in the URL fragment. Anyone with the link can read the included group name, people or team names, locations, time zones, working hours, and meeting details. A share is a snapshot, not a live synchronized workspace.

## Run locally

Requirements:

- Node.js LTS
- npm

```bash
npm install
npm run dev
```

Open the local address shown by Vite, normally `http://localhost:5173`.

## Build and test

```bash
npm run build
npm test
npm run preview
```

## Product documentation

- [UX Specification](docs/UX_SPECIFICATION.md)
- [Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md)
- [Data and API Design](docs/DATA_AND_API_DESIGN.md)
- [MVP Implementation Backlog](docs/MVP_IMPLEMENTATION_BACKLOG.md)

These documents define intended MVP behavior where the prototype and product specification differ.

## Architecture summary

- React 19
- TypeScript
- Vite
- Native Intl time-zone calculations
- Open-Meteo geocoding behind an internal service adapter
- Browser localStorage
- Vitest
- Progressive Web App service worker

The MVP intentionally has no application server, cloud database, account, calendar authorization, or contact permission.

## Roadmap

### Correctness and trust

- Duration-aware meeting recommendations
- Stronger persisted/share-data validation
- Storage failure messaging
- Automated CI

### Complete MVP experience

- Edit a person's city with automatic re-resolution
- Remove with Undo
- Favorites and accessible reordering
- Participant-aware planner
- Theme and time-format settings
- Empty-state onboarding

### Validation and release

- Component and end-to-end tests
- Keyboard and screen-reader validation
- Responsive and contrast audit
- Production privacy copy and security headers

### Later phases

- Optional accounts and synchronized data
- Shared workspaces
- Google and Microsoft calendar integrations
- AI-assisted scheduling
- Regional holiday and travel awareness
- Enterprise integrations and APIs

## Product rule

Users choose a valid city. AtlasTime determines the time zone. The product must not offer arbitrary manual time-zone selection.

## License

No license has been selected. All rights are reserved by the repository owner until a license is added.
