import { describe, expect, it } from "vitest";
import { draftsFromDeviceContacts, parseCsvContacts, parseVCardContacts } from "./contactImport";

function details<T extends { id: string }>(items: T[]) {
  return items.map(({ id: _id, ...item }) => item);
}

describe("contact imports", () => {
  it("reads UTF-8 vCards with optional email and address", () => {
    const result = parseVCardContacts([
      "BEGIN:VCARD",
      "VERSION:3.0",
      "FN:Ana García",
      "EMAIL;TYPE=INTERNET:ANA@example.com",
      "ADR;TYPE=HOME:;;Gran Via 1;Madrid;;28013;Spain",
      "END:VCARD",
      "BEGIN:VCARD",
      "VERSION:3.0",
      "N:Silva;João;;;",
      "END:VCARD",
    ].join("\r\n"));

    expect(details(result)).toEqual([
      { name: "Ana García", email: "ana@example.com", city: "Madrid", country: "Spain" },
      { name: "João Silva" },
    ]);
  });

  it("reads quoted CSV fields and common contact headers", () => {
    const result = parseCsvContacts([
      "Full Name,Email Address,City,Country",
      '"Doe, Jane",JANE@example.com,"New York",United States',
      "No Email,,Lisbon,Portugal",
    ].join("\n"));

    expect(details(result)).toEqual([
      { name: "Doe, Jane", email: "jane@example.com", city: "New York", country: "United States" },
      { name: "No Email", city: "Lisbon", country: "Portugal" },
    ]);
  });

  it("normalizes one-off device picker results and removes duplicate emails", () => {
    const result = draftsFromDeviceContacts([
      { name: ["Ana"], email: ["ana@example.com"], address: [{ city: "Madrid", country: "ES" }] },
      { name: ["Ana duplicate"], email: ["ANA@example.com"] },
      { name: ["Lee"], email: [] },
    ]);

    expect(details(result)).toEqual([
      { name: "Ana", email: "ana@example.com", city: "Madrid", country: "ES" },
      { name: "Lee" },
    ]);
  });
});

