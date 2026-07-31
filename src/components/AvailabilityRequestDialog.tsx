import { useEffect, useRef, useState } from "react";
import { Check, Copy, MessageCircle, Share2, Smartphone, X } from "lucide-react";
import { availabilityRequestMessage, smsAvailabilityUrl, whatsappAvailabilityUrl } from "../availabilityRequest";
import type { Person } from "../types";

type Props = {
  person: Person;
  onClose: () => void;
  onRequested: () => void;
};

export function AvailabilityRequestDialog({ person, onClose, onRequested }: Props) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);
  const message = availabilityRequestMessage(person);

  useEffect(() => {
    closeButton.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function openShare(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
    onRequested();
  }

  async function nativeShare() {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: "AtlasTime availability request", text: message });
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
            AtlasTime prepares the message; you choose how and whether to send it.
            The recipient stays in control, and event titles or details are never requested.
          </p>
        </div>
        <div className="availability-request-preview">
          <strong>Message preview</strong>
          <p>{message}</p>
        </div>
        <div className="availability-request-actions">
          {person.phone && (
            <button type="button" className="primary-button" onClick={() => openShare(smsAvailabilityUrl(person))}>
              <Smartphone size={17} /> Text message
            </button>
          )}
          <button type="button" className="secondary-button" onClick={() => openShare(whatsappAvailabilityUrl(person))}>
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
        </div>
        <p className="availability-request-stage-note">
          This preview uses the provider's official sharing instructions. A private, expiring AtlasTime consent link will follow after secure hosting is available.
        </p>
      </section>
    </div>
  );
}
