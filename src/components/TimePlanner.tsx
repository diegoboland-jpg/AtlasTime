import { useState } from "react";
import { CalendarDays, ChevronDown, ChevronUp, Clock3 } from "lucide-react";
import { durationLabel } from "../meeting";
import { dateAtUtcHour, durationBetweenUtcTimes, formatInZone, formatUtcHour, localRangeLabel, meetingConflictsWithBusy, meetingFitsWorkingHours, scoreAtUtcHour } from "../time";
import type { AvailabilityByPerson, HourScore, Person } from "../types";
import { CalendarAvailability } from "./CalendarAvailability";
import { ExactTimeInput } from "./ExactTimeInput";
import { MobilePlannerComparison } from "./MobilePlannerComparison";

const QUICK_DURATIONS = [15, 30, 45, 60, 90, 120];

type TimePlannerProps = {
  people: Person[];
  dateValue: string;
  selectedHour: number;
  durationMinutes: number;
  eventMode: "timed" | "all-day";
  recommendation: HourScore | null;
  hours: HourScore[];
  expanded: boolean;
  availabilityByPerson?: AvailabilityByPerson;
  advancedInitiallyOpen?: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onDateChange: (date: string) => void;
  onDurationChange: (duration: number) => void;
  onEventModeChange: (mode: "timed" | "all-day") => void;
  onHourChange: (hour: number) => void;
};

