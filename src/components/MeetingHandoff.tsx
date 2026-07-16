import { useState } from "react";
import { CalendarPlus, Clipboard, Download } from "lucide-react";
import { createIcsEvent, meetingSummary } from "../meeting";
import { createId } from "../id";
import type { Person, PlannerState } from "../types";

type Props = {
  people: Person[];
  planner: PlannerState;
  selectedInstant: Date;
  onTitleChange: (title: string) => void;
  onDurationChange: (durationMinutes: number) => void;
};

const durations = [30, 45, 60, 90, 120];

function safeFileName(title: string) {
  const normalized = title.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  return `${normalized || "atlastime-meeting"}.ics`;
}

export function MeetingHandoff({ people, planner, selectedInstant, onTitleChange, onDurationChange }: Props) {
  const [copyStatus, setCopyStatus] = useState("");
  const summary = meetingSummary(planner.title, selectedInstant, planner.durationMinutes, people);

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
          <p>Copy a timezone-aware summary or download a standard calendar file. AtlasTime never connects to your calendar account.</p>
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
        </div>

        <pre className="meeting-summary" aria-label="Meeting summary preview">{summary}</pre>

        <div className="handoff-actions">
          <button type="button" className="secondary-button" onClick={copySummary}>
            <Clipboard size={17} /> {copyStatus || "Copy details"}
          </button>
          <button type="button" className="primary-button" onClick={downloadCalendarFile}>
            <Download size={17} /> Download .ics
          </button>
        </div>
      </div>
    </section>
  );
}

