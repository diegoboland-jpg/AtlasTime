import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MobileTimeOverview } from "./MobileTimeOverview";

describe("mobile time overview", () => {
  it("keeps local time, group times, and the slider in one compact region", () => {
    const markup = renderToStaticMarkup(
      <MobileTimeOverview
        now={new Date("2026-07-16T12:00:00Z")}
        selectedInstant={new Date("2026-07-16T14:00:00Z")}
        selectedHour={14}
        selectedScore={{ utcHour: 14, available: 1, total: 1, penalty: 0, score: 12 }}
        people={[{ id: "1", name: "Madrid team", city: "Madrid", timeZone: "Europe/Madrid", workStart: 9, workEnd: 18 }]}
        onHourChange={vi.fn()}
        onNow={vi.fn()}
      />,
    );

    expect(markup).toContain("Everyone&#x27;s time");
    expect(markup).toContain("Madrid team");
    expect(markup).toContain("Explore 24 hours");
    expect(markup).toContain('type="range"');
    expect(markup).toContain("1/1 available");
  });
});
