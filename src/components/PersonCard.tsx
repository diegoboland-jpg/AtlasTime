import { CalendarPlus2, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatInZone, hourInZone } from "../time";
import type { Person, PersonAvailability } from "../types";
import { AvailabilityRequestDialog } from "./AvailabilityRequestDialog";

type PersonCardProps = {
  person: Person;
  now: Date;
  selectedInstant: Date;
  onChange: (person: Person) => void;
  onRemove: (id: string) => void;
  onEdit: () => void;
  onAvailabilityResult?: (personId: string, result: PersonAvailability | null) => void;
};

const hourOptions = Array.from({ length: 24 }, (_, hour) => hour);

export function PersonCard({ person, now, selectedInstant, onChange, onRemove, onEdit, onAvailabilityResult = () => undefined }: PersonCardProps) {
  const [showAvailabilityRequest, setShowAvailabilityRequest] = useState(false);
  const localHour = hourInZone(now, person.timeZone);
  const working = localHour >= person.workStart && localHour < person.workEnd;
  const requestStatus = person.availabilityRequestStatus ?? "not-requested";

  function changeWorkHours(field: "workStart" | "workEnd", value: number) {
    const next = { ...person, [field]: value };
    if (field === "workStart" && value >= next.workEnd) {
      next.workEnd = Math.min(23, value + 1);
      next.workStart = Math.min(value, next.workEnd - 1);
    }
    if (field === "workEnd" && value <= next.workStart) {
      next.workStart = Math.max(0, value - 1);
      next.workEnd = Math.max(value, next.workStart + 1);
    }
    onChange(next);
  }

  return (
    <article id={`person-card-${person.id}`} className="person-card" tabIndex={-1} aria-labelledby={`person-${person.id}-name`}>
      <div className="avatar" aria-hidden="true">{person.name.slice(0, 1).toUpperCase()}</div>
      <div className="person-main">
        <h3 id={`person-${person.id}-name`}>{person.name}</h3>
        <p>{person.city || person.timeZone.replaceAll("_", " ")}</p>
        {person.email && <a className="person-email" href={`mailto:${person.email}`}>{person.email}</a>}
        {person.phone && <a className="person-phone" href={`tel:${person.phone}`}>{person.phone}</a>}
        <span className={working ? "status online" : "status"}>
          {working ? "Working hours" : "Outside work hours"}
        </span>
      </div>

      <div className="person-time">
        <small>Now</small>
        <strong>{formatInZone(now, person.timeZone)}</strong>
        <span>
          {formatInZone(now, person.timeZone, {
            weekday: "short",
            day: "2-digit",
            month: "short",
          })}
        </span>
      </div>

      <div className="person-card-actions">
        <button type="button" className="icon-button edit-person" onClick={onEdit} aria-label={`Edit ${person.name}`} title={`Edit ${person.name}`}>
          <Pencil size={15} />
        </button>
        <button
          type="button"
          className="icon-button remove"
          data-card-action="delete"
          onClick={() => onRemove(person.id)}
          aria-label={`Remove ${person.name}`}
          title={`Remove ${person.name}`}
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="selected-person-time">
        <span>Selected</span>
        <strong>{formatInZone(selectedInstant, person.timeZone)}</strong>
        <small>
          {formatInZone(selectedInstant, person.timeZone, {
            weekday: "short",
            day: "2-digit",
            month: "short",
          })}
        </small>
      </div>

      <div className="work-hours" aria-label={`${person.name} working hours`}>
        <label>
          Starts
          <select
            value={person.workStart}
            onChange={(event) => changeWorkHours("workStart", Number(event.target.value))}
          >
            {hourOptions.map((hour) => (
              <option key={hour} value={hour}>{String(hour).padStart(2, "0")}:00</option>
            ))}
          </select>
        </label>
        <span>to</span>
        <label>
          Ends
          <select
            value={person.workEnd}
            onChange={(event) => changeWorkHours("workEnd", Number(event.target.value))}
          >
            {hourOptions.map((hour) => (
              <option key={hour} value={hour}>{String(hour).padStart(2, "0")}:00</option>
            ))}
          </select>
        </label>
      </div>
      {(person.email || person.phone) && (
        <div className="availability-request-row">
          <div>
            <strong>Calendar availability</strong>
            <span className={`availability-request-status ${requestStatus}`}>
              {requestStatus === "requested" ? "Request prepared" : requestStatus.replace("-", " ")}
            </span>
          </div>
          <button type="button" className="secondary-button" onClick={() => setShowAvailabilityRequest(true)}>
            <CalendarPlus2 size={16} /> {requestStatus === "requested" ? "Send again" : "Request availability"}
          </button>
        </div>
      )}
      {showAvailabilityRequest && (
        <AvailabilityRequestDialog
          person={person}
          selectedInstant={selectedInstant}
          onClose={() => setShowAvailabilityRequest(false)}
          onRequested={() => onChange({
            ...person,
            availabilityRequestStatus: "requested",
            availabilityRequestedAt: new Date().toISOString(),
          })}
          onRevoked={() => onChange({
            ...person,
            availabilityRequestStatus: "not-requested",
            availabilityRequestedAt: undefined,
          })}
          onStatusChange={(availabilityRequestStatus) => onChange({
            ...person,
            availabilityRequestStatus,
          })}
          onAvailabilityResult={(result) => onAvailabilityResult(person.contactId ?? person.id, result)}
        />
      )}
    </article>
  );
}
