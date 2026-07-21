import { type KeyboardEvent, useLayoutEffect, useRef } from "react";
import { dateAtUtcHour, formatInZone, formatUtcHour, localRangeLabel, meetingFitsWorkingHours } from "../time";
import type { HourScore, Person } from "../types";

type MobilePlannerComparisonProps = {
  people: Person[];
  dateValue: string;
  selectedHour: number;
  durationMinutes: number;
  recommendation: HourScore | null;
  hours: HourScore[];
  onHourChange: (hour: number) => void;
};

export function MobilePlannerComparison({
  people,
  dateValue,
  selectedHour,
  durationMinutes,
  recommendation,
  hours,
  onHourChange,
}: MobilePlannerComparisonProps) {
  const selectedInstant = dateAtUtcHour(dateValue, selectedHour);
  const hourScroller = useRef<HTMLDivElement | null>(null);
  const selectedOption = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    const scroller = hourScroller.current;
    const option = selectedOption.current;
    if (!scroller || !option) return;

    const centerSelectedHour = () => {
      scroller.scrollLeft = Math.max(0, option.offsetLeft - (scroller.clientWidth - option.clientWidth) / 2);
    };
    centerSelectedHour();
    const frame = window.requestAnimationFrame(centerSelectedHour);
    const handleResize = () => centerSelectedHour();
    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
    };
  }, [selectedHour]);

  function handleHourKeys(event: KeyboardEvent<HTMLButtonElement>, hour: number) {
    const currentIndex = hours.findIndex((candidate) => candidate.utcHour === hour);
    const nextIndex = event.key === "ArrowRight"
      ? Math.min(hours.length - 1, currentIndex + 1)
      : event.key === "ArrowLeft"
        ? Math.max(0, currentIndex - 1)
        : event.key === "Home"
          ? 0
          : event.key === "End"
            ? hours.length - 1
            : null;

    if (nextIndex === null) return;
    event.preventDefault();
    const nextHour = hours[nextIndex].utcHour;
    const nextOption = event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-utc-hour="${nextHour}"]`);
    nextOption?.focus();
    onHourChange(nextHour);
  }

  return (
    <div className="mobile-planner-comparison" aria-label="Phone-friendly meeting-hour comparison">
      <div className="mobile-planner-intro">
        <div>
          <span>Selected meeting hour</span>
          <strong>{formatUtcHour(selectedHour)}</strong>
        </div>
        <small>Swipe or use arrow keys, then compare everyone below.</small>
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
              aria-keyshortcuts="ArrowLeft ArrowRight Home End"
              aria-label={`${formatUtcHour(hour.utcHour)}, ${hour.available} of ${hour.total} available for ${durationMinutes} minutes${best ? ", best-scoring start" : ""}`}
              data-utc-hour={hour.utcHour}
              onClick={() => onHourChange(hour.utcHour)}
              onKeyDown={(event) => handleHourKeys(event, hour.utcHour)}
            >
              <span>{formatUtcHour(hour.utcHour).replace(" UTC", "")}</span>
              <small>{hour.available}/{hour.total} free</small>
              {best && <em>Best</em>}
            </button>
          );
        })}
      </div>

      <div className="mobile-person-times" aria-live="polite">
        {people.map((person) => {
          const working = meetingFitsWorkingHours(person, selectedInstant, durationMinutes);
          return (
            <article className="mobile-person-time" key={person.id}>
              <span className="mobile-person-initial" aria-hidden="true">{person.name.slice(0, 1).toUpperCase()}</span>
              <span className="mobile-person-identity">
                <strong>{person.name}</strong>
                <small>{person.city || person.timeZone.replaceAll("_", " ")}</small>
              </span>
              <span className="mobile-person-local-time">
                <strong>{formatInZone(selectedInstant, person.timeZone)}</strong>
                <small>{localRangeLabel(dateValue, selectedHour, durationMinutes, person)}</small>
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
