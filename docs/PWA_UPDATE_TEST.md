# Testing an AtlasTime installed-app update

Use this test after v0.23 is available on `main`. It confirms that an already installed Windows or phone PWA can discover and activate a newer release without losing saved groups.

## Before starting

- Keep the device online during the update check.
- Use the same address and port for both versions. A service worker from `localhost:4173` cannot update an installation from a different address such as `192.168.1.4:4173`.
- Create a clearly recognizable saved group in the old version, such as `Update test`, so preservation is easy to confirm.

## Windows installed-PWA test

1. Open CMD in the AtlasTime repository folder.
2. Switch to the older `main` version before v0.23, then run `npm.cmd install`, `npm.cmd run build`, and `npm.cmd run preview:mobile`.
3. Open the displayed address, normally `http://localhost:4173`, and install AtlasTime from Edge or Chrome.
4. Open the installed AtlasTime window and create the `Update test` saved group.
5. Leave the installed app open. In GitHub Desktop, fetch the latest `main` after v0.23 is merged.
6. In CMD, stop the preview with Ctrl+C, then run `npm.cmd install`, `npm.cmd run build`, and `npm.cmd run preview:mobile` again on the same address and port.
7. Return to the installed AtlasTime window. If necessary, close and reopen it once or move away and return to it so the app checks for updates.
8. Confirm that **A new AtlasTime version is ready** appears.
9. Select **Update now**.
10. Confirm the app reloads, shows v0.23, and still contains the `Update test` group.

## Phone test

Repeat the same flow using the Network address printed by `npm.cmd run preview:mobile`, for example `http://192.168.1.4:4173`. The phone and computer must remain on the same Wi-Fi network, and both the old and new versions must use exactly that same address.

## Expected result

- The update notice appears only when a new version is waiting.
- **Update now** activates and reloads the new version.
- Saved groups, people, work hours, selected date, and selected hour remain available.
- Dismissing the notice with **Update later** leaves the current session usable; the update can be offered again after reopening or refocusing the app.
