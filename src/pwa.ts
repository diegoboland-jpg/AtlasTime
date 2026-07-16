export type InstallChoice = { outcome: "accepted" | "dismissed"; platform: string };

export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
}

type StandaloneNavigator = Navigator & { standalone?: boolean };

export function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
    || Boolean((navigator as StandaloneNavigator).standalone);
}

export function isIosDevice(userAgent = navigator.userAgent) {
  return /iPad|iPhone|iPod/.test(userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function installInstructions(ios: boolean) {
  return ios
    ? "In Safari, tap Share, then Add to Home Screen."
    : "Use your browser menu and choose Install AtlasTime or Add to Home screen.";
}

export function registerAtlasTimeServiceWorker() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // AtlasTime remains usable online if registration is unavailable.
    });
  });
}
