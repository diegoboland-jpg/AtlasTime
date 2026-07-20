// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MobileTimeOverview } from "./MobileTimeOverview";

describe("mobile time overview", () => {
  it("labels live device time and gives every tile a time-of-day state", () => {
    const markup = renderToStaticMarkup(
      <MobileTimeOverview
        now={new Date("2026-07-16T12:00:00Z")}
        selectedInstant={new Date("2026-07-16T14:00:00Z")}
        selectedHour={14}
        selectedScore={{ utcHour: 14, available: 1, total: 1, penalty: 0, score: 12 }}
        recommendation={{ utcHour: 15, available: 1, total: 1, penalty: 0, score: 12 }}
        people={[{ id: "1", name: "Madrid team", city: "Madrid", timeZone: "Europe/Madrid", workStart: 9, workEnd: 18 }]}
        onHourChange={vi.fn()}
        onNow={vi.fn()}
        onOpenPlanner={vi.fn()}
      />,
    );

    expect(markup).toContain("Everyone&#x27;s time");
    expect(markup).toContain("Current time");
    expect(markup).toContain("Your device time zone");
    expect(markup).toContain("Madrid team");
    expect(markup).toContain("compact-place-rotator");
    expect(markup).toContain('aria-label="Madrid team, Madrid"');
    expect(markup).toContain("Meeting time");
    expect(markup).toContain("16:00");
    expect(markup).not.toContain("Working now");
    expect(markup).toContain("Explore 24 hours");
    expect(markup).toContain('type="range"');
    expect(markup).toContain("1/1 available");
    expect(markup).toContain("Recommended");
    expect(markup).toContain("15:00 UTC");
    expect(markup).toContain("Use time");
    expect(markup).toContain("Compare all hours");
    expect(markup).toContain("time-period-");
    expect(markup).toContain("Afternoon");
    expect(markup.match(/time-period-scene/g)?.length).toBe(2);
    expect(markup).toContain("scene-afternoon");
  });

  it("links the device-time card to slider exploration and restores it with Now", async () => {
    const onHourChange = vi.fn();
    const onNow = vi.fn();
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MobileTimeOverview
          now={new Date("2026-07-16T12:00:00Z")}
          selectedInstant={new Date("2026-07-16T18:00:00Z")}
          selectedHour={18}
          selectedScore={{ utcHour: 18, available: 1, total: 1, penalty: 0, score: 12 }}
          recommendation={null}
          people={[]}
          onHourChange={onHourChange}
          onNow={onNow}
          onOpenPlanner={vi.fn()}
        />,
      );
    });

    expect(container.querySelector(".mobile-current-time")?.textContent).toContain("Current time");
    const slider = container.querySelector<HTMLInputElement>("#mobile-time-slider")!;
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;

    await act(async () => {
      valueSetter.call(slider, "19");
      slider.dispatchEvent(new Event("input", { bubbles: true }));
    });

    expect(onHourChange).toHaveBeenCalledWith(19);
    expect(container.querySelector(".mobile-current-time")?.textContent).toContain("Exploring time");
    expect(container.querySelector(".mobile-current-time")?.textContent).toContain("Linked to the 24-hour slider");

    await act(async () => container.querySelector<HTMLButtonElement>(".mobile-overview-slider button")!.click());
    expect(onNow).toHaveBeenCalledOnce();
    expect(container.querySelector(".mobile-current-time")?.textContent).toContain("Current time");

    await act(async () => root.unmount());
    container.remove();
  });

  it("keeps long and overflowing group entries available to keyboard and assistive technology", () => {
    const people = Array.from({ length: 6 }, (_, index) => ({
      id: String(index + 1),
      name: `International operations team ${index + 1}`,
      city: `A deliberately long place name ${index + 1}`,
      timeZone: "Europe/Madrid",
      workStart: 9,
      workEnd: 18,
    }));
    const container = document.createElement("div");
    const root = createRoot(container);

    act(() => {
      root.render(
        <MobileTimeOverview
          now={new Date("2026-07-16T12:00:00Z")}
          selectedInstant={new Date("2026-07-16T14:00:00Z")}
          selectedHour={14}
          selectedScore={{ utcHour: 14, available: 6, total: 6, penalty: 0, score: 72 }}
          recommendation={null}
          people={people}
          onHourChange={vi.fn()}
          onNow={vi.fn()}
          onOpenPlanner={vi.fn()}
        />,
      );
    });

    const list = container.querySelector<HTMLElement>('[role="list"]')!;
    expect(list.tabIndex).toBe(0);
    expect(list.getAttribute("aria-describedby")).toBe("mobile-time-strip-help");
    expect(list.querySelectorAll('[role="listitem"]')).toHaveLength(6);
    expect(list.querySelector('[role="listitem"]')?.getAttribute("aria-label")).toContain(
      "International operations team 1, A deliberately long place name 1: 16:00, Afternoon, working hours",
    );

    act(() => root.unmount());
  });

  it("does not add an unnecessary keyboard stop for a group that does not overflow", () => {
    const markup = renderToStaticMarkup(
      <MobileTimeOverview
        now={new Date("2026-07-16T12:00:00Z")}
        selectedInstant={new Date("2026-07-16T14:00:00Z")}
        selectedHour={14}
        selectedScore={{ utcHour: 14, available: 1, total: 1, penalty: 0, score: 12 }}
        recommendation={null}
        people={[{ id: "1", name: "Madrid", city: "Madrid", timeZone: "Europe/Madrid", workStart: 9, workEnd: 18 }]}
        onHourChange={vi.fn()}
        onNow={vi.fn()}
        onOpenPlanner={vi.fn()}
      />,
    );

    expect(markup).toContain('role="list"');
    expect(markup).not.toContain('tabindex="0"');
  });
});
