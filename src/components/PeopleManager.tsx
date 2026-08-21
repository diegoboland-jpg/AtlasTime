import { useState } from "react";
import { ArrowLeft, Clock3, ContactRound, Mail, Plus, Share2, Users } from "lucide-react";
import { personFromContact } from "../contacts";
import type { ContactImportDraft } from "../contactImport";
import { createId } from "../id";
import type { ContactRecord, Person, PersonAvailability } from "../types";
import { AddPersonForm } from "./AddPersonForm";
import { PersonCard } from "./PersonCard";
import { ContactImportPanel } from "./ContactImportPanel";
import { adjustWorkHours, formatWorkHour, WORK_END_OPTIONS, WORK_START_OPTIONS } from "../workHours";

type Props = {
  groupName: string;
  people: Person[];
  contacts: ContactRecord[];
  now: Date;
  selectedInstant: Date;
  organizer: Person;
  showForm: boolean;
  onBack: () => void;
  onToggleForm: () => void;
  onAdd: (person: Person) => void;
  onCancelAdd: () => void;
  onChange: (person: Person) => void;
  onOrganizerChange: (person: Person) => void;
  onShareProfile: () => Promise<"shared" | "copied" | "cancelled" | "manual">;
  onRemove: (id: string) => void;
  onAvailabilityResult?: (personId: string, result: PersonAvailability | null) => void;
};

