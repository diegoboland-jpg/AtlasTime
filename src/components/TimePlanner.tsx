import { CalendarDays, Clock3, RotateCcw } from "lucide-react";
import { dateAtUtcHour, formatInZone, hourInZone, localLabel } from "../time";
import type { HourScore, Person } from "../types";

type TimePlannerProps = {
  people: Person[];
  dateValue: string;
  selectedHour: number;
  recommendation: HourScore | null;
  hours: HourScore[];
  onDateChange: (date: string) => void;
  onHourChange: (hour: number) => void;
  onNow: () => void;
};

export function TimePlanner({
  people,
  dateValue,
  selectedHour,
  recommendation,
  hours,
  onDateChange,
  onHourChange,
  onNow,
}: TimePlannerProps) {
  const selectedScore = hours[selectedHour];

  return (
    <section className="section planner">
      <div className="section-heading">
        <div>
          <p className="section-kicker"><CalendarDays size={16} /> PLANNER</p>
          <h2>Choose a humane meeting time</h2>
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
              {recommendation.penalty > 0 ? ` · discomfort penalty ${recommendation.penalty}` : " · no discomfort penalty"}.
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

      <div className="slider-panel">
        <div>
          <span>Selected meeting hour</span>
          <strong>{String(selectedHour).padStart(2, "0")}:00 UTC</strong>
        </div>
        <input
          className="time-slider"
          type="range"
          min="0"
          max="23"
          step="1"
          value={selectedHour}
          onChange={(event) => onHourChange(Number(event.target.value))}
          aria-label="Selected UTC meeting hour"
        />
        <div className="slider-actions">
          <p>
            {selectedScore?.available ?? 0}/{selectedScore?.total ?? 0} available · score {selectedScore?.score ?? 0}
          </p>
          <button type="button" onClick={onNow} title="Return to the current UTC date and hour">
            <RotateCcw size={14} /> Now
          </button>
        </div>
      </div>

      <div className="timeline-wrap">
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
