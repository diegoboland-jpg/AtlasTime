// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MobilePlannerComparison } from "./MobilePlannerComparison";

describe("mobile planner comparison", () => {
  it("offers touch-friendly UTC choices and selected local times", () => {
    const hours = Array.from({ length: 24 }, (_, utcHour) => ({
      utcHour,
      available: utcHour === 15 ? 2 : 1,
      total: 2,
      penalty: 0,
      score: utcHour === 15 ? 24 : 12,
    }));
    const markup = renderToStaticMarkup(
      <MobilePlannerComparison
        people={[
          { id: "1", name: "Diego", city: "Curitiba", timeZone: "America/Sao_Paulo", workStart: 9, workEnd: 18 },
          { id: "2", name: "Madrid team", city: "Madrid", timeZone: "Europe/Madrid", workStart: 9, workEnd: 18 },
        ]}
        dateValue="2026-07-17"
        selectedHour={15}
        recommendation={hours[15]}
        hours={hours}
        onHourChange={vi.fn()}
      />,
    );

    expect(markup).toContain("Phone-friendly meeting-hour comparison");
    expect(markup).toContain("15:00 UTC");
    expect(markup).toContain("2/2 free");
    expect(markup).toContain("Best");
    expect(markup).toContain("Diego");
    expect(markup).toContain("Madrid team");
    expect(markup).toContain("Working hours");
    expect(markup).toContain('aria-keyshortcuts="ArrowLeft ArrowRight Home End"');
    expect(markup.match(/mobile-hour-option/g)).toHaveLength(24);
  });

  it("supports arrow, Home, and End keys without trapping focus", async () => {
    const hours = Array.from({ length: 24 }, (_, utcHour) => ({
      utcHour,
      available: 1,
      total: 1,
      penalty: 0,
      score: 12,
    }));
    const onHourChange = vi.fn();
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    HTMLElement.prototype.scrollTo = vi.fn();

    await act(async () => {
      root.render(
        <MobilePlannerComparison
          people={[]}
          dateValue="2026-07-17"
          selectedHour={15}
          recommendation={hours[15]}
          hours={hours}
          onHourChange={onHourChange}
        />,
      );
    });

    const selected = container.querySelector<HTMLButtonElement>('[data-utc-hour="15"]')!;
    const press = (key: string) => selected.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));

    await act(async () => press("ArrowRight"));
    await act(async () => press("ArrowLeft"));
    await act(async () => press("Home"));
    await act(async () => press("End"));

    expect(onHourChange.mock.calls.map(([hour]) => hour)).toEqual([16, 14, 0, 23]);
    expect(container.querySelector('[data-utc-hour="23"]')).toBe(document.activeElement);

    await act(async () => root.unmount());
    container.remove();
  });

  it("centers the selected hour after the first layout", async () => {
    const hours = Array.from({ length: 24 }, (_, utcHour) => ({ utcHour, available: 1, total: 1, penalty: 0, score: 12 }));
    const container = document.createElement("div");
    const root = createRoot(container);
    Object.defineProperty(HTMLElement.prototype, "offsetLeft", {
      configurable: true,
      get() { return Number(this.getAttribute("data-utc-hour") ?? 0) * 84; },
    });
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get() { return this.classList.contains("mobile-hour-scroller") ? 320 : 76; },
    });
    const requestFrame = vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    const cancelFrame = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);

    await act(async () => {
      root.render(
        <MobilePlannerComparison
          people={[]}
          dateValue="2026-07-17"
          selectedHour={12}
          recommendation={hours[12]}
          hours={hours}
          onHourChange={vi.fn()}
        />,
      );
    });

    expect(container.querySelector<HTMLElement>(".mobile-hour-scroller")?.scrollLeft).toBe(886);
    await act(async () => root.unmount());
    requestFrame.mockRestore();
    cancelFrame.mockRestore();
  });
});
