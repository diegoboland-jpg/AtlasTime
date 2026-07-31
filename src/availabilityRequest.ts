import type { Person } from "./types";

export const GOOGLE_CALENDAR_SHARING_HELP = "https://support.google.com/calendar/answer/37082";

export function availabilityRequestMessage(person: Person) {
  return [
    `Hi ${person.name}, I am planning a meeting with AtlasTime.`,
    "Would you share only your calendar availability (busy/free), without event titles or details?",
    `Google Calendar sharing instructions: ${GOOGLE_CALENDAR_SHARING_HELP}`,
    "Please share only if you are comfortable. You can change or revoke access in your calendar settings.",
  ].join("\n\n");
}

export function smsAvailabilityUrl(person: Person) {
  const recipient = person.phone?.replace(/[^\d+]/g, "") ?? "";
  return `sms:${recipient}?body=${encodeURIComponent(availabilityRequestMessage(person))}`;
}

export function whatsappAvailabilityUrl(person: Person) {
  const phone = person.phone?.replace(/\D/g, "") ?? "";
  const base = phone ? `https://wa.me/${phone}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(availabilityRequestMessage(person))}`;
}
