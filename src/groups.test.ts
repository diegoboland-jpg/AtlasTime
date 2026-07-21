// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import { createShareLink, loadGroups, readSharedGroup, saveGroups } from "./groups";
import type { Person, SavedGroup } from "./types";

const person: Person = {
  id: "ana",
  name: "Ana",
  city: "São Paulo",
  country: "Brazil",
  countryCode: "BR",
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
    expect(workspace.groups[0].planner).toEqual({ date: "2026-08-10", hour: 16, title: "", durationMinutes: 60, location: "", notes: "" });
  });

  it("persists and restores the active group", () => {
    const groups: SavedGroup[] = [
      { id: "one", name: "One", people: [], planner: { date: "2026-07-15", hour: 12, title: "", durationMinutes: 60, location: "", notes: "" }, updatedAt: "2026-07-15T00:00:00Z" },
      { id: "two", name: "Two", people: [person], planner: { date: "2026-07-16", hour: 14, title: "Planning", durationMinutes: 45, location: "Zoom", notes: "Agenda" }, updatedAt: "2026-07-15T00:00:00Z" },
    ];

    saveGroups(groups, "two");

    expect(loadGroups()).toMatchObject({ groups, activeGroupId: "two" });
  });

  it("normalizes trusted country codes and drops invalid flag metadata", () => {
    const people = [
      { ...person, id: "valid", countryCode: "br" },
      { ...person, id: "invalid", city: "Unlisted place", country: undefined, countryCode: "Brazil", timeZone: "Etc/UTC" },
    ];
    localStorage.setItem("atlastime.groups.v1", JSON.stringify([{
      id: "countries",
      name: "Countries",
      people,
      planner: { date: "2026-07-20", hour: 12 },
      updatedAt: "2026-07-20T00:00:00Z",
    }]));

    const loaded = loadGroups().groups[0].people;

    expect(loaded[0].countryCode).toBe("BR");
    expect(loaded[1].countryCode).toBeUndefined();
  });

  it("backfills flags for trusted known city and timezone pairs", () => {
    const oldPeople = [
      { ...person, id: "granada", city: "Granada", country: undefined, countryCode: undefined, timeZone: "Europe/Madrid" },
      { ...person, id: "manila", city: "Manila", country: undefined, countryCode: undefined, timeZone: "Asia/Manila" },
      { ...person, id: "kochi", city: "Kochi", country: undefined, countryCode: undefined, timeZone: "Asia/Kolkata" },
      { ...person, id: "buenos", city: "Buenos aires", country: undefined, countryCode: undefined, timeZone: "America/Argentina/Buenos_Aires" },
    ];
    localStorage.setItem("atlastime.groups.v1", JSON.stringify([{
      id: "old", name: "Old group", people: oldPeople, planner: { date: "2026-07-20", hour: 12 }, updatedAt: "2026-07-20T00:00:00Z",
    }]));

    expect(loadGroups().groups[0].people.map(({ countryCode }) => countryCode)).toEqual(["ES", "PH", "IN", "AR"]);
  });

  it("drops people with invalid IANA time zones from persisted data", () => {
    localStorage.setItem("atlastime.groups.v1", JSON.stringify([{
      id: "invalid-zones",
      name: "Invalid zones",
      people: [
        person,
        { ...person, id: "broken", name: "Broken", timeZone: "Not/A_Time_Zone" },
      ],
      planner: { date: "2026-07-20", hour: 12 },
      updatedAt: "2026-07-20T00:00:00Z",
    }]));

    expect(loadGroups().groups[0].people).toEqual([person]);
  });

  it("backfills a representative flag from a known timezone for person and team labels", () => {
    localStorage.setItem("atlastime.groups.v1", JSON.stringify([{
      id: "teams",
      name: "Teams",
      people: [{ ...person, id: "team", name: "Europe support", city: "Remote team", country: undefined, countryCode: undefined, timeZone: "Europe/Madrid" }],
      planner: { date: "2026-07-20", hour: 12 },
      updatedAt: "2026-07-20T00:00:00Z",
    }]));

    expect(loadGroups().groups[0].people[0]).toMatchObject({ country: "Spain", countryCode: "ES" });
  });
});

describe("share links", () => {
  it("round-trips Unicode names without overwriting local storage", () => {
    const group: SavedGroup = {
      id: "group",
      name: "Equipe São Paulo",
      people: [person],
      planner: { date: "2026-09-01", hour: 15, title: "Project sync", durationMinutes: 90, location: "Room 7", notes: "Bring estimates" },
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
