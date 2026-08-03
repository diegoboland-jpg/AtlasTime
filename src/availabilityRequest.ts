import type { Person } from "./types";

export const GOOGLE_CALENDAR_SHARING_HELP = "https://support.google.com/calendar/answer/37082";

export function availabilityRequestMessage(person: Person, requestUrl = GOOGLE_CALENDAR_SHARING_HELP) {
  return [
    `Hi ${person.name}, I am planning a meeting with AtlasTime.`,
    "Would you share only your calendar availability (busy/free), without event titles or details?",
    `Private AtlasTime availability link: ${requestUrl}`,
    "Please share only if you are comfortable. You can change or revoke access in your calendar settings.",
  ].join("\n\n");
}

export function smsAvailabilityUrl(person: Person, requestUrl?: string) {
  const recipient = person.phone?.replace(/[^\d+]/g, "") ?? "";
  return `sms:${recipient}?body=${encodeURIComponent(availabilityRequestMessage(person, requestUrl))}`;
}

export function whatsappAvailabilityUrl(person: Person, requestUrl?: string) {
  const phone = person.phone?.replace(/\D/g, "") ?? "";
  const base = phone ? `https://wa.me/${phone}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(availabilityRequestMessage(person, requestUrl))}`;
}
