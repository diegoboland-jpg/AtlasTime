import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { TimePlanner } from "./TimePlanner";

const people = [
  { id: "1", name: "Diego", city: "Curitiba", timeZone: "America/Sao_Paulo", workStart: 9, workEnd: 18 },
];
const hours = Array.from({ length: 24 }, (_, utcHour) => ({
  utcHour,
  available: utcHour === 15 ? 1 : 0,
  total: 1,
  penalty: 0,
  score: utcHour === 15 ? 12 : 0,
}));

function renderPlanner(expanded: boolean, eventMode: "timed" | "all-day" = "timed") {
  return renderToStaticMarkup(
    <TimePlanner
      people={people}
      dateValue="2026-07-17"
      selectedHour={12 + 37 / 60}
      durationMinutes={90}
      eventMode={eventMode}
      recommendation={hours[15]}
      hours={hours}
      expanded={expanded}
      onExpandedChange={vi.fn()}
      onDateChange={vi.fn()}
      onDurationChange={vi.fn()}
      onEventModeChange={vi.fn()}
      onHourChange={vi.fn()}
    />,
  );
}

describe("progressive planner disclosure", () => {
  it("keeps the detailed timeline out of the initial page", () => {
    const markup = renderPlanner(false);

    expect(markup).toContain("Compare every hour when you need it");
    expect(markup).toContain("Plan Humanly");
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).not.toContain("Scrollable 24-hour local-time comparison");
    expect(markup).not.toContain('type="date"');
  });

  it("renders date, recommendation, and comparison only when expanded", () => {
    const markup = renderPlanner(true);

    expect(markup).toContain("Hide planner");
    expect(markup).toContain('aria-expanded="true"');
    expect(markup).toContain('type="date"');
    expect(markup).toContain("Best-scoring 1 hour 30 min window");
    expect(markup).toContain("Recommended meeting time and my local time");
    expect(markup).toContain("My time");
    expect(markup).toContain("planner-sticky-recommendation");
    expect(markup).toContain("Start (UTC)");
    expect(markup).toContain("Finish (UTC)");
    expect(markup).toContain("Quick length");
    expect(markup).toContain('value="30"');
    expect(markup).toContain('value="90" selected=""');
    expect(markup).toContain('value="12:37"');
    expect(markup).toContain('value="14:07"');
    expect(markup).toContain('inputMode="numeric"');
    expect(markup).toContain('type="text"');
    expect(markup).not.toContain('type="time"');
    expect(markup).toContain("type any exact time as HHMM");
    expect(markup).toContain("Scrollable 24-hour local-time comparison");
  });

  it("pauses hourly comparison for an all-day event", () => {
    const markup = renderPlanner(true, "all-day");

    expect(markup).toContain("All day on 2026-07-17");
    expect(markup).toContain("Hourly availability scoring is paused");
    expect(markup).not.toContain("Best-scoring");
    expect(markup).not.toContain("Scrollable 24-hour local-time comparison");
    expect(markup).not.toContain("Start (UTC)");
    expect(markup).not.toContain("Finish (UTC)");
  });
});
