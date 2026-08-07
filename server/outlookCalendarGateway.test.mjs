import { describe, expect, it, vi } from "vitest";
import { createOutlookCalendarGateway, outlookCalendarAvailabilityScope } from "./outlookCalendarGateway.mjs";

const origin = "https://atlas.example";
const config = {
  clientId: "microsoft-client-id",
  clientSecret: "server-only-secret",
  redirectUri: `${origin}/api/outlook-calendar/callback`,
  appOrigin: origin,
  encryptionKey: Buffer.alloc(32, 9).toString("base64url"),
  authorizationEndpoint: "https://login.example/authorize",
  tokenEndpoint: "https://login.example/token",
  graphApiEndpoint: "https://graph.example/v1.0",
};

function cookieValue(response, name) {
  const values = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : [response.headers.get("set-cookie")];
  return values.find((value) => value?.startsWith(`${name}=`))?.split(";", 1)[0];
}

function microsoftFetch() {
  return vi.fn(async (url, options = {}) => {
    if (url === config.tokenEndpoint) {
      const grantType = options.body.get("grant_type");
      return new Response(JSON.stringify(grantType === "authorization_code"
        ? { refresh_token: "refresh-secret", scope: `offline_access ${outlookCalendarAvailabilityScope}` }
        : { access_token: "access-secret" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    if (String(url).startsWith(`${config.graphApiEndpoint}/me/calendarView`)) {
      return new Response(JSON.stringify({ value: [
        {
          showAs: "busy",
          isCancelled: false,
          start: { dateTime: "2026-07-31T23:30:00", timeZone: "UTC" },
          end: { dateTime: "2026-08-01T00:30:00", timeZone: "UTC" },
        },
        {
          subject: "Private appointment",
          location: { displayName: "Private place" },
          attendees: [{ emailAddress: { address: "private@example.com" } }],
          showAs: "busy",
          isCancelled: false,
          start: { dateTime: "2026-08-01T09:00:00", timeZone: "UTC" },
          end: { dateTime: "2026-08-01T10:00:00", timeZone: "UTC" },
        },
        {
          showAs: "free",
          isCancelled: false,
          start: { dateTime: "2026-08-01T11:00:00", timeZone: "UTC" },
          end: { dateTime: "2026-08-01T12:00:00", timeZone: "UTC" },
        },
      ] }), { status: 200, headers: { "content-type": "application/json" } });
    }
    return new Response("", { status: 404 });
  });
}

async function authorize(gateway) {
  const connect = await gateway(new Request(`${origin}/api/outlook-calendar/connect?returnTo=${encodeURIComponent("/availability/token")}`));
  const authorization = new URL(connect.headers.get("location"));
  const callback = await gateway(new Request(`${origin}/api/outlook-calendar/callback?code=authorization-code&state=${authorization.searchParams.get("state")}`, {
    headers: { cookie: cookieValue(connect, "atlastime_outlook_oauth") },
  }));
  return { authorization, callback, tokenCookie: cookieValue(callback, "atlastime_outlook_calendar") };
}

describe("Outlook Calendar gateway", () => {
  it("uses state, PKCE, offline access, and a narrow calendar scope", async () => {
    const gateway = createOutlookCalendarGateway({ ...config, fetchImpl: microsoftFetch() });
    const { authorization, callback } = await authorize(gateway);
    expect(authorization.searchParams.get("scope")).toBe(`offline_access ${outlookCalendarAvailabilityScope}`);
    expect(authorization.searchParams.get("code_challenge_method")).toBe("S256");
    expect(callback.status).toBe(302);
    expect(callback.headers.get("location")).toContain("outlook=connected");
  });

  it("returns only sanitized busy intervals from Microsoft Graph", async () => {
    const fetchImpl = microsoftFetch();
    const gateway = createOutlookCalendarGateway({ ...config, fetchImpl });
    const { tokenCookie } = await authorize(gateway);
    const response = await gateway(new Request(`${origin}/api/outlook-calendar/freebusy`, {
      method: "POST",
      headers: {
        cookie: tokenCookie,
        origin,
        "x-atlastime-csrf": "1",
        "content-type": "application/json",
      },
      body: JSON.stringify({ timeMin: "2026-08-01T00:00:00Z", timeMax: "2026-08-02T00:00:00Z" }),
    }));
    const payload = await response.json();
    expect(payload.busy).toEqual([
      { start: "2026-08-01T00:00:00.000Z", end: "2026-08-01T00:30:00.000Z" },
      { start: "2026-08-01T09:00:00.000Z", end: "2026-08-01T10:00:00.000Z" },
    ]);
    expect(JSON.stringify(payload)).not.toContain("Private appointment");
    expect(JSON.stringify(payload)).not.toContain("private@example.com");
    expect(fetchImpl.mock.calls.at(-1)[1].headers.prefer).toContain("UTC");
  });

  it("rejects cross-origin mutations", async () => {
    const gateway = createOutlookCalendarGateway({ ...config, fetchImpl: microsoftFetch() });
    const response = await gateway(new Request(`${origin}/api/outlook-calendar/disconnect`, {
      method: "POST",
      headers: { origin: "https://evil.example", "x-atlastime-csrf": "1" },
    }));
    expect(response.status).toBe(403);
  });
});
