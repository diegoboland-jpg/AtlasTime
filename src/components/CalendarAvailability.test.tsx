// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CalendarAvailability } from "./CalendarAvailability";

function response(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
}

describe("combined organizer calendar availability", () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("combines occupied blocks from connected Google and Outlook calendars", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input);
      if (path === "/api/google-calendar/status") return response({ provider: "google", connected: true, availabilityGranted: true, scope: "freebusy", connectedAt: 1 });
      if (path === "/api/outlook-calendar/status") return response({ provider: "outlook", connected: true, availabilityGranted: true, connectedAt: 1 });
      if (path === "/api/google-calendar/freebusy") return response({
        timeMin: "2026-08-07T00:00:00.000Z",
        timeMax: "2026-08-08T00:00:00.000Z",
        calendars: [{ id: "primary", status: "available", busy: [{ start: "2026-08-07T09:00:00.000Z", end: "2026-08-07T10:00:00.000Z" }] }],
      });
      if (path === "/api/outlook-calendar/freebusy") return response({
        provider: "outlook",
        timeMin: "2026-08-07T00:00:00.000Z",
        timeMax: "2026-08-08T00:00:00.000Z",
        busy: [{ start: "2026-08-07T10:00:00.000Z", end: "2026-08-07T11:00:00.000Z" }],
      });
      return response({ error: "not_found" }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(<CalendarAvailability dateValue="2026-08-07" selectedHour={10} durationMinutes={60} />));

    expect(container.textContent).toContain("My connected calendar availability");
    expect(container.textContent).toContain("Google");
    expect(container.textContent).toContain("Outlook");
    expect(container.textContent).toContain("Selected time conflicts");
    expect(container.querySelectorAll(".availability-strip .busy")).toHaveLength(4);
    root.unmount();
  });

  it("keeps confirmed Outlook availability visible when Google is unavailable", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input);
      if (path === "/api/google-calendar/status") return response({ error: "calendar_gateway_not_configured" }, 503);
      if (path === "/api/outlook-calendar/status") return response({ provider: "outlook", connected: true, availabilityGranted: true, connectedAt: 1 });
      if (path === "/api/outlook-calendar/freebusy") return response({
        provider: "outlook",
        timeMin: "2026-08-07T00:00:00.000Z",
        timeMax: "2026-08-08T00:00:00.000Z",
        busy: [],
      });
      return response({ error: "not_found" }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(<CalendarAvailability dateValue="2026-08-07" selectedHour={12} durationMinutes={30} />));

    expect(container.textContent).toContain("Outlook");
    expect(container.textContent).toContain("Selected time is free");
    expect(container.querySelectorAll(".availability-strip span")).toHaveLength(48);
    root.unmount();
  });
});
