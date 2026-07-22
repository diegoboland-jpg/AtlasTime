import type { CSSProperties } from "react";
import { ArrowLeft, ContactRound, Plus, Users } from "lucide-react";
import type { Person } from "../types";
import { AddPersonForm } from "./AddPersonForm";
import { PersonCard } from "./PersonCard";

type Props = {
  groupName: string;
  people: Person[];
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
  return (
    <section className="people-manager" aria-labelledby="people-manager-heading">
      <div className="people-manager-toolbar">
        <button type="button" className="secondary-button" onClick={onBack}>
          <ArrowLeft size={17} /> Back to planner
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={onToggleForm}
          aria-expanded={showForm}
          aria-controls="add-entry-form"
        >
          <Plus size={18} /> Add person, location, or team
        </button>
      </div>

      <div className="people-manager-heading">
        <p className="section-kicker"><ContactRound size={16} /> PEOPLE</p>
        <h1 id="people-manager-heading">Manage {groupName}</h1>
        <p>Edit working hours, add a location-only card, or remove entries here without crowding the planner.</p>
      </div>

      {showForm && (
        <div id="add-entry-form" className="people-manager-form">
          <AddPersonForm onAdd={onAdd} onCancel={onCancelAdd} />
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
            />
          </div>
        ))}
        {people.length === 0 && (
          <div className="empty-state">
            <Users size={28} aria-hidden="true" />
            <h3>This group is ready.</h3>
            <p>Add a person, location, or team. Contact-account import will come in a future connected phase.</p>
          </div>
        )}
      </div>

      <p className="people-manager-future-note">
        Future contact sync will be opt-in. AtlasTime will ask before reading Google or Outlook contacts and will keep location-only entries available.
      </p>
    </section>
  );
}
