import { CalendarDays, ChevronDown, ChevronUp, Clock3 } from "lucide-react";
import { dateAtUtcHour, formatInZone, formatUtcHour, localRangeLabel, meetingFitsWorkingHours } from "../time";
import type { HourScore, Person } from "../types";
import { MobilePlannerComparison } from "./MobilePlannerComparison";

type TimePlannerProps = {
  people: Person[];
  dateValue: string;
  selectedHour: number;
  durationMinutes: number;
  recommendation: HourScore | null;
  hours: HourScore[];
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onDateChange: (date: string) => void;
  onDurationChange: (duration: number) => void;
  onHourChange: (hour: number) => void;
};

export function TimePlanner({
  people,
  dateValue,
  selectedHour,
  durationMinutes,
  recommendation,
  hours,
  expanded,
  onExpandedChange,
  onDateChange,
  onDurationChange,
  onHourChange,
}: TimePlannerProps) {
  const exactStartMinutes = Math.round(selectedHour * 60) % (24 * 60);
  const exactStartValue = `${String(Math.floor(exactStartMinutes / 60)).padStart(2, "0")}:${String(exactStartMinutes % 60).padStart(2, "0")}`;

  function selectExactStart(value: string) {
    const [hour, minute] = value.split(":").map(Number);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return;
    onHourChange(hour + minute / 60);
  }

  return (
    <section className={`section planner ${expanded ? "expanded" : "collapsed"}`} id="planner" aria-labelledby="planner-heading">
      <div className="section-heading planner-disclosure-heading">
        <div>
          <p className="section-kicker"><CalendarDays size={16} /> PLANNER</p>
          <h2 id="planner-heading">Compare every hour when you need it</h2>
          <p className="planner-helper">The best time is already shown above. Open the detailed comparison for date changes and the full 24-hour view.</p>
        </div>
        <button
          type="button"
          className="secondary-button planner-toggle"
          aria-expanded={expanded}
          aria-controls="planner-analysis"
          onClick={() => onExpandedChange(!expanded)}
        >
          {expanded ? <><ChevronUp size={17} /> Hide comparison</> : <><ChevronDown size={17} /> Compare all hours</>}
        </button>
      </div>

      {expanded && (
        <div className="planner-analysis" id="planner-analysis">
          <div className="planner-detail-toolbar">
            <strong>Detailed comparison</strong>
            <label className="date-field">
              Date
              <input type="date" value={dateValue} onChange={(event) => onDateChange(event.target.value)} />
            </label>
            <label className="date-field">
              Duration (minutes)
              <input
                type="number"
                min="1"
                max="1440"
                step="1"
                list="duration-suggestions"
                value={durationMinutes}
                onChange={(event) => {
                  const minutes = Number(event.target.value);
                  if (Number.isInteger(minutes) && minutes >= 1 && minutes <= 1440) onDurationChange(minutes);
                }}
              />
            </label>
            <datalist id="duration-suggestions">
              {[15, 30, 45, 60, 90, 120].map((minutes) => <option key={minutes} value={minutes} />)}
            </datalist>
            <label className="date-field">
              Exact UTC start
              <input
                type="time"
                step="60"
                value={exactStartValue}
                onInput={(event) => selectExactStart(event.currentTarget.value)}
              />
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
                <span>Best-scoring {durationMinutes}-minute window</span>
                <strong>{formatUtcHour(recommendation.utcHour)}</strong>
                <small>
                  {recommendation.available} of {recommendation.total} people in working hours
                  {recommendation.penalty > 0 ? ` - discomfort penalty ${recommendation.penalty}` : " - no discomfort penalty"}.
                </small>
              </span>
              <span className="local-times">
                {people.map((person) => (
                  <span key={person.id}>
                    <small>{person.name}</small>
                    <strong>{localRangeLabel(dateValue, recommendation.utcHour, durationMinutes, person)}</strong>
                  </span>
                ))}
              </span>
            </button>
          )}

          <MobilePlannerComparison
            people={people}
            dateValue={dateValue}
            selectedHour={selectedHour}
            durationMinutes={durationMinutes}
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
                  aria-label={`Select ${formatUtcHour(hour.utcHour)}`}
                >
                  {formatUtcHour(hour.utcHour).replace(" UTC", "")}
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
                  const working = meetingFitsWorkingHours(person, instant, durationMinutes);
                  const localTime = formatInZone(instant, person.timeZone);
                  return (
                    <button
                      type="button"
                      className={`hour-cell ${working ? "working" : ""} ${selectedHour === hour.utcHour ? "selected" : ""}`}
                      key={hour.utcHour}
                      title={`${person.name}: ${formatInZone(instant, person.timeZone)}`}
                      aria-label={`${person.name}: ${localRangeLabel(dateValue, hour.utcHour, durationMinutes, person)}, ${working ? "complete meeting within" : "part of meeting outside"} working hours. Select ${formatUtcHour(hour.utcHour)}`}
                      onClick={() => onHourChange(hour.utcHour)}
                    >
                      {localTime}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <p className="timeline-note">
            Choose any 30-minute UTC start or local-time cell. Green cells mean the complete {durationMinutes}-minute meeting fits that person&apos;s working hours; scoring also penalizes very early (before 07:00) and very late (21:00 or later) local times.
          </p>
        </div>
      )}
    </section>
  );
}
