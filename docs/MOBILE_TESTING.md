# AtlasTime mobile-device testing

AtlasTime v1.0 is an installable progressive web app and can also be used as a normal responsive website.

## Start a phone-accessible preview on Windows

1. Connect the computer and phone to the same private Wi-Fi network.
2. Open CMD in the AtlasTime repository folder.
3. Install dependencies once with `npm.cmd install`.
4. Start the network preview with:

   ```bat
   npm.cmd run dev:mobile
   ```

5. Keep the CMD window open. Vite prints a `Network` address such as `http://192.168.1.25:5173/`.
6. Open that exact Network address in the phone browser.
7. If Windows Firewall asks, allow Node.js on **Private networks** only.

The development server validates layout and interaction, but browsers require a production build to exercise the service worker and installation flow. For that test, run:

```bat
npm.cmd run build
npm.cmd run preview:mobile
```

Open the printed Network address. Android Chrome can show an **Install** prompt. On iPhone Safari, use **Share → Add to Home Screen**. A trusted HTTPS deployment is required if the phone browser refuses installation from a local-network HTTP address.

If Vite does not print a reachable Network address, run `ipconfig`, find the active Wi-Fi adapter's IPv4 address, and open `http://YOUR-IP:5173/` on the phone. Disable a VPN temporarily if it isolates local-network traffic.

## Phone review checklist

- Test portrait and landscape orientation.
- Create, rename, switch, and share a group.
- Add a place through global city search.
- Edit working hours and move the 24-hour slider.
- Confirm the delete control never overlaps **Now**, the live time, or the date.
- Try a long participant name and long city name.
- Enter exact Start and Finish times and test an all-day event.
- Confirm Google and Outlook open prefilled drafts and download the Apple/device `.ics` event.
- Install AtlasTime, launch it from the home screen, and confirm it opens without browser controls.
- After one online load, turn on airplane mode and confirm the saved group and planner reopen.
- Test at least one iPhone/Safari and one Android/Chrome device before calling the layout production-ready.

## Important limitation

The Vite development server is for local testing only. Do not expose it directly to the public internet. AtlasTime is an installable PWA, not a native App Store or Play Store package. Installation and offline behavior still require physical-device validation for each supported browser and operating system.
