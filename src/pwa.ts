export type InstallChoice = { outcome: "accepted" | "dismissed"; platform: string };

export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
}

type StandaloneNavigator = Navigator & { standalone?: boolean };

export const PWA_UPDATE_EVENT = "atlastime:update-ready";

export type PwaUpdateDetail = {
  registration: ServiceWorkerRegistration;
};

export function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
    || Boolean((navigator as StandaloneNavigator).standalone);
}

export function isIosDevice(userAgent?: string) {
  const browserNavigator = typeof navigator === "undefined" ? undefined : navigator;
  const resolvedUserAgent = userAgent ?? browserNavigator?.userAgent ?? "";

  return /iPad|iPhone|iPod/.test(resolvedUserAgent)
    || (browserNavigator?.platform === "MacIntel" && browserNavigator.maxTouchPoints > 1);
}

export function installInstructions(ios: boolean) {
  return ios
    ? "In Safari, tap Share, then Add to Home Screen."
    : "Use your browser menu and choose Install AtlasTime or Add to Home screen.";
}

function announceWaitingUpdate(registration: ServiceWorkerRegistration) {
  if (!registration.waiting || !navigator.serviceWorker.controller) return;
  window.dispatchEvent(new CustomEvent<PwaUpdateDetail>(PWA_UPDATE_EVENT, {
    detail: { registration },
  }));
}

export function activateWaitingServiceWorker(registration: ServiceWorkerRegistration) {
  registration.waiting?.postMessage({ type: "SKIP_WAITING" });
}

export function registerAtlasTimeServiceWorker() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((registration) => {
      announceWaitingUpdate(registration);
      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        installing?.addEventListener("statechange", () => {
          if (installing.state === "installed") announceWaitingUpdate(registration);
        });
      });
      window.addEventListener("focus", () => registration.update().catch(() => undefined));
    }).catch(() => {
      // AtlasTime remains usable online if registration is unavailable.
    });
  });
}
