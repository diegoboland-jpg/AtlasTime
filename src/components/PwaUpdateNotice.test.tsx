// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PWA_UPDATE_EVENT } from "../pwa";
import { PwaUpdateNotice } from "./PwaUpdateNotice";

describe("PWA update notice", () => {
  afterEach(() => document.body.replaceChildren());

  it("offers and requests an installed update without removing saved data", async () => {
    const postMessage = vi.fn();
    const registration = { waiting: { postMessage } } as unknown as ServiceWorkerRegistration;
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        controller: {},
        getRegistration: vi.fn().mockResolvedValue(undefined),
        addEventListener: vi.fn(),
      },
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(<PwaUpdateNotice />));
    await act(async () => window.dispatchEvent(new CustomEvent(PWA_UPDATE_EVENT, { detail: { registration } })));

    expect(container.textContent).toContain("A new AtlasTime version is ready.");
    expect(container.textContent).toContain("saved groups will stay");
    await act(async () => container.querySelector<HTMLButtonElement>(".pwa-update-action")!.click());
    expect(postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    expect(container.textContent).toContain("Updating…");
    root.unmount();
  });
});
