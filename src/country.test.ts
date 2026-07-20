import { describe, expect, it } from "vitest";
import { countryCodeToFlag } from "./country";

describe("country flag identity", () => {
  it("creates a flag only from a valid ISO alpha-2 country code", () => {
    expect(countryCodeToFlag("br")).toBe("🇧🇷");
    expect(countryCodeToFlag("US")).toBe("🇺🇸");
    expect(countryCodeToFlag("Brazil")).toBeNull();
    expect(countryCodeToFlag()).toBeNull();
  });
});
