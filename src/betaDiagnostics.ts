import { APP_VERSION } from "./version";

export type SafeConnectionState = "connected" | "not_connected" | "unavailable";

export type BetaDiagnostic = {
  app: "Kikroo";
  version: string;
  channel: "protected_beta";
  generatedAt: string;
  displayMode: "installed" | "browser";
  platform: "Android" | "iOS" | "Windows" | "macOS" | "Linux" | "Other";
  language: string;
  timeZone: string;
  network: "online" | "offline";
  serviceWorker: "controlled" | "supported" | "unsupported";
  updateState: "waiting" | "current" | "unsupported" | "unknown";
  calendars: {
    google: SafeConnectionState;
    outlook: SafeConnectionState;
  };
};

export type DiagnosticEnvironment = {
  now?: Date;
  userAgent?: string;
  language?: string;
  timeZone?: string;
  online?: boolean;
  installed?: boolean;
  serviceWorkerSupported?: boolean;
  serviceWorkerControlled?: boolean;
  updateState?: BetaDiagnostic["updateState"];
};

function platformFromUserAgent(userAgent: string): BetaDiagnostic["platform"] {
  if (/android/i.test(userAgent)) return "Android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS";
  if (/windows/i.test(userAgent)) return "Windows";
  if (/macintosh|mac os/i.test(userAgent)) return "macOS";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Other";
}

function browserEnvironment(): Required<DiagnosticEnvironment> {
  const installed = window.matchMedia?.("(display-mode: standalone)").matches
    || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
  return {
    now: new Date(),
    userAgent: navigator.userAgent,
    language: navigator.language || "unknown",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown",
    online: navigator.onLine,
    installed,
    serviceWorkerSupported: "serviceWorker" in navigator,
    serviceWorkerControlled: Boolean(navigator.serviceWorker?.controller),
    updateState: "serviceWorker" in navigator ? "unknown" : "unsupported",
  };
}

export function createBetaDiagnostic(
  calendars: BetaDiagnostic["calendars"],
  environment: DiagnosticEnvironment = {},
): BetaDiagnostic {
  const defaults = browserEnvironment();
  const facts = { ...defaults, ...environment };
  return {
    app: "Kikroo",
    version: APP_VERSION,
    channel: "protected_beta",
    generatedAt: facts.now.toISOString(),
    displayMode: facts.installed ? "installed" : "browser",
    platform: platformFromUserAgent(facts.userAgent),
    language: facts.language,
    timeZone: facts.timeZone,
    network: facts.online ? "online" : "offline",
    serviceWorker: facts.serviceWorkerControlled
      ? "controlled"
      : facts.serviceWorkerSupported ? "supported" : "unsupported",
    updateState: facts.updateState,
    calendars,
  };
}

export function formatBetaDiagnostic(diagnostic: BetaDiagnostic) {
  return JSON.stringify(diagnostic, null, 2);
}
