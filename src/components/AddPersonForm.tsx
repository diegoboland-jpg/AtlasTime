import { FormEvent, KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import type { CityOption } from "../cities";
import { createId } from "../id";
import { searchGlobalCities } from "../services/geocoding";
import type { Person } from "../types";

type AddPersonFormProps = {
  onAdd: (person: Person) => void;
  onCancel: () => void;
  initialPerson?: Person;
};

type SearchStatus = "idle" | "loading" | "success" | "error";

export function AddPersonForm({ onAdd, onCancel, initialPerson }: AddPersonFormProps) {
  const initialCity = initialPerson ? {
    label: [initialPerson.city, initialPerson.country].filter(Boolean).join(", "),
    city: initialPerson.city,
    country: initialPerson.country ?? "",
    countryCode: initialPerson.countryCode,
    timeZone: initialPerson.timeZone,
  } satisfies CityOption : undefined;
  const [name, setName] = useState(initialPerson?.name ?? "");
  const [email, setEmail] = useState(initialPerson?.email ?? "");
  const [query, setQuery] = useState(initialCity?.label ?? "");
  const [results, setResults] = useState<CityOption[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityOption | undefined>(initialCity);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [activeIndex, setActiveIndex] = useState(0);
  const [focused, setFocused] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const blurTimer = useRef<number | undefined>(undefined);
  const nameId = useId();
  const cityId = useId();
  const resultsId = useId();
  const statusId = useId();
  const timeZoneId = useId();

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
    if (event.key === "Escape") {
      setResults([]);
      setFocused(false);
      return;
    }
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
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !selectedCity) return;
    onAdd({
      id: initialPerson?.id ?? createId(),
      contactId: initialPerson?.contactId ?? createId(),
      name: name.trim(),
      ...(email.trim() ? { email: email.trim().toLowerCase() } : {}),
      city: selectedCity.city,
      country: selectedCity.country,
      countryCode: selectedCity.countryCode,
      timeZone: selectedCity.timeZone,
      workStart: 9,
      workEnd: 18,
    });
  }

  const showMenu = focused && query.trim().length >= 2 && selectedCity?.label !== query;

  return (
    <form className="add-form" onSubmit={submit}>
      <label htmlFor={nameId}>
        Person, location, or team
        <input
          id={nameId}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Olesya, Madrid office, or Design team"
          autoFocus
          required
        />
      </label>

      <label htmlFor={`${nameId}-email`}>
        Email address <span className="optional-label">Optional</span>
        <input
          id={`${nameId}-email`}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.com"
          autoComplete="email"
        />
      </label>

      <label className="city-search-field" htmlFor={cityId}>
        Global city search
        <span className="search-input-wrap">
          <Search size={16} />
          <input
            id={cityId}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showMenu}
            aria-controls={resultsId}
            aria-activedescendant={showMenu && results.length ? `${resultsId}-option-${activeIndex}` : undefined}
            aria-describedby={`${statusId} ${timeZoneId}-provider`}
            aria-busy={status === "loading"}
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
          <div className="city-results" id={resultsId} role="listbox" aria-label="Matching cities">
            {status === "loading" && <p>Searching citiesâ€¦</p>}
            {status === "error" && (
              <p className="search-error">
                City search is unavailable. <button type="button" onClick={() => setRetryKey((value) => value + 1)}>Try again</button>
              </p>
            )}
            {status === "success" && results.length === 0 && <p>No matching cities found.</p>}
            {status === "success" && results.some((city) => city.source === "offline") && (
              <p className="offline-note">Offline: showing recent saved places.</p>
            )}
            {results.map((city, index) => (
              <button
                type="button"
                role="option"
                id={`${resultsId}-option-${index}`}
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
        <p className="sr-only" id={statusId} role="status" aria-live="polite">
          {status === "loading" && "Searching cities."}
          {status === "error" && "City search is unavailable."}
          {status === "success" && `${results.length} city results available.`}
          {selectedCity && `${selectedCity.label} selected.`}
        </p>
        <small className="provider-note" id={`${timeZoneId}-provider`}>
          Global place and timezone data by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>.
        </small>
      </label>

      <label className="wide-field" htmlFor={timeZoneId}>
        Time zone
        <input
          id={timeZoneId}
          value={selectedCity?.timeZone.replaceAll("_", " ") ?? "Choose a city from the search results"}
          readOnly
          aria-readonly="true"
        />
      </label>

      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
        <button className="primary-button" type="submit" disabled={!name.trim() || !selectedCity}>
          {initialPerson ? "Save changes" : "Save contact and add"}
        </button>
      </div>
    </form>
  );
}

