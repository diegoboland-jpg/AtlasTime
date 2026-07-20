export function countryCodeToFlag(countryCode?: string) {
  const normalized = countryCode?.trim().toUpperCase() ?? "";
  if (!/^[A-Z]{2}$/.test(normalized)) return null;
  return String.fromCodePoint(...[...normalized].map((letter) => 127397 + letter.charCodeAt(0)));
}
