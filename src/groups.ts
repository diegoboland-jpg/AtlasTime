import { starterPeople } from "./data";
import { createId } from "./id";
import type { Person, PlannerState, SavedGroup, SharedGroupPayload } from "./types";

const GROUPS_STORAGE_KEY = "atlastime.groups.v1";
const ACTIVE_GROUP_STORAGE_KEY = "atlastime.active-group.v1";
const LEGACY_PEOPLE_STORAGE_KEY = "atlastime.people.v1";
const LEGACY_PLANNER_STORAGE_KEY = "atlastime.planner.v1";
const SHARE_PREFIX = "#share=";
const MAX_SHARED_PEOPLE = 30;
const ALLOWED_DURATIONS = [30, 45, 60, 90, 120];

function localDateInput() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

export function defaultPlanner(): PlannerState {
  return { date: localDateInput(), hour: 12, title: "", durationMinutes: 60 };
}

function safePlanner(value: unknown): PlannerState {
  const candidate = value as Partial<PlannerState> | null;
  return {
    date: typeof candidate?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(candidate.date)
      ? candidate.date
      : localDateInput(),
    hour: Number.isInteger(candidate?.hour) && candidate!.hour! >= 0 && candidate!.hour! <= 23
      ? candidate!.hour!
      : 12,
    title: typeof candidate?.title === "string" ? candidate.title.trim().slice(0, 120) : "",
    durationMinutes: typeof candidate?.durationMinutes === "number" && ALLOWED_DURATIONS.includes(candidate.durationMinutes)
      ? candidate.durationMinutes
      : 60,
  };
}

function safePeople(value: unknown): Person[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_SHARED_PEOPLE).filter((person): person is Person => {
    const candidate = person as Partial<Person>;
    return typeof candidate.id === "string"
      && typeof candidate.name === "string"
      && typeof candidate.city === "string"
      && typeof candidate.timeZone === "string"
      && typeof candidate.workStart === "number"
      && typeof candidate.workEnd === "number";
  });
}

function migrateLegacyGroup(): SavedGroup {
  let people = starterPeople;
  let planner = defaultPlanner();
  try {
    const legacyPeople = localStorage.getItem(LEGACY_PEOPLE_STORAGE_KEY);
    if (legacyPeople) people = safePeople(JSON.parse(legacyPeople));
    const legacyPlanner = localStorage.getItem(LEGACY_PLANNER_STORAGE_KEY);
    if (legacyPlanner) planner = safePlanner(JSON.parse(legacyPlanner));
  } catch {
    // Fall back to the starter group when legacy data is malformed.
  }
  return {
    id: createId(),
    name: "My group",
    people,
    planner,
    updatedAt: new Date().toISOString(),
  };
}

export function loadGroups(): { groups: SavedGroup[]; activeGroupId: string } {
  try {
    const parsed = JSON.parse(localStorage.getItem(GROUPS_STORAGE_KEY) ?? "[]") as SavedGroup[];
    if (Array.isArray(parsed) && parsed.length) {
      const groups = parsed.map((group) => ({
        ...group,
        name: typeof group.name === "string" && group.name.trim() ? group.name.trim() : "Untitled group",
        people: safePeople(group.people),
        planner: safePlanner(group.planner),
      }));
      const requested = localStorage.getItem(ACTIVE_GROUP_STORAGE_KEY);
      const activeGroupId = groups.some((group) => group.id === requested) ? requested! : groups[0].id;
      return { groups, activeGroupId };
    }
  } catch {
    // Migrate into a fresh group when stored group data is malformed.
  }
  const first = migrateLegacyGroup();
  return { groups: [first], activeGroupId: first.id };
}

export function saveGroups(groups: SavedGroup[], activeGroupId: string) {
  localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
  localStorage.setItem(ACTIVE_GROUP_STORAGE_KEY, activeGroupId);
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

export function createShareLink(group: SavedGroup) {
  const payload: SharedGroupPayload = {
    version: 1,
    name: group.name,
    people: group.people,
    planner: group.planner,
  };
  const encoded = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  return `${window.location.origin}${window.location.pathname}${SHARE_PREFIX}${encoded}`;
}

export function readSharedGroup(hash = window.location.hash): SharedGroupPayload | null {
  if (!hash.startsWith(SHARE_PREFIX)) return null;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(base64UrlToBytes(hash.slice(SHARE_PREFIX.length)))) as Partial<SharedGroupPayload>;
    if (parsed.version !== 1 || typeof parsed.name !== "string") return null;
    return {
      version: 1,
      name: parsed.name.trim() || "Shared group",
      people: safePeople(parsed.people),
      planner: safePlanner(parsed.planner),
    };
  } catch {
    return null;
  }
}

export function clearShareHash() {
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
}

