import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  ExternalLink,
  Globe2,
  MessageCircle,
  Phone,
  Plus,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import { cityOptions, getCityByLabel } from "./cities";
import { starterPeople } from "./data";
import {
  bestHour,
  dateAtUtcHour,
  formatInZone,
  hourInZone,
  localLabel,
  scoreHours,
} from "./time";
import type { Person } from "./types";

const STORAGE_KEY = "atlastime.people.v1";

function todayInput() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function loadPeople(): Person[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : starterPeople;
  } catch {
    return starterPeople;
  }
}

export default function App() {
  const [people, setPeople] = useState<Person[]>(loadPeople);
  const [dateValue, setDateValue] = useState(todayInput);
  const [now, setNow] = useState(new Date());
  const [name, setName] = useState("");
  const [selectedCityLabel, setSelectedCityLabel] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
  }, [people]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const hours = useMemo(
    () => scoreHours(people, dateValue),
    [people, dateValue],
  );

  const recommendation = useMemo(
    () => bestHour(people, dateValue),
    [people, dateValue],
  );

  const selectedCity = getCityByLabel(selectedCityLabel);

  function addPerson(event: FormEvent) {
    event.preventDefault();

    if (!name.trim() || !selectedCity) return;

    setPeople((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        city: selectedCity.city,
        timeZone: selectedCity.timeZone,
        workStart: 9,
        workEnd: 18,
      },
    ]);

    setName("");
    setSelectedCityLabel("");
    setShowForm(false);
  }

  function removePerson(id: string) {
    setPeople((current) =>
      current.filter((person) => person.id !== id),
    );
  }

  const selectedInstant = recommendation
    ? dateAtUtcHour(dateValue, recommendation.utcHour)
    : null;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="AtlasTime home">
          <span className="brand-mark">
            <Globe2 size={20} />
          </span>
          <span>AtlasTime</span>
        </a>
        <span className="mvp-badge">MVP 0.2.1</span>
      </header>

      <main>
        <section className="hero">
          <div>
            <p className="eyebrow">TIME ZONES, WITHOUT THE MATH</p>
            <h1>
              Find a humane time
              <br />
              for everyone.
            </h1>
            <p className="hero-copy">
              Compare local hours, spot shared availability, and move
              directly to the call.
            </p>
          </div>

          <div className="hero-clock">
            <span>Your local time</span>
            <strong>
              {formatInZone(
                now,
                Intl.DateTimeFormat().resolvedOptions().timeZone,
              )}
            </strong>
            <small>
              {Intl.DateTimeFormat()
                .resolvedOptions()
                .timeZone.replaceAll("_", " ")}
            </small>
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <div>
              <p className="section-kicker">
                <Users size={16} /> PEOPLE
              </p>
              <h2>Who needs to connect?</h2>
            </div>

            <button
              className="primary-button"
              onClick={() => setShowForm((value) => !value)}
            >
              <Plus size={18} /> Add person
            </button>
          </div>

          {showForm && (
            <form className="add-form" onSubmit={addPerson}>
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
                  onChange={(event) =>
                    setSelectedCityLabel(event.target.value)
                  }
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
                  value={
                    selectedCity
                      ? selectedCity.timeZone.replaceAll("_", " ")
                      : "Select a city first"
                  }
                  readOnly
                  aria-readonly="true"
                />
              </label>

              <button
                className="primary-button form-submit"
                type="submit"
                disabled={!name.trim() || !selectedCity}
              >
                Save person
              </button>
            </form>
          )}

          <div className="people-grid">
            {people.map((person) => {
              const localHour = hourInZone(now, person.timeZone);
              const status =
                localHour >= person.workStart &&
                localHour < person.workEnd
                  ? "Working hours"
                  : "Outside work hours";

              return (
                <article className="person-card" key={person.id}>
                  <button
                    className="icon-button remove"
                    onClick={() => removePerson(person.id)}
                    aria-label={`Remove ${person.name}`}
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="avatar">
                    {person.name.slice(0, 1).toUpperCase()}
                  </div>

                  <div className="person-main">
                    <h3>{person.name}</h3>
                    <p>
                      {person.city ||
                        person.timeZone.replaceAll("_", " ")}
                    </p>
                    <span
                      className={
                        status === "Working hours"
                          ? "status online"
                          : "status"
                      }
                    >
                      {status}
                    </span>
                  </div>

                  <div className="person-time">
                    <strong>
                      {formatInZone(now, person.timeZone)}
                    </strong>
                    <span>
                      {formatInZone(now, person.timeZone, {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="section planner">
          <div className="section-heading">
            <div>
              <p className="section-kicker">
                <CalendarDays size={16} /> PLANNER
              </p>
              <h2>Best time to meet</h2>
            </div>

            <label className="date-field">
              Date
              <input
                type="date"
                value={dateValue}
                onChange={(event) =>
                  setDateValue(event.target.value)
                }
              />
            </label>
          </div>

          {recommendation && (
            <div className="recommendation">
              <div className="recommendation-icon">
                <Clock3 size={24} />
              </div>

              <div>
                <span>Recommended one-hour window</span>
                <strong>
                  {String(recommendation.utcHour).padStart(2, "0")}
                  :00 UTC
                </strong>
                <p>
                  {recommendation.available === recommendation.total
                    ? `All ${recommendation.total} people are within their normal working hours.`
                    : `${recommendation.available} of ${recommendation.total} people are within normal working hours.`}
                </p>
              </div>

              <div className="local-times">
                {people.map((person) => (
                  <div key={person.id}>
                    <span>{person.name}</span>
                    <strong>
                      {localLabel(
                        dateValue,
                        recommendation.utcHour,
                        person,
                      )}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="timeline-wrap">
            <div className="timeline-labels">
              <span>UTC</span>
              {hours.map((hour) => (
                <span key={hour.utcHour}>
                  {String(hour.utcHour).padStart(2, "0")}
                </span>
              ))}
            </div>

            {people.map((person) => (
              <div className="timeline-row" key={person.id}>
                <div className="row-name">
                  <strong>{person.name}</strong>
                  <span>
                    {person.timeZone
                      .split("/")
                      .pop()
                      ?.replaceAll("_", " ")}
                  </span>
                </div>

                {hours.map((hour) => {
                  const instant = dateAtUtcHour(
                    dateValue,
                    hour.utcHour,
                  );
                  const localHour = hourInZone(
                    instant,
                    person.timeZone,
                  );
                  const working =
                    localHour >= person.workStart &&
                    localHour < person.workEnd;
                  const selected =
                    recommendation?.utcHour === hour.utcHour;

                  return (
                    <div
                      className={`hour-cell ${
                        working ? "working" : ""
                      } ${selected ? "selected" : ""}`}
                      key={hour.utcHour}
                      title={`${person.name}: ${formatInZone(
                        instant,
                        person.timeZone,
                      )}`}
                    >
                      <span>
                        {String(localHour).padStart(2, "0")}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <p className="timeline-note">
            Highlighted cells represent each person’s default working
            hours, 09:00–18:00.
          </p>
        </section>

        <section className="section launch-section">
          <div>
            <p className="section-kicker">
              <Phone size={16} /> CONNECT
            </p>
            <h2>Move from planning to calling.</h2>
            <p>
              These MVP shortcuts open the provider. Automatic meeting
              creation comes later.
            </p>
          </div>

          <div className="launch-grid">
            <a
              href="https://wa.me/"
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle /> WhatsApp <ExternalLink size={15} />
            </a>
            <a
              href="https://zoom.us/start/videomeeting"
              target="_blank"
              rel="noreferrer"
            >
              <Video /> Zoom <ExternalLink size={15} />
            </a>
            <a
              href="https://t.me/"
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle /> Telegram <ExternalLink size={15} />
            </a>
            <a href="viber://chat" target="_blank" rel="noreferrer">
              <Phone /> Viber <ExternalLink size={15} />
            </a>
          </div>

          {selectedInstant && (
            <p className="selected-summary">
              Selected instant:{" "}
              <strong>{selectedInstant.toUTCString()}</strong>
            </p>
          )}
        </section>
      </main>

      <footer>
        <span>AtlasTime MVP</span>
        <span>Data stays in this browser.</span>
      </footer>
    </div>
  );
}
