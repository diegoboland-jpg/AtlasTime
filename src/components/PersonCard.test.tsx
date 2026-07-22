import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PersonCard } from "./PersonCard";

const person = {
  id: "long-name",
  name: "A very long participant name",
  city: "A very long city and administrative region name",
  timeZone: "America/Sao_Paulo",
  workStart: 9,
  workEnd: 18,
};

describe("person card delete control", () => {
  it("renders delete after the live-time content with an accessible label", () => {
    const markup = renderToStaticMarkup(
      <PersonCard
        person={person}
        now={new Date("2026-07-15T15:00:00Z")}
        selectedInstant={new Date("2026-07-15T16:00:00Z")}
        onChange={vi.fn()}
        onRemove={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(markup.indexOf('class="person-time"')).toBeLessThan(markup.indexOf('aria-label="Remove A very long participant name"'));
    expect(markup).toContain('title="Remove A very long participant name"');
  });

  it("marks delete as a dedicated card action", () => {
    const markup = renderToStaticMarkup(
      <PersonCard
        person={person}
        now={new Date("2026-07-15T15:00:00Z")}
        selectedInstant={new Date("2026-07-15T16:00:00Z")}
        onChange={vi.fn()}
        onRemove={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(markup).toContain('data-card-action="delete"');
  });
});
