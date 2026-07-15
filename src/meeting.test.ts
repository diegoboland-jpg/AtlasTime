import { describe, expect, it } from "vitest";
import { createIcsEvent, meetingSummary } from "./meeting";
import type { Person } from "./types";

const people: Person[] = [
  { id: "ana", name: "Ana", city: "São Paulo", timeZone: "America/Sao_Paulo", workStart: 9, workEnd: 18 },
  { id: "lee", name: "Lee", city: "Kathmandu", timeZone: "Asia/Kathmandu", workStart: 9, workEnd: 18 },
];

describe("meeting handoff", () => {
  it("creates a summary with duration and each local-time range", () => {
    const summary = meetingSummary("Project sync", new Date("2026-07-15T15:00:00Z"), 45, people);

    expect(summary).toContain("Project sync");
    expect(summary).toContain("Duration: 45 minutes");
    expect(summary).toContain("Ana (São Paulo): Wed, 15 Jul 2026, 12:00 - Wed, 15 Jul 2026, 12:45");
    expect(summary).toContain("Lee (Kathmandu): Wed, 15 Jul 2026, 20:45 - Wed, 15 Jul 2026, 21:30");
  });

  it("creates a UTC calendar event with escaped text", () => {
    const calendar = createIcsEvent({
      title: "Planning, review; follow-up",
      start: new Date("2026-07-15T23:30:00Z"),
      durationMinutes: 90,
      description: "Line one\nLine two",
      uid: "event-123@atlastime.local",
      createdAt: new Date("2026-07-15T12:00:00Z"),
    });

    expect(calendar).toContain("DTSTART:20260715T233000Z\r\n");
    expect(calendar).toContain("DTEND:20260716T010000Z\r\n");
    expect(calendar).toContain("SUMMARY:Planning\\, review\\; follow-up\r\n");
    expect(calendar).toContain("DESCRIPTION:Line one\\nLine two\r\n");
    expect(calendar.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});
