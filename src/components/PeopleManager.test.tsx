import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PeopleManager } from "./PeopleManager";

describe("focused people management", () => {
  it("keeps detailed cards in a dedicated rolodex view", () => {
    const markup = renderToStaticMarkup(
      <PeopleManager
        groupName="Work sites"
        people={[{ id: "1", name: "Diego", city: "Curitiba", timeZone: "America/Sao_Paulo", workStart: 9, workEnd: 18 }]}
        contacts={[{ id: "1", name: "Diego", email: "diego@example.com", city: "Curitiba", timeZone: "America/Sao_Paulo", workStart: 9, workEnd: 18, updatedAt: "2026-07-22T12:00:00Z" }]}
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
    expect(markup).toContain("Your AtlasTime contacts");
    expect(markup).toContain("diego@example.com");
    expect(markup).toContain("In group");
    expect(markup).toContain("Bring selected contacts into AtlasTime");
    expect(markup).toContain("Import vCard / CSV");
    expect(markup).toContain("Diego");
    expect(markup).toContain("contact import will remain opt-in");
  });
});
