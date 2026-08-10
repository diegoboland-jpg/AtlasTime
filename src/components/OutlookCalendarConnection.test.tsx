// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OutlookCalendarConnection } from "./OutlookCalendarConnection";

function response(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
}

describe("connected Outlook Calendar UI", () => {
  afterEach(() => {
    document.body.replaceChildren();
    window.history.replaceState(null, "", "/");
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows a verified organizer availability connection", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({
      provider: "outlook",
      connected: true,
      availabilityGranted: true,
      connectedAt: Date.now(),
    })));
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(<OutlookCalendarConnection />));

    expect(container.textContent).toContain("Connected for occupied/free planning");
    expect(container.textContent).toContain("Event names, descriptions, attendees, and locations are never requested");
    expect([...container.querySelectorAll("button")].some((button) => button.textContent?.includes("Disconnect"))).toBe(true);
    root.unmount();
  });

  it("disconnects the organizer Outlook session", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ provider: "outlook", connected: true, availabilityGranted: true, connectedAt: 1 }))
      .mockResolvedValueOnce(response({ provider: "outlook", connected: false, availabilityGranted: false, connectedAt: null }));
    vi.stubGlobal("fetch", fetchMock);
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(<OutlookCalendarConnection />));
    const disconnect = [...container.querySelectorAll("button")].find((button) => button.textContent?.includes("Disconnect"));
    await act(async () => disconnect!.click());

    expect(fetchMock).toHaveBeenLastCalledWith("/api/outlook-calendar/disconnect", expect.objectContaining({ method: "POST" }));
    expect(container.textContent).toContain("Outlook Calendar disconnected");
    expect(container.textContent).toContain("Connect Outlook Calendar");
    root.unmount();
  });

  it("keeps the planner usable when Microsoft credentials are absent", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({
      error: "outlook_gateway_not_configured",
      missing: ["MICROSOFT_OAUTH_CLIENT_ID"],
    }, 503)));
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(<OutlookCalendarConnection />));

    expect(container.textContent).toContain("Gateway not configured in this build");
    expect(container.querySelector("button")).toBeNull();
    root.unmount();
  });
});
