import { useEffect, useRef, useState } from "react";
import { Check, Copy, MessageCircle, Share2, Smartphone, X } from "lucide-react";
import { availabilityRequestMessage, smsAvailabilityUrl, whatsappAvailabilityUrl } from "../availabilityRequest";
import {
  createAvailabilityRequest,
  getManagedAvailabilityResult,
  loadManagedAvailabilityRequest,
  revokeAvailabilityRequest,
  saveManagedAvailabilityResult,
  saveManagedAvailabilityRequest,
  type AvailabilityRequestRecord,
  type ManagedAvailabilityResult,
} from "../services/availabilityRequests";
import type { Person } from "../types";

type Props = {
  person: Person;
  selectedInstant: Date;
  onClose: () => void;
  onRequested: () => void;
  onRevoked: () => void;
  onStatusChange: (status: "shared" | "expired" | "declined") => void;
  onAvailabilityResult: (result: ManagedAvailabilityResult | null) => void;
};

export function AvailabilityRequestDialog({ person, selectedInstant, onClose, onRequested, onRevoked, onStatusChange, onAvailabilityResult }: Props) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);
  const [record, setRecord] = useState<AvailabilityRequestRecord | undefined>(() => loadManagedAvailabilityRequest(person.contactId ?? person.id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [remoteStatus, setRemoteStatus] = useState<string | null>(null);
  const message = availabilityRequestMessage(person, record?.url);

  useEffect(() => {
    closeButton.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!record) return;
    let active = true;
    getManagedAvailabilityResult(record).then((result) => {
      if (!active) return;
      setRemoteStatus(result.status);
      saveManagedAvailabilityResult(person.contactId ?? person.id, result);
      onAvailabilityResult(result);
      if (result.status === "shared" || result.status === "expired" || result.status === "declined") {
        onStatusChange(result.status);
      }
    }).catch(() => {
      // The organizer can retry from the visible Refresh status control.
    });
    return () => { active = false; };
  }, [record?.url]);

  function openShare(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
    onRequested();
  }

  async function generateLink() {
    setBusy(true);
    setError("");
    try {
      const timeMin = new Date(Date.UTC(selectedInstant.getUTCFullYear(), selectedInstant.getUTCMonth(), selectedInstant.getUTCDate()));
      const timeMax = new Date(timeMin.getTime() + 86_400_000);
      const created = await createAvailabilityRequest(person.name, timeMin.toISOString(), timeMax.toISOString());
      saveManagedAvailabilityRequest(person.contactId ?? person.id, created);
      setRecord(created);
    } catch {
      setError("The secure Kikroo link could not be created. Start Kikroo with the connected server and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function revokeLink() {
    if (!record) return;
    setBusy(true);
    setError("");
    try {
      await revokeAvailabilityRequest(record);
      saveManagedAvailabilityRequest(person.contactId ?? person.id, null);
      saveManagedAvailabilityResult(person.contactId ?? person.id, null);
      onAvailabilityResult(null);
      setRecord(undefined);
      onRevoked();
    } catch {
      setError("Kikroo could not revoke this link. Please try again while the connected server is running.");
    } finally {
      setBusy(false);
    }
  }

  async function refreshStatus() {
    if (!record) return;
    setBusy(true);
    setError("");
    try {
      const result = await getManagedAvailabilityResult(record);
      setRemoteStatus(result.status);
      saveManagedAvailabilityResult(person.contactId ?? person.id, result);
      onAvailabilityResult(result);
      if (result.status === "shared" || result.status === "expired" || result.status === "declined") {
        onStatusChange(result.status);
      }
    } catch {
      setError("Kikroo could not refresh this request while the connected server is unavailable.");
    } finally {
      setBusy(false);
    }
  }

  async function nativeShare() {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: "Kikroo availability request", text: message });
      onRequested();
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setCopied(false);
    }
  }

  async function copyRequest() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    onRequested();
  }

  return (
    <div className="availability-request-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="availability-request-dialog" role="dialog" aria-modal="true" aria-labelledby="availability-request-title">
        <button ref={closeButton} type="button" className="icon-button availability-request-close" onClick={onClose} aria-label="Close availability request">
          <X size={18} />
        </button>
        <div className="availability-request-icon" aria-hidden="true"><Share2 size={22} /></div>
        <div>
          <p className="section-kicker">AVAILABILITY REQUEST</p>
          <h2 id="availability-request-title">Ask {person.name} to share busy/free time</h2>
          <p>
            Kikroo prepares the message; you choose how and whether to send it.
            The recipient stays in control, and event titles or details are never requested.
          </p>
        </div>
        {!record && (
          <div className="availability-request-generate">
            <p>Create a private seven-day link. Kikroo stores only a hash of its public token on the server.</p>
            <button type="button" className="primary-button" disabled={busy} onClick={generateLink}>
              {busy ? "Creating secure link…" : "Create secure link"}
            </button>
          </div>
        )}
        {record && <div className="availability-request-preview">
          <strong>Message preview</strong>
          <p>{message}</p>
          <small>Status: {remoteStatus ?? record.status} · Expires {new Date(record.expiresAt).toLocaleString()}</small>
        </div>}
        {record && <div className="availability-request-actions">
          {person.phone && (
            <button type="button" className="primary-button" onClick={() => openShare(smsAvailabilityUrl(person, record.url))}>
              <Smartphone size={17} /> Text message
            </button>
          )}
          <button type="button" className="secondary-button" onClick={() => openShare(whatsappAvailabilityUrl(person, record.url))}>
            <MessageCircle size={17} /> WhatsApp
          </button>
          {typeof navigator.share === "function" && (
            <button type="button" className="secondary-button" onClick={nativeShare}>
              <Share2 size={17} /> Share
            </button>
          )}
          <button type="button" className="secondary-button" onClick={copyRequest}>
            {copied ? <Check size={17} /> : <Copy size={17} />} {copied ? "Copied" : "Copy message"}
          </button>
        </div>}
        {record && <div className="availability-request-management">
          <button type="button" className="secondary-button" disabled={busy} onClick={refreshStatus}>Refresh status</button>
          <button type="button" className="availability-request-revoke" disabled={busy} onClick={revokeLink}>Revoke this link</button>
        </div>}
        {error && <p className="availability-request-error" role="alert">{error}</p>}
        <p className="availability-request-stage-note">
          The link is private and expires automatically. Google and Outlook authorization on the recipient page will be enabled only through explicit consent.
        </p>
      </section>
    </div>
  );
}
