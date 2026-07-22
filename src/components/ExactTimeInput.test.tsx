// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExactTimeInput } from "./ExactTimeInput";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("exact time input", () => {
  afterEach(() => document.body.replaceChildren());

  function renderInput(onCommit = vi.fn()) {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    act(() => root.render(<ExactTimeInput value="09:00" onCommit={onCommit} />));
    return { input: container.querySelector("input")!, onCommit, root };
  }

  it("uses an AtlasTime text field instead of the clipped Android clock dialog", () => {
    const { input, root } = renderInput();

    expect(input.type).toBe("text");
    expect(input.inputMode).toBe("numeric");
    expect(input.value).toBe("09:00");
    root.unmount();
  });

  it("accepts compact exact times and normalizes them on blur", () => {
    const { input, onCommit, root } = renderInput();

    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, "1437");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    act(() => input.dispatchEvent(new FocusEvent("focusout", { bubbles: true })));

    expect(onCommit).toHaveBeenCalledWith("14:37");
    root.unmount();
  });

  it("steps by 15 minutes with arrow keys", () => {
    const { input, onCommit, root } = renderInput();

    act(() => input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true })));

    expect(input.value).toBe("09:15");
    expect(onCommit).toHaveBeenCalledWith("09:15");
    root.unmount();
  });
});