export function TimePlanner({ people, dateValue, selectedHour, durationMinutes, eventMode, recommendation, hours, expanded, availabilityByPerson = {}, advancedInitiallyOpen = false, onExpandedChange, onDateChange, onDurationChange, onEventModeChange, onHourChange }: TimePlannerProps) {
  const [showAdvanced, setShowAdvanced] = useState(advancedInitiallyOpen);
  const allDay = eventMode === "all-day";
  const organizer = people.find((person) => person.id === "current-device") ?? people[0];
  const suggestedHour = recommendation?.utcHour ?? selectedHour;
  const suggestedScore = recommendation ?? scoreAtUtcHour(people, dateValue, suggestedHour, durationMinutes, availabilityByPerson);
  const suggestionSelected = Math.abs(selectedHour - suggestedHour) < 0.001;
  const availabilityRatio = suggestedScore.total > 0 ? suggestedScore.available / suggestedScore.total : 0;
  const quality = suggestedScore.total === 0
    ? { key: "neutral", label: "Add participants to compare" }
    : suggestedScore.available === suggestedScore.total && suggestedScore.penalty === 0
      ? { key: "excellent", label: "Excellent for everyone" }
      : availabilityRatio >= 0.75
        ? { key: "good", label: "Good option" }
        : availabilityRatio >= 0.5
          ? { key: "limited", label: "Limited availability" }
          : { key: "poor", label: "Poor availability" };
  const exactStartMinutes = Math.round(selectedHour * 60) % (24 * 60);
  const exactStartValue = `${String(Math.floor(exactStartMinutes / 60)).padStart(2, "0")}:${String(exactStartMinutes % 60).padStart(2, "0")}`;
  const finishTotalMinutes = exactStartMinutes + durationMinutes;
  const finishClockMinutes = finishTotalMinutes % (24 * 60);
  const exactFinishValue = `${String(Math.floor(finishClockMinutes / 60)).padStart(2, "0")}:${String(finishClockMinutes % 60).padStart(2, "0")}`;
  const endsNextDay = finishTotalMinutes >= 24 * 60;

  function selectExactStart(value: string) {
    const [hour, minute] = value.split(":").map(Number);
    if (Number.isInteger(hour) && Number.isInteger(minute)) onHourChange(hour + minute / 60);
  }

  function selectExactFinish(value: string) {
    const [hour, minute] = value.split(":").map(Number);
    if (Number.isInteger(hour) && Number.isInteger(minute)) onDurationChange(durationBetweenUtcTimes(selectedHour, hour + minute / 60));
  }

  return (
    <section className={`section planner ${expanded ? "expanded" : "collapsed"}`} id="planner" aria-labelledby="planner-heading">
      <div className="section-heading planner-disclosure-heading">
        <div>
          <p className="section-kicker"><CalendarDays size={16} /> PLANNER</p>
          <h2 id="planner-heading">Find a good time</h2>
          <p className="planner-helper">Choose a date and duration. Kikroo suggests a considerate time; the detailed comparison stays optional.</p>
        </div>
        <button type="button" className="secondary-button planner-toggle" aria-expanded={expanded} aria-controls="planner-analysis" onClick={() => { if (expanded) setShowAdvanced(false); onExpandedChange(!expanded); }}>
          {expanded ? <><ChevronUp size={17} /> Hide planner</> : <><ChevronDown size={17} /> Find a good time</>}
        </button>
      </div>

      {expanded && (
        <div className="planner-analysis" id="planner-analysis">
          <div className="planner-primary-toolbar">
            <label className="date-field">Date<input type="date" value={dateValue} onChange={(event) => onDateChange(event.target.value)} /></label>
            <label className="date-field">
              Duration
              <select value={QUICK_DURATIONS.includes(durationMinutes) ? durationMinutes : "custom"} onChange={(event) => { if (event.target.value !== "custom") onDurationChange(Number(event.target.value)); }} disabled={allDay}>
                {QUICK_DURATIONS.map((minutes) => <option key={minutes} value={minutes}>{durationLabel(minutes)}</option>)}
                <option value="custom">Custom: {durationLabel(durationMinutes)}</option>
              </select>
            </label>
            <label className="all-day-field">
              <input type="checkbox" checked={allDay} onChange={(event) => onEventModeChange(event.target.checked ? "all-day" : "timed")} />
              <span><strong>All-day event</strong><small>Skip hourly scoring.</small></span>
            </label>
          </div>

          {allDay ? (
            <div className="all-day-context" role="status"><CalendarDays size={24} aria-hidden="true" /><div><strong>All day on {dateValue}</strong><p>Kikroo will prepare a date-only calendar handoff. Hourly recommendations are paused.</p></div></div>
          ) : (
            <div className="planner-sticky-recommendation" aria-label="Recommended meeting time and my local time">
              <div className={`recommendation meeting-quality-${quality.key}`} role="status">
                <span className="recommendation-icon"><Clock3 size={24} /></span>
                <span className="recommendation-copy">
                  <span>Suggested {durationLabel(durationMinutes)} window</span>
                  <strong>{formatUtcHour(suggestedHour)}</strong>
                  <small>{suggestedScore.available} of {suggestedScore.total} participants within preferred hours{suggestedScore.calendarConflicts ? ` · ${suggestedScore.calendarConflicts} calendar ${suggestedScore.calendarConflicts === 1 ? "conflict" : "conflicts"}` : ""}.</small>
                  <em className="meeting-quality-label">{quality.label}</em>
                </span>
                {!suggestionSelected && <button type="button" className="primary-button use-suggestion" onClick={() => onHourChange(suggestedHour)}>Use this time</button>}
              </div>
              {organizer && <aside className="my-time-recommendation" aria-label={`My time in ${organizer.timeZone}`}><span className="recommendation-icon"><Clock3 size={24} /></span><span className="my-time-copy"><span>My time</span><strong>{formatInZone(dateAtUtcHour(dateValue, suggestedHour), organizer.timeZone)}</strong><small>{localRangeLabel(dateValue, suggestedHour, durationMinutes, organizer)}</small><em>{organizer.city}</em></span></aside>}
            </div>
          )}

          {!allDay && <div className="planner-advanced-disclosure"><button type="button" className="secondary-button" aria-expanded={showAdvanced} aria-controls="planner-advanced" onClick={() => setShowAdvanced((current) => !current)}>{showAdvanced ? <><ChevronUp size={17} /> Hide detailed comparison</> : <><ChevronDown size={17} /> Compare other times</>}</button><p>Optional: exact minutes, connected-calendar busy time, and the full 24-hour comparison.</p></div>}

          {!allDay && showAdvanced && (
            <div className="planner-advanced-panel" id="planner-advanced">
              <div className="planner-detail-toolbar">
                <strong>Exact timing</strong>
                <label className="date-field time-control-field">Start (UTC)<ExactTimeInput value={exactStartValue} describedBy="exact-time-help" onCommit={selectExactStart} /></label>
                <label className="date-field time-control-field">Finish (UTC)<ExactTimeInput value={exactFinishValue} describedBy="exact-time-help" onCommit={selectExactFinish} />{endsNextDay && <small className="next-day-note">Next day</small>}</label>
                <p className="time-control-help" id="exact-time-help">Use ↑/↓ in 15-minute steps, or type any exact time as HHMM. Duration: <strong>{durationLabel(durationMinutes)}</strong>.</p>
              </div>
              <MobilePlannerComparison people={people} dateValue={dateValue} selectedHour={selectedHour} durationMinutes={durationMinutes} availabilityByPerson={availabilityByPerson} />
              <CalendarAvailability dateValue={dateValue} selectedHour={selectedHour} durationMinutes={durationMinutes} />
              <div className="timeline-wrap" role="region" aria-label="Scrollable 24-hour local-time comparison" tabIndex={0}>
                <div className="timeline-labels"><span>UTC</span>{hours.map((hour) => <button type="button" key={hour.utcHour} className={selectedHour === hour.utcHour ? "active" : ""} onClick={() => onHourChange(hour.utcHour)} aria-label={`Select ${formatUtcHour(hour.utcHour)}`}>{formatUtcHour(hour.utcHour).replace(" UTC", "")}</button>)}</div>
                {people.map((person) => <div className="timeline-row" key={person.id}><div className="row-name"><strong>{person.name}</strong><span>{person.city || person.timeZone.replaceAll("_", " ")}</span></div>{hours.map((hour) => {
                  const instant = dateAtUtcHour(dateValue, hour.utcHour);
                  const working = meetingFitsWorkingHours(person, instant, durationMinutes);
                  const calendarConflict = meetingConflictsWithBusy(instant, durationMinutes, availabilityByPerson[person.contactId ?? person.id]);
                  return <button type="button" className={`hour-cell ${working && !calendarConflict ? "working" : ""} ${calendarConflict ? "calendar-conflict" : ""} ${selectedHour === hour.utcHour ? "selected" : ""}`} key={hour.utcHour} aria-label={`${person.name}: ${localRangeLabel(dateValue, hour.utcHour, durationMinutes, person)}, ${calendarConflict ? "busy on shared calendar" : working ? "within" : "outside"} preferred hours. Select ${formatUtcHour(hour.utcHour)}`} onClick={() => onHourChange(hour.utcHour)}>{formatInZone(instant, person.timeZone)}</button>;
                })}</div>)}
              </div>
              <p className="timeline-note">The comparison uses preferred hours for you and every participant, plus any confirmed shared calendar busy time.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
