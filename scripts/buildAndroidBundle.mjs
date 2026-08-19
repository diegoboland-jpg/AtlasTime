import { access, copyFile, mkdir, readFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const targetUrl = new URL("../android/twa/", import.meta.url);
const target = fileURLToPath(targetUrl);
const manifestUrl = new URL("twa-manifest.json", targetUrl);
const releaseConfig = JSON.parse(await readFile(new URL("../android/release-config.json", import.meta.url), "utf8"));
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

try { await access(manifestUrl); }
catch {
  console.error("Android project is not initialized. Run npm run android:init first.");
  process.exit(1);
}

const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
const mismatches = [];
if (manifest.packageId !== releaseConfig.applicationId) mismatches.push("package ID");
if (manifest.appVersion !== releaseConfig.versionName) mismatches.push("version name");
if (manifest.appVersionCode !== releaseConfig.versionCode) mismatches.push("version code");
if (mismatches.length) {
  console.error(`Android project differs from release-config.json: ${mismatches.join(", ")}. Run npm run android:init again.`);
  process.exit(1);
}

const androidManifest = await readFile(new URL("app/src/main/AndroidManifest.xml", targetUrl), "utf8");
if (!androidManifest.includes("com.badie.kikroo.KikrooWidgetProvider")) {
  console.error("Android widget overlay is missing. Run npm run android:init again.");
  process.exit(1);
}

const result = spawnSync(
  npx,
  ["-y", `@bubblewrap/cli@${releaseConfig.bubblewrapVersion}`, "build", "--manifest=twa-manifest.json"],
  { cwd: target, stdio: "inherit" },
);
if (result.status !== 0) process.exit(result.status ?? 1);

const bundleUrl = new URL("app-release-bundle.aab", targetUrl);
await access(bundleUrl);
const outputDirectory = new URL("../android/output/", import.meta.url);
await mkdir(outputDirectory, { recursive: true });
const outputUrl = new URL(`kikroo-${releaseConfig.versionName}-${releaseConfig.versionCode}.aab`, outputDirectory);
await copyFile(bundleUrl, outputUrl);
const bundle = await stat(outputUrl);
console.log(`Signed Google Play bundle ready: ${fileURLToPath(outputUrl)} (${Math.ceil(bundle.size / 1024)} KiB)`);
console.log("The bundle is excluded from Git and is intended for Google Play internal testing.");
