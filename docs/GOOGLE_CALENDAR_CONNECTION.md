# Google Calendar connection boundary

AtlasTime's local PWA intentionally contains no OAuth client secret and stores no refresh token. Google currently recommends the OAuth 2.0 authorization-code model for the stronger, persistent connection AtlasTime wants. In that model, the browser receives an authorization code and sends it to a backend endpoint that validates the request, exchanges the code, and protects the resulting refresh token.

## What is ready in the PWA

- Local contacts can have optional email addresses.
- The organizer can include or exclude each valid email before calendar handoff.
- Google, Outlook, and `.ics` actions show a final structured review.
- Provider drafts and `.ics` exports remain usable without a connected account.

## What the connected phase requires

1. A production HTTPS origin for AtlasTime.
2. A Google Cloud project with Calendar API enabled and an OAuth consent screen.
3. A Web OAuth client whose JavaScript origin and redirect endpoint exactly match production.
4. A small backend authorization endpoint that validates state/CSRF, exchanges authorization codes, protects refresh tokens, and performs Calendar API calls.
5. An explicit disconnect action that revokes access and deletes AtlasTime's stored token material.
6. Provider testing with a primary calendar and the narrowest practical event permission before Microsoft authorization begins.

No free/busy permission belongs in this phase. Availability access remains a separate v1.2 consent decision.

## Primary references

- Google Identity Services code model: https://developers.google.com/identity/oauth2/web/guides/use-code-model
- Google authorization model comparison: https://developers.google.com/identity/oauth2/web/guides/choose-authorization-model
- Google Calendar authorization scopes: https://developers.google.com/workspace/calendar/api/auth
- Google Calendar event insertion: https://developers.google.com/workspace/calendar/api/v3/reference/events/insert
