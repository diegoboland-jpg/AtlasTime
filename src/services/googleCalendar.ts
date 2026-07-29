import type { CalendarAttendee } from "../meeting";

export type GoogleCalendarStatus = {
  provider: "google";
  connected: boolean;
  scope: string | null;
  connectedAt: number | null;
};

export type GoogleCalendarEvent = {
  title: string;
  description: string;
  location?: string;
  attendees: CalendarAttendee[];
  allDay: boolean;
  start?: string;
  end?: string;
  startDate?: string;
  endDate?: string;
};

export type CreatedGoogleCalendarEvent = {
  id?: string;
  htmlLink?: string;
  status?: string;
};

export class GoogleCalendarError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
  ) {
    super(code);
    this.name = "GoogleCalendarError";
  }
}

async function responseJson(response: Response) {
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) throw new GoogleCalendarError("gateway_unavailable", response.status);
  return response.json() as Promise<Record<string, unknown>>;
}

async function request<T>(path: string, init?: RequestInit) {
  let response: Response;
  try {
    response = await fetch(path, {
      credentials: "same-origin",
      ...init,
      headers: {
        accept: "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new GoogleCalendarError("gateway_unavailable", 0);
  }

  const payload = await responseJson(response);
  if (!response.ok) {
    throw new GoogleCalendarError(
      typeof payload.error === "string" ? payload.error : "calendar_request_failed",
      response.status,
    );
  }
  return payload as T;
}

export function googleCalendarConnectUrl(returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`) {
  const query = new URLSearchParams({ returnTo });
  return `/api/google-calendar/connect?${query}`;
}

export function getGoogleCalendarStatus() {
  return request<GoogleCalendarStatus>("/api/google-calendar/status");
}

export function disconnectGoogleCalendar() {
  return request<GoogleCalendarStatus>("/api/google-calendar/disconnect", {
    method: "POST",
    headers: { "X-AtlasTime-CSRF": "1" },
  });
}

export function createGoogleCalendarEvent(event: GoogleCalendarEvent) {
  return request<CreatedGoogleCalendarEvent>("/api/google-calendar/events", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-AtlasTime-CSRF": "1",
    },
    body: JSON.stringify(event),
  });
}

function nextDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function connectedGoogleCalendarEvent({
  title,
  description,
  location,
  attendees,
  allDay,
  date,
  start,
  durationMinutes,
}: {
  title: string;
  description: string;
  location?: string;
  attendees: CalendarAttendee[];
  allDay: boolean;
  date: string;
  start: Date;
  durationMinutes: number;
}): GoogleCalendarEvent {
  if (allDay) {
    return {
      title,
      description,
      location,
      attendees,
      allDay: true,
      startDate: date,
      endDate: nextDate(date),
    };
  }

  return {
    title,
    description,
    location,
    attendees,
    allDay: false,
    start: start.toISOString(),
    end: new Date(start.getTime() + durationMinutes * 60_000).toISOString(),
  };
}
