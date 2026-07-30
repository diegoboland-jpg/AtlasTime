import { describe, expect, it } from "vitest";
import { availabilityRequestMessage, GOOGLE_CALENDAR_SHARING_HELP, smsAvailabilityUrl, whatsappAvailabilityUrl } from "./availabilityRequest";
import type { Person } from "./types";

const person: Person = {
  id: "ana",
  name: "Ana",
  phone: "+55 (11) 99999-0000",
  city: "São Paulo",
  timeZone: "America/Sao_Paulo",
  workStart: 9,
  workEnd: 18,
};

describe("availability request handoff", () => {
  it("asks only for busy/free sharing and links official provider instructions", () => {
    const message = availabilityRequestMessage(person);
    expect(message).toContain("busy/free");
    expect(message).toContain(GOOGLE_CALENDAR_SHARING_HELP);
    expect(message).toContain("without event titles or details");
  });

  it("prefills SMS and WhatsApp without automatically sending either message", () => {
    expect(smsAvailabilityUrl(person)).toMatch(/^sms:\+5511999990000\?body=/);
    expect(whatsappAvailabilityUrl(person)).toMatch(/^https:\/\/wa\.me\/5511999990000\?text=/);
  });
});
