// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AddPersonForm } from "./AddPersonForm";

describe("country correction in the person form", () => {
  it("chooses an entry type before the name and saves editable local working hours", async () => {
    const onAdd = vi.fn();
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => root.render(
      <AddPersonForm
        initialPerson={{ id: "1", entryType: "person", name: "Ana", city: "Madrid", country: "Spain", countryCode: "ES", timeZone: "Europe/Madrid", workStart: 8, workEnd: 17 }}
        onAdd={onAdd}
        onCancel={vi.fn()}
      />,
    ));

    expect(container.textContent).toContain("What are you adding?");
    expect(container.textContent).toContain("Team or group");
    expect(container.textContent).toContain("Place");
    const workSelects = container.querySelectorAll<HTMLSelectElement>(".work-hours-editor select");
    expect(workSelects[0].value).toBe("8");
    expect(workSelects[1].value).toBe("17");

    await act(async () => {
      workSelects[0].value = "10";
      workSelects[0].dispatchEvent(new Event("change", { bubbles: true }));
    });
    await act(async () => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ entryType: "person", workStart: 10, workEnd: 17 }));
    await act(async () => root.unmount());
    container.remove();
  });

  it("derives a missing flag code from a globally recognized country name", () => {
    const markup = renderToStaticMarkup(
      <AddPersonForm
        initialPerson={{ id: "1", name: "Kathmandu team", city: "Kathmandu", country: "Nepal", timeZone: "Asia/Kathmandu", workStart: 9, workEnd: 18 }}
        onAdd={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(markup).toContain("Country flag");
    expect(markup).toContain("🇳🇵");
    expect(markup).toContain('<option value="NP" selected="">Nepal</option>');
  });

  it("offers the neutral globe and manual selector for unresolved metadata", () => {
    const markup = renderToStaticMarkup(
      <AddPersonForm
        initialPerson={{ id: "1", name: "Remote team", city: "Unlisted place", timeZone: "Etc/UTC", workStart: 9, workEnd: 18 }}
        onAdd={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(markup).toContain("🌐");
    expect(markup).toContain("Choose country if it could not be identified");
    expect(markup).toContain('<option value="BR">Brazil</option>');
  });
});
