export type OutlookCalendarStatus = {
  provider: "outlook";
  connected: boolean;
  availabilityGranted: boolean;
  connectedAt: number | null;
};

export type OutlookCalendarAvailability = {
  provider: "outlook";
  timeMin: string;
  timeMax: string;
  busy: Array<{ start: string; end: string }>;
};

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...init,
    headers: { accept: "application/json", ...init?.headers },
  });
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) throw new Error("outlook_gateway_unavailable");
  const payload = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "outlook_request_failed");
  return payload;
}

export function outlookCalendarConnectUrl(returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`) {
  return `/api/outlook-calendar/connect?${new URLSearchParams({ returnTo })}`;
}

export function getOutlookCalendarStatus() {
  return request<OutlookCalendarStatus>("/api/outlook-calendar/status");
}

export function disconnectOutlookCalendar() {
  return request<OutlookCalendarStatus>("/api/outlook-calendar/disconnect", {
    method: "POST",
    headers: { "X-AtlasTime-CSRF": "1" },
  });
}

export function getOutlookCalendarAvailability(timeMin: string, timeMax: string) {
  return request<OutlookCalendarAvailability>("/api/outlook-calendar/freebusy", {
    method: "POST",
    headers: { "content-type": "application/json", "X-AtlasTime-CSRF": "1" },
    body: JSON.stringify({ timeMin, timeMax }),
  });
}
