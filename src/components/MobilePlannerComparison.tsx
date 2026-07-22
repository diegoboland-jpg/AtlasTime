import { dateAtUtcHour, formatInZone, hourInZone, meetingFitsWorkingHours } from "../time";
import { timePeriodForHour } from "../timePeriods";
import type { Person } from "../types";
import { TimePeriodScene } from "./TimePeriodScene";

type MobilePlannerComparisonProps = {
  people: Person[];
  dateValue: string;
  selectedHour: number;
  durationMinutes: number;
};

export function MobilePlannerComparison({
  people,
  dateValue,
  selectedHour,
  durationMinutes,
}: MobilePlannerComparisonProps) {
  const selectedInstant = dateAtUtcHour(dateValue, selectedHour);
  const endInstant = new Date(selectedInstant.getTime() + durationMinutes * 60_000);
  const dateTimeOptions: Intl.DateTimeFormatOptions = { weekday: "short", day: "2-digit", month: "short" };

  return (
    <div className="mobile-planner-comparison" aria-label="Phone-friendly meeting-hour comparison">
      <div className="mobile-person-times" aria-live="polite">
        {people.map((person) => {
          const working = meetingFitsWorkingHours(person, selectedInstant, durationMinutes);
          const period = timePeriodForHour(hourInZone(selectedInstant, person.timeZone));
          const statusLabel = working
            ? "Working hours"
            : period.key === "night" || period.key === "evening"
              ? "Bedtime"
              : period.label;
          return (
            <article
              className={`mobile-person-time time-period-${period.key}`}
              key={person.id}
              aria-label={`${person.name}, planning from ${formatInZone(selectedInstant, person.timeZone, dateTimeOptions)} to ${formatInZone(endInstant, person.timeZone, dateTimeOptions)}, ${statusLabel}`}
            >
              <span className="mobile-person-profile">
                <span className="mobile-person-initial" aria-hidden="true">{person.name.slice(0, 1).toUpperCase()}</span>
                <span className="mobile-person-identity">
                  <strong>{person.name}</strong>
                  <small>{person.city || person.timeZone.replaceAll("_", " ")}</small>
                  <em className="planning-tag">Planning</em>
                </span>
              </span>
              <span className="mobile-person-range" key={`${selectedHour}-${durationMinutes}`}>
                <span><small>Start</small><strong>{formatInZone(selectedInstant, person.timeZone, dateTimeOptions)}</strong></span>
                <span><small>End</small><strong>{formatInZone(endInstant, person.timeZone, dateTimeOptions)}</strong></span>
              </span>
              <span className="mobile-person-period">
                <TimePeriodScene period={period.key} compact />
                <em className={working ? "working" : `outside period-${period.key}`}>{statusLabel}</em>
              </span>
            </article>
          );
        })}
        {people.length === 0 && <p className="mobile-planner-empty">Add people, locations, or teams to compare their local times.</p>}
      </div>
    </div>
  );
}
