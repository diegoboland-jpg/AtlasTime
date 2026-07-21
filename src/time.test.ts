import { describe, expect, it } from "vitest";
import { bestHour, dateAtUtcHour, formatInZone, formatUtcHour, hourInZone, meetingFitsWorkingHours, scoreAtUtcHour, scoreHours } from "./time";
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
    expect(dateAtUtcHour("2026-07-15", 14.5).toISOString()).toBe("2026-07-15T14:30:00.000Z");
    expect(formatUtcHour(14.5)).toBe("14:30 UTC");
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
    const scoreAt = (hour: number) => scores.find((score) => score.utcHour === hour)!;
    expect(scoreAt(5).penalty).toBeGreaterThan(scoreAt(8).penalty);
    expect(scoreAt(22).penalty).toBeGreaterThan(scoreAt(18).penalty);
  });

  it("returns no recommendation for an empty group", () => {
    expect(bestHour([], "2026-07-15")).toBeNull();
  });

  it("scores half-hour exploration instants", () => {
    expect(scoreAtUtcHour([person()], "2026-07-15", 9.5)).toMatchObject({ utcHour: 9.5, available: 1, score: 12 });
  });

  it("evaluates the complete meeting duration", () => {
    expect(scoreAtUtcHour([person()], "2026-07-15", 17, 60).available).toBe(1);
    expect(scoreAtUtcHour([person()], "2026-07-15", 17, 90).available).toBe(0);
  });

  it("offers 30-minute candidate starts and supports half-hour zones", () => {
    const kolkata = person({ timeZone: "Asia/Kolkata", workStart: 9, workEnd: 10 });
    const scores = scoreHours([kolkata], "2026-01-15", 60);

    expect(scores).toHaveLength(48);
    expect(scores.find((score) => score.utcHour === 3.5)?.available).toBe(1);
    expect(scores.find((score) => score.utcHour === 4)?.available).toBe(0);
  });

  it("uses elapsed duration across the spring DST boundary", () => {
    const newYork = person({ timeZone: "America/New_York", workStart: 1, workEnd: 4 });
    const start = new Date("2026-03-08T06:30:00Z");

    expect(meetingFitsWorkingHours(newYork, start, 90)).toBe(true);
    expect(meetingFitsWorkingHours(newYork, start, 120)).toBe(false);
  });

  it("ranks complete overlap above partial overlap for long meetings", () => {
    const people = [
      person({ id: "one", workStart: 9, workEnd: 12 }),
      person({ id: "two", workStart: 10, workEnd: 13 }),
    ];

    expect(bestHour(people, "2026-07-15", 120)).toMatchObject({ utcHour: 10, available: 2 });
  });
});
