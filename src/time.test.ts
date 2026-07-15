import { describe, expect, it } from "vitest";
import { bestHour, dateAtUtcHour, formatInZone, hourInZone, scoreHours } from "./time";
import type { Person } from "./types";

function person(overrides: Partial<Person> = {}): Person {
  return {
    id: "person",
    name: "Person",
    city: "City",
    timeZone: "UTC",
    workStart: 9,
    workEnd: 18,
    ...overrides,
  };
}

describe("timezone conversion", () => {
  it("creates the requested UTC instant", () => {
    expect(dateAtUtcHour("2026-07-15", 14).toISOString()).toBe("2026-07-15T14:00:00.000Z");
  });

  it("handles the New York spring daylight-saving transition", () => {
    expect(hourInZone(new Date("2026-03-08T06:00:00Z"), "America/New_York")).toBe(1);
    expect(hourInZone(new Date("2026-03-08T07:00:00Z"), "America/New_York")).toBe(3);
  });

  it("preserves non-hour timezone offsets", () => {
    expect(formatInZone(new Date("2026-01-15T00:00:00Z"), "Asia/Kathmandu")).toBe("05:45");
    expect(formatInZone(new Date("2026-01-15T00:00:00Z"), "Asia/Kolkata")).toBe("05:30");
  });
});

describe("meeting scoring", () => {
  it("penalizes very early and very late hours", () => {
    const scores = scoreHours([person()], "2026-07-15");
    expect(scores[5].penalty).toBeGreaterThan(scores[8].penalty);
    expect(scores[22].penalty).toBeGreaterThan(scores[18].penalty);
  });

  it("returns no recommendation for an empty group", () => {
    expect(bestHour([], "2026-07-15")).toBeNull();
  });
});
