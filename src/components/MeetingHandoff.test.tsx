// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Person, PlannerState } from "../types";
import { MeetingHandoff } from "./MeetingHandoff";

const people: Person[] = [
  { id: "ana", name: "Ana", city: "Madrid", timeZone: "Europe/Madrid", workStart: 9, workEnd: 18 },
];

const planner: PlannerState = {
  date: "2026-07-21",
  hour: 12,
  title: "Project sync",
  durationMinutes: 60,
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
      onDurationChange={vi.fn()}
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

  it("keeps the raw invitation collapsed and offers a universal calendar file", () => {
    const { container, root } = renderHandoff();

    const disclosure = container.querySelector<HTMLDetailsElement>(".meeting-summary-disclosure");
    expect(disclosure?.open).toBe(false);
    expect(disclosure?.querySelector("summary")?.textContent).toContain("Preview copied invitation details");
    expect(container.textContent).toContain("Any calendar (.ics)");
    root.unmount();
  });
});
