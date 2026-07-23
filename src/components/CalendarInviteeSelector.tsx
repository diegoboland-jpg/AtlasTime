import type { CalendarAttendee } from "../meeting";

type Props = {
  attendees: CalendarAttendee[];
  selectedEmails: string[];
  onChange: (emails: string[]) => void;
};

export function CalendarInviteeSelector({ attendees, selectedEmails, onChange }: Props) {
  const selected = new Set(selectedEmails);

  function toggle(email: string) {
    onChange(selected.has(email)
      ? selectedEmails.filter((candidate) => candidate !== email)
      : [...selectedEmails, email]);
  }

  return (
    <fieldset className="calendar-invitees" aria-describedby="calendar-invitees-help">
      <legend>Calendar invitees</legend>
      {attendees.length > 0 && (
        <div className="calendar-invitees-actions">
            <button type="button" onClick={() => onChange(attendees.map(({ email }) => email))}>Include all</button>
            <button type="button" onClick={() => onChange([])}>Clear</button>
        </div>
      )}
      <p id="calendar-invitees-help">
        Choose who is carried into calendar drafts and files. Your calendar provider still asks you to review before sending invitations.
      </p>
      {attendees.length ? (
        <ul>
          {attendees.map((attendee) => (
            <li key={attendee.email}>
              <label>
                <input type="checkbox" checked={selected.has(attendee.email)} onChange={() => toggle(attendee.email)} />
                <span><strong>{attendee.name}</strong><small>{attendee.email}</small></span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p className="calendar-invitees-empty">No people with valid email addresses yet. Calendar handoff still works without invitees.</p>
      )}
      {attendees.length > 0 && <p className="calendar-invitees-count">{selectedEmails.length} of {attendees.length} included</p>}
    </fieldset>
  );
}
