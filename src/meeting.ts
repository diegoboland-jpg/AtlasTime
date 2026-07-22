import type { Person } from "./types";

type IcsEvent = {
  title: string;
  start: Date;
  durationMinutes: number;
  description: string;
  location?: string;
  uid: string;
  createdAt: Date;
  allDay?: boolean;
  date?: string;
};

type MeetingDetails = {
  location?: string;
  notes?: string;
  allDay?: boolean;
  date?: string;
};

type CalendarLinkEvent = {
  title: string;
  start: Date;
  durationMinutes: number;
  description: string;
  location?: string;
  allDay?: boolean;
  date?: string;
};

export type MeetingShareData = {
  title: string;
  text: string;
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

function eventEnd(start: Date, durationMinutes: number) {
  return new Date(start.getTime() + durationMinutes * 60_000);
}

function validDate(value?: string) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function nextDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function compactDate(value: string) {
  return value.replaceAll("-", "");
}

function readableDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, day)));
}

export function durationLabel(durationMinutes: number) {
  if (durationMinutes < 60) return `${durationMinutes} min`;
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  const hourLabel = `${hours} ${hours === 1 ? "hour" : "hours"}`;
  return minutes ? `${hourLabel} ${minutes} min` : hourLabel;
}

function escapeIcs(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

export function meetingSummary(title: string, start: Date, durationMinutes: number, people: Person[], details: MeetingDetails = {}) {
  const allDayDate = details.allDay ? validDate(details.date) : null;
  const end = eventEnd(start, durationMinutes);
  const heading = title.trim() || "AtlasTime meeting";
  const location = details.location?.trim();
  const notes = details.notes?.trim();
  const localTimes = allDayDate
    ? (people.length
      ? people.map((person) => `- ${person.name} (${person.city || person.timeZone}): ${readableDate(allDayDate)}, all day`)
      : ["- No people or locations added yet."])
    : people.length
    ? people.map((person) => `- ${person.name} (${person.city || person.timeZone}): ${localDateTime(start, person.timeZone)} - ${localDateTime(end, person.timeZone)}`)
    : ["- No people or locations added yet."];

  return [
    heading,
    ...(allDayDate
      ? [`Date: ${readableDate(allDayDate)} (all day)`]
      : [`UTC: ${localDateTime(start, "UTC")} - ${localDateTime(end, "UTC")}`, `Duration: ${durationLabel(durationMinutes)}`]),
    ...(location ? [`Location: ${location}`] : []),
    ...(notes ? [`Notes: ${notes}`] : []),
    allDayDate ? "Participant dates:" : "Local times:",
    ...localTimes,
  ].join("\n");
}

export function createMeetingShareData(title: string, summary: string): MeetingShareData {
  return {
    title: title.trim() || "AtlasTime meeting",
    text: summary,
  };
}

export function createIcsEvent({ title, start, durationMinutes, description, location, uid, createdAt, allDay, date }: IcsEvent) {
  const allDayDate = allDay ? validDate(date) : null;
  const end = eventEnd(start, durationMinutes);
  const summary = title.trim() || "AtlasTime meeting";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AtlasTime//Meeting Handoff//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${escapeIcs(uid)}`,
    `DTSTAMP:${utcDateTime(createdAt)}`,
    ...(allDayDate
      ? [`DTSTART;VALUE=DATE:${compactDate(allDayDate)}`, `DTEND;VALUE=DATE:${compactDate(nextDate(allDayDate))}`]
      : [`DTSTART:${utcDateTime(start)}`, `DTEND:${utcDateTime(end)}`]),
    `SUMMARY:${escapeIcs(summary)}`,
    ...(location?.trim() ? [`LOCATION:${escapeIcs(location.trim())}`] : []),
    `DESCRIPTION:${escapeIcs(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function createGoogleCalendarUrl({ title, start, durationMinutes, description, location, allDay, date }: CalendarLinkEvent) {
  const allDayDate = allDay ? validDate(date) : null;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    dates: allDayDate
      ? `${compactDate(allDayDate)}/${compactDate(nextDate(allDayDate))}`
      : `${utcDateTime(start)}/${utcDateTime(eventEnd(start, durationMinutes))}`,
    text: title.trim() || "AtlasTime meeting",
    details: description,
  });
  if (location?.trim()) params.set("location", location.trim());
  return `https://calendar.google.com/calendar/r/eventedit?${params}`;
}

export function createOutlookCalendarUrl({ title, start, durationMinutes, description, location, allDay, date }: CalendarLinkEvent) {
  const allDayDate = allDay ? validDate(date) : null;
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    startdt: allDayDate ?? start.toISOString(),
    enddt: allDayDate ? nextDate(allDayDate) : eventEnd(start, durationMinutes).toISOString(),
    subject: title.trim() || "AtlasTime meeting",
    body: description,
  });
  if (allDayDate) params.set("allday", "true");
  if (location?.trim()) params.set("location", location.trim());
  return `https://outlook.office.com/calendar/deeplink/compose?${params}`;
}
