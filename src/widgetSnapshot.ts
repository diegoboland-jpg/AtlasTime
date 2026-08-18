import type { SavedGroup } from "./types";

export const WIDGET_SNAPSHOT_VERSION = 1 as const;
export const WIDGET_MAX_ENTRIES = 6;
export const WIDGET_ACTIONS = ["previous-30", "now", "next-30", "open-app"] as const;

const FRESH_FOR_MINUTES = 15;
const EXPIRE_AFTER_HOURS = 24;

export type WidgetTheme = "sky" | "midnight";
export type WidgetPrivacyMode = "labels" | "times-only";

export type WidgetSnapshot = {
  version: typeof WIDGET_SNAPSHOT_VERSION;
  generatedAt: string;
  freshUntil: string;
  expiresAt: string;
  deviceTimeZone: string;
  selectedAt: string;
  group: { id: string; label?: string };
  entries: Array<{
    id: string;
    label?: string;
    place?: string;
    countryCode?: string;
    timeZone: string;
    workStart: number;
    workEnd: number;
  }>;
  recommendation?: {
    startAt: string;
    available: number;
    total: number;
  };
  theme: WidgetTheme;
  privacyMode: WidgetPrivacyMode;
};

export type WidgetSnapshotFreshness = "fresh" | "stale" | "expired";

function bounded(value: string, maximum: number) {
  return value.trim().slice(0, maximum);
}

function futureIso(date: Date, milliseconds: number) {
  return new Date(date.getTime() + milliseconds).toISOString();
}

export function createWidgetSnapshot({
  group,
  deviceTimeZone,
  selectedAt,
  recommendation,
  theme = "sky",
  privacyMode = "labels",
  now = new Date(),
}: {
  group: SavedGroup;
  deviceTimeZone: string;
  selectedAt: Date;
  recommendation?: { startAt: Date; available: number; total: number };
  theme?: WidgetTheme;
  privacyMode?: WidgetPrivacyMode;
  now?: Date;
}): WidgetSnapshot {
  const showLabels = privacyMode === "labels";
  return {
    version: WIDGET_SNAPSHOT_VERSION,
    generatedAt: now.toISOString(),
    freshUntil: futureIso(now, FRESH_FOR_MINUTES * 60_000),
    expiresAt: futureIso(now, EXPIRE_AFTER_HOURS * 60 * 60_000),
    deviceTimeZone,
    selectedAt: selectedAt.toISOString(),
    group: {
      id: bounded(group.id, 120),
      ...(showLabels ? { label: bounded(group.name, 80) } : {}),
    },
    entries: group.people.slice(0, WIDGET_MAX_ENTRIES).map((person, index) => ({
      id: bounded(person.id, 120),
      ...(showLabels ? { label: bounded(person.name, 80), place: bounded(person.city, 80) } : {}),
      ...(showLabels && person.countryCode ? { countryCode: bounded(person.countryCode.toUpperCase(), 2) } : {}),
      timeZone: person.timeZone,
      workStart: person.workStart,
      workEnd: person.workEnd,
      ...(!showLabels ? { id: `entry-${index + 1}` } : {}),
    })),
    ...(recommendation ? {
      recommendation: {
        startAt: recommendation.startAt.toISOString(),
        available: Math.max(0, Math.min(recommendation.total, Math.trunc(recommendation.available))),
        total: Math.max(0, Math.trunc(recommendation.total)),
      },
    } : {}),
    theme,
    privacyMode,
  };
}

export function widgetSnapshotFreshness(snapshot: WidgetSnapshot, now = new Date()): WidgetSnapshotFreshness {
  const timestamp = now.getTime();
  if (timestamp >= new Date(snapshot.expiresAt).getTime()) return "expired";
  if (timestamp >= new Date(snapshot.freshUntil).getTime()) return "stale";
  return "fresh";
}
