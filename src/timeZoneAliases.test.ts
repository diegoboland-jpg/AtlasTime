import { describe, expect, it } from "vitest";
import { currentUtcOffset, searchTimeZoneAliases } from "./timeZoneAliases";

describe("corporate time-zone aliases", () => {
  it("requires an explicit regional choice for ambiguous abbreviations", () => {
    const results = searchTimeZoneAliases("IST", new Date("2026-01-15T12:00:00Z"));

    expect(results.map(({ timeZone }) => timeZone)).toEqual([
      "Asia/Kolkata",
      "Europe/Dublin",
      "Asia/Jerusalem",
    ]);
    expect(results.every((result) => result.source === "timezone-alias")).toBe(true);
    expect(results[0].detail).toContain("UTC+05:30");
  });

  it("does not silently reuse one meaning across different entries", () => {
    const firstSearch = searchTimeZoneAliases("CST");
    const secondSearch = searchTimeZoneAliases("cst");

    expect(firstSearch.map(({ timeZone }) => timeZone)).toEqual([
      "America/Chicago",
      "Asia/Shanghai",
      "America/Havana",
    ]);
    expect(secondSearch).toEqual(firstSearch);
  });

  it("keeps unambiguous aliases explicit and ignores ordinary place text", () => {
    expect(searchTimeZoneAliases("UTC")).toEqual([
      expect.objectContaining({ timeZone: "Etc/UTC", abbreviation: "UTC" }),
    ]);
    expect(searchTimeZoneAliases("Madrid")).toEqual([]);
    expect(currentUtcOffset("Etc/UTC", new Date("2026-01-15T12:00:00Z"))).toBe("UTC");
  });

  it("uses valid time-zone identifiers for every supported alias choice", () => {
    const aliases = [
      "UTC", "GMT", "ET", "EST", "CT", "CST", "MT", "MST", "PT", "PST", "IST", "BST",
      "AST", "GST", "CET", "EET", "WET", "BRT", "ART", "CLT", "SGT", "JST", "KST", "PHT",
      "PKT", "AEST", "NZST", "MSK", "EAT", "CAT", "SAST", "WAT",
    ];

    for (const alias of aliases) {
      const results = searchTimeZoneAliases(alias, new Date("2026-01-15T12:00:00Z"));
      expect(results.length, `${alias} should have at least one regional choice`).toBeGreaterThan(0);
      for (const result of results) {
        expect(() => currentUtcOffset(result.timeZone, new Date("2026-01-15T12:00:00Z"))).not.toThrow();
      }
    }
  });
});
