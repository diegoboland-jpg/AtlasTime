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
        durationMinutes={60}
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
    expect(markup).toContain('class="mobile-hour-grid"');
    expect(markup).not.toContain("mobile-hour-scroller");
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
          durationMinutes={60}
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

});
