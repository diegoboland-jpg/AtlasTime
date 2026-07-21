import { useState } from "react";
import { CalendarPlus, Clipboard, Download, ExternalLink } from "lucide-react";
import { createGoogleCalendarUrl, createIcsEvent, createOutlookCalendarUrl, meetingSummary } from "../meeting";
import { createId } from "../id";
import type { Person, PlannerState } from "../types";

type Props = {
  people: Person[];
  planner: PlannerState;
  selectedInstant: Date;
  onTitleChange: (title: string) => void;
  onDurationChange: (durationMinutes: number) => void;
  onLocationChange: (location: string) => void;
  onNotesChange: (notes: string) => void;
};

const durations = [30, 45, 60, 90, 120];

function safeFileName(title: string) {
  const normalized = title.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  return `${normalized || "atlastime-meeting"}.ics`;
}

export function MeetingHandoff({ people, planner, selectedInstant, onTitleChange, onDurationChange, onLocationChange, onNotesChange }: Props) {
  const [copyStatus, setCopyStatus] = useState("");
  const summary = meetingSummary(planner.title, selectedInstant, planner.durationMinutes, people, planner);
  const calendarLinkEvent = {
    title: planner.title,
    start: selectedInstant,
    durationMinutes: planner.durationMinutes,
    description: summary,
    location: planner.location,
  };
  const googleCalendarUrl = createGoogleCalendarUrl(calendarLinkEvent);
  const outlookCalendarUrl = createOutlookCalendarUrl(calendarLinkEvent);

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopyStatus("Copied!");
      window.setTimeout(() => setCopyStatus(""), 2200);
    } catch {
      window.prompt("Copy these meeting details", summary);
    }
  }

  function downloadCalendarFile() {
    const calendar = createIcsEvent({
      title: planner.title,
      start: selectedInstant,
      durationMinutes: planner.durationMinutes,
      description: summary,
      location: planner.location,
      uid: `${createId()}@atlastime.local`,
      createdAt: new Date(),
    });
    const url = URL.createObjectURL(new Blob([calendar], { type: "text/calendar;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = safeFileName(planner.title);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <section className="section handoff" aria-labelledby="handoff-heading">
      <div className="section-heading">
        <div>
          <p className="section-kicker"><CalendarPlus size={16} /> HANDOFF</p>
          <h2 id="handoff-heading">Take the selected time with you</h2>
          <p>Copy the timezone-aware details, download a standard calendar file, or open a prefilled calendar draft. AtlasTime never reads or edits your calendar.</p>
        </div>
      </div>

      <div className="handoff-panel">
        <div className="handoff-fields">
          <label>
            Meeting title
            <input value={planner.title} maxLength={120} placeholder="e.g. Weekly project sync" onChange={(event) => onTitleChange(event.target.value)} />
          </label>
          <label>
            Duration
            <select value={planner.durationMinutes} onChange={(event) => onDurationChange(Number(event.target.value))}>
              {durations.map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
            </select>
          </label>
          <label>
            Meeting location or link
            <input value={planner.location} maxLength={160} placeholder="e.g. Zoom or Conference room 3" onChange={(event) => onLocationChange(event.target.value)} />
          </label>
          <label>
            Notes
            <textarea value={planner.notes} maxLength={1000} rows={4} placeholder="Optional agenda or instructions" onChange={(event) => onNotesChange(event.target.value)} />
          </label>
        </div>

        <pre className="meeting-summary" aria-label="Meeting summary preview">{summary}</pre>

        <div className="handoff-actions">
          <button type="button" className="secondary-button" onClick={copySummary}>
            <Clipboard size={17} /> {copyStatus || "Copy details"}
          </button>
          <a className="secondary-button" href={googleCalendarUrl} target="_blank" rel="noreferrer">
            Google Calendar <ExternalLink size={15} />
          </a>
          <a className="secondary-button" href={outlookCalendarUrl} target="_blank" rel="noreferrer">
            Outlook Calendar <ExternalLink size={15} />
          </a>
          <button type="button" className="primary-button" onClick={downloadCalendarFile}>
            <Download size={17} /> Download .ics
          </button>
        </div>
      </div>
    </section>
  );
}

