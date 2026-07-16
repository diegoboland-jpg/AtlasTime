import { Clock3, RotateCcw } from "lucide-react";
import { formatInZone, hourInZone } from "../time";
import type { HourScore, Person } from "../types";

type MobileTimeOverviewProps = {
  now: Date;
  people: Person[];
  selectedInstant: Date;
  selectedHour: number;
  selectedScore: HourScore | undefined;
  onHourChange: (hour: number) => void;
  onNow: () => void;
};

function dayLabel(date: Date, timeZone: string) {
  return formatInZone(date, timeZone, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export function MobileTimeOverview({
  now,
  people,
  selectedInstant,
  selectedHour,
  selectedScore,
  onHourChange,
  onNow,
}: MobileTimeOverviewProps) {
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const hourLabel = `${String(selectedHour).padStart(2, "0")}:00 UTC`;
  const available = selectedScore?.available ?? 0;
  const total = selectedScore?.total ?? 0;

  return (
    <section className="mobile-time-overview" aria-labelledby="mobile-overview-heading">
      <div className="mobile-overview-heading">
        <div>
          <span><Clock3 size={14} aria-hidden="true" /> At a glance</span>
          <h1 id="mobile-overview-heading">Everyone's time</h1>
        </div>
        <strong>{hourLabel}</strong>
      </div>

      <div className="mobile-time-strip" role="region" aria-label="Local and group times" tabIndex={0}>
        <article className="compact-time-card local-card">
          <span>You</span>
          <small>{localTimeZone.replaceAll("_", " ")}</small>
          <strong>{formatInZone(now, localTimeZone)}</strong>
          <p>Selected {formatInZone(selectedInstant, localTimeZone)}</p>
          <em>{dayLabel(selectedInstant, localTimeZone)}</em>
        </article>

        {people.map((person) => {
          const localHour = hourInZone(now, person.timeZone);
          const working = localHour >= person.workStart && localHour < person.workEnd;
          return (
            <article className="compact-time-card" key={person.id}>
              <span>{person.name}</span>
              <small>{person.city || person.timeZone.replaceAll("_", " ")}</small>
              <strong>{formatInZone(now, person.timeZone)}</strong>
              <p>Selected {formatInZone(selectedInstant, person.timeZone)}</p>
              <em className={working ? "working" : ""}>{working ? "Working now" : dayLabel(selectedInstant, person.timeZone)}</em>
            </article>
          );
        })}
      </div>

      <div className="mobile-overview-slider">
        <label htmlFor="mobile-time-slider">
          <span>Explore 24 hours</span>
          <small>{available}/{total} available - score {selectedScore?.score ?? 0}</small>
        </label>
        <input
          id="mobile-time-slider"
          type="range"
          min="0"
          max="23"
          step="1"
          value={selectedHour}
          onChange={(event) => onHourChange(Number(event.target.value))}
          aria-label="Selected UTC meeting hour in mobile overview"
          aria-valuetext={`${hourLabel}, ${available} of ${total} available`}
        />
        <button type="button" onClick={onNow} title="Return to the current UTC date and hour">
          <RotateCcw size={14} aria-hidden="true" /> Now
        </button>
      </div>

      <p className="sr-only" aria-live="polite">
        Selected meeting time {hourLabel}. {available} of {total} entries are within working hours.
      </p>
    </section>
  );
}
