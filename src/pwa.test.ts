import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { installInstructions, isIosDevice } from "./pwa";

describe("PWA install guidance", () => {
  it("recognizes iPhone and Android user agents", () => {
    expect(isIosDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe(true);
    expect(isIosDevice("Mozilla/5.0 (Linux; Android 15; Pixel 9)")).toBe(false);
  });

  it("is safe when browser globals are unavailable", () => {
    vi.stubGlobal("navigator", undefined);
    try {
      expect(isIosDevice()).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("provides platform-appropriate installation instructions", () => {
    expect(installInstructions(true)).toContain("Add to Home Screen");
    expect(installInstructions(false)).toContain("Install Kikroo");
  });
});

describe("PWA update lifecycle", () => {
  it("uses a cache generation that matches the current app version", () => {
    const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version: string };
    const serviceWorker = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

    expect(serviceWorker).toContain(`const CACHE_NAME = "kikroo-v${packageJson.version}";`);
    expect(serviceWorker).toContain('event.data?.type === "SKIP_WAITING"');
    expect(serviceWorker).toContain("self.skipWaiting()");
    expect(serviceWorker).toContain("self.clients.claim()");
    expect(serviceWorker).toContain('url.pathname.startsWith("/api/")');
  });

  it("publishes Android-compatible any and maskable PNG icons", () => {
    const manifest = JSON.parse(readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8")) as {
      icons: Array<{ src: string; sizes: string; type: string; purpose: string }>;
    };
    expect(manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ src: "/icons/kikroo-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" }),
      expect.objectContaining({ src: "/icons/kikroo-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }),
      expect.objectContaining({ src: "/icons/kikroo-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }),
    ]));
  });
});
