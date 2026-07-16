# AtlasTime

AtlasTime is a lightweight scheduling MVP for people who coordinate calls across time zones.

## MVP capabilities

- Add and remove people with an IANA time zone
- See everybody's current local time
- Compare a selected date across a 24-hour timeline
- Highlight shared working-hour overlap
- Get a recommended one-hour meeting window
- Open WhatsApp, Zoom, Telegram and Viber launch links
- Save data locally in the browser

This version intentionally avoids accounts, cloud storage, calendar authorization and contact permissions. Those belong to later phases after validating the core scheduling experience.

## Run on Windows 10

1. Install Node.js LTS from the official Node.js website.
2. Extract this project ZIP.
3. Open the extracted `AtlasTime` folder.
4. Click the File Explorer address bar, type `cmd`, and press Enter.
5. Run:

```bash
npm install
npm run dev
```

6. Open the local address shown in the terminal, normally `http://localhost:5173`.

## Production build

```bash
npm run build
npm run preview
```

## Publish with GitHub Desktop

1. Install GitHub Desktop.
2. Sign in to the GitHub account `diegoboland-jpg`.
3. Choose **File â†’ Add local repository**.
4. Select the extracted `AtlasTime` folder.
5. If prompted, choose **Create a repository** for this folder.
6. Commit the files with message `Initial AtlasTime MVP`.
7. In **Repository â†’ Repository settings â†’ Remote**, set:
   `https://github.com/diegoboland-jpg/AtlasTime.git`
8. Click **Push origin**.

Because the remote repository is empty, GitHub Desktop may instead show **Publish repository**. Keep the name `AtlasTime`, ensure the owner is `diegoboland-jpg`, and do not create a second repository with another name.

## Product roadmap

### Phase 1 â€” Current MVP
- Time-zone roster
- Current local times
- Work-hour overlap
- Suggested meeting hour
- Calling-app shortcuts
- Browser persistence

### Phase 2 â€” Validation
- Editable work hours per person
- Multiple saved groups
- Shareable scheduling link
- Compact mobile overview with local time, participant/location times, and the slider in one screen
- Accessibility and usability testing

### Phase 3 â€” Integrations
- Phone contacts, only with explicit permission
- Google and Microsoft calendars
- Zoom meeting creation
- WhatsApp, Viber and Telegram deep-link improvements
- Native mobile application if web validation is positive

### Phase 4 â€” Collaboration
- Accounts and synchronized data
- Team workspaces
- Invitations and voting
- Reminders and notifications

## Privacy

The current MVP stores contacts only in the user's browser using `localStorage`. It does not upload or transmit contact information.

## License

No license has been selected yet. All rights are reserved by the repository owner until a license is added.

