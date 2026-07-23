import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Clipboard, Download, ExternalLink, Share2 } from "lucide-react";
import { calendarAttendees, createGoogleCalendarUrl, createIcsEvent, createMeetingShareData, createOutlookCalendarUrl, durationLabel, meetingSummary } from "../meeting";
import { createId } from "../id";
import type { Person, PlannerState } from "../types";
import { CalendarHandoffDialog } from "./CalendarHandoffDialog";
import { CalendarInviteeSelector } from "./CalendarInviteeSelector";

type Props = {
  people: Person[];
  planner: PlannerState;
  selectedInstant: Date;
  onTitleChange: (title: string) => void;
  onLocationChange: (location: string) => void;
  onNotesChange: (notes: string) => void;
};

function safeFileName(title: string) {
  const normalized = title.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  return `${normalized || "atlastime-meeting"}.ics`;
}

export function MeetingHandoff({ people, planner, selectedInstant, onTitleChange, onLocationChange, onNotesChange }: Props) {
  const [copyStatus, setCopyStatus] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const availableAttendees = useMemo(() => calendarAttendees(people), [people]);
  const [selectedEmails, setSelectedEmails] = useState(() => availableAttendees.map(({ email }) => email));
  const [pendingHandoff, setPendingHandoff] = useState<"google" | "outlook" | "ics" | null>(null);
  const allDay = planner.eventMode === "all-day";
  const summary = meetingSummary(planner.title, selectedInstant, planner.durationMinutes, people, { ...planner, allDay });
  const shareData = createMeetingShareData(planner.title, summary);
  const attendees = availableAttendees.filter(({ email }) => selectedEmails.includes(email));
  const calendarLinkEvent = {
    title: planner.title,
    start: selectedInstant,
    durationMinutes: planner.durationMinutes,
    description: summary,
    location: planner.location,
    allDay,
    date: planner.date,
    attendees,
  };
  const googleCalendarUrl = createGoogleCalendarUrl(calendarLinkEvent);
  const outlookCalendarUrl = createOutlookCalendarUrl(calendarLinkEvent);

  useEffect(() => {
    const available = new Set(availableAttendees.map(({ email }) => email));
    setSelectedEmails((current) => current.filter((email) => available.has(email)));
  }, [availableAttendees]);

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopyStatus("Copied!");
      window.setTimeout(() => setCopyStatus(""), 2200);
    } catch {
      window.prompt("Copy these meeting details", summary);
    }
  }

  async function shareInvite() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
        setShareStatus("Shared!");
        window.setTimeout(() => setShareStatus(""), 2200);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(summary);
      setShareStatus("Copied instead");
      window.setTimeout(() => setShareStatus(""), 2200);
    } catch {
      window.prompt("Copy this meeting invitation", summary);
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
      allDay,
      date: planner.date,
      attendees,
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

  function confirmCalendarHandoff() {
    if (pendingHandoff === "google") window.open(googleCalendarUrl, "_blank", "noopener,noreferrer");
    if (pendingHandoff === "outlook") window.open(outlookCalendarUrl, "_blank", "noopener,noreferrer");
    if (pendingHandoff === "ics") downloadCalendarFile();
    setPendingHandoff(null);
  }

  const handoffDetails = pendingHandoff ? {
    google: { destination: "Google Calendar", confirmLabel: "Open Google draft" },
    outlook: { destination: "Outlook Calendar", confirmLabel: "Open Outlook draft" },
    ics: { destination: "your device calendar", confirmLabel: "Download calendar file" },
  }[pendingHandoff] : null;
  const timing = allDay
    ? `All day on ${planner.date}`
    : `${selectedInstant.toUTCString()} · ${durationLabel(planner.durationMinutes)}`;

  return (
    <section className="section handoff" aria-labelledby="handoff-heading">
      <div className="section-heading">
        <div>
          <p className="section-kicker"><CalendarPlus size={16} /> HANDOFF</p>
          <h2 id="handoff-heading">Take the selected time with you</h2>
          <p>Share the timezone-aware invitation through an app you choose, copy it, download a standard calendar file, or open a prefilled calendar draft. AtlasTime never sends anything automatically or reads your accounts.</p>
        </div>
      </div>

      <div className="handoff-panel">
        <div className="handoff-fields">
          <label>
            Meeting title
            <input value={planner.title} maxLength={120} placeholder="e.g. Weekly project sync" onChange={(event) => onTitleChange(event.target.value)} />
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

        <details className="meeting-summary-disclosure">
          <summary>Preview copied invitation details</summary>
          <pre className="meeting-summary" aria-label="Meeting summary preview">{summary}</pre>
        </details>

        <details className="calendar-connection-preview">
          <summary>Calendar connections <span>Safe handoff mode</span></summary>
          <p>No calendar account is authorized yet. Secure persistent Google authorization requires a configured OAuth client and backend token exchange. Drafts and calendar files remain available without signing in.</p>
          <div>
            <span><strong>Google Calendar</strong><em>Not connected</em></span>
            <span><strong>Outlook Calendar</strong><em>Planned after Google validation</em></span>
          </div>
        </details>

        <CalendarInviteeSelector attendees={availableAttendees} selectedEmails={selectedEmails} onChange={setSelectedEmails} />

        <div className="handoff-actions">
          <button type="button" className="primary-button" onClick={shareInvite}>
            <Share2 size={17} /> {shareStatus || "Share invite"}
          </button>
          <button type="button" className="secondary-button" onClick={copySummary}>
            <Clipboard size={17} /> {copyStatus || "Copy details"}
          </button>
          <button type="button" className="secondary-button" onClick={() => setPendingHandoff("google")}>
            Google Calendar draft <ExternalLink size={15} />
          </button>
          <button type="button" className="secondary-button" onClick={() => setPendingHandoff("outlook")}>
            Outlook Calendar draft <ExternalLink size={15} />
          </button>
          <button type="button" className="secondary-button" onClick={() => setPendingHandoff("ics")}>
            <Download size={17} /> Apple / device calendar (.ics)
          </button>
        </div>
        <p className="handoff-privacy-note">Google and Outlook open prefilled drafts for you to review and save. Valid contact emails are included as invitees, but the calendar provider decides whether invitations are sent when you save. Apple and device calendars import the complete .ics event. AtlasTime never saves or sends anything without your confirmation.</p>
      </div>
      {pendingHandoff && handoffDetails && (
        <CalendarHandoffDialog
          {...handoffDetails}
          eventTitle={planner.title}
          timing={timing}
          location={planner.location}
          attendees={attendees}
          onCancel={() => setPendingHandoff(null)}
          onConfirm={confirmCalendarHandoff}
        />
      )}
    </section>
  );
}

