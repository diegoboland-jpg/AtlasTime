import type { AvailabilityByPerson, HourScore, Person, PersonAvailability } from "./types";

export const timeZones = [
  "America/Sao_Paulo",
  "America/Argentina/Buenos_Aires",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export function formatInZone(date: Date, timeZone: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...options,
  }).format(date);
}

const namedTimeZones: Record<string, Record<string, string>> = {
  "America/Sao_Paulo": { "GMT-3": "BRT" },
  "America/Argentina/Buenos_Aires": { "GMT-3": "ART" },
  "Europe/London": { GMT: "GMT", "GMT+1": "BST" },
  "Europe/Madrid": { "GMT+1": "CET", "GMT+2": "CEST" },
  "Europe/Paris": { "GMT+1": "CET", "GMT+2": "CEST" },
  "Europe/Berlin": { "GMT+1": "CET", "GMT+2": "CEST" },
  "Europe/Rome": { "GMT+1": "CET", "GMT+2": "CEST" },
  "Europe/Moscow": { "GMT+3": "MSK" },
  "Asia/Dubai": { "GMT+4": "GST" },
  "Asia/Kolkata": { "GMT+5:30": "IST" },
  "Asia/Singapore": { "GMT+8": "SGT" },
  "Asia/Tokyo": { "GMT+9": "JST" },
  "Australia/Sydney": { "GMT+10": "AEST", "GMT+11": "AEDT" },
  "Pacific/Auckland": { "GMT+12": "NZST", "GMT+13": "NZDT" },
};

export function timeZoneAbbreviation(date: Date, timeZone: string) {
  const abbreviation = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "short",
  }).formatToParts(date).find((part) => part.type === "timeZoneName")?.value ?? "UTC";
  return namedTimeZones[timeZone]?.[abbreviation] ?? abbreviation.replace("GMT", "UTC");
}

export function hourInZone(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  return Number(parts.find((part) => part.type === "hour")?.value ?? 0);
}

function minuteInZone(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

export function dateAtUtcHour(dateValue: string, utcHour: number): Date {
  const [year, month, day] = dateValue.split("-").map(Number);
  const wholeHour = Math.floor(utcHour);
  const minutes = Math.round((utcHour - wholeHour) * 60);
  return new Date(Date.UTC(year, month - 1, day, wholeHour, minutes, 0));
}

export function formatUtcHour(utcHour: number) {
  const wholeHour = Math.floor(utcHour);
  const minutes = Math.round((utcHour - wholeHour) * 60);
  return `${String(wholeHour).padStart(2, "0")}:${String(minutes).padStart(2, "0")} UTC`;
}

function workingAtInstant(person: Person, instant: Date) {
  const localMinute = minuteInZone(instant, person.timeZone);
  return localMinute >= person.workStart * 60 && localMinute < person.workEnd * 60;
}

export function meetingFitsWorkingHours(person: Person, start: Date, durationMinutes: number) {
  const offsets = Array.from({ length: Math.ceil(durationMinutes / 15) }, (_, index) => index * 15);
  offsets.push(Math.max(0, durationMinutes - 1));
  for (const offset of new Set(offsets)) {
    if (!workingAtInstant(person, new Date(start.getTime() + offset * 60_000))) return false;
  }
  return true;
}

function discomfortAtInstant(person: Person, instant: Date) {
  const localHour = hourInZone(instant, person.timeZone);
  if (localHour >= person.workStart && localHour < person.workEnd) return 0;
  const distance = localHour < person.workStart
    ? person.workStart - localHour
    : localHour - person.workEnd + 1;
  return 2 + distance + (localHour < 7 || localHour >= 21 ? 5 : 0);
}

export function meetingConflictsWithBusy(start: Date, durationMinutes: number, availability?: PersonAvailability) {
  if (!availability || availability.status !== "shared") return false;
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const windowStart = new Date(availability.timeMin);
  const windowEnd = new Date(availability.timeMax);
  if (!Number.isFinite(windowStart.getTime()) || !Number.isFinite(windowEnd.getTime())) return false;
  if (start < windowStart || end > windowEnd) return false;
  return availability.busy.some((period) => {
    const busyStart = new Date(period.start);
    const busyEnd = new Date(period.end);
    return Number.isFinite(busyStart.getTime()) && Number.isFinite(busyEnd.getTime()) && start < busyEnd && end > busyStart;
  });
}

export function scoreAtUtcHour(
  people: Person[],
  dateValue: string,
  utcHour: number,
  durationMinutes = 60,
  availabilityByPerson: AvailabilityByPerson = {},
): HourScore {
  const instant = dateAtUtcHour(dateValue, utcHour);
  let available = 0;
  let calendarConflicts = 0;
  const penalty = people.reduce((totalPenalty, person) => {
    const calendarConflict = meetingConflictsWithBusy(
      instant,
      durationMinutes,
      availabilityByPerson[person.contactId ?? person.id],
    );
    if (calendarConflict) calendarConflicts += 1;
    if (meetingFitsWorkingHours(person, instant, durationMinutes)) {
      if (!calendarConflict) available += 1;
      return totalPenalty + (calendarConflict ? 24 : 0);
    }
    let worstDiscomfort = 0;
    const offsets = Array.from({ length: Math.ceil(durationMinutes / 15) }, (_, index) => index * 15);
    offsets.push(Math.max(0, durationMinutes - 1));
    for (const offset of new Set(offsets)) {
      worstDiscomfort = Math.max(
        worstDiscomfort,
        discomfortAtInstant(person, new Date(instant.getTime() + offset * 60_000)),
      );
    }
    return totalPenalty + Math.max(2, worstDiscomfort) + (calendarConflict ? 24 : 0);
  }, 0);

  return { utcHour, available, total: people.length, penalty, score: available * 12 - penalty, calendarConflicts };
}

export function scoreHours(people: Person[], dateValue: string, durationMinutes = 60, availabilityByPerson: AvailabilityByPerson = {}): HourScore[] {
  return Array.from({ length: 48 }, (_, index) => scoreAtUtcHour(people, dateValue, index / 2, durationMinutes, availabilityByPerson));
}

export function bestHour(people: Person[], dateValue: string, durationMinutes = 60, availabilityByPerson: AvailabilityByPerson = {}): HourScore | null {
  if (!people.length) return null;
  return scoreHours(people, dateValue, durationMinutes, availabilityByPerson).sort(
    (a, b) =>
      b.score - a.score ||
      b.available - a.available ||
      a.penalty - b.penalty ||
      Math.abs(a.utcHour - 15) - Math.abs(b.utcHour - 15),
  )[0];
}

export function localRangeLabel(dateValue: string, utcHour: number, durationMinutes: number, person: Person) {
  const start = dateAtUtcHour(dateValue, utcHour);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const options: Intl.DateTimeFormatOptions = { weekday: "short", day: "2-digit", month: "short" };
  return `${formatInZone(start, person.timeZone, options)} – ${formatInZone(end, person.timeZone, options)}`;
}

export function durationBetweenUtcTimes(startHour: number, finishHour: number) {
  const startMinutes = Math.round(startHour * 60) % (24 * 60);
  const finishMinutes = Math.round(finishHour * 60) % (24 * 60);
  const sameDayDifference = finishMinutes - startMinutes;
  return sameDayDifference > 0 ? sameDayDifference : sameDayDifference + 24 * 60;
}

export function localLabel(dateValue: string, utcHour: number, person: Person) {
  return formatInZone(dateAtUtcHour(dateValue, utcHour), person.timeZone, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}
