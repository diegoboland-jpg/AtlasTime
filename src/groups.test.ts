// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import { createShareLink, loadGroups, readSharedGroup, saveGroups } from "./groups";
import type { Person, SavedGroup } from "./types";

const person: Person = {
  id: "ana",
  name: "Ana",
  city: "São Paulo",
  timeZone: "America/Sao_Paulo",
  workStart: 8,
  workEnd: 17,
};

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
});

describe("saved groups", () => {
  it("migrates legacy people and planner data", () => {
    localStorage.setItem("atlastime.people.v1", JSON.stringify([person]));
    localStorage.setItem("atlastime.planner.v1", JSON.stringify({ date: "2026-08-10", hour: 16 }));

    const workspace = loadGroups();

    expect(workspace.groups).toHaveLength(1);
    expect(workspace.groups[0].people).toEqual([person]);
    expect(workspace.groups[0].planner).toEqual({ date: "2026-08-10", hour: 16, title: "", durationMinutes: 60 });
  });

  it("persists and restores the active group", () => {
    const groups: SavedGroup[] = [
      { id: "one", name: "One", people: [], planner: { date: "2026-07-15", hour: 12, title: "", durationMinutes: 60 }, updatedAt: "2026-07-15T00:00:00Z" },
      { id: "two", name: "Two", people: [person], planner: { date: "2026-07-16", hour: 14, title: "Planning", durationMinutes: 45 }, updatedAt: "2026-07-15T00:00:00Z" },
    ];

    saveGroups(groups, "two");

    expect(loadGroups()).toMatchObject({ groups, activeGroupId: "two" });
  });
});

describe("share links", () => {
  it("round-trips Unicode names without overwriting local storage", () => {
    const group: SavedGroup = {
      id: "group",
      name: "Equipe São Paulo",
      people: [person],
      planner: { date: "2026-09-01", hour: 15, title: "Project sync", durationMinutes: 90 },
      updatedAt: "2026-07-15T00:00:00Z",
    };
    localStorage.setItem("sentinel", "unchanged");

    const link = new URL(createShareLink(group));
    const shared = readSharedGroup(link.hash);

    expect(shared).toEqual({ version: 1, name: group.name, people: group.people, planner: group.planner });
    expect(localStorage.getItem("sentinel")).toBe("unchanged");
  });

  it("rejects malformed share payloads", () => {
    expect(readSharedGroup("#share=not-valid-base64")).toBeNull();
  });
});
