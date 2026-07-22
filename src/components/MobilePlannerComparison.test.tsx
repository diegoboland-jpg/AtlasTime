import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MobilePlannerComparison } from "./MobilePlannerComparison";

describe("mobile planner comparison", () => {
  it("shows compact start, end, and time-of-day columns without a duplicate hour picker", () => {
    const markup = renderToStaticMarkup(
      <MobilePlannerComparison
        people={[
          { id: "1", name: "Kochi", city: "Kochi", timeZone: "Asia/Kolkata", workStart: 9, workEnd: 18 },
          { id: "2", name: "Granada", city: "Granada", timeZone: "Europe/Madrid", workStart: 9, workEnd: 18 },
        ]}
        dateValue="2026-07-22"
        selectedHour={9}
        durationMinutes={120}
      />,
    );

    expect(markup).toContain("Phone-friendly meeting-hour comparison");
    expect(markup).toContain("Kochi");
    expect(markup).toContain("Granada");
    expect(markup.match(/Planning/g)).toHaveLength(2);
    expect(markup).toContain("Wed 22 Jul, 14:30");
    expect(markup).toContain("Wed 22 Jul, 16:30");
    expect(markup).toContain("Working hours");
    expect(markup).toContain("Start");
    expect(markup).toContain("End");
    expect(markup).toContain("time-period-scene");
    expect(markup).not.toContain("Selected meeting hour");
    expect(markup).not.toContain("mobile-hour-grid");
    expect(markup).not.toContain("mobile-hour-option");
  });
});
