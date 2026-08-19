import { useEffect, useRef, useState } from "react";
import { Check, Clipboard, FileWarning, Info, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { createBetaDiagnostic, formatBetaDiagnostic, type SafeConnectionState } from "../betaDiagnostics";
import { getGoogleCalendarStatus } from "../services/googleCalendar";
import { getOutlookCalendarStatus } from "../services/outlookCalendar";
import { APP_RELEASE_LABEL } from "../version";

type Props = {
  open: boolean;
  onClose: () => void;
  loadCalendarStates?: () => Promise<{ google: SafeConnectionState; outlook: SafeConnectionState }>;
};

async function safeCalendarStates() {
  const [google, outlook] = await Promise.allSettled([
    getGoogleCalendarStatus(),
    getOutlookCalendarStatus(),
  ]);
  return {
    google: google.status === "fulfilled"
      ? google.value.connected ? "connected" as const : "not_connected" as const
      : "unavailable" as const,
    outlook: outlook.status === "fulfilled"
      ? outlook.value.connected && outlook.value.availabilityGranted ? "connected" as const : "not_connected" as const
      : "unavailable" as const,
  };
}

async function copyText(value: string) {
  if (!navigator.clipboard?.writeText) throw new Error("clipboard_unavailable");
  await navigator.clipboard.writeText(value);
}

export function AboutPrivacyDialog({ open, onClose, loadCalendarStates = safeCalendarStates }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [diagnostic, setDiagnostic] = useState("");
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  async function generateDiagnostic() {
    setLoading(true);
    setStatus("");
    try {
      const calendars = await loadCalendarStates();
      let updateState: "waiting" | "current" | "unsupported" | "unknown" = "unsupported";
      if ("serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          updateState = registration?.waiting ? "waiting" : registration ? "current" : "unknown";
        } catch {
          updateState = "unknown";
        }
      }
      setDiagnostic(formatBetaDiagnostic(createBetaDiagnostic(calendars, { updateState })));
      setStatus("Diagnostic preview generated locally. Nothing was sent.");
    } finally {
      setLoading(false);
    }
  }

  function prepareFeedback() {
    setFeedback([
      "Kikroo protected beta feedback",
      "",
      "What I was trying to do:",
      "",
      "Anonymous tester ID (for example T01):",
      "",
      "Test session (A-F):",
      "",
      "Device / OS and browser or installed app:",
      "",
      "Steps to reproduce:",
      "1. ",
      "2. ",
      "What happened:",
      "",
      "What I expected:",
      "",
      "Severity (P0 privacy/data loss, P1 blocked, P2 workaround, P3 visual/copy):",
      "",
      "Could I continue? (yes/no):",
      "",
      "Screenshot included? (yes/no; remove personal data first):",
      "",
      "Safe diagnostic:",
      diagnostic || "Not generated",
    ].join("\n"));
    setStatus("Feedback template prepared locally. Review it before copying.");
  }

  async function copy(value: string, label: string) {
    try {
      await copyText(value);
      setStatus(`${label} copied. You choose where to send it.`);
    } catch {
      setStatus("Copy is unavailable here. Select the text manually.");
    }
  }

  return (
    <div className="about-privacy-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="about-privacy-dialog" role="dialog" aria-modal="true" aria-labelledby="about-privacy-title">
        <button ref={closeRef} type="button" className="about-privacy-close" onClick={onClose} aria-label="Close About and privacy">
          <X size={20} />
        </button>
        <div className="about-privacy-heading">
          <span><ShieldCheck size={24} /></span>
          <div>
            <p className="section-kicker">PROTECTED BETA</p>
            <h2 id="about-privacy-title">About Kikroo</h2>
            <strong>{APP_RELEASE_LABEL}</strong>
          </div>
        </div>

        <div className="about-privacy-summary">
          <Info size={18} />
          <p>Kikroo helps compare local times and occupied/free calendar blocks. Your groups and contact details stay in this browser. Connected-calendar tokens use encrypted, HttpOnly cookies; event titles and descriptions are not used for availability comparisons.</p>
        </div>

        <p className="about-privacy-contact">
          Operated by DIEGO BOLAND AUSILIO CONSULTORIA EM TECNOLOGIA DA INFORMACAO LTDA, Brazil. Privacy and support: <a href="mailto:support@kikroo.com">support@kikroo.com</a>.
        </p>

        <div className="about-privacy-grid">
          <article>
            <h3>What this beta may store</h3>
            <ul>
              <li>Groups, people, locations and planner preferences in this browser.</li>
              <li>A group-sharing URL contains a readable snapshot for anyone who receives that link.</li>
              <li>Encrypted connection records and short-lived availability-request records on the connected server.</li>
              <li>Only occupied/free time blocks when calendar availability is requested.</li>
              <li>The Android widget receives only the selected group, time zones, working hours and aggregate recommendation needed to render it. It never receives contact details, calendar tokens, event details or raw busy/free periods.</li>
            </ul>
          </article>
          <article>
            <h3>Your control</h3>
            <ul>
              <li>Calendar connections remain optional and can be disconnected.</li>
              <li>Opening the Android app refreshes its private widget snapshot; widget time controls change only the widget preview and never edit your planner.</li>
              <li>Kikroo never sends invitations or beta feedback without an explicit action.</li>
              <li>Do not include passwords, private calendar links or confidential screenshots in feedback.</li>
            </ul>
          </article>
        </div>

        <section className="beta-diagnostic" aria-labelledby="diagnostic-title">
          <div>
            <h3 id="diagnostic-title">Privacy-safe diagnostic</h3>
            <p>Generated only when you ask. It excludes names, emails, phone numbers, groups, event details, tokens, URLs and busy/free periods.</p>
          </div>
          <button type="button" className="secondary-button" disabled={loading} onClick={generateDiagnostic}>
            {loading ? <LoaderCircle className="calendar-spinner" size={17} /> : <FileWarning size={17} />}
            {loading ? "Generating…" : "Generate preview"}
          </button>
          {diagnostic && (
            <>
              <pre tabIndex={0}>{diagnostic}</pre>
              <button type="button" className="secondary-button" onClick={() => copy(diagnostic, "Diagnostic")}>
                <Clipboard size={17} /> Copy diagnostic
              </button>
            </>
          )}
        </section>

        <section className="beta-feedback" aria-labelledby="feedback-title">
          <div>
            <h3 id="feedback-title">Beta feedback</h3>
            <p>Prepare a template, review every line, then copy it into the approved channel supplied by the beta coordinator.</p>
          </div>
          <button type="button" className="primary-button" onClick={prepareFeedback}>Prepare feedback</button>
          {feedback && (
            <>
              <textarea aria-label="Feedback draft" value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={12} />
              <button type="button" className="secondary-button" onClick={() => copy(feedback, "Feedback")}>
                <Clipboard size={17} /> Copy reviewed feedback
              </button>
            </>
          )}
        </section>

        {status && <p className="about-privacy-status" role="status"><Check size={15} /> {status}</p>}
      </section>
    </div>
  );
}
