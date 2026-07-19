import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { TimePeriodKey } from "../timePeriods";
import { TimePeriodScene } from "./TimePeriodScene";

const periods: TimePeriodKey[] = ["night", "morning", "lunch", "afternoon", "dinner", "evening"];

describe("time-period vector scenes", () => {
  it.each(periods)("renders the %s scene as decorative SVG", (period) => {
    const markup = renderToStaticMarkup(<TimePeriodScene period={period} compact />);

    expect(markup).toContain("time-period-scene");
    expect(markup).toContain(`scene-${period}`);
    expect(markup).toContain("compact");
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain("<svg");
  });

  it("uses layered solid forms for landscapes, coffee, and clouds", () => {
    const morning = renderToStaticMarkup(<TimePeriodScene period="morning" />);
    const afternoon = renderToStaticMarkup(<TimePeriodScene period="afternoon" />);

    expect(morning).toContain("scene-horizon-far");
    expect(morning).toContain("scene-vessel");
    expect(morning).toContain("scene-saucer");
    expect(afternoon).toContain("scene-cloud-back");
    expect(afternoon).toContain("scene-cloud-front");
  });
});
