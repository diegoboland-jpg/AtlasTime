# Kikroo v1.17 - Android widget internal test

This release adds Kikroo's first native Android home-screen widget to the existing private Google Play test. It does not publish Kikroo publicly.

## Fixed release identity

| Setting | Value |
| --- | --- |
| Store and launcher name | Kikroo |
| Android application ID | `com.badie.kikroo` |
| Version name | `1.17.0` |
| Version code | `11700` |
| Hosted application | `https://atlastime-staging.onrender.com` |
| Web manifest | `https://atlastime-staging.onrender.com/manifest.webmanifest` |
| Digital Asset Links | `https://atlastime-staging.onrender.com/.well-known/assetlinks.json` |

Do not change `com.badie.kikroo` after creating the Play Console application. Keep signing passwords, keystores, service-account files, OAuth secrets and private keys outside Git, screenshots and chat.

## 1. Prepare the Android project on Windows

Open the Kikroo repository in File Explorer. Click the address bar, type `cmd`, and press Enter. Run:

```cmd
npm.cmd install
npm.cmd run android:check
npm.cmd run android:init
```

`android:init` regenerates the Trusted Web Activity and automatically applies the tracked Kikroo widget layer. If Bubblewrap asks for release values, use:

- Application ID: `com.badie.kikroo`
- App and launcher name: `Kikroo`
- Version name: `1.17.0`
- Version code: `11700`
- Display mode: `standalone`
- Orientation: `any`
- Signing alias: `kikroo-upload`
- Keystore: the existing private `.jks` outside the repository

The generated project must contain `KikrooWidgetProvider`, `KikrooLauncherActivity` and `PostMessageService`. The release build command checks this before signing.

## 2. Build the signed bundle

In the same CMD window run:

```cmd
npm.cmd run android:build:bundle
```

Enter the signing password only in the local prompt. The expected output is similar to:

```text
android\output\kikroo-1.17.0-11700.aab
```

## 3. Upload to the private Play track

1. Open [Google Play Console](https://play.google.com/console/).
2. Open Kikroo, then **Testing > Internal testing**.
3. Choose **Create new release**.
4. Upload `kikroo-1.17.0-11700.aab`.
5. Use release notes such as `Kikroo v1.17 Android widget beta.`
6. Save, review and roll out only to the internal testers.
7. Install or update Kikroo from the tester opt-in link.

## 4. Add the widget on Android

Exact labels differ slightly by phone manufacturer:

1. Open installed Kikroo once and wait until the main time grid appears. This transfers a privacy-limited snapshot to the native app.
2. Return to the Android home screen.
3. Touch and hold an empty area of the home screen.
4. Tap **Widgets**.
5. Search for **Kikroo** or scroll to Kikroo.
6. Touch and hold the Kikroo widget preview, then drag it to the home screen.
7. Resize it horizontally and vertically to check both compact and expanded layouts.

If the widget says **Open Kikroo to set up your time widget**, tap it, let Kikroo finish loading, return home and wait a few seconds.

## 5. Functional test

Confirm each item and capture a screenshot without private contact data:

- Widget title matches the selected group.
- Up to six entries show the correct local times.
- **Previous 30 min** moves all displayed times back together.
- **Next 30 min** moves all displayed times forward together.
- **Now** restores the current instant.
- Tapping the header or **Open Kikroo** opens the full app.
- Changing group, people, working hours or theme in Kikroo refreshes the widget after reopening the app.
- With more than six people, the widget remains stable and the full group recommendation is still shown.

## 6. Privacy and reliability test

- The widget contains no email, phone, contact ID, event title, event notes, invitation link or OAuth information.
- After 15 minutes it may mark its recommendation as outdated.
- After 24 hours it hides the recommendation and asks to open Kikroo.
- It renders a safe state after airplane mode, device restart and normal Play update.
- Test normal and 200% font size on two physical Android phones before promoting the release.

## 7. Digital Asset Links requirement

The deployed `assetlinks.json` must include both `delegate_permission/common.handle_all_urls` and `delegate_permission/common.use_as_origin` for `com.badie.kikroo`, using the Play app-signing SHA-256 fingerprint. Without the second relation, Kikroo can open as a TWA but cannot securely refresh its widget snapshot.

## Acceptance gate

- Signed `1.17.0 (11700)` installs from the private Play link.
- TWA opens without a browser address bar.
- The widget can be added, resized and refreshed.
- All four widget actions work on two phones.
- Fresh, stale, expired, offline, restart and update states are evidenced.
- Google and Outlook connection, planning and disconnect still work.
- No secret, signing file or private calendar record exists in Git or the bundle.
