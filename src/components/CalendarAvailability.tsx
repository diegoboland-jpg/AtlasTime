import { useEffect, useMemo, useState } from "react";
import { CalendarClock, LoaderCircle, LockKeyhole } from "lucide-react";
import {
  getGoogleCalendarAvailability,
  getGoogleCalendarStatus,
  googleCalendarConnectUrl,
  type GoogleCalendarBusyPeriod,
  type GoogleCalendarStatus,
} from "../services/googleCalendar";

type Props = {
  dateValue: string;
  selectedHour: number;
  durationMinutes: number;
};

type View =
  | { kind: "loading" }
  | { kind: "unavailable" }
  | { kind: "ready"; status: GoogleCalendarStatus; busy: GoogleCalendarBusyPeriod[]; lookupUnavailable: boolean };

const SLOTS = Array.from({ length: 48 }, (_, index) => index);

export function CalendarAvailability({ dateValue, selectedHour, durationMinutes }: Props) {
  const [view, setView] = useState<View>({ kind: "loading" });
  const bounds = useMemo(() => {
    const start = new Date(`${dateValue}T00:00:00.000Z`);
    return { start, end: new Date(start.getTime() + 86_400_000) };
  }, [dateValue]);

  useEffect(() => {
    let active = true;
    setView({ kind: "loading" });
    getGoogleCalendarStatus()
      .then(async (status) => {
        if (!active) return;
        if (!status.connected || !status.availabilityGranted) {
          setView({ kind: "ready", status, busy: [], lookupUnavailable: false });
          return;
        }
        try {
          const result = await getGoogleCalendarAvailability(bounds.start.toISOString(), bounds.end.toISOString());
          if (!active) return;
          const primary = result.calendars.find((calendar) => calendar.id === "primary");
          setView({
            kind: "ready",
            status,
            busy: primary?.busy ?? [],
            lookupUnavailable: !primary || primary.status === "unavailable",
          });
        } catch {
          if (active) setView({ kind: "ready", status, busy: [], lookupUnavailable: true });
        }
      })
      .catch(() => active && setView({ kind: "unavailable" }));
    return () => { active = false; };
  }, [bounds]);

  if (view.kind === "unavailable") return null;

  const selectedStart = bounds.start.getTime() + selectedHour * 3_600_000;
  const selectedEnd = selectedStart + durationMinutes * 60_000;
  const overlaps = view.kind === "ready" && view.busy.some((period) =>
    new Date(period.start).getTime() < selectedEnd && new Date(period.end).getTime() > selectedStart);

  return (
    <section className="calendar-availability" aria-labelledby="calendar-availability-heading">
      <div className="calendar-availability-heading">
        <span><CalendarClock size={18} /></span>
        <div>
          <strong id="calendar-availability-heading">My Google Calendar availability</strong>
          <small>AtlasTime reads occupied/free blocks only — never event names or descriptions.</small>
        </div>
        {view.kind === "loading" && <LoaderCircle className="calendar-spinner" size={18} aria-label="Loading calendar availability" />}
      </div>

      {view.kind === "ready" && !view.status.connected && (
        <p>Connect Google Calendar in Handoff first. Planning still works without it.</p>
      )}
      {view.kind === "ready" && view.status.connected && !view.status.availabilityGranted && (
        <div className="availability-consent">
          <p><LockKeyhole size={15} /> Availability access is off.</p>
          <button type="button" className="secondary-button" onClick={() => window.location.assign(googleCalendarConnectUrl(undefined, true))}>
            Enable occupied/free access
          </button>
        </div>
      )}
      {view.kind === "ready" && view.status.availabilityGranted && (
        <>
          {view.lookupUnavailable ? (
            <p role="status">Google did not return availability. AtlasTime will not assume that time is free.</p>
          ) : (
            <>
              <div className="availability-strip" aria-label="Your Google Calendar occupied and free periods">
                {SLOTS.map((slot) => {
                  const start = bounds.start.getTime() + slot * 30 * 60_000;
                  const end = start + 30 * 60_000;
                  const busy = view.busy.some((period) => new Date(period.start).getTime() < end && new Date(period.end).getTime() > start);
                  const selected = start < selectedEnd && end > selectedStart;
                  return <span key={slot} className={`${busy ? "busy" : "free"}${selected ? " selected" : ""}`} title={`${String(Math.floor(slot / 2)).padStart(2, "0")}:${slot % 2 ? "30" : "00"} UTC — ${busy ? "occupied" : "free"}`} />;
                })}
              </div>
              <div className="availability-legend">
                <span><i className="free" /> Free</span>
                <span><i className="busy" /> Occupied</span>
                <strong className={overlaps ? "conflict" : "clear"}>{overlaps ? "Selected time conflicts" : "Selected time is free"}</strong>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
