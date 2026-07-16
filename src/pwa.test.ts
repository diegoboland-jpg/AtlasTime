import { describe, expect, it } from "vitest";
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
