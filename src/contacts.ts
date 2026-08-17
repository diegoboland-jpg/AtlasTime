import { getCityByPlace, getCountryByTimeZone } from "./cities";
import { countryCodeFromName, normalizeCountryCode } from "./countries";
import type { ContactRecord, Person, SavedGroup } from "./types";

const CONTACTS_STORAGE_KEY = "atlastime.contacts.v1";
const MAX_CONTACTS = 250;

export function normalizeEmail(value?: string) {
  const email = value?.trim().toLowerCase() ?? "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email.slice(0, 254) : undefined;
}

export function normalizePhone(value?: string) {
  const raw = value?.trim() ?? "";
  if (!raw) return undefined;
  const leadingPlus = raw.startsWith("+");
  const digits = raw.replaceAll(/\D/g, "").slice(0, 18);
  return digits.length >= 7 ? `${leadingPlus ? "+" : ""}${digits}` : undefined;
}

function availabilityStatus(value: unknown): Person["availabilityRequestStatus"] {
  return ["not-requested", "requested", "shared", "declined", "expired", "blocked"].includes(String(value))
    ? value as Person["availabilityRequestStatus"]
    : undefined;
}

function validTimeZone(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}

function safeContact(value: unknown): ContactRecord | null {
  const candidate = value as Partial<ContactRecord> | null;
  if (!candidate || typeof candidate.id !== "string" || !candidate.id
    || typeof candidate.name !== "string" || !candidate.name.trim()
    || typeof candidate.city !== "string" || !validTimeZone(candidate.timeZone)
    || typeof candidate.workStart !== "number" || typeof candidate.workEnd !== "number") return null;

  const knownPlace = getCityByPlace(candidate.city, candidate.timeZone);
  const knownCountry = knownPlace ?? getCountryByTimeZone(candidate.timeZone);
  const country = typeof candidate.country === "string" && candidate.country.trim()
    ? candidate.country.trim().slice(0, 80)
    : knownCountry?.country;
  const countryCode = normalizeCountryCode(candidate.countryCode)
    ?? countryCodeFromName(country)
    ?? knownCountry?.countryCode;
  const email = normalizeEmail(candidate.email);
  const phone = normalizePhone(candidate.phone);
  const requestStatus = availabilityStatus(candidate.availabilityRequestStatus);

  return {
    id: candidate.id,
    entryType: "person",
    name: candidate.name.trim().slice(0, 120),
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    ...(requestStatus ? { availabilityRequestStatus: requestStatus } : {}),
    ...(typeof candidate.availabilityRequestedAt === "string" ? { availabilityRequestedAt: candidate.availabilityRequestedAt } : {}),
    city: candidate.city.trim().slice(0, 120),
    ...(country ? { country } : {}),
    ...(countryCode ? { countryCode } : {}),
    timeZone: candidate.timeZone,
    workStart: Math.max(0, Math.min(23, candidate.workStart)),
    workEnd: Math.max(1, Math.min(24, candidate.workEnd)),
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : new Date().toISOString(),
  };
}

export function contactFromPerson(person: Person): ContactRecord {
  const email = normalizeEmail(person.email);
  const phone = normalizePhone(person.phone);
  return {
    id: person.contactId ?? person.id,
    entryType: "person",
    name: person.name,
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    ...(person.availabilityRequestStatus ? { availabilityRequestStatus: person.availabilityRequestStatus } : {}),
    ...(person.availabilityRequestedAt ? { availabilityRequestedAt: person.availabilityRequestedAt } : {}),
    city: person.city,
    ...(person.country ? { country: person.country } : {}),
    ...(person.countryCode ? { countryCode: person.countryCode } : {}),
    timeZone: person.timeZone,
    workStart: person.workStart,
    workEnd: person.workEnd,
    updatedAt: new Date().toISOString(),
  };
}

export function personFromContact(contact: ContactRecord, id: string): Person {
  return {
    id,
    entryType: "person",
    contactId: contact.id,
    name: contact.name,
    ...(contact.email ? { email: contact.email } : {}),
    ...(contact.phone ? { phone: contact.phone } : {}),
    ...(contact.availabilityRequestStatus ? { availabilityRequestStatus: contact.availabilityRequestStatus } : {}),
    ...(contact.availabilityRequestedAt ? { availabilityRequestedAt: contact.availabilityRequestedAt } : {}),
    city: contact.city,
    ...(contact.country ? { country: contact.country } : {}),
    ...(contact.countryCode ? { countryCode: contact.countryCode } : {}),
    timeZone: contact.timeZone,
    workStart: contact.workStart,
    workEnd: contact.workEnd,
  };
}

export function upsertContact(contacts: ContactRecord[], person: Person) {
  if (person.entryType && person.entryType !== "person") {
    const contactId = person.contactId ?? person.id;
    return contacts.filter((contact) => contact.id !== contactId);
  }
  const next = contactFromPerson(person);
  const index = contacts.findIndex((contact) => contact.id === next.id);
  if (index < 0) return [...contacts, next].slice(-MAX_CONTACTS);
  return contacts.map((contact, contactIndex) => contactIndex === index ? next : contact);
}

export function updateLinkedContactInGroups(groups: SavedGroup[], activeGroupId: string, updated: Person) {
  const contactId = updated.contactId;
  return groups.map((group) => {
    let changed = false;
    const people = group.people.map((person) => {
      if (group.id === activeGroupId && person.id === updated.id) {
        changed = true;
        return updated;
      }
      if (contactId && person.contactId === contactId) {
        changed = true;
        return { ...updated, id: person.id, contactId };
      }
      return person;
    });
    return changed ? { ...group, people, updatedAt: new Date().toISOString() } : group;
  });
}

export function loadContacts(seedPeople: Person[] = []): ContactRecord[] {
  let stored: ContactRecord[] = [];
  try {
    const parsed = JSON.parse(localStorage.getItem(CONTACTS_STORAGE_KEY) ?? "[]");
    if (Array.isArray(parsed)) stored = parsed.slice(0, MAX_CONTACTS).flatMap((value) => {
      const contact = safeContact(value);
      return contact ? [contact] : [];
    });
  } catch {
    stored = [];
  }

  return seedPeople.reduce(upsertContact, stored);
}

export function saveContacts(contacts: ContactRecord[]) {
  localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts.slice(0, MAX_CONTACTS)));
}
