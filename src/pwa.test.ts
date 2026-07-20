import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { installInstructions, isIosDevice } from "./pwa";

describe("PWA install guidance", () => {
  it("recognizes iPhone and Android user agents", () => {
    expect(isIosDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe(true);
    expect(isIosDevice("Mozilla/5.0 (Linux; Android 15; Pixel 9)")).toBe(false);
  });

  it("provides platform-appropriate installation instructions", () => {
    expect(installInstructions(true)).toContain("Add to Home Screen");
    expect(installInstructions(false)).toContain("Install AtlasTime");
  });
});

describe("PWA update lifecycle", () => {
  it("uses a cache generation that matches the current app version", () => {
    const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version: string };
    const serviceWorker = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

    expect(serviceWorker).toContain(`const CACHE_NAME = "atlastime-v${packageJson.version.replace(/\.0$/, "")}";`);
    expect(serviceWorker).toContain("self.skipWaiting()");
    expect(serviceWorker).toContain("self.clients.claim()");
  });
});
