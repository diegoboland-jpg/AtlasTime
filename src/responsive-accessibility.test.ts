import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

describe("responsive accessibility safeguards", () => {
  it("keeps key touch controls at least 44 CSS pixels tall", () => {
    expect(styles).toMatch(/\.install-button, \.installed-badge \{[\s\S]*?min-height: 44px/);
    expect(styles).toMatch(/\.remove \{[\s\S]*?width: 44px; height: 44px/);
    expect(styles).toMatch(/\.work-hours select \{ min-height: 44px/);
    expect(styles).toMatch(/\.mobile-overview-slider input \{[^}]*min-height: 44px/);
    expect(styles).toMatch(/\.mobile-overview-slider button \{[\s\S]*?min-height: 44px/);
    expect(styles).toMatch(/@media \(hover: none\) \{[\s\S]*?\.hour-cell \{ min-height: 44px/);
  });

  it("keeps the compact phone grid while reflowing detailed planner rows", () => {
    expect(styles).toMatch(/@media \(max-width: 420px\)/);
    expect(styles).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    expect(styles).toContain(".mobile-person-local-time { grid-column: 2; text-align: left; }");
  });

  it("retains reduced-motion, forced-color, and visible-focus support", () => {
    expect(styles).toContain(":focus-visible { outline: 3px solid #f2a900");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styles).toContain("@media (forced-colors: active)");
    expect(styles).toContain("animation-duration: .01ms !important");
  });
});
