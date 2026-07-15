import type { Person } from "./types";

type IcsEvent = {
  title: string;
  start: Date;
  durationMinutes: number;
  description: string;
  uid: string;
  createdAt: Date;
};

function localDateTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function utcDateTime(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcs(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

export function meetingSummary(title: string, start: Date, durationMinutes: number, people: Person[]) {
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const heading = title.trim() || "AtlasTime meeting";
  const localTimes = people.length
    ? people.map((person) => `- ${person.name} (${person.city || person.timeZone}): ${localDateTime(start, person.timeZone)} - ${localDateTime(end, person.timeZone)}`)
    : ["- No people or locations added yet."];

  return [
    heading,
    `UTC: ${localDateTime(start, "UTC")} - ${localDateTime(end, "UTC")}`,
    `Duration: ${durationMinutes} minutes`,
    "Local times:",
    ...localTimes,
  ].join("\n");
}

export function createIcsEvent({ title, start, durationMinutes, description, uid, createdAt }: IcsEvent) {
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const summary = title.trim() || "AtlasTime meeting";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AtlasTime//Meeting Handoff//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${escapeIcs(uid)}`,
    `DTSTAMP:${utcDateTime(createdAt)}`,
    `DTSTART:${utcDateTime(start)}`,
    `DTEND:${utcDateTime(end)}`,
    `SUMMARY:${escapeIcs(summary)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
