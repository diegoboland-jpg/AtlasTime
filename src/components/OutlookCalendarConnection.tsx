import { useEffect, useState } from "react";
import { CalendarRange, Link2Off, LoaderCircle } from "lucide-react";
import {
  disconnectOutlookCalendar,
  getOutlookCalendarStatus,
  outlookCalendarConnectUrl,
  type OutlookCalendarStatus,
} from "../services/outlookCalendar";

type ViewState =
  | { kind: "loading" }
  | { kind: "ready"; status: OutlookCalendarStatus }
  | { kind: "unavailable" }
  | { kind: "error" };

type Notice = { message: string; kind: "success" | "error" };

function connectionResult() {
  const url = new URL(window.location.href);
  const result = url.searchParams.get("outlook");
  const reason = url.searchParams.get("reason");
  if (!result) return null;
  url.searchParams.delete("outlook");
  url.searchParams.delete("reason");
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  return result === "connected"
    ? { result: "connected" as const }
    : {
        result: "error" as const,
        message: `Outlook Calendar was not connected${reason ? ` (${reason.replaceAll("_", " ")})` : ""}.`,
      };
}

export function OutlookCalendarConnection() {
  const [view, setView] = useState<ViewState>({ kind: "loading" });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    const result = connectionResult();
    let active = true;
    getOutlookCalendarStatus()
      .then((status) => {
        if (!active) return;
        setView({ kind: "ready", status });
        if (result?.result === "connected") {
          setNotice(status.connected && status.availabilityGranted
            ? { message: "Outlook Calendar connected for occupied/free planning.", kind: "success" }
            : { message: "Microsoft returned successfully, but AtlasTime could not verify calendar access. Connect again.", kind: "error" });
        } else if (result?.result === "error") {
          setNotice({ message: result.message, kind: "error" });
        }
      })
      .catch(() => {
        if (!active) return;
        setView({ kind: "unavailable" });
        if (result) setNotice({ message: "AtlasTime could not verify the Outlook connection.", kind: "error" });
      });
    return () => { active = false; };
  }, []);

  async function disconnect() {
    setDisconnecting(true);
    setNotice(null);
    try {
      const status = await disconnectOutlookCalendar();
      setView({ kind: "ready", status });
      setNotice({ message: "Outlook Calendar disconnected.", kind: "success" });
    } catch {
      setView({ kind: "error" });
      setNotice({ message: "Outlook Calendar could not be disconnected. Try again while the connected server is running.", kind: "error" });
    } finally {
      setDisconnecting(false);
    }
  }

  const connected = view.kind === "ready" && view.status.connected && view.status.availabilityGranted;

  return (
    <section className={`calendar-connection-card${connected ? " connected" : ""}`} aria-labelledby="outlook-calendar-heading">
      <div className="calendar-connection-heading">
        <span className="calendar-provider-icon"><CalendarRange size={19} /></span>
        <span>
          <strong id="outlook-calendar-heading">Outlook Calendar</strong>
          <small>
            {view.kind === "loading" && "Checking connection…"}
            {view.kind === "ready" && (connected ? "Connected for occupied/free planning" : "Optional connection")}
            {view.kind === "unavailable" && "Gateway not configured in this build"}
            {view.kind === "error" && "Connection check failed"}
          </small>
        </span>
        {view.kind === "loading" && <LoaderCircle className="calendar-spinner" size={18} aria-label="Checking Outlook Calendar connection" />}
        {view.kind === "ready" && <em className={connected ? "is-connected" : ""}>{connected ? "Connected" : "Not connected"}</em>}
      </div>

      <p>
        {connected
          ? "AtlasTime combines Outlook occupied/free blocks with Google availability in the planner. Event names, descriptions, attendees, and locations are never requested."
          : "Connect a personal Outlook or permitted Microsoft 365 calendar to include its occupied/free blocks in your planning view."}
      </p>

      {notice && <p className={`calendar-connection-message${notice.kind === "error" ? " error" : ""}`} role="status">{notice.message}</p>}

      <div className="calendar-connection-actions">
        {view.kind === "ready" && !connected && (
          <button type="button" className="secondary-button" onClick={() => window.location.assign(outlookCalendarConnectUrl())}>
            Connect Outlook Calendar
          </button>
        )}
        {connected && (
          <button type="button" className="calendar-disconnect-button" disabled={disconnecting} onClick={disconnect}>
            <Link2Off size={14} /> {disconnecting ? "Disconnecting…" : "Disconnect"}
          </button>
        )}
      </div>
    </section>
  );
}
