// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PwaInstall } from "./PwaInstall";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const originalUserAgent = navigator.userAgent;

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({ matches: false }),
  });
  Object.defineProperty(navigator, "userAgent", {
    configurable: true,
    value: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
  });
});

afterEach(() => {
  document.body.replaceChildren();
  Object.defineProperty(navigator, "userAgent", { configurable: true, value: originalUserAgent });
});

describe("PWA installation help", () => {
  it("opens iPhone instructions in an accessible overlay above the application", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(<PwaInstall />));
    await act(async () => container.querySelector<HTMLButtonElement>(".install-button")!.click());

    const dialog = container.querySelector<HTMLElement>('[role="dialog"]');
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
    expect(dialog?.textContent).toContain("Install Kikroo on iPhone");
    expect(dialog?.textContent).toContain("Open this page in Safari");
    expect(container.querySelector(".install-help-backdrop")).not.toBeNull();

    await act(async () => dialog?.querySelector<HTMLButtonElement>('button[aria-label="Close install instructions"]')?.click());
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    await act(async () => root.unmount());
  });
});
