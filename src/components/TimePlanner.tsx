import { CalendarDays, Clock3 } from "lucide-react";
import { dateAtUtcHour, formatInZone, hourInZone, localLabel } from "../time";
import type { HourScore, Person } from "../types";
import { MobilePlannerComparison } from "./MobilePlannerComparison";

type TimePlannerProps = {
  people: Person[];
  dateValue: string;
  selectedHour: number;
  recommendation: HourScore | null;
  hours: HourScore[];
  onDateChange: (date: string) => void;
  onHourChange: (hour: number) => void;
};

export function TimePlanner({
  people,
  dateValue,
  selectedHour,
  recommendation,
  hours,
  onDateChange,
  onHourChange,
}: TimePlannerProps) {
  return (
    <section className="section planner" aria-labelledby="planner-heading">
      <div className="section-heading">
        <div>
          <p className="section-kicker"><CalendarDays size={16} /> PLANNER</p>
          <h2 id="planner-heading">Choose a humane meeting time</h2>
        </div>
        <label className="date-field">
          Date
          <input type="date" value={dateValue} onChange={(event) => onDateChange(event.target.value)} />
        </label>
      </div>

      {recommendation && (
        <button
          className="recommendation"
          type="button"
          onClick={() => onHourChange(recommendation.utcHour)}
        >
          <span className="recommendation-icon"><Clock3 size={24} /></span>
          <span className="recommendation-copy">
            <span>Best-scoring one-hour window</span>
            <strong>{String(recommendation.utcHour).padStart(2, "0")}:00 UTC</strong>
            <small>
              {recommendation.available} of {recommendation.total} people in working hours
              {recommendation.penalty > 0 ? ` - discomfort penalty ${recommendation.penalty}` : " - no discomfort penalty"}.
            </small>
          </span>
          <span className="local-times">
            {people.map((person) => (
              <span key={person.id}>
                <small>{person.name}</small>
                <strong>{localLabel(dateValue, recommendation.utcHour, person)}</strong>
              </span>
            ))}
          </span>
        </button>
      )}

      <MobilePlannerComparison
        people={people}
        dateValue={dateValue}
        selectedHour={selectedHour}
        recommendation={recommendation}
        hours={hours}
        onHourChange={onHourChange}
      />

      <div className="timeline-wrap" role="region" aria-label="Scrollable 24-hour local-time comparison" tabIndex={0}>
        <div className="timeline-labels">
          <span>UTC</span>
          {hours.map((hour) => (
            <button
              type="button"
              key={hour.utcHour}
              className={selectedHour === hour.utcHour ? "active" : ""}
              onClick={() => onHourChange(hour.utcHour)}
              aria-label={`Select ${hour.utcHour}:00 UTC`}
            >
              {String(hour.utcHour).padStart(2, "0")}
            </button>
          ))}
        </div>

        {people.map((person) => (
          <div className="timeline-row" key={person.id}>
            <div className="row-name">
              <strong>{person.name}</strong>
              <span>{person.timeZone.split("/").pop()?.replaceAll("_", " ")}</span>
            </div>
            {hours.map((hour) => {
              const instant = dateAtUtcHour(dateValue, hour.utcHour);
              const localHour = hourInZone(instant, person.timeZone);
              const working = localHour >= person.workStart && localHour < person.workEnd;
              return (
                <button
                  type="button"
                  className={`hour-cell ${working ? "working" : ""} ${selectedHour === hour.utcHour ? "selected" : ""}`}
                  key={hour.utcHour}
                  title={`${person.name}: ${formatInZone(instant, person.timeZone)}`}
                  aria-label={`${person.name}: ${formatInZone(instant, person.timeZone)}, ${working ? "within" : "outside"} working hours. Select ${hour.utcHour}:00 UTC`}
                  onClick={() => onHourChange(hour.utcHour)}
                >
                  {String(localHour).padStart(2, "0")}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <p className="timeline-note">
        Click any UTC hour or local-time cell to select it. Green cells use each person&apos;s editable working hours; scoring also penalizes very early (before 07:00) and very late (21:00 or later) local times.
      </p>
    </section>
  );
}
