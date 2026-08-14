import { renderToStaticMarkup } from "react-dom/server";
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { cityOptions } from "../cities";
import { CountryFlagBackdrop } from "./CountryFlagBackdrop";

describe("country flag backdrops", () => {
  it("maps every country currently supported by offline city search to its ISO flag class", () => {
    const supportedCountryCodes = [...new Set(cityOptions.map(({ countryCode }) => countryCode).filter(Boolean))];
    supportedCountryCodes.forEach((countryCode) => {
      const markup = renderToStaticMarkup(<CountryFlagBackdrop countryCode={countryCode} />);
      expect(markup).toContain(`data-country-code="${countryCode}"`);
      expect(markup).toContain(`/flags/4x3/${countryCode!.toLowerCase()}.svg`);
      expect(existsSync(new URL(`../../public/flags/4x3/${countryCode!.toLowerCase()}.svg`, import.meta.url))).toBe(true);
    });
  });

  it.each(["us", "KR", " za ", "SE", "NG", "EG"])("supports global ISO country code %s", (countryCode) => {
    const normalized = countryCode.trim().toLowerCase();
    expect(renderToStaticMarkup(<CountryFlagBackdrop countryCode={countryCode} />)).toContain(`/flags/4x3/${normalized}.svg`);
    expect(existsSync(new URL(`../../public/flags/4x3/${normalized}.svg`, import.meta.url))).toBe(true);
  });

  it("shows a neutral globe while country metadata is missing or malformed", () => {
    expect(renderToStaticMarkup(<CountryFlagBackdrop countryCode="Brazil" />)).toContain("country-flag-backdrop-fallback");
    expect(renderToStaticMarkup(<CountryFlagBackdrop countryCode="ZZ" />)).toContain("country-flag-backdrop-fallback");
    expect(renderToStaticMarkup(<CountryFlagBackdrop />)).toContain("country-flag-backdrop-fallback");
  });
});
