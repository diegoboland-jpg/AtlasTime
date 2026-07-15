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
  it("reuses a fresh exact-query cache entry", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(response());

    const first = await searchGlobalCities("Curitiba");
    const second = await searchGlobalCities("Curitiba");

    expect(first[0]).toMatchObject({ city: "Curitiba", timeZone: "America/Sao_Paulo", source: "network" });
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

  it("preserves the error when no saved place matches", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("offline"));
    await expect(searchGlobalCities("Reykjavik")).rejects.toThrow("offline");
  });
});
