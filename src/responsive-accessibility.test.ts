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

  it("cycles compact identity labels without overlap and stops for reduced motion", () => {
    expect(styles).toContain("@keyframes compact-name-cycle");
    expect(styles).toContain("@keyframes compact-location-cycle");
    expect(styles).toContain("animation: compact-name-cycle 6s linear infinite");
    expect(styles).toContain("animation: compact-location-cycle 6s linear infinite");
    expect(styles).toContain(".compact-place-rotator span, .compact-place-rotator small { position: static; opacity: 1 !important");
  });

  it("retains reduced-motion, forced-color, and visible-focus support", () => {
    expect(styles).toContain(":focus-visible { outline: 3px solid #f2a900");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styles).toContain("@media (forced-colors: active)");
    expect(styles).toContain("animation-duration: .01ms !important");
  });
});
