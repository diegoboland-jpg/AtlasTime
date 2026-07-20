import { describe, expect, it } from "vitest";
import { getCityByPlace } from "./cities";

describe("trusted known-place metadata", () => {
  it.each([
    ["Granada", "Europe/Madrid", "ES"],
    ["Manila", "Asia/Manila", "PH"],
    ["Kochi", "Asia/Kolkata", "IN"],
    ["Buenos aires", "America/Argentina/Buenos_Aires", "AR"],
  ])("matches %s only with its expected timezone", (city, timeZone, countryCode) => {
    expect(getCityByPlace(city, timeZone)?.countryCode).toBe(countryCode);
  });

  it("does not infer a country from a timezone alone", () => {
    expect(getCityByPlace("Unlisted place", "Europe/Madrid")).toBeUndefined();
  });
});
