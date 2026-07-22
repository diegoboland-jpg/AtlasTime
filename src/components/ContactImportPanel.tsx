import { useId, useState, type ChangeEvent } from "react";
import { ContactRound, FileUp, Smartphone, X } from "lucide-react";
import { draftsFromDeviceContacts, parseCsvContacts, parseVCardContacts, type ContactImportDraft } from "../contactImport";

type DeviceContact = { name?: string[]; email?: string[]; address?: Array<{ city?: string; country?: string }> };
type ContactsNavigator = Navigator & {
  contacts?: {
    getProperties(): Promise<string[]>;
    select(properties: string[], options: { multiple: boolean }): Promise<DeviceContact[]>;
  };
};

type Props = {
  onComplete: (draft: ContactImportDraft) => void;
};

function mergeDrafts(current: ContactImportDraft[], imported: ContactImportDraft[]) {
  const keys = new Set(current.map((draft) => draft.email ?? `${draft.name.toLocaleLowerCase()}|${draft.city?.toLocaleLowerCase() ?? ""}`));
  return [...current, ...imported.filter((draft) => {
    const key = draft.email ?? `${draft.name.toLocaleLowerCase()}|${draft.city?.toLocaleLowerCase() ?? ""}`;
    if (keys.has(key)) return false;
    keys.add(key);
    return true;
  })].slice(0, 100);
}

export function ContactImportPanel({ onComplete }: Props) {
  const [drafts, setDrafts] = useState<ContactImportDraft[]>([]);
  const [status, setStatus] = useState("");
  const inputId = useId();
  const contactsApi = typeof navigator === "undefined" ? undefined : (navigator as ContactsNavigator).contacts;
  const pickerAvailable = Boolean(typeof window !== "undefined" && window.isSecureContext && contactsApi?.select && contactsApi?.getProperties);

  async function pickFromDevice() {
    if (!pickerAvailable || !contactsApi) return;
    setStatus("");
    try {
      const supported = await contactsApi.getProperties();
      const requested = ["name", "email", "address"].filter((property) => supported.includes(property));
      if (!requested.includes("name")) {
        setStatus("This device cannot share contact names with AtlasTime.");
        return;
      }
      const imported = draftsFromDeviceContacts(await contactsApi.select(requested, { multiple: true }));
      setDrafts((current) => mergeDrafts(current, imported));
      setStatus(imported.length ? `${imported.length} selected. Complete each contact with a timezone.` : "No contacts selected.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus("The contact picker could not be opened. Use a vCard or CSV file instead.");
    }
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 1_000_000) {
      setStatus("Choose a contact file smaller than 1 MB.");
      return;
    }
    try {
      const text = await file.text();
      const imported = file.name.toLocaleLowerCase().endsWith(".csv") || file.type.includes("csv")
        ? parseCsvContacts(text)
        : parseVCardContacts(text);
      setDrafts((current) => mergeDrafts(current, imported));
      setStatus(imported.length ? `${imported.length} imported. Complete each contact with a timezone.` : "No usable contacts were found in that file.");
    } catch {
      setStatus("That contact file could not be read.");
    }
  }

  return (
    <section className="contact-import-panel" aria-labelledby="contact-import-heading">
      <div className="contact-import-heading">
        <div>
          <p className="section-kicker"><ContactRound size={14} /> IMPORT</p>
          <h3 id="contact-import-heading">Bring selected contacts into AtlasTime</h3>
        </div>
        <div className="contact-import-actions">
          <button type="button" className="secondary-button" onClick={pickFromDevice} disabled={!pickerAvailable}>
            <Smartphone size={16} /> Choose from device
          </button>
          <label className="secondary-button" htmlFor={inputId}>
            <FileUp size={16} /> Import vCard / CSV
          </label>
          <input id={inputId} className="sr-only" type="file" accept=".vcf,.vcard,text/vcard,text/x-vcard,.csv,text/csv" onChange={importFile} />
        </div>
      </div>
      {!pickerAvailable && <p className="contact-import-support">Device selection requires a supported Android browser or installed app on HTTPS. File import works here.</p>}
      <p className="contact-import-privacy">You choose exactly which contacts and fields to share. AtlasTime stores completed contacts only in this browser and never edits the source address book.</p>
      {status && <p className="contact-import-status" role="status" aria-live="polite">{status}</p>}
      {drafts.length > 0 && (
        <div className="contact-import-drafts" aria-label="Contacts waiting for a timezone">
          {drafts.map((draft) => (
            <article key={draft.id}>
              <span><strong>{draft.name}</strong><small>{draft.email ?? "No email shared"}{draft.city ? ` · ${draft.city}` : " · Location needed"}</small></span>
              <button type="button" className="primary-button" onClick={() => onComplete(draft)}>Complete</button>
              <button type="button" className="icon-button" aria-label={`Dismiss ${draft.name}`} onClick={() => setDrafts((current) => current.filter(({ id }) => id !== draft.id))}>
                <X size={15} />
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
