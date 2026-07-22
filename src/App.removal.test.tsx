// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const group = {
  id: "group-one",
  name: "Client team",
  people: [
    { id: "ana", name: "Ana", city: "Madrid", country: "Spain", countryCode: "ES", timeZone: "Europe/Madrid", workStart: 9, workEnd: 18 },
    { id: "lee", name: "Lee", city: "Kathmandu", country: "Nepal", countryCode: "NP", timeZone: "Asia/Kathmandu", workStart: 9, workEnd: 18 },
  ],
  planner: { date: "2026-07-21", hour: 12, title: "", durationMinutes: 60, eventMode: "timed", location: "", notes: "" },
  updatedAt: "2026-07-21T12:00:00.000Z",
};

async function flushAnimationFrame() {
  await act(async () => new Promise((resolve) => window.setTimeout(resolve, 0)));
}

describe("forgiving person removal", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("atlastime.groups.v1", JSON.stringify([group]));
    localStorage.setItem("atlastime.active-group.v1", group.id);
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0),
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        media: "",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it("restores the removed person at the original position and returns focus", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => root.render(<App />));

    const manage = [...container.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent?.includes("Manage people"));
    expect(manage).toBeTruthy();
    await act(async () => manage!.click());

    const remove = container.querySelector<HTMLButtonElement>('[aria-label="Remove Ana"]');
    expect(remove).toBeTruthy();
    await act(async () => remove!.click());
    await flushAnimationFrame();

    expect(container.querySelector("#person-ana-name")).toBeNull();
    expect(container.querySelector(".undo-toast")?.textContent).toContain("Ana removed from Client team");
    expect(document.activeElement?.id).toBe("undo-person-removal");

    const undo = container.querySelector<HTMLButtonElement>("#undo-person-removal");
    await act(async () => undo!.click());
    await flushAnimationFrame();

    const restoredNames = [...container.querySelectorAll(".people-rolodex .person-card h3")].map((heading) => heading.textContent);
    expect(restoredNames).toEqual(["Ana", "Lee"]);
    expect(container.querySelector(".undo-toast")).toBeNull();
    expect(document.activeElement?.id).toBe("person-card-ana");

    await act(async () => root.unmount());
  });
});
