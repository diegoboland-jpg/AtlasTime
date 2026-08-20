import { FormEvent, KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { getCountryByTimeZone, type CityOption } from "../cities";
import { countryCodeFromName, countryNameFromCode, countryOptions, normalizeCountryCode } from "../countries";
import { countryCodeToFlag } from "../country";
import { createId } from "../id";
import { searchGlobalCities } from "../services/geocoding";
import type { EntryType, Person } from "../types";
import type { ContactImportDraft } from "../contactImport";
import { adjustWorkHours, formatWorkHour, WORK_END_OPTIONS, WORK_START_OPTIONS } from "../workHours";

type AddPersonFormProps = {
  onAdd: (person: Person) => void;
  onCancel: () => void;
  initialPerson?: Person;
  initialDraft?: ContactImportDraft;
};

type SearchStatus = "idle" | "loading" | "success" | "error";

const entryChoices: Array<{ value: EntryType; label: string; help: string }> = [
  { value: "person", label: "Person", help: "A contact with editable local working hours." },
  { value: "team", label: "Team or group", help: "A family, office, or team sharing one local schedule." },
  { value: "place", label: "Place", help: "A city or country used mainly as a time reference." },
];

export function AddPersonForm({ onAdd, onCancel, initialPerson, initialDraft }: AddPersonFormProps) {
  const initialCity = initialPerson ? {
    label: [initialPerson.city, initialPerson.country].filter(Boolean).join(", "),
    city: initialPerson.city,
    country: initialPerson.country ?? "",
    countryCode: initialPerson.countryCode,
    timeZone: initialPerson.timeZone,
  } satisfies CityOption : undefined;
  const inferredInitialType: EntryType = initialPerson?.entryType
    ?? (initialDraft || initialPerson?.email || initialPerson?.phone ? "person" : initialPerson ? "place" : "person");
  const [entryType, setEntryType] = useState<EntryType>(inferredInitialType);
  const [name, setName] = useState(initialPerson?.name ?? initialDraft?.name ?? "");
  const [email, setEmail] = useState(initialPerson?.email ?? initialDraft?.email ?? "");
  const [phone, setPhone] = useState(initialPerson?.phone ?? initialDraft?.phone ?? "");
  const draftLocation = [initialDraft?.city, initialDraft?.country].filter(Boolean).join(", ");
  const [query, setQuery] = useState(initialCity?.label ?? draftLocation);
  const [results, setResults] = useState<CityOption[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityOption | undefined>(initialCity);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | undefined>(() => normalizeCountryCode(initialPerson?.countryCode)
    ?? countryCodeFromName(initialPerson?.country)
    ?? (initialPerson ? getCountryByTimeZone(initialPerson.timeZone)?.countryCode : undefined));
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [activeIndex, setActiveIndex] = useState(0);
  const [focused, setFocused] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [workStart, setWorkStart] = useState(initialPerson?.workStart ?? 9);
  const [workEnd, setWorkEnd] = useState(initialPerson?.workEnd ?? 18);
  const blurTimer = useRef<number | undefined>(undefined);
  const nameId = useId();
  const cityId = useId();
  const resultsId = useId();
  const statusId = useId();
  const timeZoneId = useId();
  const entryTypeId = useId();

  function changeWorkHours(field: "start" | "end", value: number) {
    const next = adjustWorkHours(workStart, workEnd, field, value);
    setWorkStart(next.workStart);
    setWorkEnd(next.workEnd);
  }

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
    const inferredCountryCode = normalizeCountryCode(city.countryCode)
      ?? countryCodeFromName(city.country)
      ?? getCountryByTimeZone(city.timeZone)?.countryCode;
    setSelectedCity({ ...city, ...(inferredCountryCode ? { countryCode: inferredCountryCode } : {}) });
    setSelectedCountryCode(inferredCountryCode);
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
      entryType,
      ...(entryType === "person"
        ? { contactId: initialPerson?.contactId ?? createId() }
        : initialPerson?.contactId ? { contactId: initialPerson.contactId } : {}),
      name: name.trim(),
      ...(entryType !== "place" && email.trim() ? { email: email.trim().toLowerCase() } : {}),
      ...(entryType !== "place" && phone.trim() ? { phone: phone.trim() } : {}),
      ...(entryType === "person" && initialPerson?.availabilityRequestStatus ? { availabilityRequestStatus: initialPerson.availabilityRequestStatus } : {}),
      ...(entryType === "person" && initialPerson?.availabilityRequestedAt ? { availabilityRequestedAt: initialPerson.availabilityRequestedAt } : {}),
      city: selectedCity.city,
      country: countryNameFromCode(selectedCountryCode) ?? selectedCity.country,
      ...(selectedCountryCode ? { countryCode: selectedCountryCode } : {}),
      timeZone: selectedCity.timeZone,
      workStart: entryType === "place" ? initialPerson?.workStart ?? 9 : workStart,
      workEnd: entryType === "place" ? initialPerson?.workEnd ?? 18 : workEnd,
    });
  }

  const showMenu = focused && query.trim().length >= 2 && selectedCity?.label !== query;

  return (
    <form className="add-form" onSubmit={submit}>
      <fieldset className="entry-type-selector wide-field">
        <legend>What are you adding?</legend>
        <div>
          {entryChoices.map((choice) => (
            <label key={choice.value} className={entryType === choice.value ? "selected" : ""}>
              <input
                type="radio"
                name={entryTypeId}
                value={choice.value}
                checked={entryType === choice.value}
                onChange={() => setEntryType(choice.value)}
              />
              <span><strong>{choice.label}</strong><small>{choice.help}</small></span>
            </label>
          ))}
        </div>
      </fieldset>

      <label htmlFor={nameId}>
        {entryType === "person" ? "Person's name" : entryType === "team" ? "Team or group name" : "Place label"}
        <input
          id={nameId}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={entryType === "person" ? "e.g. Olesya" : entryType === "team" ? "e.g. Family or Madrid office" : "e.g. Tokyo or Brazil"}
          autoFocus
          required
        />
      </label>

      {entryType !== "place" && (
        <>
          <label htmlFor={`${nameId}-phone`}>
            Mobile number <span className="optional-label">Optional</span>
            <input
              id={`${nameId}-phone`}
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+55 11 99999 9999"
              autoComplete="tel"
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

          <fieldset className="work-hours-editor wide-field">
            <legend>Local working hours</legend>
            <label>
              Starts
              <select value={workStart} onChange={(event) => changeWorkHours("start", Number(event.target.value))}>
                {WORK_START_OPTIONS.map((hour) => <option key={hour} value={hour}>{formatWorkHour(hour)}</option>)}
              </select>
            </label>
            <span>to</span>
            <label>
              Ends
              <select value={workEnd} onChange={(event) => changeWorkHours("end", Number(event.target.value))}>
                {WORK_END_OPTIONS.map((hour) => <option key={hour} value={hour}>{formatWorkHour(hour)}</option>)}
              </select>
            </label>
            <small>Saved locally for this contact or group and used by Find a good time.</small>
          </fieldset>
        </>
      )}

      <label className="city-search-field" htmlFor={cityId}>
        City or time-zone search
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
              setSelectedCountryCode(undefined);
              setFocused(true);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              blurTimer.current = window.setTimeout(() => setFocused(false), 120);
            }}
            onKeyDown={handleKeys}
            placeholder="City, postal code, or abbreviation such as IST"
            autoComplete="off"
          />
        </span>

        {showMenu && (
          <div className="city-results" id={resultsId} role="listbox" aria-label="Matching cities and time zones">
            {status === "loading" && <p>Searching citiesâ€¦</p>}
            {status === "error" && (
              <p className="search-error">
                City search is unavailable. <button type="button" onClick={() => setRetryKey((value) => value + 1)}>Try again</button>
              </p>
            )}
            {status === "success" && results.length === 0 && <p>No matching cities or time zones found.</p>}
            {status === "success" && results.some((city) => city.source === "timezone-alias") && (
              <p className="timezone-alias-note">Choose the intended region for this entry. Kikroo asks again for every ambiguous abbreviation.</p>
            )}
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
                <span><strong>{city.label}</strong><small>{city.detail ?? city.timeZone.replaceAll("_", " ")}</small></span>
              </button>
            ))}
          </div>
        )}
        <p className="sr-only" id={statusId} role="status" aria-live="polite">
          {status === "loading" && "Searching cities."}
          {status === "error" && "City search is unavailable."}
          {status === "success" && `${results.length} city or time-zone results available.`}
          {selectedCity && `${selectedCity.label} selected.`}
        </p>
        <small className="provider-note" id={`${timeZoneId}-provider`}>
          Time-zone abbreviations are resolved privately on this device. Global place data by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>.
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

      <label className="wide-field country-select-field" htmlFor={`${timeZoneId}-country`}>
        Country flag
        <span className="country-select-wrap">
          <span aria-hidden="true">{countryCodeToFlag(selectedCountryCode) ?? "🌐"}</span>
          <select
            id={`${timeZoneId}-country`}
            value={selectedCountryCode ?? ""}
            onChange={(event) => {
              const code = normalizeCountryCode(event.target.value);
              setSelectedCountryCode(code);
              setSelectedCity((current) => current ? {
                ...current,
                country: countryNameFromCode(code) ?? current.country,
                ...(code ? { countryCode: code } : { countryCode: undefined }),
              } : current);
            }}
            disabled={!selectedCity}
          >
            <option value="">Choose country if it could not be identified</option>
            {countryOptions.map(({ code, name: countryName }) => (
              <option key={code} value={code}>{countryName}</option>
            ))}
          </select>
        </span>
        <small className="provider-note">The city search fills this automatically. Change it here only when the country is missing or incorrect.</small>
      </label>

      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
        <button className="primary-button" type="submit" disabled={!name.trim() || !selectedCity}>
          {initialPerson ? "Save changes" : entryType === "person" ? "Save contact and add" : "Save entry"}
        </button>
      </div>
    </form>
  );
}

