// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AboutPrivacyDialog } from "./AboutPrivacyDialog";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("About and privacy", () => {
  it("does not inspect connections or generate a diagnostic until requested", async () => {
    const loadCalendarStates = vi.fn().mockResolvedValue({ google: "connected", outlook: "not_connected" });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(<AboutPrivacyDialog open onClose={vi.fn()} loadCalendarStates={loadCalendarStates} />));
    expect(loadCalendarStates).not.toHaveBeenCalled();
    expect(container.querySelector("pre")).toBeNull();
    expect(container.textContent).toContain("support@kikroo.com");
    expect(container.querySelector('a[href="mailto:support@kikroo.com"]')).not.toBeNull();

    const generate = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes("Generate preview"));
    await act(async () => generate!.click());

    expect(loadCalendarStates).toHaveBeenCalledTimes(1);
    expect(container.querySelector("pre")?.textContent).toContain('"google": "connected"');
    expect(container.textContent).toContain("Nothing was sent");
    await act(async () => root.unmount());
  });

  it("prepares editable feedback locally and copies only after explicit action", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(<AboutPrivacyDialog open onClose={vi.fn()} />));
    const prepare = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes("Prepare feedback"));
    await act(async () => prepare!.click());

    expect(writeText).not.toHaveBeenCalled();
    const draft = container.querySelector<HTMLTextAreaElement>('textarea[aria-label="Feedback draft"]');
    expect(draft?.value).toContain("What I expected:");
    expect(draft?.value).toContain("Test session (A-F):");
    expect(draft?.value).toContain("Severity (P0 privacy/data loss, P1 blocked, P2 workaround, P3 visual/copy):");
    const copy = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes("Copy reviewed feedback"));
    await act(async () => copy!.click());
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain("Kikroo protected beta feedback");
    await act(async () => root.unmount());
  });
});
