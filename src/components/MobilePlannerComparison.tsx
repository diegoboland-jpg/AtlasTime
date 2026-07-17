import { useEffect, useRef } from "react";
import { dateAtUtcHour, formatInZone, hourInZone } from "../time";
import type { HourScore, Person } from "../types";

type MobilePlannerComparisonProps = {
  people: Person[];
  dateValue: string;
  selectedHour: number;
  recommendation: HourScore | null;
  hours: HourScore[];
  onHourChange: (hour: number) => void;
};

export function MobilePlannerComparison({
  people,
  dateValue,
  selectedHour,
  recommendation,
  hours,
  onHourChange,
}: MobilePlannerComparisonProps) {
  const selectedInstant = dateAtUtcHour(dateValue, selectedHour);
  const hourScroller = useRef<HTMLDivElement | null>(null);
  const selectedOption = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const scroller = hourScroller.current;
    const option = selectedOption.current;
    if (!scroller || !option) return;
    scroller.scrollTo({
      left: option.offsetLeft - (scroller.clientWidth - option.clientWidth) / 2,
      behavior: "smooth",
    });
  }, [selectedHour]);

  return (
    <div className="mobile-planner-comparison" aria-label="Phone-friendly meeting-hour comparison">
      <div className="mobile-planner-intro">
        <div>
          <span>Selected meeting hour</span>
          <strong>{String(selectedHour).padStart(2, "0")}:00 UTC</strong>
        </div>
        <small>Swipe the hours, then compare everyone below.</small>
      </div>

      <div className="mobile-hour-scroller" role="list" aria-label="Choose a UTC meeting hour" ref={hourScroller}>
        {hours.map((hour) => {
          const selected = selectedHour === hour.utcHour;
          const best = recommendation?.utcHour === hour.utcHour;
          return (
            <button
              type="button"
              role="listitem"
              className={`mobile-hour-option ${selected ? "selected" : ""} ${best ? "best" : ""}`}
              key={hour.utcHour}
              ref={selected ? selectedOption : undefined}
              aria-pressed={selected}
              aria-label={`${hour.utcHour}:00 UTC, ${hour.available} of ${hour.total} available${best ? ", best-scoring hour" : ""}`}
              onClick={() => onHourChange(hour.utcHour)}
            >
              <span>{String(hour.utcHour).padStart(2, "0")}:00</span>
              <small>{hour.available}/{hour.total} free</small>
              {best && <em>Best</em>}
            </button>
          );
        })}
      </div>

      <div className="mobile-person-times" aria-live="polite">
        {people.map((person) => {
          const localHour = hourInZone(selectedInstant, person.timeZone);
          const working = localHour >= person.workStart && localHour < person.workEnd;
          return (
            <article className="mobile-person-time" key={person.id}>
              <span className="mobile-person-initial" aria-hidden="true">{person.name.slice(0, 1).toUpperCase()}</span>
              <span className="mobile-person-identity">
                <strong>{person.name}</strong>
                <small>{person.city || person.timeZone.replaceAll("_", " ")}</small>
              </span>
              <span className="mobile-person-local-time">
                <strong>{formatInZone(selectedInstant, person.timeZone)}</strong>
                <small>{new Intl.DateTimeFormat("en-GB", {
                  timeZone: person.timeZone,
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                }).format(selectedInstant)}</small>
              </span>
              <em className={working ? "working" : "outside"}>{working ? "Working hours" : "Outside hours"}</em>
            </article>
          );
        })}
        {people.length === 0 && <p className="mobile-planner-empty">Add people, locations, or teams to compare their local times.</p>}
      </div>
    </div>
  );
}
