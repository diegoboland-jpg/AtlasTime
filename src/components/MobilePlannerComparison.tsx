import { dateAtUtcHour, localRangeLabel, meetingFitsWorkingHours } from "../time";
import type { Person } from "../types";

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

  return (
    <div className="mobile-planner-comparison" aria-label="Phone-friendly meeting-hour comparison">
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
              <span className="mobile-person-planning">
                <small>Planning</small>
                <strong>{localRangeLabel(dateValue, selectedHour, durationMinutes, person)}</strong>
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
