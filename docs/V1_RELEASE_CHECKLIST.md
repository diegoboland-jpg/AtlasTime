# AtlasTime v1.0 acceptance checklist

Use the release-candidate branch and record each item as Pass, Fail, or Not available. A failure should include the device, browser, and a screenshot when possible.

## Start the release candidate

1. In GitHub Desktop, switch to `agent/v1.0-release-candidate` and fetch the latest changes.
2. Open the repository folder in CMD.
3. Run:

   ```bat
   npm.cmd install
   npm.cmd run build
   npm.cmd run preview:mobile
   ```

4. Keep CMD open. Use `http://localhost:4173/` on Windows and the printed Network address on a phone.

## Required: Android phone

- [ ] Page loads over the private Wi-Fi Network address.
- [ ] AtlasTime installs or can be added to the home screen.
- [ ] Installed app opens without normal browser controls.
- [ ] Create a group and add at least three locations, including a half-hour time zone.
- [ ] Everyone's Time shows six stable slots and exact current minutes while idle.
- [ ] Slider, Now, animated scenes, country flags, and scrolling remain readable.
- [ ] **Plan Humanly** opens the detailed planner.
- [ ] Start/Finish accept `1437` as `14:37` without the clipped Android clock dialog.
- [ ] A custom-duration and an all-day plan show correct participant dates and times.
- [ ] Google Calendar and Outlook buttons open prefilled event drafts.
- [ ] Apple/device `.ics` downloads with title, start, finish, location, and notes.
- [ ] After one online load, airplane mode still reopens the saved group and planner.

## Required: installed Windows PWA

- [ ] AtlasTime installs from Edge or Chrome and launches in its own window.
- [ ] Desktop shows the same six overview slots, animated scenes, and floating slider as phone.
- [ ] Keyboard focus is visible and Tab reaches every interactive control logically.
- [ ] Start/Finish accept exact times; arrow keys move in 15-minute steps.
- [ ] Google and Outlook drafts and the `.ics` download contain complete event details.
- [ ] Closing and reopening preserves groups and planner settings.
- [ ] The update flow in `docs/PWA_UPDATE_TEST.md` preserves the `Update test` group.

## Compatibility: iPhone/Safari when available

- [ ] Add to Home Screen succeeds and launches in standalone mode.
- [ ] Six-slot overview, floating slider, planner, and handoff controls fit without horizontal clipping.
- [ ] Apple/device `.ics` opens an event containing complete details.
- [ ] Offline reopening preserves the saved group.

## Release decision

- [ ] Automated tests and production build pass.
- [ ] GitHub CI passes on the release-candidate PR.
- [ ] No unresolved release-blocking defects remain.
- [ ] Android and installed-Windows required sections are complete.
- [ ] Product owner approves creating Git tag and GitHub release `v1.0.0`.
