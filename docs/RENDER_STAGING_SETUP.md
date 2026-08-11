# AtlasTime staging on Render

This guide creates AtlasTime's first public HTTPS test environment. It does not publish AtlasTime to Google Play or the App Store, and it does not require a custom domain yet.

![Render staging click map](images/render-staging-click-map.svg)

## Before starting

- Merge the v1.9 and v1.10 pull requests into `main`.
- Create a Render account and allow it to read the AtlasTime GitHub repository.
- Expect a paid Render web service because persistent disks are not available on a free web service.
- Keep your `.env` file private. Never upload it, paste it into chat, or include it in screenshots.

## Step 1 — generate a new production data key

Open CMD inside the AtlasTime folder and run:

```text
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Copy the result into a password manager temporarily. This must be a new key; do not reuse the Google or Microsoft token keys.

## Step 2 — create the Blueprint

1. Open the Render Dashboard.
2. Click **New +**.
3. Click **Blueprint**.
4. Connect GitHub if requested.
5. Select `diegoboland-jpg/AtlasTime`.
6. Render detects `render.yaml` and shows `atlastime-staging`.
7. For `ATLASTIME_DATA_ENCRYPTION_KEY`, paste only the new key from Step 1.
8. Review the paid service and 1 GB persistent disk before accepting charges.
9. Click **Apply**.

The Blueprint builds the existing Dockerfile, starts only after GitHub checks pass, mounts `/data`, and checks `/api/health` automatically.

## Step 3 — confirm the public service

1. Wait until the deploy status is **Live**.
2. Open the generated address, similar to `https://atlastime-staging.onrender.com`.
3. Add `/api/health` to the address.
4. Confirm the page reports:
   - `status: ok`
   - `storage: encrypted`
   - version `1.10.0`

Render provides `RENDER_EXTERNAL_HOSTNAME`; AtlasTime uses it automatically for its public origin and provider callback paths.

## Step 4 — add Google Calendar

In Render, open the AtlasTime service and select **Environment**. Add these four private variables:

```text
GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET
GOOGLE_TOKEN_ENCRYPTION_KEY
```

In Google Cloud, update the AtlasTime Web OAuth client:

- Authorized JavaScript origin: `https://YOUR-RENDER-HOSTNAME`
- Authorized redirect URI: `https://YOUR-RENDER-HOSTNAME/api/google-calendar/callback`

The production token key must be new and different from the data key. `GOOGLE_OAUTH_REDIRECT_URI` is optional because AtlasTime derives it from the public hostname.

## Step 5 — add Microsoft Outlook

In Render **Environment**, add:

```text
MICROSOFT_OAUTH_CLIENT_ID
MICROSOFT_OAUTH_CLIENT_SECRET
MICROSOFT_TOKEN_ENCRYPTION_KEY
```

In Microsoft Entra, add this Web redirect URI:

```text
https://YOUR-RENDER-HOSTNAME/api/outlook-calendar/callback
```

The Microsoft token key must be new and different from both other keys. `MICROSOFT_OAUTH_REDIRECT_URI` is optional because AtlasTime derives it from the public hostname.

## Step 6 — redeploy and test

1. Save the Render environment variables and choose **Save and deploy**.
2. Open `/api/health` again; Google and Outlook should both report configured.
3. Open AtlasTime in a private browser window and on a phone using mobile data.
4. Connect Google, read busy/free time, and disconnect.
5. Connect Outlook, read busy/free time, and disconnect.
6. Create a private availability link and open it on the phone outside the home Wi-Fi network.
7. Restart the Render service and confirm that the private link still works.
8. Run `npm run production:check` from Render's service shell and confirm `READY`.

## Step 7 — recovery check

From the service shell:

```text
npm run backup:data
```

Copy the reported encrypted backup and its `.sha256` file to protected storage outside Render. Render also takes daily disk snapshots, but AtlasTime's own encrypted backup gives an independent recovery path.

## Known staging limits

- The persistent disk keeps AtlasTime on one server instance.
- Deploys with a disk have a short interruption rather than zero downtime.
- This setup is appropriate for staging and early testers, not large-scale public traffic.
- A transactional database will replace the file store before horizontal scaling.
