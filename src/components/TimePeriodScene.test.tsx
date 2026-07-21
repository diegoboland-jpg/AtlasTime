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

  it("uses layered solid forms and distinct afternoon and meal concepts", () => {
    const morning = renderToStaticMarkup(<TimePeriodScene period="morning" />);
    const lunch = renderToStaticMarkup(<TimePeriodScene period="lunch" />);
    const afternoon = renderToStaticMarkup(<TimePeriodScene period="afternoon" />);
    const dinner = renderToStaticMarkup(<TimePeriodScene period="dinner" />);

    expect(morning).toContain("scene-horizon-far");
    expect(morning).toContain("scene-vessel");
    expect(morning).toContain("scene-saucer");
    expect(lunch).toContain('data-meal-design="bowl-and-spoon"');
    expect(afternoon).toContain("scene-sun-track");
    expect(afternoon).toContain("scene-afternoon-orbit");
    expect(afternoon).toContain('data-ray-set="complete-eight"');
    expect(afternoon).toContain("scene-afternoon-short-rays");
    expect(dinner).toContain('data-meal-design="plate-fork-knife"');
    expect(dinner).toContain("scene-knife");
  });
});
