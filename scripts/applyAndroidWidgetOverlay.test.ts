import { describe, expect, it } from "vitest";
import { applyWidgetGradle, applyWidgetManifest } from "./applyAndroidWidgetOverlay.mjs";

describe("Android widget overlay", () => {
  it("replaces the generated launcher and inserts the widget declarations once", () => {
    const manifest = `<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application><activity android:name="com.google.androidbrowserhelper.trusted.LauncherActivity" /></application></manifest>`;
    const fragment = `<service android:name="androidx.browser.customtabs.PostMessageService" /><receiver android:name="com.badie.kikroo.KikrooWidgetProvider" />`;
    const once = applyWidgetManifest(manifest, fragment);
    const twice = applyWidgetManifest(once, fragment);
    expect(twice).toContain("com.badie.kikroo.KikrooLauncherActivity");
    expect(twice.match(/KikrooWidgetProvider/g)).toHaveLength(1);
    expect(twice.match(/android\.support\.customtabs\.action\.CustomTabsService/g)).toHaveLength(1);
  });

  it("supports Bubblewrap's unqualified launcher activity name", () => {
    const manifest = `<manifest><application><activity android:name="LauncherActivity" /></application></manifest>`;
    const fragment = `<receiver android:name="com.badie.kikroo.KikrooWidgetProvider" />`;
    expect(applyWidgetManifest(manifest, fragment)).toContain(
      `android:name="com.badie.kikroo.KikrooLauncherActivity"`,
    );
  });

  it("pins the browser libraries and Android 6 minimum needed by the widget channel", () => {
    const gradle = `android { defaultConfig { minSdkVersion 21 } }\ndependencies {\n implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'\n}`;
    const result = applyWidgetGradle(gradle);
    expect(result).toContain("minSdkVersion 23");
    expect(result).toContain("androidbrowserhelper:2.7.3");
    expect(result).toContain("androidx.browser:browser:1.10.0");
  });
});
