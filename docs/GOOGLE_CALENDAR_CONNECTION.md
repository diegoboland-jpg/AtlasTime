# Google Calendar connection boundary

AtlasTime's local PWA intentionally contains no OAuth client secret and stores no refresh token. Google currently recommends the OAuth 2.0 authorization-code model for the stronger, persistent connection AtlasTime wants. In that model, the browser receives an authorization code and sends it to a backend endpoint that validates the request, exchanges the code, and protects the resulting refresh token.

## What is ready in the PWA

- Local contacts can have optional email addresses.
- The organizer can include or exclude each valid email before calendar handoff.
- Google, Outlook, and `.ics` actions show a final structured review.
- Provider drafts and `.ics` exports remain usable without a connected account.

## Gateway now included

`server/googleCalendarGateway.mjs` implements the provider boundary without third-party runtime dependencies:

- state and PKCE-bound authorization-code initiation;
- server-side code exchange;
- AES-256-GCM encrypted refresh-token storage in an HttpOnly, SameSite cookie;
- narrow `calendar.events.owned` authorization;
- same-origin and explicit-header checks for mutations;
- primary-calendar event insertion with selected attendee updates;
- provider revocation and local cookie removal.

`server/index.mjs` serves the built PWA and gateway from one origin. When configuration is absent, calendar endpoints return a clear `503` response and the local PWA remains usable.

## Deployment still requires

1. A production HTTPS origin for AtlasTime.
2. A Google Cloud project with Calendar API enabled and an OAuth consent screen.
3. A Web OAuth client whose JavaScript origin and redirect endpoint exactly match production.
4. The four server-only Google variables documented in `.env.example`, plus `ATLASTIME_APP_ORIGIN`.
5. A unique 32-byte base64url encryption key stored in the deployment secret manager.
6. Provider testing with a primary calendar and the narrow event permission before Microsoft authorization begins.

Generate a development encryption key without writing it into source control:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

The production reverse proxy or hosting platform must terminate HTTPS and pass the original same-origin `Origin`, cookies, method, and request body to the Node process.

## Endpoint contract

- `GET /api/google-calendar/connect` starts explicit authorization.
- `GET /api/google-calendar/callback` validates and completes the server-side exchange.
- `GET /api/google-calendar/status` returns only connection state and granted scope.
- `POST /api/google-calendar/events` creates the final confirmed event.
- `POST /api/google-calendar/disconnect` revokes provider access and clears local token state.

Mutation requests must be same-origin and include `X-AtlasTime-CSRF: 1`. Tokens and client secrets are never returned to the PWA.

No free/busy permission belongs in this phase. Availability access remains a separate v1.2 consent decision.

## Primary references

- Google Identity Services code model: https://developers.google.com/identity/oauth2/web/guides/use-code-model
- Google authorization model comparison: https://developers.google.com/identity/oauth2/web/guides/choose-authorization-model
- Google Calendar authorization scopes: https://developers.google.com/workspace/calendar/api/auth
- Google Calendar event insertion: https://developers.google.com/workspace/calendar/api/v3/reference/events/insert
