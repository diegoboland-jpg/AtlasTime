import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const requiredIcons = new Map([
  ["public/icons/kikroo-icon-192.png", 192],
  ["public/icons/kikroo-icon-512.png", 512],
  ["public/icons/kikroo-icon-maskable-512.png", 512],
]);
const requiredWidgetFiles = [
  "android/widget-overlay/app/src/main/java/com/badie/kikroo/KikrooLauncherActivity.java",
  "android/widget-overlay/app/src/main/java/com/badie/kikroo/KikrooWidgetProvider.java",
  "android/widget-overlay/app/src/main/java/com/badie/kikroo/WidgetSnapshotStore.java",
  "android/widget-overlay/app/src/main/res/layout/kikroo_widget.xml",
  "android/widget-overlay/app/src/main/res/xml/kikroo_widget_info.xml",
  "android/widget-overlay/manifest-fragment.xml",
];

const [appPackage, webManifest, releaseConfig] = await Promise.all([
  readFile(new URL("package.json", root), "utf8").then(JSON.parse),
  readFile(new URL("public/manifest.webmanifest", root), "utf8").then(JSON.parse),
  readFile(new URL("android/release-config.json", root), "utf8").then(JSON.parse),
]);

const failures = [];
if (appPackage.version !== releaseConfig.versionName) failures.push("package and Android version names differ");
if (!/^com\.[a-z0-9_.]+$/.test(releaseConfig.applicationId)) failures.push("Android application ID is invalid");
if (!Number.isSafeInteger(releaseConfig.versionCode) || releaseConfig.versionCode < 1) failures.push("Android version code must be a positive integer");
if (!/^\d+\.\d+\.\d+$/.test(releaseConfig.bubblewrapVersion)) failures.push("Bubblewrap version must be pinned exactly");
if (!releaseConfig.manifestUrl.startsWith("https://")) failures.push("Android manifest URL must use HTTPS");
if (webManifest.display !== "standalone") failures.push("web manifest must use standalone display mode");
if (appPackage.scripts?.["android:init"] !== "node scripts/initAndroidTwa.mjs") failures.push("android:init command is missing");
if (appPackage.scripts?.["android:build:bundle"] !== "node scripts/buildAndroidBundle.mjs") failures.push("android:build:bundle command is missing");
if (appPackage.version !== "1.17.0" || releaseConfig.versionCode !== 11700) failures.push("v1.17 Android version metadata is not aligned");
for (const file of requiredWidgetFiles) {
  try { await access(new URL(file, root)); }
  catch { failures.push(`missing ${file}`); }
}
const [assetLinksSource, widgetManifestFragment] = await Promise.all([
  readFile(new URL("server/androidAppLinks.mjs", root), "utf8"),
  readFile(new URL("android/widget-overlay/manifest-fragment.xml", root), "utf8"),
]);
if (!assetLinksSource.includes("delegate_permission/common.use_as_origin")) failures.push("Digital Asset Links does not authorize the widget message origin");
if (!widgetManifestFragment.includes("androidx.browser.customtabs.PostMessageService")) failures.push("Android PostMessageService is missing");
const overlaySource = await readFile(new URL("scripts/applyAndroidWidgetOverlay.mjs", root), "utf8");
if (!overlaySource.includes("android.support.customtabs.action.CustomTabsService")) failures.push("Android Custom Tabs package visibility query is missing");
for (const [icon, expectedSize] of requiredIcons) {
  try {
    const location = new URL(icon, root);
    await access(location);
    const png = await readFile(location);
    if (png.toString("ascii", 1, 4) !== "PNG") failures.push(`${icon} is not a PNG file`);
    if (png.readUInt32BE(16) !== expectedSize || png.readUInt32BE(20) !== expectedSize) {
      failures.push(`${icon} must be ${expectedSize}x${expectedSize}`);
    }
  }
  catch { failures.push(`missing ${icon}`); }
}

if (failures.length) {
  console.error(`Android release preparation failed:\n- ${failures.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log(`Android release preparation ready for ${releaseConfig.applicationId} v${releaseConfig.versionName}.`);
  console.log(`Public manifest: ${releaseConfig.manifestUrl}`);
  console.log("Signing keys and certificate fingerprints remain external to the repository, as required.");
}
