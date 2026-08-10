# AtlasTime production deployment foundation

AtlasTime v1.8 can run as one same-origin Node service behind a managed HTTPS host. The browser application, Google and Microsoft OAuth callbacks, and private availability links must all use the same public origin.

## What v1.8 guarantees

- Production startup refuses a non-HTTPS `ATLASTIME_APP_ORIGIN`.
- Production startup refuses plaintext availability-request storage.
- Availability-request records are encrypted with AES-256-GCM before they reach the mounted data file.
- An altered encrypted file fails closed instead of returning corrupted or fabricated availability.
- Security headers include a restrictive Content Security Policy, denied framing, and disabled camera, microphone, and geolocation permissions.
- `GET /api/health` reports readiness without revealing credentials or calendar data.

This is a deployment foundation, not multi-instance database support. Use one AtlasTime server instance with a persistent encrypted volume. A later database adapter is required before horizontal scaling.

## Required production settings

Set these in the host's secret manager, never in GitHub or the browser bundle:

```text
NODE_ENV=production
ATLASTIME_APP_ORIGIN=https://your-atlastime-domain.example
ATLASTIME_DATA_ENCRYPTION_KEY=<independent 32-byte base64url key>
ATLASTIME_DATA_FILE=/data/availability-requests.json
```

Generate the storage key locally:

```text
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Use a different key for Google tokens, Microsoft tokens, and availability records. Losing a key makes its encrypted data unrecoverable; rotating one therefore requires a planned migration.

Add the existing Google and Microsoft variables from `.env.example` when those connections are enabled. Update both provider consoles so their OAuth redirect URIs exactly match the public HTTPS domain.

## Container deployment

Build from the repository root:

```text
docker build -t atlastime:1.8.0 .
```

The runtime listens on `PORT` and stores encrypted records at `/data/availability-requests.json`. Mount `/data` as a persistent volume. Terminate HTTPS at the hosting platform or reverse proxy and forward requests to port 4173 without changing the original public origin.

## Acceptance checks

1. Open `https://your-domain.example/api/health` and confirm `status` is `ok` and `storage` is `encrypted`.
2. Confirm the response identifies Google and Outlook only as configured or not configured; no secret values should appear.
3. Create a private availability link, restart the service, and confirm the link still works.
4. Inspect the mounted data file and confirm names and busy intervals are not readable plaintext.
5. Connect and disconnect each configured calendar provider through the public HTTPS origin.
6. Open the private link on a phone outside the development computer's Wi-Fi network.
7. Stop the persistent volume temporarily and confirm the service fails rather than silently replacing existing records.

## Before public launch

- Select a hosting provider and persistent-volume or managed-database strategy.
- Store every secret in the provider's secret manager.
- Configure backups for the encrypted data file and securely retain the matching encryption key.
- Complete Android, installed-Windows, and iPhone acceptance testing.
- Add monitoring against `/api/health` and review provider OAuth verification requirements.
