import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PeopleManager } from "./PeopleManager";

describe("focused people management", () => {
  it("keeps detailed cards in a dedicated rolodex view", () => {
    const markup = renderToStaticMarkup(
      <PeopleManager
        groupName="Work sites"
        people={[{ id: "1", name: "Diego", city: "Curitiba", timeZone: "America/Sao_Paulo", workStart: 9, workEnd: 18 }]}
        now={new Date("2026-07-22T12:00:00Z")}
        selectedInstant={new Date("2026-07-22T14:37:00Z")}
        showForm={false}
        onBack={vi.fn()}
        onToggleForm={vi.fn()}
        onAdd={vi.fn()}
        onCancelAdd={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(markup).toContain("Back to planner");
    expect(markup).toContain("Manage Work sites");
    expect(markup).toContain("people-rolodex");
    expect(markup).toContain("Diego");
    expect(markup).toContain("Future contact sync will be opt-in");
  });
});
