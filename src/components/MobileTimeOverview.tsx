import { useEffect, useRef, useState } from "react";
import { Clock3, Coffee, Moon, RotateCcw, SunMedium, Sunrise, Sunset, Utensils } from "lucide-react";
import { formatInZone, hourInZone } from "../time";
import { timePeriodForHour, type TimePeriodKey } from "../timePeriods";
import type { HourScore, Person } from "../types";
import { TimePeriodScene } from "./TimePeriodScene";

type MobileTimeOverviewProps = {
  now: Date;
  people: Person[];
  selectedInstant: Date;
  selectedHour: number;
  selectedScore: HourScore | undefined;
  recommendation: HourScore | null;
  onHourChange: (hour: number) => void;
  onNow: () => void;
  onOpenPlanner: () => void;
};

const RETURN_TO_NOW_MS = 20_000;

function dayLabel(date: Date, timeZone: string) {
  return formatInZone(date, timeZone, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function PeriodIcon({ period }: { period: TimePeriodKey }) {
  const Icon = period === "night"
    ? Moon
    : period === "morning"
      ? Sunrise
      : period === "lunch"
        ? Coffee
        : period === "afternoon"
          ? SunMedium
          : period === "dinner"
            ? Utensils
            : Sunset;
  return <Icon size={11} aria-hidden="true" />;
}

export function MobileTimeOverview({
  now,
  people,
  selectedInstant,
  selectedHour,
  selectedScore,
  recommendation,
  onHourChange,
  onNow,
  onOpenPlanner,
}: MobileTimeOverviewProps) {
  const returnTimer = useRef<number | undefined>(undefined);
  const [returnPending, setReturnPending] = useState(false);
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const hourLabel = `${String(selectedHour).padStart(2, "0")}:00 UTC`;
  const available = selectedScore?.available ?? 0;
  const total = selectedScore?.total ?? 0;
  const overviewInstant = returnPending ? selectedInstant : now;
  const overviewHour = hourInZone(overviewInstant, localTimeZone);
  const overviewPeriod = timePeriodForHour(overviewHour);

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
      <article
        className={`mobile-current-time time-period-${overviewPeriod.key} ${returnPending ? "exploring" : ""}`}
        key={overviewInstant.toISOString()}
        aria-label={`${returnPending ? "Exploring" : "Current"} device time is ${formatInZone(overviewInstant, localTimeZone)}`}
      >
        <TimePeriodScene period={overviewPeriod.key} />
        <div>
          <span>{returnPending ? "Exploring time" : "Current time"}</span>
          <small>{returnPending ? "Linked to the 24-hour slider" : "Your device time zone"} - {localTimeZone.replaceAll("_", " ")}</small>
        </div>
        <strong>{formatInZone(overviewInstant, localTimeZone)}</strong>
        <em>
          {dayLabel(overviewInstant, localTimeZone)}
          <span className="time-period-badge"><PeriodIcon period={overviewPeriod.key} /> {overviewPeriod.label}</span>
        </em>
      </article>

      <div className="mobile-overview-heading">
        <div>
          <span><Clock3 size={14} aria-hidden="true" /> At a glance</span>
          <h1 id="mobile-overview-heading">Everyone's time</h1>
        </div>
        <strong>{hourLabel}</strong>
      </div>

      <p id="mobile-time-strip-help" className="sr-only">
        Group times are shown as a scrollable list. Each entry includes its place, selected local time, time of day, and working-hours status.
      </p>
      <div
        className="mobile-time-strip"
        role="list"
        aria-label="Selected group times"
        aria-describedby="mobile-time-strip-help"
        tabIndex={people.length > 4 ? 0 : undefined}
      >
        {people.map((person) => {
          const localHour = hourInZone(selectedInstant, person.timeZone);
          const working = localHour >= person.workStart && localHour < person.workEnd;
          const period = timePeriodForHour(localHour);
          const placeLabel = person.city || person.timeZone.replaceAll("_", " ");
          return (
            <article
              className={`compact-time-card time-period-${period.key}`}
              key={`${person.id}-${selectedInstant.toISOString()}`}
              role="listitem"
              aria-label={`${person.name}, ${placeLabel}: ${formatInZone(selectedInstant, person.timeZone)}, ${period.label}, ${working ? "working hours" : "outside work hours"}`}
            >
              <TimePeriodScene period={period.key} compact />
              <div className="compact-place-rotator" aria-label={`${person.name}, ${placeLabel}`}>
                <span aria-hidden="true">{person.name}</span>
                <small aria-hidden="true">{placeLabel}</small>
              </div>
              <strong className="tile-time-value">
                {formatInZone(selectedInstant, person.timeZone)}
              </strong>
              <p><span>Meeting time</span><span className="time-period-badge"><PeriodIcon period={period.key} /> {period.label}</span></p>
              <em className={working ? "working" : ""}>
                {dayLabel(selectedInstant, person.timeZone)} - {working ? "Working hours" : "Outside work hours"}
              </em>
            </article>
          );
        })}
        {people.length === 0 && <p className="mobile-time-empty" role="status">Add people, locations, or teams below.</p>}
      </div>

      {recommendation && (
        <div className="mobile-recommendation" aria-label={`Recommended meeting time ${recommendation.utcHour}:00 UTC`}>
          <div>
            <span>Recommended</span>
            <strong>{String(recommendation.utcHour).padStart(2, "0")}:00 UTC</strong>
            <small>{recommendation.available}/{recommendation.total} in working hours</small>
          </div>
          <button type="button" onClick={() => onHourChange(recommendation.utcHour)}>Use time</button>
          <button type="button" className="mobile-compare-button" onClick={onOpenPlanner}>Compare all hours</button>
        </div>
      )}

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
