// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GoogleCalendarConnection } from "./GoogleCalendarConnection";

function response(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const event = {
  title: "Project sync",
  description: "Review launch readiness.",
  location: "Zoom",
  attendees: [{ name: "Ana", email: "ana@example.com" }],
  allDay: false,
  start: "2026-07-21T12:00:00.000Z",
  end: "2026-07-21T13:00:00.000Z",
};

describe("connected Google Calendar UI", () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("creates an event only after the final review", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({
        provider: "google",
        connected: true,
        scope: "https://www.googleapis.com/auth/calendar.events.owned",
        connectedAt: Date.now(),
      }))
      .mockResolvedValueOnce(response({
        id: "event-1",
        htmlLink: "https://calendar.google.com/calendar/event?eid=event-1",
        status: "confirmed",
      }, 201));
    vi.stubGlobal("fetch", fetchMock);
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(
      <GoogleCalendarConnection
        event={event}
        eventTitle="Project sync"
        timing="Tue, 21 Jul 2026 12:00:00 GMT · 1 hour"
        location="Zoom"
        attendees={event.attendees}
      />,
    ));

    expect(container.textContent).toContain("Connected securely");
    const createButton = [...container.querySelectorAll("button")].find((button) => button.textContent?.includes("Create Google event"));
    await act(async () => createButton!.click());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[role="dialog"]')?.textContent).toContain("Continue to your connected Google Calendar?");

    const confirm = [...container.querySelectorAll('[role="dialog"] button')]
      .find((button) => button.textContent === "Create Google event");
    await act(async () => confirm!.click());

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain("Event created in Google Calendar");
    expect(container.querySelector<HTMLAnchorElement>(".calendar-created-link")?.href)
      .toBe("https://calendar.google.com/calendar/event?eid=event-1");
    root.unmount();
  });

  it("keeps handoff available when the gateway is not configured", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({
      error: "calendar_gateway_not_configured",
      missing: ["GOOGLE_OAUTH_CLIENT_ID"],
    }, 503)));
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(
      <GoogleCalendarConnection
        event={event}
        eventTitle="Project sync"
        timing="Tue, 21 Jul 2026 12:00:00 GMT · 1 hour"
        location="Zoom"
        attendees={event.attendees}
      />,
    ));

    expect(container.textContent).toContain("Gateway not configured in this build");
    expect(container.textContent).toContain("Calendar drafts and .ics files work without connecting");
    expect(container.querySelector("button")).toBeNull();
    root.unmount();
  });
});
