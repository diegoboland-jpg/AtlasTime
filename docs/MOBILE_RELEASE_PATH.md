# Kikroo path to mobile stores and native widgets

Kikroo already works as an installable PWA on Android, iPhone, and Windows. A store listing and a native home-screen widget require additional release layers; they do not replace the planner or its connected server.

## Current position: v1.13 internal-test packaging

- The responsive PWA, offline shell, mobile planner, floating time slider, Google connection, Microsoft connection, private availability sharing, and combined busy/free scoring exist.
- The connected server has encrypted persistence, production safety checks, verified backup and restore operations, and public Render staging.
- Google and Microsoft connections work on the public HTTPS build.
- v1.11 adds the phone workspace deck, consistent people cards, embedded flag treatments, and live meeting-quality feedback.
- v1.12 contains Android-compatible icons, the confirmed package identity, a release-readiness check, and a secure Digital Asset Links endpoint.
- v1.13 fixes the mobile viewport, keeps six overview slots in one screen, scrolls only additional tiles, and adds guided Bubblewrap initialization plus signed App Bundle generation. The permanent ID is `com.badie.kikroo`.

## Phase A - public staging deployment (complete)

1. [x] Create the prepared Render staging service and persistent disk.
2. [x] Deploy AtlasTime behind managed HTTPS.
3. [x] Register the public Google and Microsoft OAuth callback URLs.
4. [x] Validate Google and Microsoft connections from the public build.
5. [ ] Perform the final encrypted backup-and-restore drill and configure monitoring alerts.

The stable public origin is now available. The remaining operational drill does not block preparing an Android internal-test bundle, but it must pass before production release.

## Phase B - Google Play internal test

1. Finalize store screenshots, privacy disclosure, support URL, and data-safety answers; icons and package identity are ready.
2. Package the hosted PWA as an Android Trusted Web Activity after validating v1.13 on the physical phone.
3. Configure Android app-link ownership for the production domain.
4. Produce a signed Android App Bundle and test it through Play Console internal testing.
5. Validate installation, updates, calendar handoff, OAuth return, account disconnect, and offline reopen.

The first Android store build should remain visually identical to the tested PWA. Native-only features should not delay the initial internal release.

## Phase C - Apple TestFlight and App Store

1. Enroll in the Apple Developer Program and obtain macOS/Xcode build access.
2. Package AtlasTime in a thin iOS shell and configure Universal Links for the production domain.
3. Confirm Google and Microsoft OAuth policies inside the iOS authentication session.
4. Produce privacy nutrition labels, screenshots, review notes, and account-disconnect guidance.
5. Validate through TestFlight before App Store review.

Apple packaging cannot be completed solely from the current Windows computer; a Mac or managed macOS build service is required.

## Phase D - native home-screen widgets

The existing six-tile overview is an in-app widget-style experience. A real Android or iOS home-screen widget requires native code and a safe data-sharing bridge.

1. Define the compact widget states: current device time, selected group, up to six locations, and next humane time.
2. Decide how the native extension reads a privacy-safe local snapshot without exposing calendar tokens.
3. Add Android Glance/AppWidget and iOS WidgetKit implementations after the native shells are stable.
4. Refresh on OS-approved schedules; widgets cannot run the continuous web animation or slider interaction.
5. Open the full app for editing, time exploration, calendar connection, and planning.

The practical order is: **public staging -> Android internal test -> iOS TestFlight -> native widgets**.
