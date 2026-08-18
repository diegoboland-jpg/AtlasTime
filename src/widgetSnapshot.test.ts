import { describe, expect, it } from "vitest";
import type { SavedGroup } from "./types";
import { createWidgetSnapshot, WIDGET_ACTIONS, WIDGET_MAX_ENTRIES, widgetSnapshotFreshness } from "./widgetSnapshot";

const group: SavedGroup = {
  id: "group-1",
  name: "Global launch",
  updatedAt: "2026-08-18T12:00:00.000Z",
  planner: {
    date: "2026-08-18",
    hour: 14,
    title: "Secret acquisition",
    durationMinutes: 60,
    eventMode: "timed",
    location: "Confidential room",
    notes: "Private deal notes",
  },
  people: Array.from({ length: 8 }, (_, index) => ({
    id: `person-${index + 1}`,
    contactId: `contact-${index + 1}`,
    entryType: "person" as const,
    name: `Person ${index + 1}`,
    email: `person${index + 1}@example.com`,
    phone: `+55110000000${index + 1}`,
    availabilityRequestStatus: "shared" as const,
    availabilityRequestedAt: "2026-08-18T11:00:00.000Z",
    city: index ? "Madrid" : "Curitiba",
    country: index ? "Spain" : "Brazil",
    countryCode: index ? "ES" : "BR",
    timeZone: index ? "Europe/Madrid" : "America/Sao_Paulo",
    workStart: 9,
    workEnd: 18,
  })),
};

describe("privacy-safe native widget snapshot", () => {
  it("caps the widget at six entries and excludes sensitive source fields", () => {
    const snapshot = createWidgetSnapshot({
      group,
      deviceTimeZone: "America/Sao_Paulo",
      selectedAt: new Date("2026-08-18T14:00:00.000Z"),
      recommendation: { startAt: new Date("2026-08-18T15:00:00.000Z"), available: 5, total: 8 },
      now: new Date("2026-08-18T12:00:00.000Z"),
    });
    const serialized = JSON.stringify(snapshot);

    expect(snapshot.entries).toHaveLength(WIDGET_MAX_ENTRIES);
    expect(snapshot.entries[0]).toEqual(expect.objectContaining({
      label: "Person 1",
      place: "Curitiba",
      timeZone: "America/Sao_Paulo",
      workStart: 9,
      workEnd: 18,
    }));
    expect(serialized).not.toContain("@example.com");
    expect(serialized).not.toContain("+5511");
    expect(serialized).not.toContain("contact-");
    expect(serialized).not.toContain("Secret acquisition");
    expect(serialized).not.toContain("Confidential room");
    expect(serialized).not.toContain("Private deal notes");
    expect(serialized).not.toContain("availabilityRequest");
  });

  it("supports a times-only mode that removes user-defined labels and places", () => {
    const snapshot = createWidgetSnapshot({
      group,
      deviceTimeZone: "America/Sao_Paulo",
      selectedAt: new Date("2026-08-18T14:00:00.000Z"),
      privacyMode: "times-only",
      now: new Date("2026-08-18T12:00:00.000Z"),
    });
    const serialized = JSON.stringify(snapshot);

    expect(snapshot.group.label).toBeUndefined();
    expect(snapshot.entries[0]).toEqual(expect.objectContaining({ id: "entry-1", timeZone: "America/Sao_Paulo" }));
    expect(serialized).not.toContain("Global launch");
    expect(serialized).not.toContain("Person 1");
    expect(serialized).not.toContain("Curitiba");
  });

  it("defines predictable fresh, stale, and expired states", () => {
    const snapshot = createWidgetSnapshot({
      group,
      deviceTimeZone: "America/Sao_Paulo",
      selectedAt: new Date("2026-08-18T14:00:00.000Z"),
      now: new Date("2026-08-18T12:00:00.000Z"),
    });

    expect(widgetSnapshotFreshness(snapshot, new Date("2026-08-18T12:14:59.000Z"))).toBe("fresh");
    expect(widgetSnapshotFreshness(snapshot, new Date("2026-08-18T12:15:00.000Z"))).toBe("stale");
    expect(widgetSnapshotFreshness(snapshot, new Date("2026-08-19T12:00:00.000Z"))).toBe("expired");
  });

  it("limits native interaction to the reviewed workaround actions", () => {
    expect(WIDGET_ACTIONS).toEqual(["previous-30", "now", "next-30", "open-app"]);
  });
});
