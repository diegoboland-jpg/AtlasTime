import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AddPersonForm } from "./AddPersonForm";

describe("country correction in the person form", () => {
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
