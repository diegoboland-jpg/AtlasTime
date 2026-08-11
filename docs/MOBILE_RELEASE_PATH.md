# AtlasTime path to mobile stores and native widgets

AtlasTime already works as an installable PWA on Android, iPhone, and Windows. A store listing and a native home-screen widget require additional release layers; they do not replace the planner or its connected server.

## Current position: v1.10

- The responsive PWA, offline shell, mobile planner, floating time slider, Google connection, Microsoft connection, private availability sharing, and combined busy/free scoring exist.
- The connected server has encrypted persistence, production safety checks, verified backup and restore operations, and a Render staging Blueprint.
- Local-network phone testing works, but a public HTTPS staging domain and physical-device acceptance remain required.

## Phase A — public staging deployment

1. Create the prepared Render staging service and persistent disk.
2. Deploy the v1.10 container behind managed HTTPS.
3. Register the public Google and Microsoft OAuth callback URLs.
4. Complete cross-network Android, iPhone, and installed-Windows tests.
5. Perform a backup-and-restore drill and configure monitoring.

This phase is the immediate blocker for every store release because OAuth callbacks and private availability links need a stable public origin.

## Phase B — Google Play internal test

1. Finalize store icons, screenshots, privacy disclosure, support URL, and data-safety answers.
2. Package the hosted PWA as an Android Trusted Web Activity or use a thin native shell after comparing offline and OAuth behavior.
3. Configure Android app-link ownership for the production domain.
4. Produce a signed Android App Bundle and test it through Play Console internal testing.
5. Validate installation, updates, notifications if later added, calendar handoff, and account disconnect.

The first Android store build should remain visually identical to the tested PWA. Native-only features should not delay the initial internal release.

## Phase C — Apple TestFlight and App Store

1. Enroll in the Apple Developer Program and obtain macOS/Xcode build access.
2. Package AtlasTime in a thin iOS shell and configure Universal Links for the production domain.
3. Confirm Google and Microsoft OAuth policies inside the iOS browser/authentication session.
4. Produce privacy nutrition labels, screenshots, review notes, and account-disconnect guidance.
5. Validate through TestFlight before App Store review.

Apple packaging cannot be completed solely from the current Windows computer; a Mac or managed macOS build service is required.

## Phase D — native home-screen widgets

The existing six-tile overview is an in-app widget-style experience. A real Android or iOS home-screen widget requires native code and a safe data-sharing bridge.

1. Define the compact widget states: current device time, selected group, up to six locations, and next humane time.
2. Decide how the native extension reads a privacy-safe local snapshot without exposing calendar tokens.
3. Add Android Glance/AppWidget and iOS WidgetKit implementations after the native shells are stable.
4. Refresh on OS-approved schedules; widgets cannot run the continuous web animation or slider interaction.
5. Open the full app for editing, time exploration, calendar connection, and planning.

The practical order is therefore: **public staging → Android internal test → iOS TestFlight → native widgets**.
