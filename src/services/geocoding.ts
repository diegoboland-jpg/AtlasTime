import type { CityOption } from "../cities";

const DEFAULT_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";
const CACHE_KEY = "atlastime.geocoding-cache.v1";
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
const OFFLINE_FALLBACK_TTL = 30 * 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 40;

type OpenMeteoPlace = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  country?: string;
  country_code?: string;
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

function offlineMatches(cache: SearchCache, normalized: string): CityOption[] {
  const now = Date.now();
  const seen = new Set<string>();
  return Object.values(cache)
    .filter((entry) => now - entry.savedAt < OFFLINE_FALLBACK_TTL)
    .sort((a, b) => b.savedAt - a.savedAt)
    .flatMap((entry) => entry.results)
    .filter((place) => {
      const searchable = `${place.label} ${place.city} ${place.country} ${place.timeZone}`.toLocaleLowerCase();
      const identity = place.id ?? `${place.label}:${place.timeZone}`;
      if (!searchable.includes(normalized) || seen.has(identity)) return false;
      seen.add(identity);
      return true;
    })
    .slice(0, 10)
    .map((place) => ({ ...place, source: "offline" as const }));
}

export async function searchGlobalCities(query: string, signal?: AbortSignal): Promise<CityOption[]> {
  const language = (navigator.language || "en").split("-")[0].toLowerCase();
  const normalized = query.trim().toLocaleLowerCase();
  const queryKey = `${language}:${normalized}`;
  const cache = readCache();
  const cached = cache[queryKey];

  if (cached && Date.now() - cached.savedAt < CACHE_TTL) {
    return cached.results.map((place) => ({ ...place, source: "cache" }));
  }

  const endpoint = import.meta.env.VITE_GEOCODING_API_URL || DEFAULT_ENDPOINT;
  const url = new URL(endpoint);
  url.searchParams.set("name", query.trim());
  url.searchParams.set("count", "10");
  url.searchParams.set("language", language);
  url.searchParams.set("format", "json");

  const apiKey = import.meta.env.VITE_GEOCODING_API_KEY;
  if (apiKey) url.searchParams.set("apikey", apiKey);

  try {
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
        countryCode: /^[A-Z]{2}$/i.test(place.country_code ?? "") ? place.country_code!.toUpperCase() : undefined,
        timeZone: place.timezone,
        latitude: place.latitude,
        longitude: place.longitude,
        source: "network" as const,
      }));

    writeCache(queryKey, results);
    return results;
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    const fallback = offlineMatches(cache, normalized);
    if (fallback.length) return fallback;
    throw error;
  }
}
