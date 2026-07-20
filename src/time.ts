import type { HourScore, Person } from "./types";

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

export function hourInZone(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  return Number(parts.find((part) => part.type === "hour")?.value ?? 0);
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

export function scoreAtUtcHour(people: Person[], dateValue: string, utcHour: number): HourScore {
  const instant = dateAtUtcHour(dateValue, utcHour);
  let available = 0;
  const penalty = people.reduce((totalPenalty, person) => {
    const localHour = hourInZone(instant, person.timeZone);
    const working = localHour >= person.workStart && localHour < person.workEnd;

    if (working) {
      available += 1;
      return totalPenalty;
    }

    const distance = localHour < person.workStart
      ? person.workStart - localHour
      : localHour - person.workEnd + 1;
    const extremePenalty = localHour < 7 || localHour >= 21 ? 5 : 0;
    return totalPenalty + 2 + distance + extremePenalty;
  }, 0);

  return { utcHour, available, total: people.length, penalty, score: available * 12 - penalty };
}

export function scoreHours(people: Person[], dateValue: string): HourScore[] {
  return Array.from({ length: 24 }, (_, utcHour) => scoreAtUtcHour(people, dateValue, utcHour));
}

export function bestHour(people: Person[], dateValue: string): HourScore | null {
  if (!people.length) return null;
  return scoreHours(people, dateValue).sort(
    (a, b) =>
      b.score - a.score ||
      b.available - a.available ||
      a.penalty - b.penalty ||
      Math.abs(a.utcHour - 15) - Math.abs(b.utcHour - 15),
  )[0];
}

export function localLabel(dateValue: string, utcHour: number, person: Person) {
  return formatInZone(dateAtUtcHour(dateValue, utcHour), person.timeZone, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}
