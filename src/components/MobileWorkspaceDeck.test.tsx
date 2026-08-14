import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MobileWorkspaceDeck } from "./MobileWorkspaceDeck";

describe("mobile workspace deck", () => {
  it("exposes named, wraparound workspace navigation without duplicating content", () => {
    const markup = renderToStaticMarkup(
      <MobileWorkspaceDeck
        activePanel={0}
        labels={["Everyone's time", "Saved group", "People", "Find a good time", "Handoff"]}
        onActivePanelChange={vi.fn()}
      >
        <div>Main</div>
        <div>Groups</div>
        <div>Contacts</div>
        <div>Planner</div>
        <div>Calendars</div>
      </MobileWorkspaceDeck>,
    );

    expect(markup).toContain('aria-label="Workspace sections"');
    expect(markup).toContain("Everyone&#x27;s time");
    expect(markup).toContain('aria-label="1 of 5"');
    expect(markup.match(/class="mobile-workspace-panel"/g)).toHaveLength(5);
    expect(markup).not.toContain("undefined");
  });
});
