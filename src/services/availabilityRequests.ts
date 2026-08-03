import type { AvailabilityByPerson, PersonAvailability } from "../types";

export type AvailabilityRequestRecord = {
  url: string;
  managementKey: string;
  status: "pending" | "revoked";
  expiresAt: string;
};

export type PublicAvailabilityRequest = {
  personName: string;
  status: "pending" | "expired" | "revoked" | "shared" | "declined";
  expiresAt: string;
  timeMin: string;
  timeMax: string;
};

export type ManagedAvailabilityResult = PersonAvailability;

const STORAGE_KEY = "atlastime.availability-requests.v1";

async function json<T>(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) throw new Error("availability_gateway_unavailable");
  const payload = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "availability_request_failed");
  return payload;
}

export async function createAvailabilityRequest(personName: string, timeMin: string, timeMax: string, expiresInDays = 7) {
  const response = await fetch("/api/availability-requests", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json", "X-AtlasTime-CSRF": "1" },
    body: JSON.stringify({ personName, timeMin, timeMax, expiresInDays }),
  });
  return json<AvailabilityRequestRecord>(response);
}

export async function submitGoogleAvailability(token: string, busy: Array<{ start: string; end: string }>) {
  const response = await fetch(`/api/availability-requests/${encodeURIComponent(token)}/submit`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json", "X-AtlasTime-CSRF": "1" },
    body: JSON.stringify({ provider: "google", busy }),
  });
  return json<{ status: "shared" }>(response);
}

export async function getManagedAvailabilityResult(record: AvailabilityRequestRecord) {
  const segments = new URL(record.url).pathname.split("/");
  const token = segments[segments.length - 1] ?? "";
  const response = await fetch(`/api/availability-requests/${encodeURIComponent(token)}/result`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json", "X-AtlasTime-CSRF": "1" },
    body: JSON.stringify({ managementKey: record.managementKey }),
  });
  return json<ManagedAvailabilityResult>(response);
}

export async function getAvailabilityRequest(token: string) {
  const response = await fetch(`/api/availability-requests/${encodeURIComponent(token)}`, {
    credentials: "same-origin",
    headers: { accept: "application/json" },
  });
  return json<PublicAvailabilityRequest>(response);
}

export async function revokeAvailabilityRequest(record: AvailabilityRequestRecord) {
  const segments = new URL(record.url).pathname.split("/");
  const token = segments[segments.length - 1] ?? "";
  const response = await fetch(`/api/availability-requests/${encodeURIComponent(token)}/revoke`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json", "X-AtlasTime-CSRF": "1" },
    body: JSON.stringify({ managementKey: record.managementKey }),
  });
  return json<{ status: "revoked" }>(response);
}

function loadRecords(): Record<string, AvailabilityRequestRecord> {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function loadManagedAvailabilityRequest(personId: string) {
  return loadRecords()[personId];
}

export function saveManagedAvailabilityRequest(personId: string, record: AvailabilityRequestRecord | null) {
  const records = loadRecords();
  if (record) records[personId] = record;
  else delete records[personId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

const RESULTS_STORAGE_KEY = "atlastime.availability-results.v1";

export function loadManagedAvailabilityResults(): AvailabilityByPerson {
  try {
    const parsed = JSON.parse(localStorage.getItem(RESULTS_STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveManagedAvailabilityResult(personId: string, result: ManagedAvailabilityResult | null) {
  const results = loadManagedAvailabilityResults();
  if (result) results[personId] = result;
  else delete results[personId];
  localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(results));
  return results;
}
