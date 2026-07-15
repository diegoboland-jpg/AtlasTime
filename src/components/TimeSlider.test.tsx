import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { TimeSlider } from "./TimeSlider";

describe("time slider", () => {
  it("announces the selected hour and availability", () => {
    const markup = renderToStaticMarkup(
      <TimeSlider
        selectedHour={14}
        selectedScore={{ utcHour: 14, available: 2, total: 3, penalty: 1, score: 19 }}
        onHourChange={vi.fn()}
        onNow={vi.fn()}
      />,
    );

    expect(markup).toContain("14:00 UTC");
    expect(markup).toContain('aria-valuetext="14:00 UTC, 2 of 3 available"');
    expect(markup).toContain("2/3 available - score 19");
    expect(markup).toContain("Explore meeting hours");
  });
});
