import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { installInstructions, isIosDevice, isStandalone, type InstallPromptEvent } from "../pwa";

export function PwaInstall() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [showHelp, setShowHelp] = useState(false);
  const ios = isIosDevice();

  useEffect(() => {
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const confirmInstall = () => {
      setInstalled(true);
      setPrompt(null);
      setShowHelp(false);
    };
    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", confirmInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", confirmInstall);
    };
  }, []);

  if (installed) return <span className="installed-badge">Installed</span>;

  async function requestInstall() {
    if (!prompt) {
      setShowHelp((visible) => !visible);
      return;
    }
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setPrompt(null);
  }

  return (
    <div className="install-control">
      <button type="button" className="install-button" onClick={requestInstall} aria-expanded={showHelp}>
        <Download size={15} /> Install
      </button>
      {showHelp && (
        <div
          className="install-help-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowHelp(false);
          }}
        >
          <section className="install-tip" role="dialog" aria-modal="true" aria-labelledby="install-tip-title">
            <div>
              <strong id="install-tip-title">{ios ? "Install Kikroo on iPhone" : "Install Kikroo"}</strong>
              <span>{installInstructions(ios)}</span>
            </div>
            <button type="button" onClick={() => setShowHelp(false)} aria-label="Close install instructions"><X size={18} /></button>
          </section>
        </div>
      )}
    </div>
  );
}
