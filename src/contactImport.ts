import { createId } from "./id";
import { normalizeEmail } from "./contacts";

export type ContactImportDraft = {
  id: string;
  name: string;
  email?: string;
  city?: string;
  country?: string;
};

function unescapeVCard(value: string) {
  return value
    .replaceAll("\\n", " ")
    .replaceAll("\\,", ",")
    .replaceAll("\\;", ";")
    .replaceAll("\\\\", "\\")
    .trim();
}

function makeDraft(name: string, email?: string, city?: string, country?: string): ContactImportDraft | null {
  const normalizedName = name.trim().slice(0, 120);
  if (!normalizedName) return null;
  const validEmail = normalizeEmail(email);
  return {
    id: createId(),
    name: normalizedName,
    ...(validEmail ? { email: validEmail } : {}),
    ...(city?.trim() ? { city: city.trim().slice(0, 120) } : {}),
    ...(country?.trim() ? { country: country.trim().slice(0, 80) } : {}),
  };
}

function dedupe(drafts: ContactImportDraft[]) {
  const seen = new Set<string>();
  return drafts.filter((draft) => {
    const key = draft.email ?? `${draft.name.toLocaleLowerCase()}|${draft.city?.toLocaleLowerCase() ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function parseVCardContacts(value: string) {
  const unfolded = value.replace(/\r?\n[ \t]/g, "");
  const cards = unfolded.match(/BEGIN:VCARD[\s\S]*?END:VCARD/gi) ?? [];
  return dedupe(cards.flatMap((card) => {
    const lines = card.split(/\r?\n/);
    const field = (name: string) => lines.find((line) => line.toUpperCase().startsWith(`${name}:`) || line.toUpperCase().startsWith(`${name};`));
    const valueOf = (line?: string) => line ? unescapeVCard(line.slice(line.indexOf(":") + 1)) : "";
    const name = valueOf(field("FN")) || valueOf(field("N")).split(";").filter(Boolean).reverse().join(" ");
    const email = valueOf(field("EMAIL"));
    const address = valueOf(field("ADR")).split(";");
    const draft = makeDraft(name, email, address[3], address[6]);
    return draft ? [draft] : [];
  }));
}

function parseCsvRows(value: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === '"') {
      if (quoted && value[index + 1] === '"') {
        field += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && value[index + 1] === "\n") index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else field += character;
  }
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function parseCsvContacts(value: string) {
  const [headerRow = [], ...rows] = parseCsvRows(value.replace(/^\uFEFF/, ""));
  const headers = headerRow.map((header) => header.toLocaleLowerCase().replaceAll(/[^a-z0-9]/g, ""));
  const indexOf = (...names: string[]) => headers.findIndex((header) => names.includes(header));
  const nameIndex = indexOf("name", "fullname", "displayname");
  const firstNameIndex = indexOf("firstname", "givenname");
  const lastNameIndex = indexOf("lastname", "surname", "familyname");
  const emailIndex = indexOf("email", "emailaddress", "email1value");
  const cityIndex = indexOf("city", "locality", "addresscity");
  const countryIndex = indexOf("country", "addresscountry");

  return dedupe(rows.flatMap((row) => {
    const name = nameIndex >= 0
      ? row[nameIndex] ?? ""
      : [row[firstNameIndex] ?? "", row[lastNameIndex] ?? ""].filter(Boolean).join(" ");
    const draft = makeDraft(name, row[emailIndex], row[cityIndex], row[countryIndex]);
    return draft ? [draft] : [];
  }));
}

export function draftsFromDeviceContacts(contacts: Array<{ name?: string[]; email?: string[]; address?: Array<{ city?: string; country?: string }> }>) {
  return dedupe(contacts.flatMap((contact) => {
    const address = contact.address?.[0];
    const draft = makeDraft(contact.name?.[0] ?? "", contact.email?.[0], address?.city, address?.country);
    return draft ? [draft] : [];
  }));
}

