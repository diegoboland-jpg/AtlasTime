import { useEffect, useMemo, useState } from "react";
import { CalendarClock, LoaderCircle, LockKeyhole } from "lucide-react";
import {
  getGoogleCalendarAvailability,
  getGoogleCalendarStatus,
  googleCalendarConnectUrl,
  type GoogleCalendarBusyPeriod,
  type GoogleCalendarStatus,
} from "../services/googleCalendar";
import {
  getOutlookCalendarAvailability,
  getOutlookCalendarStatus,
  type OutlookCalendarStatus,
} from "../services/outlookCalendar";

type ProviderView<Status> = {
  status: Status | null;
  busy: GoogleCalendarBusyPeriod[];
  lookupUnavailable: boolean;
};

type View =
  | { kind: "loading" }
  | { kind: "unavailable" }
  | { kind: "ready"; google: ProviderView<GoogleCalendarStatus>; outlook: ProviderView<OutlookCalendarStatus> };

type Props = { dateValue: string; selectedHour: number; durationMinutes: number };

const SLOTS = Array.from({ length: 48 }, (_, index) => index);

function emptyProvider<Status>(status: Status | null = null): ProviderView<Status> {
  return { status, busy: [], lookupUnavailable: false };
}

export function CalendarAvailability({ dateValue, selectedHour, durationMinutes }: Props) {
  const [view, setView] = useState<View>({ kind: "loading" });
  const bounds = useMemo(() => {
    const start = new Date(`${dateValue}T00:00:00.000Z`);
    return { start, end: new Date(start.getTime() + 86_400_000) };
  }, [dateValue]);

  useEffect(() => {
    let active = true;
    setView({ kind: "loading" });

    async function load() {
      const [googleStatusResult, outlookStatusResult] = await Promise.allSettled([
        getGoogleCalendarStatus(),
        getOutlookCalendarStatus(),
      ]);
      if (!active) return;
      if (googleStatusResult.status === "rejected" && outlookStatusResult.status === "rejected") {
        setView({ kind: "unavailable" });
        return;
      }

      const google = emptyProvider(googleStatusResult.status === "fulfilled" ? googleStatusResult.value : null);
      const outlook = emptyProvider(outlookStatusResult.status === "fulfilled" ? outlookStatusResult.value : null);
      const timeMin = bounds.start.toISOString();
      const timeMax = bounds.end.toISOString();
      const [googleBusyResult, outlookBusyResult] = await Promise.allSettled([
        google.status?.connected && google.status.availabilityGranted
          ? getGoogleCalendarAvailability(timeMin, timeMax)
          : Promise.resolve(null),
        outlook.status?.connected && outlook.status.availabilityGranted
          ? getOutlookCalendarAvailability(timeMin, timeMax)
          : Promise.resolve(null),
      ]);
      if (!active) return;

      if (google.status?.connected && google.status.availabilityGranted) {
        if (googleBusyResult.status === "fulfilled" && googleBusyResult.value) {
          const primary = googleBusyResult.value.calendars.find((calendar) => calendar.id === "primary");
          google.busy = primary?.busy ?? [];
          google.lookupUnavailable = !primary || primary.status === "unavailable";
        } else {
          google.lookupUnavailable = true;
        }
      }

      if (outlook.status?.connected && outlook.status.availabilityGranted) {
        if (outlookBusyResult.status === "fulfilled" && outlookBusyResult.value) outlook.busy = outlookBusyResult.value.busy;
        else outlook.lookupUnavailable = true;
      }

      setView({ kind: "ready", google, outlook });
    }

    void load();
    return () => { active = false; };
  }, [bounds]);

  if (view.kind === "unavailable") return null;

  const selectedStart = bounds.start.getTime() + selectedHour * 3_600_000;
  const selectedEnd = selectedStart + durationMinutes * 60_000;
  const google = view.kind === "ready" ? view.google : emptyProvider<GoogleCalendarStatus>();
  const outlook = view.kind === "ready" ? view.outlook : emptyProvider<OutlookCalendarStatus>();
  const busy = [...google.busy, ...outlook.busy];
  const connectedProviders = [
    google.status?.connected && google.status.availabilityGranted ? "Google" : null,
    outlook.status?.connected && outlook.status.availabilityGranted ? "Outlook" : null,
  ].filter((provider): provider is string => Boolean(provider));
  const lookupUnavailable = google.lookupUnavailable || outlook.lookupUnavailable;
  const overlaps = busy.some((period) =>
    new Date(period.start).getTime() < selectedEnd && new Date(period.end).getTime() > selectedStart);

  return (
    <section className="calendar-availability" aria-labelledby="calendar-availability-heading">
      <div className="calendar-availability-heading">
        <span><CalendarClock size={18} /></span>
        <div>
          <strong id="calendar-availability-heading">My connected calendar availability</strong>
          <small>Google and Outlook occupied/free blocks are combined. Event details never enter Kikroo.</small>
        </div>
        {view.kind === "loading" && <LoaderCircle className="calendar-spinner" size={18} aria-label="Loading connected calendar availability" />}
      </div>

      {view.kind === "ready" && connectedProviders.length === 0 && (
        <p>Connect Google or Outlook Calendar in Handoff first. Planning still works without either account.</p>
      )}
      {view.kind === "ready" && google.status?.connected && !google.status.availabilityGranted && (
        <div className="availability-consent">
          <p><LockKeyhole size={15} /> Google occupied/free access is off.</p>
          <button type="button" className="secondary-button" onClick={() => window.location.assign(googleCalendarConnectUrl(undefined, true))}>
            Enable Google occupied/free access
          </button>
        </div>
      )}
      {view.kind === "ready" && connectedProviders.length > 0 && (
        <>
          <div className="availability-provider-list" aria-label="Connected availability providers">
            {connectedProviders.map((provider) => <span key={provider}>{provider}</span>)}
          </div>
          {lookupUnavailable && (
            <p role="status">One connected provider did not return availability. Kikroo shows confirmed blocks from the other provider and does not assume missing time is free.</p>
          )}
          <div className="availability-strip" aria-label={`Your combined ${connectedProviders.join(" and ")} occupied and free periods`}>
            {SLOTS.map((slot) => {
              const start = bounds.start.getTime() + slot * 30 * 60_000;
              const end = start + 30 * 60_000;
              const slotBusy = busy.some((period) => new Date(period.start).getTime() < end && new Date(period.end).getTime() > start);
              const selected = start < selectedEnd && end > selectedStart;
              return <span key={slot} className={`${slotBusy ? "busy" : "free"}${selected ? " selected" : ""}`} title={`${String(Math.floor(slot / 2)).padStart(2, "0")}:${slot % 2 ? "30" : "00"} UTC — ${slotBusy ? "occupied" : "free"}`} />;
            })}
          </div>
          <div className="availability-legend">
            <span><i className="free" /> Free</span>
            <span><i className="busy" /> Occupied</span>
            <strong className={overlaps ? "conflict" : "clear"}>{overlaps ? "Selected time conflicts" : "Selected time is free"}</strong>
          </div>
        </>
      )}
    </section>
  );
}
