import { useEffect, useState } from "react";
import { CalendarClock, ShieldCheck } from "lucide-react";
import { getAvailabilityRequest, submitGoogleAvailability, type PublicAvailabilityRequest } from "../services/availabilityRequests";
import { getGoogleCalendarAvailability, getGoogleCalendarStatus, googleCalendarConnectUrl } from "../services/googleCalendar";

type Props = { token: string };

export function AvailabilityConsentPage({ token }: Props) {
  const [request, setRequest] = useState<PublicAvailabilityRequest | null>(null);
  const [error, setError] = useState("");
  const [googleReady, setGoogleReady] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    getAvailabilityRequest(token).then(setRequest).catch(() => setError("This availability request is invalid or no longer available."));
  }, [token]);

  useEffect(() => {
    if (request?.status !== "pending") return;
    getGoogleCalendarStatus()
      .then((status) => setGoogleReady(status.connected && status.availabilityGranted))
      .catch(() => setGoogleReady(false));
  }, [request]);

  async function shareGoogleAvailability() {
    if (!request) return;
    setSharing(true);
    setError("");
    try {
      const availability = await getGoogleCalendarAvailability(request.timeMin, request.timeMax);
      const primary = availability.calendars.find((calendar) => calendar.id === "primary");
      if (!primary || primary.status !== "available") throw new Error("availability_unavailable");
      await submitGoogleAvailability(token, primary.busy);
      setRequest({ ...request, status: "shared" });
    } catch {
      setError("Google availability could not be shared. Confirm the extra availability permission and try again.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <main className="availability-consent-page">
      <section className="availability-consent-card">
        <span className="availability-consent-mark"><CalendarClock size={28} /></span>
        <p className="section-kicker">ATLASTIME AVAILABILITY REQUEST</p>
        {!request && !error && <h1>Checking this private link…</h1>}
        {error && <><h1>Link unavailable</h1><p role="alert">{error}</p></>}
        {request && request.status !== "pending" && (
          <><h1>This request is {request.status}.</h1><p>No calendar access will be requested from this link.</p></>
        )}
        {request?.status === "pending" && (
          <>
            <h1>Share busy/free time for {request.personName}</h1>
            <p>AtlasTime will ask your calendar provider only whether selected times are occupied or free.</p>
            <ul>
              <li><ShieldCheck size={17} /> No event titles, descriptions, attendees, or locations.</li>
              <li><ShieldCheck size={17} /> You choose the provider and explicitly approve access.</li>
              <li><ShieldCheck size={17} /> The request expires {new Date(request.expiresAt).toLocaleString()}.</li>
            </ul>
            <div className="availability-consent-providers" aria-label="Calendar providers coming next">
              {googleReady ? (
                <button type="button" className="primary-button" disabled={sharing} onClick={shareGoogleAvailability}>
                  {sharing ? "Sharing busy/free…" : "Share Google busy/free"}
                </button>
              ) : (
                <a className="primary-button" href={googleCalendarConnectUrl(`/availability/${token}`, true)}>Continue with Google</a>
              )}
              <button type="button" className="secondary-button" disabled>Continue with Outlook</button>
            </div>
            <p className="availability-consent-note">Nothing is shared until you authorize Google and press Share Google busy/free. Outlook remains pending.</p>
          </>
        )}
      </section>
    </main>
  );
}
