import type { CityOption } from "./cities";

type TimeZoneAliasChoice = {
  aliases: string[];
  name: string;
  place: string;
  country: string;
  countryCode?: string;
  timeZone: string;
};

const choices: TimeZoneAliasChoice[] = [
  { aliases: ["UTC"], name: "Coordinated Universal Time", place: "UTC", country: "", timeZone: "Etc/UTC" },
  { aliases: ["GMT"], name: "Greenwich Mean Time", place: "Reykjavik", country: "Iceland", countryCode: "IS", timeZone: "Atlantic/Reykjavik" },
  { aliases: ["ET", "EST", "EDT"], name: "Eastern Time", place: "New York", country: "United States", countryCode: "US", timeZone: "America/New_York" },
  { aliases: ["EST"], name: "Eastern Standard Time", place: "Kingston", country: "Jamaica", countryCode: "JM", timeZone: "America/Jamaica" },
  { aliases: ["CT", "CST", "CDT"], name: "Central Time", place: "Chicago", country: "United States", countryCode: "US", timeZone: "America/Chicago" },
  { aliases: ["CST"], name: "China Standard Time", place: "Shanghai", country: "China", countryCode: "CN", timeZone: "Asia/Shanghai" },
  { aliases: ["CST"], name: "Cuba Standard Time", place: "Havana", country: "Cuba", countryCode: "CU", timeZone: "America/Havana" },
  { aliases: ["MT", "MST", "MDT"], name: "Mountain Time", place: "Denver", country: "United States", countryCode: "US", timeZone: "America/Denver" },
  { aliases: ["MST"], name: "Mountain Standard Time (no daylight saving)", place: "Phoenix", country: "United States", countryCode: "US", timeZone: "America/Phoenix" },
  { aliases: ["PT", "PST", "PDT"], name: "Pacific Time", place: "Los Angeles", country: "United States", countryCode: "US", timeZone: "America/Los_Angeles" },
  { aliases: ["IST"], name: "India Standard Time", place: "Kolkata", country: "India", countryCode: "IN", timeZone: "Asia/Kolkata" },
  { aliases: ["IST"], name: "Irish Standard Time", place: "Dublin", country: "Ireland", countryCode: "IE", timeZone: "Europe/Dublin" },
  { aliases: ["IST"], name: "Israel Standard Time", place: "Jerusalem", country: "Israel", countryCode: "IL", timeZone: "Asia/Jerusalem" },
  { aliases: ["BST"], name: "British Summer Time", place: "London", country: "United Kingdom", countryCode: "GB", timeZone: "Europe/London" },
  { aliases: ["BST"], name: "Bangladesh Standard Time", place: "Dhaka", country: "Bangladesh", countryCode: "BD", timeZone: "Asia/Dhaka" },
  { aliases: ["BST"], name: "Bougainville Standard Time", place: "Bougainville", country: "Papua New Guinea", countryCode: "PG", timeZone: "Pacific/Bougainville" },
  { aliases: ["AST"], name: "Atlantic Time", place: "Halifax", country: "Canada", countryCode: "CA", timeZone: "America/Halifax" },
  { aliases: ["AST"], name: "Arabia Standard Time", place: "Riyadh", country: "Saudi Arabia", countryCode: "SA", timeZone: "Asia/Riyadh" },
  { aliases: ["GST"], name: "Gulf Standard Time", place: "Dubai", country: "United Arab Emirates", countryCode: "AE", timeZone: "Asia/Dubai" },
  { aliases: ["GST"], name: "South Georgia Time", place: "South Georgia", country: "South Georgia and the South Sandwich Islands", countryCode: "GS", timeZone: "Atlantic/South_Georgia" },
  { aliases: ["CET", "CEST"], name: "Central European Time", place: "Paris", country: "France", countryCode: "FR", timeZone: "Europe/Paris" },
  { aliases: ["EET", "EEST"], name: "Eastern European Time", place: "Helsinki", country: "Finland", countryCode: "FI", timeZone: "Europe/Helsinki" },
  { aliases: ["WET", "WEST"], name: "Western European Time", place: "Lisbon", country: "Portugal", countryCode: "PT", timeZone: "Europe/Lisbon" },
  { aliases: ["BRT"], name: "Brasilia Time", place: "Sao Paulo", country: "Brazil", countryCode: "BR", timeZone: "America/Sao_Paulo" },
  { aliases: ["ART"], name: "Argentina Time", place: "Buenos Aires", country: "Argentina", countryCode: "AR", timeZone: "America/Argentina/Buenos_Aires" },
  { aliases: ["CLT", "CLST"], name: "Chile Time", place: "Santiago", country: "Chile", countryCode: "CL", timeZone: "America/Santiago" },
  { aliases: ["SGT"], name: "Singapore Time", place: "Singapore", country: "Singapore", countryCode: "SG", timeZone: "Asia/Singapore" },
  { aliases: ["JST"], name: "Japan Standard Time", place: "Tokyo", country: "Japan", countryCode: "JP", timeZone: "Asia/Tokyo" },
  { aliases: ["KST"], name: "Korea Standard Time", place: "Seoul", country: "South Korea", countryCode: "KR", timeZone: "Asia/Seoul" },
  { aliases: ["PHT"], name: "Philippine Time", place: "Manila", country: "Philippines", countryCode: "PH", timeZone: "Asia/Manila" },
  { aliases: ["PKT"], name: "Pakistan Standard Time", place: "Karachi", country: "Pakistan", countryCode: "PK", timeZone: "Asia/Karachi" },
  { aliases: ["AEST", "AEDT"], name: "Australian Eastern Time", place: "Sydney", country: "Australia", countryCode: "AU", timeZone: "Australia/Sydney" },
  { aliases: ["NZST", "NZDT"], name: "New Zealand Time", place: "Auckland", country: "New Zealand", countryCode: "NZ", timeZone: "Pacific/Auckland" },
  { aliases: ["MSK"], name: "Moscow Time", place: "Moscow", country: "Russia", countryCode: "RU", timeZone: "Europe/Moscow" },
  { aliases: ["EAT"], name: "East Africa Time", place: "Nairobi", country: "Kenya", countryCode: "KE", timeZone: "Africa/Nairobi" },
  { aliases: ["CAT"], name: "Central Africa Time", place: "Harare", country: "Zimbabwe", countryCode: "ZW", timeZone: "Africa/Harare" },
  { aliases: ["SAST"], name: "South Africa Standard Time", place: "Johannesburg", country: "South Africa", countryCode: "ZA", timeZone: "Africa/Johannesburg" },
  { aliases: ["WAT"], name: "West Africa Time", place: "Lagos", country: "Nigeria", countryCode: "NG", timeZone: "Africa/Lagos" },
];

export function currentUtcOffset(timeZone: string, date = new Date()) {
  const part = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  }).formatToParts(date).find(({ type }) => type === "timeZoneName")?.value ?? "GMT";
  return part.replace("GMT", "UTC").replace("UTC+00:00", "UTC");
}

export function searchTimeZoneAliases(query: string, date = new Date()): CityOption[] {
  const abbreviation = query.trim().toLocaleUpperCase();
  if (!/^[A-Z]{2,5}$/.test(abbreviation)) return [];

  return choices
    .filter((choice) => choice.aliases.includes(abbreviation))
    .map((choice) => ({
      id: `timezone-alias:${abbreviation}:${choice.timeZone}`,
      label: `${abbreviation} — ${choice.name} (${choice.country || "Global"})`,
      city: choice.place,
      country: choice.country,
      countryCode: choice.countryCode,
      timeZone: choice.timeZone,
      source: "timezone-alias" as const,
      abbreviation,
      detail: `${currentUtcOffset(choice.timeZone, date)} · ${choice.place} · ${choice.timeZone.replaceAll("_", " ")}`,
    }));
}
