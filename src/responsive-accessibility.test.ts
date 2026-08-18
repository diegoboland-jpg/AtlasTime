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

  it("keeps the compact phone grid while simplifying detailed planner rows", () => {
    expect(styles).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    expect(styles).toContain("grid-template-columns: minmax(98px, .85fr) minmax(138px, 1.35fr) 64px");
    expect(styles).toContain(".mobile-person-period .time-period-scene * { animation: none; }");
    expect(styles).toMatch(/@media \(max-width: 360px\) \{[\s\S]*?\.mobile-person-time \{ grid-template-columns: 78px minmax\(0, 1fr\) 48px/);
  });

  it("provides an app-like swipe deck without duplicating the floating slider", () => {
    expect(styles).toContain("scroll-snap-type: x mandatory");
    expect(styles).toContain("scroll-snap-stop: always");
    expect(styles).toMatch(
      /main > \.time-slider-section \{ display: none; \}\s*\.planner-workspace-panel > \.time-slider-section \{ display: none; \}\s*@media \(min-width: 641px\)/,
    );
    expect(styles).toContain("background: linear-gradient(135deg, rgba(13,27,42,.82), rgba(0,180,168,.68))");
  });

  it("keeps installation help above phone navigation and inside safe areas", () => {
    expect(styles).toMatch(/\.install-help-backdrop \{[\s\S]*?z-index: 200/);
    expect(styles).toMatch(/\.install-help-backdrop \{[\s\S]*?safe-area-inset-top/);
    expect(styles).toMatch(/\.install-tip \{[\s\S]*?max-height: calc\(100dvh/);
    expect(styles).toMatch(/\.install-tip \{[\s\S]*?overflow: auto/);
  });

  it("uses the shared animated overview as the desktop PWA experience", () => {
    expect(styles).toMatch(/@media \(min-width: 641px\) \{[\s\S]*?\.hero \{ display: none/);
    expect(styles).toMatch(/@media \(min-width: 641px\) \{[\s\S]*?\.mobile-time-strip \{ grid-column: 2; grid-template-columns: repeat\(3, minmax\(0, 1fr\)\); min-height: 228px; max-height: none/);
    expect(styles).toContain(".mobile-time-strip:not(.is-scrollable) { grid-template-rows: repeat(2, minmax(110px, 1fr)); }");
    expect(styles).toMatch(/\.mobile-overview-slider \{\s*position: fixed/);
    expect(styles).toContain("main > .time-slider-section { display: none; }");
  });

  it("lets the compact overview survive text zoom and overflowing groups", () => {
    expect(styles).toContain("overscroll-behavior: contain");
    expect(styles).toContain("max-height: 348px");
    expect(styles).toContain(".add-time-slot button");
    expect(styles).toContain(".mobile-time-strip:focus-visible");
    expect(styles).toContain("@media (max-width: 280px)");
    expect(styles).toMatch(/@media \(max-width: 280px\) \{[\s\S]*?body \{ min-width: 0/);
    expect(styles).toMatch(/@media \(max-width: 280px\) \{[\s\S]*?\.mobile-time-strip \{ grid-template-columns: 1fr; max-height: none/);
    expect(styles).toMatch(/@media \(max-width: 280px\) \{[\s\S]*?\.mobile-overview-slider label \{ align-items: flex-start; flex-direction: column/);
  });

  it("scales stronger vector artwork across phone widths", () => {
    expect(styles).toContain(".time-period-scene.compact { top: 4px; right: -5px; width: 82px; height: 52px; opacity: .68");
    expect(styles).toContain("@media (max-width: 360px)");
    expect(styles).toContain("@media (min-width: 480px) and (max-width: 640px)");
    expect(styles).toContain("@media (prefers-contrast: more)");
  });

  it("keeps names fixed while placing location and timezone at the tile footer", () => {
    expect(styles).toContain(".compact-person-name");
    expect(styles).toContain(".compact-location-zone");
    expect(styles).toContain(".compact-location-zone abbr");
    expect(styles).not.toContain("compact-name-cycle");
    expect(styles).not.toContain("compact-location-cycle");
  });

  it("keeps trusted country flags subtle, cropped, and optional in high-contrast modes", () => {
    expect(styles).toMatch(/\.country-flag-backdrop \{[\s\S]*?width: 32%/);
    expect(styles).toMatch(/\.country-flag-backdrop \{[\s\S]*?opacity: \.16/);
    expect(styles).toMatch(/\.country-flag-backdrop \{[\s\S]*?mask-image: linear-gradient/);
    expect(styles).toContain("background-size: cover");
    expect(styles).toContain("clip-path: polygon(0 0, 100% 0, 76% 100%, 0 100%)");
    expect(styles).toMatch(/@media \(forced-colors: active\) \{[\s\S]*?\.time-period-scene, \.country-flag-backdrop \{ display: none/);
  });

  it("retains reduced-motion, forced-color, and visible-focus support", () => {
    expect(styles).toContain(":focus-visible { outline: 3px solid #f2a900");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styles).toContain("@media (forced-colors: active)");
    expect(styles).toContain("animation-duration: .01ms !important");
  });
});
