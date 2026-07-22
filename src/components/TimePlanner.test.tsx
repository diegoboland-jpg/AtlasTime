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

function renderPlanner(expanded: boolean) {
  return renderToStaticMarkup(
    <TimePlanner
      people={people}
      dateValue="2026-07-17"
      selectedHour={12 + 37 / 60}
      durationMinutes={90}
      recommendation={hours[15]}
      hours={hours}
      expanded={expanded}
      onExpandedChange={vi.fn()}
      onDateChange={vi.fn()}
      onDurationChange={vi.fn()}
      onHourChange={vi.fn()}
    />,
  );
}

describe("progressive planner disclosure", () => {
  it("keeps the detailed timeline out of the initial page", () => {
    const markup = renderPlanner(false);

    expect(markup).toContain("Compare every hour when you need it");
    expect(markup).toContain("Compare all hours");
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).not.toContain("Scrollable 24-hour local-time comparison");
    expect(markup).not.toContain('type="date"');
  });

  it("renders date, recommendation, and comparison only when expanded", () => {
    const markup = renderPlanner(true);

    expect(markup).toContain("Hide comparison");
    expect(markup).toContain('aria-expanded="true"');
    expect(markup).toContain('type="date"');
    expect(markup).toContain("Best-scoring 90-minute window");
    expect(markup).toContain("Duration (minutes)");
    expect(markup).toContain('value="15"');
    expect(markup).toContain('value="12:37"');
    expect(markup).toContain("Scrollable 24-hour local-time comparison");
  });
});
