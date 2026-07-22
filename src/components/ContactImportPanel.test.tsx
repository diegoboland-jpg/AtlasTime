// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContactImportPanel } from "./ContactImportPanel";

describe("contact import panel", () => {
  afterEach(() => {
    document.body.replaceChildren();
    Reflect.deleteProperty(navigator, "contacts");
    Reflect.deleteProperty(window, "isSecureContext");
    vi.restoreAllMocks();
  });

  it("imports only contacts selected through a supported device picker", async () => {
    Object.defineProperty(window, "isSecureContext", { configurable: true, value: true });
    const select = vi.fn().mockResolvedValue([{
      name: ["Ana"],
      email: ["ana@example.com"],
      address: [{ city: "Madrid", country: "Spain" }],
    }]);
    Object.defineProperty(navigator, "contacts", {
      configurable: true,
      value: { getProperties: vi.fn().mockResolvedValue(["name", "email", "address"]), select },
    });
    const onComplete = vi.fn();
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => root.render(<ContactImportPanel onComplete={onComplete} />));

    const choose = [...container.querySelectorAll("button")].find((button) => button.textContent?.includes("Choose from device"))!;
    await act(async () => choose.click());

    expect(select).toHaveBeenCalledWith(["name", "email", "address"], { multiple: true });
    expect(container.textContent).toContain("Ana");
    expect(container.textContent).toContain("ana@example.com · Madrid");
    const complete = [...container.querySelectorAll("button")].find((button) => button.textContent === "Complete")!;
    await act(async () => complete.click());
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ name: "Ana", email: "ana@example.com", city: "Madrid" }));

    await act(async () => root.unmount());
  });
});
