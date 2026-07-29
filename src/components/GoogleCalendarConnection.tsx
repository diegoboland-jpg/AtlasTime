import { useEffect, useState } from "react";
import { CalendarCheck2, ExternalLink, Link2Off, LoaderCircle } from "lucide-react";
import type { CalendarAttendee } from "../meeting";
import {
  createGoogleCalendarEvent,
  disconnectGoogleCalendar,
  getGoogleCalendarStatus,
  googleCalendarConnectUrl,
  GoogleCalendarError,
  type GoogleCalendarEvent,
  type GoogleCalendarStatus,
} from "../services/googleCalendar";
import { CalendarHandoffDialog } from "./CalendarHandoffDialog";

type Props = {
  event: GoogleCalendarEvent;
  eventTitle: string;
  timing: string;
  location: string;
  attendees: CalendarAttendee[];
};

type ViewState =
  | { kind: "loading" }
  | { kind: "ready"; status: GoogleCalendarStatus }
  | { kind: "unavailable" }
  | { kind: "error"; message: string };

type Notice = {
  message: string;
  kind: "success" | "error";
};

function connectionResult() {
  const url = new URL(window.location.href);
  const result = url.searchParams.get("calendar");
  const reason = url.searchParams.get("reason");
  if (!result) return null;
  url.searchParams.delete("calendar");
  url.searchParams.delete("reason");
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  return result === "connected"
    ? { result: "connected" as const }
    : {
        result: "error" as const,
        message: `Google Calendar was not connected${reason ? ` (${reason.replaceAll("_", " ")})` : ""}.`,
      };
}

function errorMessage(error: unknown) {
  if (!(error instanceof GoogleCalendarError)) return "Google Calendar could not be reached.";
  if (error.code === "not_connected" || error.code === "authorization_expired") return "The Google connection expired. Connect again to continue.";
  if (error.code === "event_creation_failed") return "Google could not create the event. No invitation was sent.";
  return "Google Calendar could not be reached. Draft and calendar-file options are still available.";
}

export function GoogleCalendarConnection({ event, eventTitle, timing, location, attendees }: Props) {
  const [view, setView] = useState<ViewState>({ kind: "loading" });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState<"create" | "disconnect" | null>(null);
  const [createdLink, setCreatedLink] = useState("");

  useEffect(() => {
    const result = connectionResult();
    let active = true;
    getGoogleCalendarStatus()
      .then((status) => {
        if (!active) return;
        setView({ kind: "ready", status });
        if (result?.result === "connected") {
          setNotice(status.connected
            ? { message: "Google Calendar connected.", kind: "success" }
            : {
                message: "Google returned successfully, but AtlasTime could not verify the saved connection. Connect again.",
                kind: "error",
              });
        } else if (result?.result === "error") {
          setNotice({ message: result.message, kind: "error" });
        }
      })
      .catch((error) => {
        if (!active) return;
        const unavailable = error instanceof GoogleCalendarError
          && (error.code === "calendar_gateway_not_configured" || error.code === "gateway_unavailable");
        setView(unavailable ? { kind: "unavailable" } : { kind: "error", message: errorMessage(error) });
        if (result) {
          setNotice({
            message: result.result === "error"
              ? result.message
              : "Google returned successfully, but AtlasTime could not verify the saved connection.",
            kind: "error",
          });
        }
      });
    return () => { active = false; };
  }, []);

  function connect() {
    window.location.assign(googleCalendarConnectUrl());
  }

  async function disconnect() {
    setBusy("disconnect");
    setNotice(null);
    setCreatedLink("");
    try {
      const status = await disconnectGoogleCalendar();
      setView({ kind: "ready", status });
      setNotice({ message: "Google Calendar disconnected.", kind: "success" });
    } catch (error) {
      setNotice({ message: errorMessage(error), kind: "error" });
    } finally {
      setBusy(null);
    }
  }

  async function createEvent() {
    setConfirming(false);
    setBusy("create");
    setNotice(null);
    setCreatedLink("");
    try {
      const created = await createGoogleCalendarEvent(event);
      setCreatedLink(created.htmlLink ?? "");
      setNotice({
        message: "Event created in Google Calendar. Invitations were handed to Google for delivery.",
        kind: "success",
      });
    } catch (error) {
      setNotice({ message: errorMessage(error), kind: "error" });
      if (error instanceof GoogleCalendarError && ["not_connected", "authorization_expired"].includes(error.code)) {
        setView({
          kind: "ready",
          status: { provider: "google", connected: false, scope: null, connectedAt: null },
        });
      }
    } finally {
      setBusy(null);
    }
  }

  const connected = view.kind === "ready" && view.status.connected;

  return (
    <section className={`calendar-connection-card${connected ? " connected" : ""}`} aria-labelledby="google-calendar-heading">
      <div className="calendar-connection-heading">
        <span className="calendar-provider-icon"><CalendarCheck2 size={19} /></span>
        <span>
          <strong id="google-calendar-heading">Google Calendar</strong>
          <small>
            {view.kind === "loading" && "Checking connection…"}
            {view.kind === "ready" && (connected ? "Connected securely" : "Optional connection")}
            {view.kind === "unavailable" && "Gateway not configured in this build"}
            {view.kind === "error" && "Connection check failed"}
          </small>
        </span>
        {view.kind === "loading" && <LoaderCircle className="calendar-spinner" size={18} aria-label="Checking Google Calendar connection" />}
        {view.kind === "ready" && <em className={connected ? "is-connected" : ""}>{connected ? "Connected" : "Not connected"}</em>}
      </div>

      <p>
        {connected
          ? "Create the reviewed meeting directly on your primary calendar. Google sends invitations only after this final confirmation."
          : "Connect only when you want AtlasTime to create a reviewed event. Calendar drafts and .ics files work without connecting."}
      </p>

      {view.kind === "error" && <p className="calendar-connection-message error" role="status">{view.message}</p>}
      {notice && (
        <p className={`calendar-connection-message${notice.kind === "error" ? " error" : ""}`} role="status">
          {notice.message}
        </p>
      )}
      {createdLink && (
        <a className="calendar-created-link" href={createdLink} target="_blank" rel="noreferrer">
          Open created event <ExternalLink size={14} />
        </a>
      )}

      <div className="calendar-connection-actions">
        {view.kind === "ready" && !connected && (
          <button type="button" className="secondary-button" onClick={connect}>Connect Google Calendar</button>
        )}
        {connected && (
          <>
            <button type="button" className="primary-button" disabled={busy !== null} onClick={() => setConfirming(true)}>
              {busy === "create" ? <><LoaderCircle className="calendar-spinner" size={16} /> Creating event…</> : <><CalendarCheck2 size={16} /> Create Google event</>}
            </button>
            <button type="button" className="calendar-disconnect-button" disabled={busy !== null} onClick={disconnect}>
              <Link2Off size={14} /> {busy === "disconnect" ? "Disconnecting…" : "Disconnect"}
            </button>
          </>
        )}
      </div>

      {confirming && (
        <CalendarHandoffDialog
          destination="your connected Google Calendar"
          confirmLabel="Create Google event"
          eventTitle={eventTitle}
          timing={timing}
          location={location}
          attendees={attendees}
          onCancel={() => setConfirming(false)}
          onConfirm={createEvent}
        />
      )}
    </section>
  );
}
