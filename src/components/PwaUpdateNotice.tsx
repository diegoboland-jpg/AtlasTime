import { RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { activateWaitingServiceWorker, PWA_UPDATE_EVENT, type PwaUpdateDetail } from "../pwa";

export function PwaUpdateNotice() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const showUpdate = (event: Event) => {
      setRegistration((event as CustomEvent<PwaUpdateDetail>).detail.registration);
    };
    window.addEventListener(PWA_UPDATE_EVENT, showUpdate);
    navigator.serviceWorker.getRegistration().then((current) => {
      if (current?.waiting && navigator.serviceWorker.controller) setRegistration(current);
    }).catch(() => undefined);
    return () => window.removeEventListener(PWA_UPDATE_EVENT, showUpdate);
  }, []);

  if (!registration) return null;

  function updateNow() {
    setUpdating(true);
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), { once: true });
    activateWaitingServiceWorker(registration!);
  }

  return (
    <aside className="pwa-update-notice" role="status" aria-live="polite">
      <RefreshCw size={20} aria-hidden="true" />
      <div>
        <strong>A new AtlasTime version is ready.</strong>
        <span>Your saved groups will stay on this device.</span>
      </div>
      <button type="button" className="pwa-update-action" onClick={updateNow} disabled={updating}>
        {updating ? "Updating…" : "Update now"}
      </button>
      <button type="button" className="pwa-update-dismiss" onClick={() => setRegistration(null)} aria-label="Update later">
        <X size={18} />
      </button>
    </aside>
  );
}
