import { useEffect, useRef } from "react";
import type { CalendarAttendee } from "../meeting";

type Props = {
  destination: string;
  confirmLabel: string;
  eventTitle: string;
  timing: string;
  location: string;
  attendees: CalendarAttendee[];
  onCancel: () => void;
  onConfirm: () => void;
};

export function CalendarHandoffDialog({ destination, confirmLabel, eventTitle, timing, location, attendees, onCancel, onConfirm }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div className="calendar-review-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section className="calendar-review" role="dialog" aria-modal="true" aria-labelledby="calendar-review-title">
        <p className="section-kicker">FINAL REVIEW</p>
        <h3 id="calendar-review-title">Continue to {destination}?</h3>
        <p>Nothing has been sent or saved. Check the details before AtlasTime continues.</p>
        <dl>
          <div><dt>Event</dt><dd>{eventTitle.trim() || "AtlasTime meeting"}</dd></div>
          <div><dt>When</dt><dd>{timing}</dd></div>
          {location.trim() && <div><dt>Location</dt><dd>{location.trim()}</dd></div>}
          <div>
            <dt>Invitees</dt>
            <dd>{attendees.length ? attendees.map(({ email }) => email).join(", ") : "None included"}</dd>
          </div>
        </dl>
        <div className="calendar-review-actions">
          <button ref={cancelRef} type="button" className="secondary-button" onClick={onCancel}>Go back</button>
          <button type="button" className="primary-button" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
