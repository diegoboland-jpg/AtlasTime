import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { countryCodeFromName, countryNameFromCode, countryOptions, normalizeCountryCode } from "./countries";

describe("global country metadata", () => {
  it("contains a global country and territory selector", () => {
    expect(countryOptions.length).toBeGreaterThan(240);
    expect(countryOptions).toContainEqual({ code: "NP", name: "Nepal" });
    expect(countryOptions).toContainEqual({ code: "ZA", name: "South Africa" });
  });

  it("has a packaged flag image for every selectable country or territory", () => {
    countryOptions.forEach(({ code }) => {
      expect(existsSync(new URL(`../public/flags/4x3/${code.toLowerCase()}.svg`, import.meta.url))).toBe(true);
    });
  });

  it("resolves English, Spanish, aliases, and direct ISO codes", () => {
    expect(countryCodeFromName("Brazil")).toBe("BR");
    expect(countryCodeFromName("Brasil")).toBe("BR");
    expect(countryCodeFromName("United States of America")).toBe("US");
    expect(countryCodeFromName("np")).toBe("NP");
  });

  it("keeps invalid values unresolved for the neutral globe fallback", () => {
    expect(normalizeCountryCode("ZZ")).toBeUndefined();
    expect(countryCodeFromName("Unknown made-up place")).toBeUndefined();
    expect(countryNameFromCode("BR")).toBe("Brazil");
  });
});
