import type { Person } from "./types";

const STORAGE_KEY = "kikroo.organizer-availability.v1";

function deviceTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function defaultOrganizer(): Person {
  const timeZone = deviceTimeZone();
  return {
    id: "current-device",
    entryType: "person",
    name: "My time",
    city: timeZone.split("/").pop()?.replaceAll("_", " ") || timeZone,
    timeZone,
    workStart: 9,
    workEnd: 18,
  };
}

export function loadOrganizer(): Person {
  const fallback = defaultOrganizer();
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<Person> | null;
    const workStart = typeof parsed?.workStart === "number" ? parsed.workStart : fallback.workStart;
    const workEnd = typeof parsed?.workEnd === "number" ? parsed.workEnd : fallback.workEnd;
    if (workStart < 0 || workEnd > 24 || workStart >= workEnd) return fallback;
    return {
      ...fallback,
      name: typeof parsed?.name === "string" && parsed.name.trim() ? parsed.name.trim().slice(0, 80) : fallback.name,
      workStart,
      workEnd,
    };
  } catch {
    return fallback;
  }
}

export function saveOrganizer(person: Person) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    name: person.name,
    workStart: person.workStart,
    workEnd: person.workEnd,
  }));
}
