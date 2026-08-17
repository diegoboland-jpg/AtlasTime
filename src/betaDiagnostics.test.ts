// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { createBetaDiagnostic, formatBetaDiagnostic } from "./betaDiagnostics";

describe("protected beta diagnostic", () => {
  it("contains only the allow-listed environment and connection facts", () => {
    const diagnostic = createBetaDiagnostic(
      { google: "connected", outlook: "not_connected" },
      {
        now: new Date("2026-08-17T12:00:00.000Z"),
        userAgent: "Mozilla/5.0 (Linux; Android 16) secret-user-agent-detail",
        language: "pt-BR",
        timeZone: "America/Sao_Paulo",
        online: true,
        installed: true,
        serviceWorkerSupported: true,
        serviceWorkerControlled: true,
        updateState: "waiting",
      },
    );
    const output = formatBetaDiagnostic(diagnostic);

    expect(diagnostic).toMatchObject({
      app: "Kikroo",
      version: "1.15.0",
      channel: "protected_beta",
      displayMode: "installed",
      platform: "Android",
      language: "pt-BR",
      timeZone: "America/Sao_Paulo",
      network: "online",
      serviceWorker: "controlled",
      updateState: "waiting",
      calendars: { google: "connected", outlook: "not_connected" },
    });
    expect(output).not.toContain("secret-user-agent-detail");
  });

  it("cannot include personal or calendar content supplied outside its narrow API", () => {
    const sensitive = [
      "diego@example.com",
      "+5511999999999",
      "Executive launch",
      "https://calendar.example/private-token",
      "refresh-token-secret",
      "My confidential group",
    ];
    const output = formatBetaDiagnostic(createBetaDiagnostic(
      { google: "unavailable", outlook: "unavailable" },
      {
        now: new Date("2026-08-17T12:00:00.000Z"),
        userAgent: "Windows",
        language: "en-US",
        timeZone: "UTC",
        online: false,
        installed: false,
        serviceWorkerSupported: false,
        serviceWorkerControlled: false,
        updateState: "unsupported",
      },
    ));

    sensitive.forEach((value) => expect(output).not.toContain(value));
    expect(Object.keys(JSON.parse(output))).toEqual([
      "app", "version", "channel", "generatedAt", "displayMode", "platform", "language",
      "timeZone", "network", "serviceWorker", "updateState", "calendars",
    ]);
  });
});
