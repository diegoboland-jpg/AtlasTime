// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import { contactFromPerson, loadContacts, normalizeEmail, personFromContact, saveContacts, updateLinkedContactInGroups, upsertContact } from "./contacts";
import type { ContactRecord, Person, SavedGroup } from "./types";

const person: Person = {
  id: "ana-group-entry",
  name: "Ana",
  email: " ANA@Example.com ",
  city: "São Paulo",
  country: "Brazil",
  countryCode: "BR",
  timeZone: "America/Sao_Paulo",
  workStart: 9,
  workEnd: 18,
};

beforeEach(() => localStorage.clear());

describe("local contact directory", () => {
  it("normalizes valid emails and rejects invalid addresses", () => {
    expect(normalizeEmail(" ANA@Example.com ")).toBe("ana@example.com");
    expect(normalizeEmail("not-an-email")).toBeUndefined();
  });

  it("seeds old group entries and persists them independently", () => {
    const contacts = loadContacts([person]);
    expect(contacts).toHaveLength(1);
    expect(contacts[0]).toMatchObject({ id: person.id, email: "ana@example.com", city: "São Paulo" });

    saveContacts(contacts);
    expect(loadContacts([])).toEqual(contacts);
  });

  it("reuses a directory contact with a new group-entry id and keeps edits linked", () => {
    const contact: ContactRecord = contactFromPerson({ ...person, contactId: "ana-contact" });
    const reused = personFromContact(contact, "new-group-entry");
    const updated = { ...reused, city: "Lisbon", timeZone: "Europe/Lisbon" };
    const directory = upsertContact([contact], updated);

    expect(reused).toMatchObject({ id: "new-group-entry", contactId: "ana-contact", email: "ana@example.com" });
    expect(directory).toHaveLength(1);
    expect(directory[0]).toMatchObject({ id: "ana-contact", city: "Lisbon", timeZone: "Europe/Lisbon" });
  });

  it("propagates contact edits to every group that reuses the contact", () => {
    const linked = { ...person, contactId: "ana-contact" };
    const groups: SavedGroup[] = ["one", "two"].map((id, index) => ({
      id,
      name: id,
      people: [{ ...linked, id: `entry-${index}` }],
      planner: { date: "2026-07-22", hour: 12, title: "", durationMinutes: 60, eventMode: "timed", location: "", notes: "" },
      updatedAt: "2026-07-22T00:00:00Z",
    }));
    const updated = { ...linked, id: "entry-0", city: "Lisbon", timeZone: "Europe/Lisbon" };

    const next = updateLinkedContactInGroups(groups, "one", updated);
    expect(next.map((group) => group.people[0])).toEqual([
      updated,
      { ...updated, id: "entry-1" },
    ]);
  });
});
