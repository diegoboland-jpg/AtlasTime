import { useEffect, useRef, useState } from "react";
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

const RETURN_TO_NOW_MS = 20_000;

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
  const returnTimer = useRef<number | undefined>(undefined);
  const [returnPending, setReturnPending] = useState(false);
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const hourLabel = `${String(selectedHour).padStart(2, "0")}:00 UTC`;
  const available = selectedScore?.available ?? 0;
  const total = selectedScore?.total ?? 0;

  useEffect(() => () => window.clearTimeout(returnTimer.current), []);

  function scheduleReturnToNow(hour: number) {
    onHourChange(hour);
    window.clearTimeout(returnTimer.current);
    setReturnPending(true);
    returnTimer.current = window.setTimeout(() => {
      setReturnPending(false);
      onNow();
    }, RETURN_TO_NOW_MS);
  }

  function returnToNow() {
    window.clearTimeout(returnTimer.current);
    setReturnPending(false);
    onNow();
  }

  return (
    <section className="mobile-time-overview" aria-labelledby="mobile-overview-heading">
      <article className="mobile-current-time" aria-label={`Your current time is ${formatInZone(now, localTimeZone)}`}>
        <div>
          <span>Current time</span>
          <small>Your device time zone - {localTimeZone.replaceAll("_", " ")}</small>
        </div>
        <strong>{formatInZone(now, localTimeZone)}</strong>
        <em>{dayLabel(now, localTimeZone)}</em>
      </article>

      <div className="mobile-overview-heading">
        <div>
          <span><Clock3 size={14} aria-hidden="true" /> At a glance</span>
          <h1 id="mobile-overview-heading">Everyone's time</h1>
        </div>
        <strong>{hourLabel}</strong>
      </div>

      <div className="mobile-time-strip" role="region" aria-label="Selected group times" tabIndex={0}>
        {people.map((person) => {
          const localHour = hourInZone(selectedInstant, person.timeZone);
          const working = localHour >= person.workStart && localHour < person.workEnd;
          return (
            <article className="compact-time-card" key={person.id}>
              <span>{person.name}</span>
              <small>{person.city || person.timeZone.replaceAll("_", " ")}</small>
              <strong className="tile-time-value" key={`${person.id}-${selectedInstant.toISOString()}`}>
                {formatInZone(selectedInstant, person.timeZone)}
              </strong>
              <p>Meeting time</p>
              <em className={working ? "working" : ""}>
                {dayLabel(selectedInstant, person.timeZone)} - {working ? "Working hours" : "Outside work hours"}
              </em>
            </article>
          );
        })}
        {people.length === 0 && <p className="mobile-time-empty">Add people, locations, or teams below.</p>}
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
          onChange={(event) => scheduleReturnToNow(Number(event.target.value))}
          aria-label="Selected UTC meeting hour in mobile overview"
          aria-valuetext={`${hourLabel}, ${available} of ${total} available`}
        />
        <button type="button" onClick={returnToNow} title="Return to the current UTC date and hour">
          <RotateCcw size={14} aria-hidden="true" /> Now
        </button>
        <p className="mobile-return-note" aria-live="polite">
          {returnPending ? "Returning to current time after 20 seconds." : "Move the slider to explore; Now restores current time."}
        </p>
      </div>

      <p className="sr-only" aria-live="polite">
        Selected meeting time {hourLabel}. {available} of {total} entries are within working hours.
      </p>
    </section>
  );
}
