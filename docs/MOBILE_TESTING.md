# AtlasTime mobile-device testing

AtlasTime is a responsive web application today. It can be tested on a real phone without installing a native app.

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

If Vite does not print a reachable Network address, run `ipconfig`, find the active Wi-Fi adapter's IPv4 address, and open `http://YOUR-IP:5173/` on the phone. Disable a VPN temporarily if it isolates local-network traffic.

## Phone review checklist

- Test portrait and landscape orientation.
- Create, rename, switch, and share a group.
- Add a place through global city search.
- Edit working hours and move the 24-hour slider.
- Confirm the delete control never overlaps **Now**, the live time, or the date.
- Try a long participant name and long city name.
- Copy meeting details and download the `.ics` file.
- Test at least one iPhone/Safari and one Android/Chrome device before calling the layout production-ready.

## Important limitation

The Vite development server is for local testing only. Do not expose it directly to the public internet. An installable PWA and native store packages are separate future milestones.
