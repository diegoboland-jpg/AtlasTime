import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MobileWorkspaceDeck } from "./MobileWorkspaceDeck";

describe("mobile workspace deck", () => {
  it("exposes named, wraparound workspace navigation without duplicating content", () => {
    const markup = renderToStaticMarkup(
      <MobileWorkspaceDeck
        activePanel={0}
        labels={["At a glance", "Groups & people", "Find a good time", "Handoff"]}
        onActivePanelChange={vi.fn()}
      >
        <div>Main</div>
        <div>Groups and contacts</div>
        <div>Planner</div>
        <div>Calendars</div>
      </MobileWorkspaceDeck>,
    );

    expect(markup).toContain('aria-label="Workspace sections"');
    expect(markup).toContain("At a glance");
    expect(markup).toContain('aria-label="1 of 4"');
    expect(markup.match(/class="mobile-workspace-panel"/g)).toHaveLength(4);
    expect(markup).not.toContain("undefined");
  });
});
