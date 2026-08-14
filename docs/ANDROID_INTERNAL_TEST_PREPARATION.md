# Kikroo Android internal-test preparation

This is the next release phase after v1.11. The goal is a private Google Play installation that uses the existing hosted PWA inside a Trusted Web Activity (TWA). It is not a public launch yet.

## What is already ready

- Public HTTPS staging URL.
- Installable PWA manifest and offline shell.
- Responsive phone workspace and floating time control.
- Google and Microsoft calendar connections.
- Private availability links and combined busy/free scoring.
- Automated tests and production build checks.

## Decisions required before generating the signed Android bundle

1. **Final Android application ID** - recommended shape: `com.<owner>.atlastime`. It cannot be casually renamed after Play publication.
2. **Store-facing app name** - `Kikroo`.
3. **Production web domain** - staging can be used for internal testing, but production should use the final stable domain.
4. **Signing owner and secure backup location** - the release key must never be committed to GitHub.
5. **Google Play developer account** - required to create the internal-testing application.

## Packaging sequence

1. Run the full v1.11 Android acceptance checklist on the public URL.
2. Generate store PNG icons and a 1024 x 500 feature graphic from the approved Kikroo identity.
3. Create the TWA project with the chosen application ID and start URL.
4. Generate the release signing key outside the repository and store an encrypted backup.
5. Build the signed `.aab` Android App Bundle.
6. Export the signing certificate SHA-256 fingerprint.
7. Publish `/.well-known/assetlinks.json` on the AtlasTime domain so Android verifies that the app owns the website.
8. Upload the `.aab` to Google Play Console internal testing.
9. Complete Data safety, privacy-policy, support-contact, content-rating, and store-listing forms.
10. Install through the private tester link and validate OAuth, calendar disconnect, availability sharing, updates, offline reopen, back navigation, and the phone workspace deck.

## Release gate

- The internal build opens without a browser address bar after Digital Asset Links verification.
- Google and Outlook authorization return to the installed app.
- No calendar token, secret, signing key, or personal availability record is bundled in the app.
- Local data survives a normal app update.
- Disconnect and revoke actions work for both calendar providers.
- The v1.11 physical-phone checklist passes at normal and enlarged text sizes.

## Apple and widgets

After the Android internal test is stable, the parallel next steps are an iOS thin shell/TestFlight build and native widget design. iOS packaging requires macOS/Xcode or a managed macOS build service. Android and iOS home-screen widgets require native implementations; the current six-tile view is the in-app widget experience.
