# Kikroo

Kikroo is a local-first Progressive Web App for people coordinating calls across time zones. It replaces manual conversion with synchronized local times, working-hour comparison, and meeting recommendations.

**A friendly time for everyone.** The primary planning action is **Find a good time**.

## Current release

**Version:** 1.15.0 protected beta

### Implemented

- Add a person, location, or team through global city search
- Automatically resolve the selected city's IANA time zone
- Prevent arbitrary city/time-zone mismatches
- Handle daylight-saving rules through the browser's Intl time-zone data
- Show current and selected local times
- Explore a 24-hour UTC timeline in hourly and half-hour steps
- Configure working hours and compare availability
- Recommend a humane meeting hour
- Use confirmed shared busy/free blocks to avoid known calendar conflicts without reading event details
- Let recipients combine explicitly authorized Google and Outlook busy/free blocks in one private availability response
- Let organizers connect Outlook alongside Google and see one combined occupied/free planning view
- Encrypt private availability-request records at rest and refuse insecure production startup
- Audit production configuration and create, verify, and safely restore encrypted backups
- Deploy reproducibly to Render staging with managed HTTPS, health checks, and persistent encrypted storage
- Publish Android Digital Asset Links from server-only signing-certificate settings
- Validate store-ready 192 px, 512 px, and maskable Android icon assets during every production build
- Save multiple groups locally
- Set editable start and finish times, use quick 30-minute meeting lengths, type any exact minute, or create a true all-day event
- Add meeting title, location, and notes
- Create prefilled Google Calendar and Outlook event drafts
- Export complete `.ics` events for Apple and device calendars
- Choose calendar invitees individually and review the final handoff before anything opens or downloads
- Optionally connect Google Calendar through a same-origin secure gateway and create the reviewed event directly
- Plan exact start and finish times, including all-day events
- Create portable share links with an explicit privacy warning
- Import shared groups without overwriting local data
- Install as a PWA and return to saved data offline
- Use recent cached places when network city search is unavailable
- Launch WhatsApp, Zoom, Telegram, or Viber
- Use keyboard-accessible city autocomplete and reduced-motion/forced-color support

### Release progression

AtlasTime v1.0 completed the local-first cross-time-zone planner. v1.1 added a local contact directory and optional direct Google event creation. v1.2 added organizer busy/free visualization, v1.3 added recipient-controlled availability requests, and v1.4 introduced private, expiring, revocable sharing links. v1.5 uses confirmed shared busy/free blocks in recommendations. v1.6 lets recipients combine Google and Outlook availability without returning event details. v1.7 brings the same combined Google and Outlook view to the organizer's planner. v1.8 prepares the connected server for a public HTTPS deployment with encrypted durable records. v1.9 adds configuration auditing and verified recovery operations. v1.10 adds reproducible Render staging with managed HTTPS and persistent storage. v1.11 adds mobile workspace navigation and visual consistency. v1.12 prepares the Android identity, icons, and Digital Asset Links. v1.13 removes unnecessary phone-page movement, keeps six overview slots visible, and adds reproducible commands for the first signed Google Play internal-test bundle. v1.14 simplifies the mobile information hierarchy, combines group and people management, and extends Kikroo's visual language across the complete product. v1.15 introduces the protected-beta privacy surface, an allow-listed local diagnostic, and an explicit review-before-copy feedback flow.

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

The optional Google Calendar gateway is disabled unless all server-only variables in `.env.example` are configured. After building, it can serve the PWA and same-origin API together:

```bash
npm run preview:connected
```

Never put the Google client secret or token-encryption key in a `VITE_*` variable.

For public hosting, follow [the v1.8 production deployment guide](docs/PRODUCTION_DEPLOYMENT.md). Production mode requires HTTPS, a dedicated availability-record encryption key, and persistent storage.

Before starting or updating a production host, run `npm run production:check`. Use `npm run backup:data`, `npm run verify:data -- <backup-file>`, and `npm run restore:data -- <backup-file> RESTORE` for encrypted recovery operations. The path from hosting to store releases and native widgets is tracked in [the mobile release path](docs/MOBILE_RELEASE_PATH.md).

For the first public test environment, follow the illustrated [Render staging guide](docs/RENDER_STAGING_SETUP.md).

For the first private Google Play installation, follow the [v1.13 Android internal-test guide](docs/ANDROID_INTERNAL_TEST_GUIDE.md).

For the protected external beta, use the [v1.15 scope](docs/V1_15_PROTECTED_BETA.md), [release checklist](docs/BETA_RELEASE_CHECKLIST.md), [tester invitation](docs/BETA_TESTER_INVITATION.md), [tester validation plan](docs/BETA_VALIDATION_PLAN.md), [exit-report template](docs/BETA_EXIT_REPORT_TEMPLATE.md), and [draft beta privacy notice](docs/BETA_PRIVACY_NOTICE.md). Brand and asset decisions are tracked in the [IP asset register](docs/IP_ASSET_REGISTER.md) and [brand-protection plan](docs/BRAND_PROTECTION_PLAN.md). Third-party release attribution is summarized in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Ownership and filing choices are recorded in the [legal decision record](docs/LEGAL_DECISION_RECORD.md) and [international trademark strategy](docs/INTERNATIONAL_TRADEMARK_STRATEGY.md). Protected-beta recruitment uses a completion-based [tester recruitment plan](docs/TESTER_RECRUITMENT_PLAN.md). The next product increment is the measurable [v1.16 Google Play internal beta](docs/V1_16_ANDROID_INTERNAL_BETA.md); native widget implementation remains outside that release until its privacy-safe snapshot architecture is approved.

Create a checksum-backed evidence bundle in an ignored local folder with `npm run evidence:release`. For long-term storage, pass a protected external destination after `--`; never place credentials, private signing material, tester identities, or calendar data in the bundle.

## Build and test

```bash
npm run build
npm test
npm run preview
```

## Product documentation

- [v1.0 Changelog](CHANGELOG.md)
- [v1.0 Acceptance Checklist](docs/V1_RELEASE_CHECKLIST.md)
- [Google Calendar connection guide](docs/GOOGLE_CALENDAR_CONNECTION.md)
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
- Optional same-origin Node gateway for Google Calendar authorization and event creation

The default v1.0 experience remains a local PWA with no application server, cloud database, or account. The optional v1.1 Google Calendar gateway runs only when server-side credentials are configured; it never bundles secrets into the browser app.

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
