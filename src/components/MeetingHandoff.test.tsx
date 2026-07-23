// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Person, PlannerState } from "../types";
import { MeetingHandoff } from "./MeetingHandoff";

const people: Person[] = [
  { id: "ana", name: "Ana", email: "ana@example.com", city: "Madrid", timeZone: "Europe/Madrid", workStart: 9, workEnd: 18 },
];

const planner: PlannerState = {
  date: "2026-07-21",
  hour: 12,
  title: "Project sync",
  durationMinutes: 60,
  eventMode: "timed",
  location: "Zoom",
  notes: "Review launch readiness.",
};

function renderHandoff() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  act(() => root.render(
    <MeetingHandoff
      people={people}
      planner={planner}
      selectedInstant={new Date("2026-07-21T12:00:00Z")}
      onTitleChange={vi.fn()}
      onLocationChange={vi.fn()}
      onNotesChange={vi.fn()}
    />,
  ));
  return { container, root };
}

describe("meeting handoff sharing", () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it("opens the native share sheet with the visible invitation", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { configurable: true, value: share });
    const { container, root } = renderHandoff();

    const button = [...container.querySelectorAll("button")].find((candidate) => candidate.textContent?.includes("Share invite"));
    expect(button).toBeTruthy();
    await act(async () => button!.click());

    expect(share).toHaveBeenCalledWith(expect.objectContaining({
      title: "Project sync",
      text: expect.stringContaining("Ana (Madrid)"),
    }));
    expect(share.mock.calls[0][0]).not.toHaveProperty("url");
    root.unmount();
  });

  it("copies the invitation when native sharing is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    const { container, root } = renderHandoff();

    const button = [...container.querySelectorAll("button")].find((candidate) => candidate.textContent?.includes("Share invite"));
    await act(async () => button!.click());

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Project sync"));
    expect(container.textContent).toContain("Copied instead");
    root.unmount();
  });

  it("keeps the raw invitation collapsed and offers reviewed calendar handoffs", () => {
    const { container, root } = renderHandoff();

    const disclosure = container.querySelector<HTMLDetailsElement>(".meeting-summary-disclosure");
    expect(disclosure?.open).toBe(false);
    expect(disclosure?.querySelector("summary")?.textContent).toContain("Preview copied invitation details");
    expect(container.textContent).toContain("Google Calendar draft");
    expect(container.textContent).toContain("Outlook Calendar draft");
    expect(container.textContent).toContain("Apple / device calendar (.ics)");
    expect(container.textContent).toContain("Calendar connections");
    expect(container.textContent).toContain("Safe handoff mode");
    expect(container.textContent).toContain("1 of 1 included");
    expect(container.textContent).toContain("ana@example.com");
    expect([...container.querySelectorAll("button")].some((button) => button.textContent?.includes("Google Calendar draft"))).toBe(true);
    expect([...container.querySelectorAll("button")].some((button) => button.textContent?.includes("Outlook Calendar draft"))).toBe(true);
    root.unmount();
  });

  it("lets the organizer exclude invitees and confirms before opening a calendar draft", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const { container, root } = renderHandoff();

    const clear = [...container.querySelectorAll("button")].find((button) => button.textContent === "Clear");
    await act(async () => clear!.click());
    expect(container.textContent).toContain("0 of 1 included");

    const google = [...container.querySelectorAll("button")].find((button) => button.textContent?.includes("Google Calendar draft"));
    await act(async () => google!.click());
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain("Continue to Google Calendar?");
    expect(dialog?.textContent).toContain("None included");
    expect(open).not.toHaveBeenCalled();

    const confirm = [...dialog!.querySelectorAll("button")].find((button) => button.textContent === "Open Google draft");
    await act(async () => confirm!.click());
    expect(open).toHaveBeenCalledTimes(1);
    const openedUrl = new URL(String(open.mock.calls[0][0]));
    expect(openedUrl.origin).toBe("https://calendar.google.com");
    expect(openedUrl.searchParams.has("add")).toBe(false);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    root.unmount();
  });
});
