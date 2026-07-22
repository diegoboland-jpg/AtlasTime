import { useState, type CSSProperties } from "react";
import { ArrowLeft, ContactRound, Mail, Plus, Users } from "lucide-react";
import { personFromContact } from "../contacts";
import { createId } from "../id";
import type { ContactRecord, Person } from "../types";
import { AddPersonForm } from "./AddPersonForm";
import { PersonCard } from "./PersonCard";

type Props = {
  groupName: string;
  people: Person[];
  contacts: ContactRecord[];
  now: Date;
  selectedInstant: Date;
  showForm: boolean;
  onBack: () => void;
  onToggleForm: () => void;
  onAdd: (person: Person) => void;
  onCancelAdd: () => void;
  onChange: (person: Person) => void;
  onRemove: (id: string) => void;
};

export function PeopleManager({
  groupName,
  people,
  contacts = [],
  now,
  selectedInstant,
  showForm,
  onBack,
  onToggleForm,
  onAdd,
  onCancelAdd,
  onChange,
  onRemove,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingPerson = people.find((person) => person.id === editingId);
  const activeContactIds = new Set(people.map((person) => person.contactId ?? person.id));

  function closeForm() {
    setEditingId(null);
    onCancelAdd();
  }

  return (
    <section className="people-manager" aria-labelledby="people-manager-heading">
      <div className="people-manager-toolbar">
        <button type="button" className="secondary-button" onClick={onBack}>
          <ArrowLeft size={17} /> Back to planner
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={() => { setEditingId(null); onToggleForm(); }}
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

      <section className="contact-directory" aria-labelledby="contact-directory-heading">
        <div>
          <p className="section-kicker"><ContactRound size={15} /> LOCAL DIRECTORY</p>
          <h2 id="contact-directory-heading">Your AtlasTime contacts</h2>
          <p>Saved only in this browser. A contact remains here when removed from a group.</p>
        </div>
        <div className="contact-directory-list">
          {contacts.map((contact) => {
            const inGroup = activeContactIds.has(contact.id);
            return (
              <article key={contact.id}>
                <span className="contact-directory-avatar" aria-hidden="true">{contact.name.slice(0, 1).toUpperCase()}</span>
                <span><strong>{contact.name}</strong><small>{contact.email ?? "No email yet"} · {contact.city}</small></span>
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

      {(showForm || editingPerson) && (
        <div id="add-entry-form" className="people-manager-form">
          <AddPersonForm
            key={editingPerson?.id ?? "new-contact"}
            initialPerson={editingPerson}
            onAdd={(person) => {
              if (editingPerson) onChange(person);
              else onAdd(person);
              setEditingId(null);
            }}
            onCancel={closeForm}
          />
        </div>
      )}

      <div className="people-rolodex" aria-label={`Entries in ${groupName}`}>
        {people.map((person, index) => (
          <div className="rolodex-card" style={{ "--card-index": index } as CSSProperties} key={person.id}>
            <PersonCard
              person={person}
              now={now}
              selectedInstant={selectedInstant}
              onChange={onChange}
              onRemove={onRemove}
              onEdit={() => { setEditingId(person.id); onCancelAdd(); }}
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
