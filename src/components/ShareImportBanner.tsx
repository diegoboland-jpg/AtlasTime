import { Download, X } from "lucide-react";
import type { SharedGroupPayload } from "../types";

type Props = {
  payload: SharedGroupPayload;
  onImport: () => void;
  onDismiss: () => void;
};

export function ShareImportBanner({ payload, onImport, onDismiss }: Props) {
  return (
    <section className="share-import" role="status">
      <div>
        <span>SHARED ATLASTIME GROUP</span>
        <strong>{payload.name}</strong>
        <p>{payload.people.length} {payload.people.length === 1 ? "entry" : "entries"}. Importing creates a new saved group and does not replace your current data.</p>
      </div>
      <div className="share-import-actions">
        <button type="button" className="primary-button" onClick={onImport}><Download size={17} /> Import group</button>
        <button type="button" className="secondary-button" onClick={onDismiss}><X size={17} /> Dismiss</button>
      </div>
    </section>
  );
}
