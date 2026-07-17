import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MobileTimeOverview } from "./MobileTimeOverview";

describe("mobile time overview", () => {
  it("keeps current device time separate from slider-controlled group times", () => {
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
  });
});
