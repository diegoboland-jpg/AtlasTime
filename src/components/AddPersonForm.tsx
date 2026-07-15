import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import type { CityOption } from "../cities";
import { searchGlobalCities } from "../services/geocoding";
import type { Person } from "../types";

type AddPersonFormProps = {
  onAdd: (person: Person) => void;
  onCancel: () => void;
};

type SearchStatus = "idle" | "loading" | "success" | "error";

export function AddPersonForm({ onAdd, onCancel }: AddPersonFormProps) {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CityOption[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityOption>();
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [activeIndex, setActiveIndex] = useState(0);
  const [focused, setFocused] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const blurTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (selectedCity?.label === query || query.trim().length < 2) {
      setResults([]);
      setStatus("idle");
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setStatus("loading");
      try {
        const matches = await searchGlobalCities(query, controller.signal);
        setResults(matches);
        setActiveIndex(0);
        setStatus("success");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults([]);
          setStatus("error");
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, retryKey, selectedCity]);

  function chooseCity(city: CityOption) {
    setSelectedCity(city);
    setQuery(city.label);
    setResults([]);
    setStatus("idle");
    setFocused(false);
  }

  function handleKeys(event: KeyboardEvent<HTMLInputElement>) {
    if (!results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      chooseCity(results[activeIndex]);
    } else if (event.key === "Escape") {
      setResults([]);
      setFocused(false);
    }
  }

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

  const showMenu = focused && query.trim().length >= 2 && selectedCity?.label !== query;

  return (
    <form className="add-form" onSubmit={submit}>
      <label>
        Person, location, or team
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Olesya, Madrid office, or Design team"
          autoFocus
        />
      </label>

      <label className="city-search-field">
        Global city search
        <span className="search-input-wrap">
          <Search size={16} />
          <input
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showMenu}
            aria-controls="city-search-results"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedCity(undefined);
              setFocused(true);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              blurTimer.current = window.setTimeout(() => setFocused(false), 120);
            }}
            onKeyDown={handleKeys}
            placeholder="Start typing any city or postal code"
            autoComplete="off"
          />
        </span>

        {showMenu && (
          <div className="city-results" id="city-search-results" role="listbox">
            {status === "loading" && <p>Searching cities…</p>}
            {status === "error" && (
              <p className="search-error">
                City search is unavailable. <button type="button" onClick={() => setRetryKey((value) => value + 1)}>Try again</button>
              </p>
            )}
            {status === "success" && results.length === 0 && <p>No matching cities found.</p>}
            {results.map((city, index) => (
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={index === activeIndex ? "active" : ""}
                key={city.id ?? `${city.label}:${city.timeZone}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => chooseCity(city)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <MapPin size={15} />
                <span><strong>{city.label}</strong><small>{city.timeZone.replaceAll("_", " ")}</small></span>
              </button>
            ))}
          </div>
        )}
        <small className="provider-note">
          Global place and timezone data by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>.
        </small>
      </label>

      <label className="wide-field">
        Time zone
        <input
          value={selectedCity?.timeZone.replaceAll("_", " ") ?? "Choose a city from the search results"}
          readOnly
          aria-readonly="true"
        />
      </label>

      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
        <button className="primary-button" type="submit" disabled={!name.trim() || !selectedCity}>Save entry</button>
      </div>
    </form>
  );
}
