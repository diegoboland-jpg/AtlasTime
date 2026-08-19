# Kikroo Android internal-test preparation

Kikroo already has the fixed Android identity `com.badie.kikroo` and an internal Google Play path. v1.17 adds the first native Android home-screen widget to that installed Trusted Web Activity.

## Ready in the repository

- Public HTTPS application and Digital Asset Links endpoint.
- Fixed package identity and versioned Android release configuration.
- Repeatable Bubblewrap initialization and signed-bundle scripts.
- Tracked native widget source and automatic overlay into the generated Android project.
- Verified-origin web-to-native snapshot bridge.
- App-private widget storage with strict field, size, time-zone and expiry validation.
- Compact widget controls for previous 30 minutes, Now, next 30 minutes and opening Kikroo.
- Privacy contract that excludes contact details, OAuth data, event details and raw busy/free blocks.

## External items still required

1. Existing private upload keystore and password.
2. Google Play internal-testing application and tester list.
3. Play app-signing SHA-256 fingerprint in Render.
4. Two physical Android phones for layout, font scaling, offline, restart and update evidence.

## Release order

1. Run web tests, production build and `android:check`.
2. Regenerate the Android project with `android:init`; this applies the native widget layer.
3. Build signed `kikroo-1.17.0-11700.aab`.
4. Upload it to Google Play internal testing.
5. Install through the tester link and open Kikroo once.
6. Add the Kikroo widget from the Android home-screen widget picker.
7. Complete the physical acceptance checklist in `ANDROID_INTERNAL_TEST_GUIDE.md`.

## iPhone follow-up

The reviewed snapshot contract can inform a later WidgetKit implementation, but iPhone still needs its own native container, App Group storage, signing, TestFlight validation and App Store review. The Android widget does not automatically create an iPhone widget.
