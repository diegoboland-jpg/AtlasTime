import { CalendarDays, ChevronDown, ChevronUp, Clock3 } from "lucide-react";
import { durationLabel } from "../meeting";
import { dateAtUtcHour, durationBetweenUtcTimes, formatInZone, formatUtcHour, localRangeLabel, meetingFitsWorkingHours } from "../time";
import type { HourScore, Person } from "../types";
import { ExactTimeInput } from "./ExactTimeInput";
import { MobilePlannerComparison } from "./MobilePlannerComparison";

const QUICK_DURATIONS = Array.from({ length: 16 }, (_, index) => (index + 1) * 30);

type TimePlannerProps = {
  people: Person[];
  dateValue: string;
  selectedHour: number;
  durationMinutes: number;
  eventMode: "timed" | "all-day";
  recommendation: HourScore | null;
  hours: HourScore[];
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onDateChange: (date: string) => void;
  onDurationChange: (duration: number) => void;
  onEventModeChange: (mode: "timed" | "all-day") => void;
  onHourChange: (hour: number) => void;
};

export function TimePlanner({
  people,
  dateValue,
  selectedHour,
  durationMinutes,
  eventMode,
  recommendation,
  hours,
  expanded,
  onExpandedChange,
  onDateChange,
  onDurationChange,
  onEventModeChange,
  onHourChange,
}: TimePlannerProps) {
  const allDay = eventMode === "all-day";
  const exactStartMinutes = Math.round(selectedHour * 60) % (24 * 60);
  const exactStartValue = `${String(Math.floor(exactStartMinutes / 60)).padStart(2, "0")}:${String(exactStartMinutes % 60).padStart(2, "0")}`;
  const finishTotalMinutes = exactStartMinutes + durationMinutes;
  const finishClockMinutes = finishTotalMinutes % (24 * 60);
  const exactFinishValue = `${String(Math.floor(finishClockMinutes / 60)).padStart(2, "0")}:${String(finishClockMinutes % 60).padStart(2, "0")}`;
  const endsNextDay = finishTotalMinutes >= 24 * 60;
  const deviceTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const devicePerson: Person = {
    id: "current-device",
    name: "My time",
    city: deviceTimeZone.split("/").pop()?.replaceAll("_", " ") || deviceTimeZone,
    timeZone: deviceTimeZone,
    workStart: 0,
    workEnd: 24,
  };

  function selectExactStart(value: string) {
    const [hour, minute] = value.split(":").map(Number);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return;
    onHourChange(hour + minute / 60);
  }

  function selectExactFinish(value: string) {
    const [hour, minute] = value.split(":").map(Number);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return;
    onDurationChange(durationBetweenUtcTimes(selectedHour, hour + minute / 60));
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
          {expanded ? <><ChevronUp size={17} /> Hide comparison</> : <><ChevronDown size={17} /> Plan Humanly</>}
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
            <label className="all-day-field">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(event) => onEventModeChange(event.target.checked ? "all-day" : "timed")}
              />
              <span><strong>All-day event</strong><small>Use calendar dates without a start hour.</small></span>
            </label>
            {!allDay && (
              <>
                <label className="date-field time-control-field">
                  Start (UTC)
                  <ExactTimeInput
                    value={exactStartValue}
                    describedBy="exact-time-help"
                    onCommit={selectExactStart}
                  />
                </label>
                <label className="date-field time-control-field">
                  Finish (UTC)
                  <ExactTimeInput
                    value={exactFinishValue}
                    describedBy="exact-time-help"
                    onCommit={selectExactFinish}
                  />
                  {endsNextDay && <small className="next-day-note">Next day</small>}
                </label>
                <label className="date-field">
                  Quick length
                  <select
                    value={QUICK_DURATIONS.includes(durationMinutes) ? durationMinutes : "custom"}
                    onChange={(event) => {
                      if (event.target.value === "custom") return;
                      onDurationChange(Number(event.target.value));
                    }}
                  >
                    {QUICK_DURATIONS.map((minutes) => <option key={minutes} value={minutes}>{durationLabel(minutes)}</option>)}
                    <option value="custom">Custom finish</option>
                  </select>
                </label>
                <p className="time-control-help" id="exact-time-help">Use ↑/↓ in 15-minute steps, or type any exact time as HHMM. Duration: <strong>{durationLabel(durationMinutes)}</strong>.</p>
              </>
            )}
          </div>

          {allDay ? (
            <div className="all-day-context" role="status">
              <CalendarDays size={24} aria-hidden="true" />
              <div>
                <strong>All day on {dateValue}</strong>
                <p>Hourly availability scoring is paused. Calendar drafts will use this date and end before the next date.</p>
                {people.length > 0 && (
                  <ul>
                    {people.map((person) => <li key={person.id}><strong>{person.name}</strong><span>{person.city || person.timeZone}</span></li>)}
                  </ul>
                )}
              </div>
            </div>
          ) : recommendation && (
            <div className="planner-sticky-recommendation" aria-label="Recommended meeting time and my local time">
              <button
                className="recommendation"
                type="button"
                onClick={() => onHourChange(recommendation.utcHour)}
              >
                <span className="recommendation-icon"><Clock3 size={24} /></span>
                <span className="recommendation-copy">
                  <span>Best-scoring {durationLabel(durationMinutes)} window</span>
                  <strong>{formatUtcHour(recommendation.utcHour)}</strong>
                  <small>
                    {recommendation.available} of {recommendation.total} people in working hours
                    {recommendation.penalty > 0 ? ` - discomfort penalty ${recommendation.penalty}` : " - no discomfort penalty"}.
                  </small>
                </span>
              </button>
              <aside className="my-time-recommendation" aria-label={`My time in ${deviceTimeZone}`}>
                <span className="recommendation-icon"><Clock3 size={24} /></span>
                <span className="my-time-copy">
                  <span>My time</span>
                  <strong>{formatInZone(dateAtUtcHour(dateValue, recommendation.utcHour), deviceTimeZone)}</strong>
                  <small>{localRangeLabel(dateValue, recommendation.utcHour, durationMinutes, devicePerson)}</small>
                  <em>{devicePerson.city}</em>
                </span>
              </aside>
            </div>
          )}

          {!allDay && <MobilePlannerComparison
              people={people}
              dateValue={dateValue}
              selectedHour={selectedHour}
              durationMinutes={durationMinutes}
            />}

          {!allDay && <div className="timeline-wrap" role="region" aria-label="Scrollable 24-hour local-time comparison" tabIndex={0}>
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
          </div>}

          {!allDay && <p className="timeline-note">
            Choose any 30-minute UTC start or local-time cell. Green cells mean the complete {durationLabel(durationMinutes)} meeting fits that person&apos;s working hours; scoring also penalizes very early (before 07:00) and very late (21:00 or later) local times.
          </p>}
        </div>
      )}
    </section>
  );
}
