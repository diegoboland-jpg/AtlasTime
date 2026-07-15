import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Globe2, MessageCircle, Phone, Plus, Users, Video } from "lucide-react";
import { AddPersonForm } from "./components/AddPersonForm";
import { PersonCard } from "./components/PersonCard";
import { TimePlanner } from "./components/TimePlanner";
import { starterPeople } from "./data";
import { bestHour, dateAtUtcHour, formatInZone, scoreHours } from "./time";
import type { Person } from "./types";

const PEOPLE_STORAGE_KEY = "atlastime.people.v1";
const PLANNER_STORAGE_KEY = "atlastime.planner.v1";

function todayInput() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function loadPeople(): Person[] {
  try {
    const raw = localStorage.getItem(PEOPLE_STORAGE_KEY);
    return raw ? JSON.parse(raw) as Person[] : starterPeople;
  } catch {
    return starterPeople;
  }
}

function loadPlanner() {
  try {
    const raw = localStorage.getItem(PLANNER_STORAGE_KEY);
    if (!raw) return { date: todayInput(), hour: 12 };
    const parsed = JSON.parse(raw) as { date?: string; hour?: number };
    return {
      date: parsed.date || todayInput(),
      hour: Number.isInteger(parsed.hour) && parsed.hour! >= 0 && parsed.hour! <= 23 ? parsed.hour! : 12,
    };
  } catch {
    return { date: todayInput(), hour: 12 };
  }
}

export default function App() {
  const [people, setPeople] = useState<Person[]>(loadPeople);
  const [planner, setPlanner] = useState(loadPlanner);
  const [now, setNow] = useState(new Date());
  const [showForm, setShowForm] = useState(false);

  useEffect(() => localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(people)), [people]);
  useEffect(() => localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(planner)), [planner]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  const hours = useMemo(() => scoreHours(people, planner.date), [people, planner.date]);
  const recommendation = useMemo(() => bestHour(people, planner.date), [people, planner.date]);
  const selectedInstant = dateAtUtcHour(planner.date, planner.hour);

  function updatePerson(updated: Person) {
    setPeople((current) => current.map((person) => person.id === updated.id ? updated : person));
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="AtlasTime home">
          <span className="brand-mark"><Globe2 size={20} /></span>
          <span>AtlasTime</span>
        </a>
        <span className="mvp-badge">v0.4 interactive planner</span>
      </header>

      <main>
        <section className="hero">
          <div>
            <p className="eyebrow">TIME ZONES, WITHOUT THE MATH</p>
            <h1>Find a humane time<br />for everyone.</h1>
            <p className="hero-copy">Explore every hour, compare live local times, and choose a fair meeting window.</p>
          </div>
          <div className="hero-clock">
            <span>Your local time</span>
            <strong>{formatInZone(now, Intl.DateTimeFormat().resolvedOptions().timeZone)}</strong>
            <small>{Intl.DateTimeFormat().resolvedOptions().timeZone.replaceAll("_", " ")}</small>
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <div>
              <p className="section-kicker"><Users size={16} /> PEOPLE</p>
              <h2>Who needs to connect?</h2>
            </div>
            <button className="primary-button" onClick={() => setShowForm((value) => !value)}>
              <Plus size={18} /> Add person
            </button>
          </div>

          {showForm && (
            <AddPersonForm
              onAdd={(person) => { setPeople((current) => [...current, person]); setShowForm(false); }}
              onCancel={() => setShowForm(false)}
            />
          )}

          <div className="people-grid">
            {people.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                now={now}
                onChange={updatePerson}
                onRemove={(id) => setPeople((current) => current.filter((item) => item.id !== id))}
              />
            ))}
          </div>
        </section>

        <TimePlanner
          people={people}
          dateValue={planner.date}
          selectedHour={planner.hour}
          recommendation={recommendation}
          hours={hours}
          onDateChange={(date) => setPlanner((current) => ({ ...current, date }))}
          onHourChange={(hour) => setPlanner((current) => ({ ...current, hour }))}
        />

        <section className="section launch-section">
          <div>
            <p className="section-kicker"><Phone size={16} /> CONNECT</p>
            <h2>Move from planning to calling.</h2>
            <p>These shortcuts only open each provider. AtlasTime does not create meetings or connect calendars yet.</p>
          </div>
          <div className="launch-grid">
            <a href="https://wa.me/" target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp <ExternalLink size={15} /></a>
            <a href="https://zoom.us/start/videomeeting" target="_blank" rel="noreferrer"><Video /> Zoom <ExternalLink size={15} /></a>
            <a href="https://t.me/" target="_blank" rel="noreferrer"><MessageCircle /> Telegram <ExternalLink size={15} /></a>
            <a href="viber://chat"><Phone /> Viber <ExternalLink size={15} /></a>
          </div>
          <p className="selected-summary">Selected instant: <strong>{selectedInstant.toUTCString()}</strong></p>
        </section>
      </main>

      <footer><span>AtlasTime v0.4</span><span>People and planner choices stay in this browser.</span></footer>
    </div>
  );
}
