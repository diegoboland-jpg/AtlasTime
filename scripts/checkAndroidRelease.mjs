import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const requiredIcons = new Map([
  ["public/icons/kikroo-icon-192.png", 192],
  ["public/icons/kikroo-icon-512.png", 512],
  ["public/icons/kikroo-icon-maskable-512.png", 512],
]);

const [appPackage, webManifest, releaseConfig] = await Promise.all([
  readFile(new URL("package.json", root), "utf8").then(JSON.parse),
  readFile(new URL("public/manifest.webmanifest", root), "utf8").then(JSON.parse),
  readFile(new URL("android/release-config.json", root), "utf8").then(JSON.parse),
]);

const failures = [];
if (appPackage.version !== releaseConfig.versionName) failures.push("package and Android version names differ");
if (!/^com\.[a-z0-9_.]+$/.test(releaseConfig.applicationId)) failures.push("Android application ID is invalid");
if (!releaseConfig.manifestUrl.startsWith("https://")) failures.push("Android manifest URL must use HTTPS");
if (webManifest.display !== "standalone") failures.push("web manifest must use standalone display mode");
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
