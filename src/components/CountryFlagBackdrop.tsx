import type { CSSProperties } from "react";
import { normalizeCountryCode } from "../countries";

type Props = {
  countryCode?: string;
};

export function CountryFlagBackdrop({ countryCode }: Props) {
  const normalized = normalizeCountryCode(countryCode);
  if (!normalized) {
    return <span className="country-flag-backdrop country-flag-backdrop-fallback" aria-hidden="true">&#127760;</span>;
  }
  return (
    <span
      className="country-flag-backdrop"
      aria-hidden="true"
      data-country-code={normalized}
      style={{ "--country-flag": `url("/flags/4x3/${normalized.toLowerCase()}.svg")` } as CSSProperties}
    />
  );
}
