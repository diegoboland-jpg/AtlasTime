import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import type { SavedGroup } from "../types";

type Props = {
  groups: SavedGroup[];
  activeGroupId: string;
  copyStatus: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRename: () => void;
  onDelete: () => void;
  onShare: () => void;
};

export function GroupManager({ groups, activeGroupId, copyStatus, onSelect, onCreate, onRename, onDelete, onShare }: Props) {
  return (
    <section className="group-manager" aria-label="Saved groups">
      <div className="group-copy">
        <span>SAVED GROUP</span>
        <strong>Keep different teams and trips separate.</strong>
      </div>
      <label className="group-select">
        <span>Current group</span>
        <select value={activeGroupId} onChange={(event) => onSelect(event.target.value)}>
          {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
        </select>
      </label>
      <div className="group-actions">
        <button type="button" onClick={onCreate}><Plus size={16} /> New</button>
        <button type="button" onClick={onRename}><Pencil size={15} /> Rename</button>
        <button type="button" onClick={onShare}><Copy size={15} /> {copyStatus || "Share"}</button>
        <button type="button" className="danger-action" onClick={onDelete} disabled={groups.length === 1} title={groups.length === 1 ? "Keep at least one group" : "Delete this group"}>
          <Trash2 size={15} /> Delete
        </button>
      </div>
    </section>
  );
}
