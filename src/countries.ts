const ISO_REGION_CODES = `AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW`.split(" ");

const englishNames = new Intl.DisplayNames(["en"], { type: "region" });
const spanishNames = new Intl.DisplayNames(["es"], { type: "region" });

function normalizedName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
}

export const countryOptions = ISO_REGION_CODES.map((code) => ({
  code,
  name: englishNames.of(code) ?? code,
})).sort((left, right) => left.name.localeCompare(right.name, "en"));

const countryNameIndex = new Map<string, string>();
countryOptions.forEach(({ code, name }) => {
  countryNameIndex.set(normalizedName(name), code);
  const spanishName = spanishNames.of(code);
  if (spanishName) countryNameIndex.set(normalizedName(spanishName), code);
});
[
  ["USA", "US"], ["United States of America", "US"], ["UK", "GB"],
  ["South Korea", "KR"], ["North Korea", "KP"], ["Russia", "RU"],
  ["Bolivia", "BO"], ["Venezuela", "VE"], ["Tanzania", "TZ"],
].forEach(([name, code]) => countryNameIndex.set(normalizedName(name), code));

export function normalizeCountryCode(value?: string) {
  const normalized = value?.trim().toUpperCase() ?? "";
  return ISO_REGION_CODES.includes(normalized) ? normalized : undefined;
}

export function countryCodeFromName(value?: string) {
  const raw = value?.trim() ?? "";
  if (!raw) return undefined;
  return normalizeCountryCode(raw) ?? countryNameIndex.get(normalizedName(raw));
}

export function countryNameFromCode(value?: string) {
  const code = normalizeCountryCode(value);
  return code ? (englishNames.of(code) ?? code) : undefined;
}
