import { afterEach, describe, expect, it, vi } from "vitest";
import {
  connectedGoogleCalendarEvent,
  createGoogleCalendarEvent,
  disconnectGoogleCalendar,
  getGoogleCalendarStatus,
  GoogleCalendarError,
} from "./googleCalendar";

function jsonResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("Google Calendar PWA client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads only the connection status returned by the gateway", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      provider: "google",
      connected: true,
      scope: "calendar.events.owned",
      connectedAt: 123,
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getGoogleCalendarStatus()).resolves.toMatchObject({ connected: true, connectedAt: 123 });
    expect(fetchMock).toHaveBeenCalledWith("/api/google-calendar/status", expect.objectContaining({
      credentials: "same-origin",
    }));
  });

  it("sends CSRF-protected disconnect and event requests", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ provider: "google", connected: false, scope: null, connectedAt: null }))
      .mockResolvedValueOnce(jsonResponse({ id: "event-1", htmlLink: "https://calendar.google.com/event?eid=1" }, 201));
    vi.stubGlobal("fetch", fetchMock);

    await disconnectGoogleCalendar();
    await createGoogleCalendarEvent({
      title: "Project sync",
      description: "Details",
      attendees: [{ name: "Ana", email: "ana@example.com" }],
      allDay: false,
      start: "2026-07-21T12:00:00.000Z",
      end: "2026-07-21T13:00:00.000Z",
    });

    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      headers: expect.objectContaining({ "X-AtlasTime-CSRF": "1" }),
    });
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: "POST",
      headers: expect.objectContaining({ "X-AtlasTime-CSRF": "1" }),
    });
    expect(JSON.parse(String(fetchMock.mock.calls[1][1].body))).toMatchObject({
      attendees: [{ email: "ana@example.com" }],
    });
  });

  it("builds exact timed and all-day payloads", () => {
    const base = {
      title: "Project sync",
      description: "Details",
      attendees: [],
      date: "2026-07-21",
      start: new Date("2026-07-21T12:00:00.000Z"),
      durationMinutes: 90,
    };
    expect(connectedGoogleCalendarEvent({ ...base, allDay: false })).toMatchObject({
      allDay: false,
      start: "2026-07-21T12:00:00.000Z",
      end: "2026-07-21T13:30:00.000Z",
    });
    expect(connectedGoogleCalendarEvent({ ...base, allDay: true })).toMatchObject({
      allDay: true,
      startDate: "2026-07-21",
      endDate: "2026-07-22",
    });
  });

  it("surfaces gateway configuration failures without exposing response details", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({
      error: "calendar_gateway_not_configured",
      missing: ["GOOGLE_OAUTH_CLIENT_SECRET"],
    }, 503)));

    await expect(getGoogleCalendarStatus()).rejects.toEqual(expect.objectContaining<Partial<GoogleCalendarError>>({
      code: "calendar_gateway_not_configured",
      status: 503,
    }));
  });
});
