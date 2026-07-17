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
});
