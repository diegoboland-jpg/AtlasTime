import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Globe2, MessageCircle, Phone, Settings2, Users, Video } from "lucide-react";
import { GroupManager } from "./components/GroupManager";
import { MeetingHandoff } from "./components/MeetingHandoff";
import { MobileTimeOverview } from "./components/MobileTimeOverview";
import { PeopleManager } from "./components/PeopleManager";
import { PwaInstall } from "./components/PwaInstall";
import { PwaUpdateNotice } from "./components/PwaUpdateNotice";
import { ShareImportBanner } from "./components/ShareImportBanner";
import { TimePlanner } from "./components/TimePlanner";
import { TimeSlider } from "./components/TimeSlider";
import { clearShareHash, createShareLink, defaultPlanner, loadGroups, readSharedGroup, saveGroups } from "./groups";
import { createId } from "./id";
import { bestHour, dateAtUtcHour, formatInZone, scoreAtUtcHour, scoreHours } from "./time";
import type { Person, SavedGroup } from "./types";

type PendingPersonRemoval = {
  groupId: string;
  groupName: string;
  person: Person;
  index: number;
};

function utcDateInput(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export default function App() {
  const [workspace, setWorkspace] = useState(loadGroups);
  const [sharedPayload, setSharedPayload] = useState(readSharedGroup);
  const [now, setNow] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [managingPeople, setManagingPeople] = useState(false);
  const [plannerExpanded, setPlannerExpanded] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [pendingPersonRemoval, setPendingPersonRemoval] = useState<PendingPersonRemoval | null>(null);
  const [restoredPersonFocusId, setRestoredPersonFocusId] = useState<string | null>(null);
  const removalTimer = useRef<number | null>(null);

  const activeGroup = workspace.groups.find((group) => group.id === workspace.activeGroupId) ?? workspace.groups[0];
  const people = activeGroup.people;
  const planner = activeGroup.planner;

  useEffect(() => saveGroups(workspace.groups, workspace.activeGroupId), [workspace]);
  useEffect(() => setPlannerExpanded(false), [workspace.activeGroupId]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => () => {
    if (removalTimer.current !== null) window.clearTimeout(removalTimer.current);
  }, []);
  useEffect(() => {
    if (!pendingPersonRemoval) return;
    window.requestAnimationFrame(() => document.getElementById("undo-person-removal")?.focus());
  }, [pendingPersonRemoval]);
  useEffect(() => {
    if (!restoredPersonFocusId) return;
    window.requestAnimationFrame(() => {
      document.getElementById(`person-card-${restoredPersonFocusId}`)?.focus();
      setRestoredPersonFocusId(null);
    });
  }, [restoredPersonFocusId]);

  const hours = useMemo(() => scoreHours(people, planner.date, planner.durationMinutes), [people, planner.date, planner.durationMinutes]);
  const recommendation = useMemo(() => bestHour(people, planner.date, planner.durationMinutes), [people, planner.date, planner.durationMinutes]);
  const selectedInstant = dateAtUtcHour(planner.date, planner.hour);
  const selectedScore = useMemo(() => scoreAtUtcHour(people, planner.date, planner.hour, planner.durationMinutes), [people, planner.date, planner.hour, planner.durationMinutes]);

  function updateActiveGroup(update: (group: SavedGroup) => SavedGroup) {
    setWorkspace((current) => ({
      ...current,
      groups: current.groups.map((group) => group.id === current.activeGroupId
        ? { ...update(group), updatedAt: new Date().toISOString() }
        : group),
    }));
  }

  function updatePerson(updated: Person) {
    updateActiveGroup((group) => ({ ...group, people: group.people.map((person) => person.id === updated.id ? updated : person) }));
  }

  function clearRemovalTimer() {
    if (removalTimer.current === null) return;
    window.clearTimeout(removalTimer.current);
    removalTimer.current = null;
  }

  function scheduleRemovalExpiry() {
    clearRemovalTimer();
    removalTimer.current = window.setTimeout(() => {
      setPendingPersonRemoval(null);
      removalTimer.current = null;
    }, 8_000);
  }

  function removePerson(id: string) {
    const index = people.findIndex((person) => person.id === id);
    const person = people[index];
    if (!person) return;
    setPendingPersonRemoval({ groupId: activeGroup.id, groupName: activeGroup.name, person, index });
    updateActiveGroup((group) => ({ ...group, people: group.people.filter((item) => item.id !== id) }));
    scheduleRemovalExpiry();
  }

  function undoPersonRemoval() {
    const removal = pendingPersonRemoval;
    if (!removal) return;
    clearRemovalTimer();
    setWorkspace((current) => ({
      ...current,
      groups: current.groups.map((group) => {
        if (group.id !== removal.groupId || group.people.some((person) => person.id === removal.person.id)) return group;
        const peopleAtOriginalPosition = [...group.people];
        peopleAtOriginalPosition.splice(Math.min(removal.index, peopleAtOriginalPosition.length), 0, removal.person);
        return { ...group, people: peopleAtOriginalPosition, updatedAt: new Date().toISOString() };
      }),
    }));
    setPendingPersonRemoval(null);
    setRestoredPersonFocusId(removal.person.id);
  }

  function selectHour(hour: number) {
    updateActiveGroup((group) => ({ ...group, planner: { ...group.planner, hour } }));
  }

  function selectNow() {
    const current = new Date();
    setNow(current);
    updateActiveGroup((group) => ({
      ...group,
      planner: { ...group.planner, date: utcDateInput(current), hour: current.getUTCHours() + (current.getUTCMinutes() >= 30 ? 0.5 : 0) },
    }));
  }

  function openPlanner() {
    setPlannerExpanded(true);
    window.requestAnimationFrame(() => document.getElementById("planner")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function openAddEntry() {
    setManagingPeople(true);
    setShowForm(true);
    window.requestAnimationFrame(() => document.getElementById("add-entry-form")?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  function createGroup() {
    const requested = window.prompt("Name the new group", "New group")?.trim();
    if (!requested) return;
    const group: SavedGroup = { id: createId(), name: requested, people: [], planner: defaultPlanner(), updatedAt: new Date().toISOString() };
    setWorkspace((current) => ({ groups: [...current.groups, group], activeGroupId: group.id }));
    setShowForm(false);
  }

  function renameGroup() {
    const requested = window.prompt("Rename this group", activeGroup.name)?.trim();
    if (requested) updateActiveGroup((group) => ({ ...group, name: requested }));
  }

  function deleteGroup() {
    if (workspace.groups.length === 1 || !window.confirm(`Delete â€œ${activeGroup.name}â€ from this browser?`)) return;
    setWorkspace((current) => {
      const groups = current.groups.filter((group) => group.id !== current.activeGroupId);
      return { groups, activeGroupId: groups[0].id };
    });
  }

  async function shareGroup() {
    const approved = window.confirm("This link contains the group name, people or team names, locations, time zones, working hours, and any meeting title, location, or notes. Anyone with the link can read that information. Create it?");
    if (!approved) return;
    const link = createShareLink(activeGroup);
    try {
      await navigator.clipboard.writeText(link);
      setCopyStatus("Copied!");
      window.setTimeout(() => setCopyStatus(""), 2200);
    } catch {
      window.prompt("Copy this AtlasTime link", link);
    }
  }

  function importSharedGroup() {
    if (!sharedPayload) return;
    const group: SavedGroup = {
      id: createId(),
      name: sharedPayload.name,
      people: sharedPayload.people.map((person) => ({ ...person, id: createId() })),
      planner: sharedPayload.planner,
      updatedAt: new Date().toISOString(),
    };
    setWorkspace((current) => ({ groups: [...current.groups, group], activeGroupId: group.id }));
    setSharedPayload(null);
    clearShareHash();
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to planner content</a>
      <header className="topbar">
        <a className="brand" href="#main-content" aria-label="AtlasTime home">
          <span className="brand-mark"><Globe2 size={20} /></span>
          <span>AtlasTime</span>
        </a>
        <div className="topbar-actions">
          <PwaInstall />
          <span className="mvp-badge">v0.31 flexible durations</span>
        </div>
      </header>

      <PwaUpdateNotice />

      <main id="main-content" tabIndex={-1}>
        {sharedPayload && <ShareImportBanner payload={sharedPayload} onImport={importSharedGroup} onDismiss={() => { setSharedPayload(null); clearShareHash(); }} />}

        {managingPeople ? (
          <PeopleManager
            groupName={activeGroup.name}
            people={people}
            now={now}
            selectedInstant={selectedInstant}
            showForm={showForm}
            onBack={() => { setManagingPeople(false); setShowForm(false); }}
            onToggleForm={() => setShowForm((current) => !current)}
            onAdd={(person) => { updateActiveGroup((group) => ({ ...group, people: [...group.people, person] })); setShowForm(false); }}
            onCancelAdd={() => setShowForm(false)}
            onChange={updatePerson}
            onRemove={removePerson}
          />
        ) : (
          <>

        <MobileTimeOverview
          now={now}
          people={people}
          selectedInstant={selectedInstant}
          selectedHour={planner.hour}
          selectedScore={selectedScore}
          scoringEnabled={planner.eventMode === "timed"}
          onHourChange={selectHour}
          onNow={selectNow}
          onOpenPlanner={openPlanner}
          onAddEntry={openAddEntry}
        />

        <section className="hero">
          <div>
            <p className="eyebrow">TIME ZONES, WITHOUT THE MATH</p>
            <h1>Find a humane time<br />for everyone.</h1>
            <p className="hero-copy">Explore every hour, compare live local times, and choose a fair meeting window.</p>
          </div>
          <div className="hero-clock" aria-label={`Your local time is ${formatInZone(now, Intl.DateTimeFormat().resolvedOptions().timeZone)}`}>
            <span>Your local time</span>
            <strong>{formatInZone(now, Intl.DateTimeFormat().resolvedOptions().timeZone)}</strong>
            <small>{Intl.DateTimeFormat().resolvedOptions().timeZone.replaceAll("_", " ")}</small>
          </div>
        </section>

        <GroupManager
          groups={workspace.groups}
          activeGroupId={workspace.activeGroupId}
          copyStatus={copyStatus}
          onSelect={(activeGroupId) => { setWorkspace((current) => ({ ...current, activeGroupId })); setShowForm(false); }}
          onCreate={createGroup}
          onRename={renameGroup}
          onDelete={deleteGroup}
          onShare={shareGroup}
        />

        <section className="section people-summary-section">
          <div className="section-heading">
            <div>
              <p className="section-kicker"><Users size={16} /> PEOPLE</p>
              <h2>{people.length} {people.length === 1 ? "entry" : "entries"} in this group</h2>
            </div>
            <button className="secondary-button" onClick={() => setManagingPeople(true)}>
              <Settings2 size={18} /> Manage people
            </button>
          </div>
          <div className="people-summary-list" aria-label={`People in ${activeGroup.name}`}>
            {people.slice(0, 6).map((person) => <span key={person.id}>{person.name}</span>)}
            {people.length > 6 && <span>+{people.length - 6} more</span>}
            {people.length === 0 && <button type="button" onClick={openAddEntry}>+ Add the first entry</button>}
          </div>
        </section>

        <TimeSlider
          selectedHour={planner.hour}
          selectedScore={selectedScore}
          scoringEnabled={planner.eventMode === "timed"}
          onHourChange={selectHour}
          onNow={selectNow}
        />

        <TimePlanner
          people={people}
          dateValue={planner.date}
          selectedHour={planner.hour}
          durationMinutes={planner.durationMinutes}
          eventMode={planner.eventMode}
          recommendation={recommendation}
          hours={hours}
          expanded={plannerExpanded}
          onExpandedChange={setPlannerExpanded}
          onDateChange={(date) => updateActiveGroup((group) => ({ ...group, planner: { ...group.planner, date } }))}
          onDurationChange={(durationMinutes) => updateActiveGroup((group) => ({ ...group, planner: { ...group.planner, durationMinutes } }))}
          onEventModeChange={(eventMode) => updateActiveGroup((group) => ({ ...group, planner: { ...group.planner, eventMode } }))}
          onHourChange={selectHour}
        />

        <MeetingHandoff
          people={people}
          planner={planner}
          selectedInstant={selectedInstant}
          onTitleChange={(title) => updateActiveGroup((group) => ({ ...group, planner: { ...group.planner, title } }))}
          onLocationChange={(location) => updateActiveGroup((group) => ({ ...group, planner: { ...group.planner, location } }))}
          onNotesChange={(notes) => updateActiveGroup((group) => ({ ...group, planner: { ...group.planner, notes } }))}
        />

        <section className="section launch-section">
          <div>
            <p className="section-kicker"><Phone size={16} /> CONNECT</p>
            <h2>Move from planning to calling.</h2>
            <p>These shortcuts only open each provider. AtlasTime does not create meetings or connect calendars yet.</p>
          </div>
          <div className="launch-grid">
            <a href="https://wa.me/" target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp <ExternalLink size={15} /></a>
            <a href="https://zoom.us/start/videomeeting" target="_blank" rel="noreferrer"><Video /> Zoom <ExternalLink size={15} /></a>
            <a href="https://t.me/" target="_blank" rel="noreferrer"><MessageCircle /> Telegram <ExternalLink size={15} /></a>
            <a href="viber://chat"><Phone /> Viber <ExternalLink size={15} /></a>
          </div>
          <p className="selected-summary">Selected instant: <strong>{selectedInstant.toUTCString()}</strong></p>
        </section>
          </>
        )}
      </main>

      {pendingPersonRemoval && (
        <aside
          className="undo-toast"
          aria-live="polite"
          aria-atomic="true"
          onFocus={clearRemovalTimer}
          onBlur={scheduleRemovalExpiry}
          onMouseEnter={clearRemovalTimer}
          onMouseLeave={scheduleRemovalExpiry}
        >
          <span><strong>{pendingPersonRemoval.person.name} removed</strong> from {pendingPersonRemoval.groupName}.</span>
          <button id="undo-person-removal" type="button" onClick={undoPersonRemoval}>Undo</button>
        </aside>
      )}

      <footer><span>AtlasTime v0.31</span><span>Groups stay in this browser. Share links contain a portable copy.</span></footer>
    </div>
  );
}

