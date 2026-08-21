// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import { loadOrganizer, saveOrganizer } from "./organizerAvailability";

describe("organizer availability", () => {
  beforeEach(() => localStorage.clear());

  it("defaults to humane working hours", () => {
    expect(loadOrganizer()).toMatchObject({ id: "current-device", name: "My time", workStart: 9, workEnd: 18 });
  });

  it("persists half-hour preferences", () => {
    saveOrganizer({ ...loadOrganizer(), name: "Diego", workStart: 8.5, workEnd: 17.5 });
    expect(loadOrganizer()).toMatchObject({ name: "Diego", workStart: 8.5, workEnd: 17.5 });
  });
});
