import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { applyAndroidWidgetOverlay } from "./applyAndroidWidgetOverlay.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const target = fileURLToPath(new URL("../android/twa/", import.meta.url));
const manifestPath = fileURLToPath(new URL("../android/twa/twa-manifest.json", import.meta.url));
const releaseConfig = JSON.parse(await readFile(new URL("../android/release-config.json", import.meta.url), "utf8"));
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const bubblewrap = `@bubblewrap/cli@${releaseConfig.bubblewrapVersion}`;

await mkdir(target, { recursive: true });

console.log("Kikroo Android initialization will open Bubblewrap's guided setup.");
console.log(`Use package ID ${releaseConfig.applicationId}, app name ${releaseConfig.appName}, and version ${releaseConfig.versionName}.`);
console.log("Choose a signing-key location outside this Git repository and keep a separate encrypted backup.");

const result = spawnSync(
  npx,
  ["-y", bubblewrap, "init", `--manifest=${releaseConfig.manifestUrl}`, `--directory=${target}`],
  { cwd: root, stdio: "inherit" },
);
if (result.status !== 0) process.exit(result.status ?? 1);

const twaManifest = JSON.parse(await readFile(manifestPath, "utf8"));
Object.assign(twaManifest, {
  packageId: releaseConfig.applicationId,
  host: releaseConfig.host,
  name: releaseConfig.appName,
  launcherName: releaseConfig.appName,
  display: releaseConfig.display,
  orientation: releaseConfig.orientation,
  startUrl: releaseConfig.startUrl,
  iconUrl: releaseConfig.iconUrl,
  maskableIconUrl: releaseConfig.maskableIconUrl,
  appVersion: releaseConfig.versionName,
  appVersionCode: releaseConfig.versionCode,
  themeColor: releaseConfig.themeColor,
  themeColorDark: releaseConfig.themeColor,
  navigationColor: releaseConfig.themeColor,
  navigationColorDark: releaseConfig.themeColor,
  navigationDividerColor: releaseConfig.themeColor,
  navigationDividerColorDark: releaseConfig.themeColor,
  backgroundColor: releaseConfig.backgroundColor,
  webManifestUrl: releaseConfig.manifestUrl,
  enableNotifications: false,
});
await writeFile(manifestPath, `${JSON.stringify(twaManifest, null, 2)}\n`);

const update = spawnSync(
  npx,
  ["-y", bubblewrap, "update", "--skipVersionUpgrade", "--manifest=twa-manifest.json"],
  { cwd: target, stdio: "inherit" },
);
if (update.status !== 0) process.exit(update.status ?? 1);

await applyAndroidWidgetOverlay();

console.log(`Android project ready in ${target}`);
console.log("Next: npm run android:build:bundle");
