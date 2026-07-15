import type { CityOption } from "../cities";

const DEFAULT_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";
const CACHE_KEY = "atlastime.geocoding-cache.v1";
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 40;

type OpenMeteoPlace = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  country?: string;
  admin1?: string;
};

type OpenMeteoResponse = {
  results?: OpenMeteoPlace[];
  error?: boolean;
  reason?: string;
};

type CacheEntry = {
  savedAt: number;
  results: CityOption[];
};

type SearchCache = Record<string, CacheEntry>;

function readCache(): SearchCache {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}") as SearchCache;
  } catch {
    return {};
  }
}

function writeCache(queryKey: string, results: CityOption[]) {
  try {
    const cache = readCache();
    cache[queryKey] = { savedAt: Date.now(), results };
    const trimmed = Object.fromEntries(
      Object.entries(cache)
        .sort(([, a], [, b]) => b.savedAt - a.savedAt)
        .slice(0, MAX_CACHE_ENTRIES),
    );
    localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
  } catch {
    // Search still works when storage is unavailable or full.
  }
}

function resultLabel(place: OpenMeteoPlace) {
  const parts = [place.name];
  if (place.admin1 && place.admin1 !== place.name) parts.push(place.admin1);
  if (place.country && place.country !== place.admin1) parts.push(place.country);
  return parts.join(", ");
}

export async function searchGlobalCities(query: string, signal?: AbortSignal): Promise<CityOption[]> {
  const language = (navigator.language || "en").split("-")[0].toLowerCase();
  const normalized = query.trim().toLocaleLowerCase();
  const queryKey = `${language}:${normalized}`;
  const cached = readCache()[queryKey];

  if (cached && Date.now() - cached.savedAt < CACHE_TTL) return cached.results;

  const endpoint = import.meta.env.VITE_GEOCODING_API_URL || DEFAULT_ENDPOINT;
  const url = new URL(endpoint);
  url.searchParams.set("name", query.trim());
  url.searchParams.set("count", "10");
  url.searchParams.set("language", language);
  url.searchParams.set("format", "json");

  const apiKey = import.meta.env.VITE_GEOCODING_API_KEY;
  if (apiKey) url.searchParams.set("apikey", apiKey);

  const response = await fetch(url, { signal });
  const payload = await response.json() as OpenMeteoResponse;
  if (!response.ok || payload.error) {
    throw new Error(payload.reason || `City search failed (${response.status})`);
  }

  const results = (payload.results ?? [])
    .filter((place): place is OpenMeteoPlace & { timezone: string } => Boolean(place.timezone))
    .map((place) => ({
      id: `open-meteo:${place.id}`,
      label: resultLabel(place),
      city: place.name,
      country: place.country ?? "",
      timeZone: place.timezone,
      latitude: place.latitude,
      longitude: place.longitude,
    }));

  writeCache(queryKey, results);
  return results;
}
