// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { searchGlobalCities } from "./geocoding";

const curitibaResponse = {
  results: [{
    id: 3464975,
    name: "Curitiba",
    latitude: -25.43,
    longitude: -49.27,
    timezone: "America/Sao_Paulo",
    country: "Brazil",
    country_code: "BR",
    admin1: "Paraná",
  }],
};

function response(payload = curitibaResponse) {
  return { ok: true, status: 200, json: vi.fn().mockResolvedValue(payload) } as unknown as Response;
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("global city search cache", () => {
  it("resolves exact corporate abbreviations locally without sending them to the provider", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    const matches = await searchGlobalCities("IST");

    expect(matches).toHaveLength(3);
    expect(matches.map(({ timeZone }) => timeZone)).toEqual(["Asia/Kolkata", "Europe/Dublin", "Asia/Jerusalem"]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reuses a fresh exact-query cache entry", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(response());

    const first = await searchGlobalCities("Curitiba");
    const second = await searchGlobalCities("Curitiba");

    expect(first[0]).toMatchObject({ city: "Curitiba", country: "Brazil", countryCode: "BR", timeZone: "America/Sao_Paulo", source: "network" });
    expect(second[0]).toMatchObject({ city: "Curitiba", source: "cache" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns matching recent places when the network fails", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(response());
    await searchGlobalCities("Curitiba");
    fetchMock.mockRejectedValueOnce(new TypeError("offline"));

    const fallback = await searchGlobalCities("Curi");

    expect(fallback).toHaveLength(1);
    expect(fallback[0]).toMatchObject({ city: "Curitiba", source: "offline" });
  });

  it("recovers a missing country code from the provider's country name", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(response({
      results: [{
        id: 264371,
        name: "Reykjavik",
        latitude: 64.15,
        longitude: -21.94,
        timezone: "Atlantic/Reykjavik",
        country: "Iceland",
      }],
    }));

    await expect(searchGlobalCities("Reykjavik")).resolves.toEqual([
      expect.objectContaining({ city: "Reykjavik", countryCode: "IS", timeZone: "Atlantic/Reykjavik" }),
    ]);
  });

  it("preserves the error when no saved place matches", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("offline"));
    await expect(searchGlobalCities("Reykjavik")).rejects.toThrow("offline");
  });
});