export function PeopleManager({
  groupName,
  people,
  contacts = [],
  now,
  selectedInstant,
  organizer,
  showForm,
  onBack,
  onToggleForm,
  onAdd,
  onCancelAdd,
  onChange,
  onOrganizerChange,
  onShareProfile,
  onRemove,
  onAvailabilityResult = () => undefined,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importDraft, setImportDraft] = useState<ContactImportDraft | null>(null);
  const [profileShareStatus, setProfileShareStatus] = useState("");
  const editingPerson = people.find((person) => person.id === editingId);
  const activeContactIds = new Set(people.map((person) => person.contactId ?? person.id));

  function closeForm() {
    setEditingId(null);
    setImportDraft(null);
    onCancelAdd();
  }

  return (
    <section className="people-manager" aria-labelledby="people-manager-heading">
      <div className="people-manager-toolbar">
        <button type="button" className="secondary-button" onClick={onBack}>
          <ArrowLeft size={17} /> Back to groups &amp; people
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={() => { setEditingId(null); setImportDraft(null); onToggleForm(); }}
          aria-expanded={showForm}
          aria-controls="add-entry-form"
        >
          <Plus size={18} /> Add person, location, or team
        </button>
      </div>

      <div className="people-manager-heading">
        <p className="section-kicker"><ContactRound size={16} /> PEOPLE</p>
        <h1 id="people-manager-heading">Manage {groupName}</h1>
        <p>Reuse a local contact, edit email and travel location, adjust working hours, or keep a location-only entry without crowding the planner.</p>
      </div>

      <section className="my-availability-settings" aria-labelledby="my-availability-heading">
        <span className="my-availability-icon"><Clock3 size={22} aria-hidden="true" /></span>
        <div className="my-availability-copy">
          <p className="section-kicker">MY AVAILABILITY</p>
          <h2 id="my-availability-heading">When should Kikroo consider me available?</h2>
          <p>These hours are used for recommendations in your device time zone, {organizer.timeZone.replaceAll("_", " ")}. Connected calendars can additionally mark busy periods.</p>
          <label className="profile-display-name">
            Name others will see
            <input value={organizer.name} maxLength={80} onChange={(event) => onOrganizerChange({ ...organizer, name: event.target.value })} />
          </label>
        </div>
        <div className="my-availability-hours work-hours">
          <label>
            Starts
            <select
              value={organizer.workStart}
              onChange={(event) => onOrganizerChange({ ...organizer, ...adjustWorkHours(organizer.workStart, organizer.workEnd, "start", Number(event.target.value)) })}
            >
              {WORK_START_OPTIONS.map((hour) => <option key={hour} value={hour}>{formatWorkHour(hour)}</option>)}
            </select>
          </label>
          <span>to</span>
          <label>
            Ends
            <select
              value={organizer.workEnd}
              onChange={(event) => onOrganizerChange({ ...organizer, ...adjustWorkHours(organizer.workStart, organizer.workEnd, "end", Number(event.target.value)) })}
            >
              {WORK_END_OPTIONS.map((hour) => <option key={hour} value={hour}>{formatWorkHour(hour)}</option>)}
            </select>
          </label>
        </div>
        <div className="profile-share-action">
          <button type="button" className="primary-button" onClick={async () => {
            const result = await onShareProfile();
            setProfileShareStatus(result === "shared" ? "Share sheet opened." : result === "copied" ? "Private profile link copied." : result === "manual" ? "Copy the link from the open dialog." : "");
          }}>
            <Share2 size={17} /> Share my Kikroo
          </button>
          <small>Invite friends, family, or coworkers to see your time zone and preferred hours.</small>
          {profileShareStatus && <span role="status">{profileShareStatus}</span>}
        </div>
      </section>

      <section className="contact-directory" aria-labelledby="contact-directory-heading">
        <div>
          <p className="section-kicker"><ContactRound size={15} /> LOCAL DIRECTORY</p>
          <h2 id="contact-directory-heading">Your Kikroo contacts</h2>
          <p>Saved only in this browser. A contact remains here when removed from a group.</p>
        </div>
        <div className="contact-directory-list">
          {contacts.map((contact) => {
            const inGroup = activeContactIds.has(contact.id);
            return (
              <article key={contact.id}>
                <span className="contact-directory-avatar" aria-hidden="true">{contact.name.slice(0, 1).toUpperCase()}</span>
                <span><strong>{contact.name}</strong><small>{contact.email ?? contact.phone ?? "No email or phone yet"} · {contact.city}</small></span>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={inGroup}
                  onClick={() => onAdd(personFromContact(contact, createId()))}
                >
                  {inGroup ? "In group" : "+ Add"}
                </button>
              </article>
            );
          })}
          {contacts.length === 0 && <p className="contact-directory-empty"><Mail size={17} /> New contacts will appear here after you save them.</p>}
        </div>
      </section>

      <ContactImportPanel onComplete={(draft) => {
        setEditingId(null);
        setImportDraft(draft);
        onCancelAdd();
      }} />

      {(showForm || editingPerson || importDraft) && (
        <div id="add-entry-form" className="people-manager-form">
          <AddPersonForm
            key={editingPerson?.id ?? importDraft?.id ?? "new-contact"}
            initialPerson={editingPerson}
            initialDraft={importDraft ?? undefined}
            onAdd={(person) => {
              if (editingPerson) onChange(person);
              else onAdd(person);
              setEditingId(null);
              setImportDraft(null);
            }}
            onCancel={closeForm}
          />
        </div>
      )}

      <div className="people-rolodex" aria-label={`Entries in ${groupName}`}>
        {people.map((person, index) => (
          <div className="rolodex-card" data-card-index={Math.min(index, 9)} key={person.id}>
            <PersonCard
              person={person}
              now={now}
              selectedInstant={selectedInstant}
              onChange={onChange}
              onRemove={onRemove}
              onAvailabilityResult={onAvailabilityResult}
              onEdit={() => { setEditingId(person.id); setImportDraft(null); onCancelAdd(); }}
            />
          </div>
        ))}
        {people.length === 0 && (
          <div className="empty-state">
            <Users size={28} aria-hidden="true" />
            <h3>This group is ready.</h3>
            <p>Add a person, location, or team, or reuse one from your local directory.</p>
          </div>
        )}
      </div>

      <p className="people-manager-future-note">
        Device, Google, and Outlook contact import will remain opt-in. Editing this local directory never changes the original phone or account contact.
      </p>
    </section>
  );
}
