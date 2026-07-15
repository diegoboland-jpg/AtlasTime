import { FormEvent, useMemo, useState } from "react";
import { cityOptions, getCityByLabel } from "../cities";
import type { Person } from "../types";

type AddPersonFormProps = {
  onAdd: (person: Person) => void;
  onCancel: () => void;
};

export function AddPersonForm({ onAdd, onCancel }: AddPersonFormProps) {
  const [name, setName] = useState("");
  const [selectedCityLabel, setSelectedCityLabel] = useState("");
  const selectedCity = useMemo(
    () => getCityByLabel(selectedCityLabel),
    [selectedCityLabel],
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !selectedCity) return;

    onAdd({
      id: crypto.randomUUID(),
      name: name.trim(),
      city: selectedCity.city,
      timeZone: selectedCity.timeZone,
      workStart: 9,
      workEnd: 18,
    });
  }

  return (
    <form className="add-form" onSubmit={submit}>
      <label>
        Name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Olesya"
          autoFocus
        />
      </label>

      <label>
        City
        <select
          value={selectedCityLabel}
          onChange={(event) => setSelectedCityLabel(event.target.value)}
          required
        >
          <option value="">Select a city</option>
          {cityOptions.map((option) => (
            <option key={option.label} value={option.label}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="wide-field">
        Time zone
        <input
          value={selectedCity?.timeZone.replaceAll("_", " ") ?? "Select a city first"}
          readOnly
          aria-readonly="true"
        />
      </label>

      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="primary-button" type="submit" disabled={!name.trim() || !selectedCity}>
          Save person
        </button>
      </div>
    </form>
  );
}
