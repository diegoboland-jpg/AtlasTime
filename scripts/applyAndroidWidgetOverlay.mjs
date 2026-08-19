import { cp, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const overlayMain = new URL("../android/widget-overlay/app/src/main/", import.meta.url);
const generatedMain = new URL("../android/twa/app/src/main/", import.meta.url);
const generatedManifest = new URL("AndroidManifest.xml", generatedMain);
const manifestFragment = new URL("../android/widget-overlay/manifest-fragment.xml", import.meta.url);
const generatedGradle = new URL("../android/twa/app/build.gradle", import.meta.url);

const GENERATED_LAUNCHERS = [
  "com.google.androidbrowserhelper.trusted.LauncherActivity",
  ".LauncherActivity",
];
const KIKROO_LAUNCHER = "com.badie.kikroo.KikrooLauncherActivity";
const ANDROID_BROWSER_HELPER = "2.7.3";
const ANDROIDX_BROWSER = "1.10.0";
const CUSTOM_TABS_QUERY = `  <queries>
    <intent>
      <action android:name="android.support.customtabs.action.CustomTabsService" />
    </intent>
  </queries>`;

export function applyWidgetManifest(manifest, fragment) {
  let next = manifest;
  if (!next.includes("android.support.customtabs.action.CustomTabsService")) {
    next = next.replace(/<application\b/, `${CUSTOM_TABS_QUERY}\n  <application`);
  }
  if (!next.includes(KIKROO_LAUNCHER)) {
    const launcher = GENERATED_LAUNCHERS.find((candidate) => next.includes(`android:name="${candidate}"`));
    if (!launcher) throw new Error("Generated TWA launcher activity was not found.");
    next = next.replace(`android:name="${launcher}"`, `android:name="${KIKROO_LAUNCHER}"`);
  }
  if (!next.includes("com.badie.kikroo.KikrooWidgetProvider")) {
    next = next.replace("</application>", `${fragment.trim()}\n</application>`);
  }
  return next;
}

export function applyWidgetGradle(gradle) {
  let next = gradle.replace(
    /com\.google\.androidbrowserhelper:androidbrowserhelper:[^'"\s)]+/g,
    `com.google.androidbrowserhelper:androidbrowserhelper:${ANDROID_BROWSER_HELPER}`,
  );
  if (!next.includes(`androidx.browser:browser:${ANDROIDX_BROWSER}`)) {
    const dependencies = /dependencies\s*\{/;
    if (!dependencies.test(next)) throw new Error("Generated Android dependencies block was not found.");
    next = next.replace(dependencies, `dependencies {\n    implementation 'androidx.browser:browser:${ANDROIDX_BROWSER}'`);
  }
  return next;
}

export async function applyAndroidWidgetOverlay() {
  await cp(overlayMain, generatedMain, { recursive: true, force: true });
  const [manifest, fragment, gradle] = await Promise.all([
    readFile(generatedManifest, "utf8"),
    readFile(manifestFragment, "utf8"),
    readFile(generatedGradle, "utf8"),
  ]);
  await Promise.all([
    writeFile(generatedManifest, applyWidgetManifest(manifest, fragment)),
    writeFile(generatedGradle, applyWidgetGradle(gradle)),
  ]);
  console.log(`Kikroo Android widget overlay applied to ${fileURLToPath(generatedMain)}`);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await applyAndroidWidgetOverlay();
}
