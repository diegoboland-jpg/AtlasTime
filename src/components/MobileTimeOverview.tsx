import { useEffect, useRef, useState } from "react";
import { Clock3, Coffee, Moon, Plus, RotateCcw, SunMedium, Sunrise, Sunset, Utensils } from "lucide-react";
import { getCountryByTimeZone } from "../cities";
import { countryCodeToFlag } from "../country";
import { formatInZone, formatUtcHour, hourInZone } from "../time";
import { timePeriodForHour, type TimePeriodKey } from "../timePeriods";
import type { HourScore, Person } from "../types";
import { TimePeriodScene } from "./TimePeriodScene";

type MobileTimeOverviewProps = {
  now: Date;
  people: Person[];
  selectedInstant: Date;
  selectedHour: number;
  selectedScore: HourScore | undefined;
  onHourChange: (hour: number) => void;
  onNow: () => void;
  onOpenPlanner: () => void;
  onAddEntry: () => void;
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
  onHourChange,
  onNow,
  onOpenPlanner,
  onAddEntry,
}: MobileTimeOverviewProps) {
  const returnTimer = useRef<number | undefined>(undefined);
  const [returnPending, setReturnPending] = useState(false);
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const selectedHourLabel = formatUtcHour(selectedHour);
  const available = selectedScore?.available ?? 0;
  const total = selectedScore?.total ?? 0;
  const overviewInstant = returnPending ? selectedInstant : now;
  const tileInstant = returnPending ? selectedInstant : now;
  const hourLabel = returnPending ? selectedHourLabel : `${formatInZone(now, "UTC")} UTC`;
  const overviewHour = hourInZone(overviewInstant, localTimeZone);
  const overviewPeriod = timePeriodForHour(overviewHour);
  const emptySlots = Math.max(0, 6 - people.length);

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
        Six group slots are shown. Filled entries include their place, local time, time of day, and working-hours status. Empty slots add a person, location, or team. Additional entries scroll below the first six.
      </p>
      <div
        className="mobile-time-strip"
        role="list"
        aria-label="Selected group times"
        aria-describedby="mobile-time-strip-help"
        tabIndex={people.length > 6 ? 0 : undefined}
      >
        {people.map((person) => {
          const localHour = hourInZone(tileInstant, person.timeZone);
          const working = localHour >= person.workStart && localHour < person.workEnd;
          const period = timePeriodForHour(localHour);
          const placeLabel = person.city || person.timeZone.replaceAll("_", " ");
          const countryFlag = countryCodeToFlag(person.countryCode ?? getCountryByTimeZone(person.timeZone)?.countryCode);
          return (
            <article
              className={`compact-time-card time-period-${period.key}`}
              key={`${person.id}-${tileInstant.toISOString()}`}
              role="listitem"
              aria-label={`${person.name}, ${placeLabel}: ${formatInZone(tileInstant, person.timeZone)}, ${period.label}, ${working ? "working hours" : "outside work hours"}`}
            >
              {countryFlag && <span className="country-flag-backdrop" aria-hidden="true">{countryFlag}</span>}
              <TimePeriodScene period={period.key} compact />
              <div className="compact-place-rotator" aria-label={`${person.name}, ${placeLabel}`}>
                <span aria-hidden="true">{person.name}</span>
                <small aria-hidden="true">{placeLabel}</small>
              </div>
              <strong className="tile-time-value">
                {formatInZone(tileInstant, person.timeZone)}
              </strong>
              <p><span>Meeting time</span><span className="time-period-badge"><PeriodIcon period={period.key} /> {period.label}</span></p>
              <em className={working ? "working" : ""}>
                {dayLabel(tileInstant, person.timeZone)} - {working ? "Working hours" : "Outside work hours"}
              </em>
            </article>
          );
        })}
        {Array.from({ length: emptySlots }, (_, index) => (
          <div className="add-time-slot" role="listitem" key={`empty-slot-${index}`}>
            <button type="button" onClick={onAddEntry} aria-label="Add a person, location, or team">
              <Plus size={24} aria-hidden="true" />
              <span>Add location or person</span>
            </button>
          </div>
        ))}
      </div>

      {people.length > 0 && (
        <div className="mobile-planner-shortcut">
          <span>Need a recommended meeting time?</span>
          <button type="button" onClick={onOpenPlanner}>Open planner</button>
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
          max="23.5"
          step="0.5"
          value={selectedHour}
          onChange={(event) => scheduleReturnToNow(Number(event.target.value))}
          aria-label="Selected UTC meeting hour in mobile overview"
          aria-valuetext={`${selectedHourLabel}, ${available} of ${total} available`}
        />
        <button type="button" onClick={returnToNow} title="Return to the current UTC date and hour">
          <RotateCcw size={14} aria-hidden="true" /> Now
        </button>
        <p className="mobile-return-note" aria-live="polite">
          {returnPending ? "Returning to current time after 20 seconds." : "Move the slider to explore; Now restores current time."}
        </p>
      </div>

      <p className="sr-only" aria-live="polite">
        Selected meeting time {selectedHourLabel}. {available} of {total} entries are within working hours.
      </p>
    </section>
  );
}
