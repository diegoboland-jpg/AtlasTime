import { describe, expect, it } from "vitest";
import { createGoogleCalendarUrl, createIcsEvent, createOutlookCalendarUrl, meetingSummary } from "./meeting";
import type { Person } from "./types";

const people: Person[] = [
  { id: "ana", name: "Ana", city: "São Paulo", timeZone: "America/Sao_Paulo", workStart: 9, workEnd: 18 },
  { id: "lee", name: "Lee", city: "Kathmandu", timeZone: "Asia/Kathmandu", workStart: 9, workEnd: 18 },
];

describe("meeting handoff", () => {
  it("creates a summary with duration and each local-time range", () => {
    const summary = meetingSummary("Project sync", new Date("2026-07-15T15:00:00Z"), 45, people, {
      location: "Zoom room 4",
      notes: "Review launch risks.",
    });

    expect(summary).toContain("Project sync");
    expect(summary).toContain("Duration: 45 minutes");
    expect(summary).toContain("Location: Zoom room 4");
    expect(summary).toContain("Notes: Review launch risks.");
    expect(summary).toContain("Ana (São Paulo): Wed, 15 Jul 2026, 12:00 - Wed, 15 Jul 2026, 12:45");
    expect(summary).toContain("Lee (Kathmandu): Wed, 15 Jul 2026, 20:45 - Wed, 15 Jul 2026, 21:30");
  });

  it("creates a UTC calendar event with escaped text", () => {
    const calendar = createIcsEvent({
      title: "Planning, review; follow-up",
      start: new Date("2026-07-15T23:30:00Z"),
      durationMinutes: 90,
      description: "Line one\nLine two",
      location: "Room 4, West; wing",
      uid: "event-123@atlastime.local",
      createdAt: new Date("2026-07-15T12:00:00Z"),
    });

    expect(calendar).toContain("DTSTART:20260715T233000Z\r\n");
    expect(calendar).toContain("DTEND:20260716T010000Z\r\n");
    expect(calendar).toContain("SUMMARY:Planning\\, review\\; follow-up\r\n");
    expect(calendar).toContain("LOCATION:Room 4\\, West\\; wing\r\n");
    expect(calendar).toContain("DESCRIPTION:Line one\\nLine two\r\n");
    expect(calendar.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  it("creates prefilled Google and Outlook calendar drafts", () => {
    const event = {
      title: "Planning & review",
      start: new Date("2026-07-15T23:30:00Z"),
      durationMinutes: 90,
      description: "Line one\nLine two",
      location: "Room 4, West wing",
    };
    const google = new URL(createGoogleCalendarUrl(event));
    const outlook = new URL(createOutlookCalendarUrl(event));

    expect(google.origin).toBe("https://calendar.google.com");
    expect(google.searchParams.get("action")).toBe("TEMPLATE");
    expect(google.searchParams.get("dates")).toBe("20260715T233000Z/20260716T010000Z");
    expect(google.searchParams.get("text")).toBe(event.title);
    expect(google.searchParams.get("details")).toBe(event.description);
    expect(google.searchParams.get("location")).toBe(event.location);

    expect(outlook.origin).toBe("https://outlook.office.com");
    expect(outlook.searchParams.get("path")).toBe("/calendar/action/compose");
    expect(outlook.searchParams.get("rru")).toBe("addevent");
    expect(outlook.searchParams.get("startdt")).toBe("2026-07-15T23:30:00.000Z");
    expect(outlook.searchParams.get("enddt")).toBe("2026-07-16T01:00:00.000Z");
    expect(outlook.searchParams.get("subject")).toBe(event.title);
    expect(outlook.searchParams.get("body")).toBe(event.description);
    expect(outlook.searchParams.get("location")).toBe(event.location);
  });
});
