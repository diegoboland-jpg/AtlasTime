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
    expect(markup.match(/mobile-hour-option/g)).toHaveLength(24);
  });
});
