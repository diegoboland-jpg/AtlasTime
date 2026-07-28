import { describe, expect, it, vi } from "vitest";
import { createGoogleCalendarGateway, googleCalendarScope } from "./googleCalendarGateway.mjs";

const config = {
  clientId: "client-id.apps.googleusercontent.com",
  clientSecret: "server-only-secret",
  redirectUri: "https://atlas.example/api/google-calendar/callback",
  appOrigin: "https://atlas.example",
  encryptionKey: Buffer.alloc(32, 7).toString("base64url"),
  authorizationEndpoint: "https://accounts.example/authorize",
  tokenEndpoint: "https://accounts.example/token",
  revokeEndpoint: "https://accounts.example/revoke",
  calendarApiEndpoint: "https://calendar.example/v3",
};

function cookieValue(response, name) {
  const values = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : [response.headers.get("set-cookie")];
  const match = values.find((value) => value?.startsWith(`${name}=`));
  return match?.split(";", 1)[0];
}

async function authorize(gateway, returnTo = "/planner") {
  const connect = await gateway(new Request(`https://atlas.example/api/google-calendar/connect?returnTo=${encodeURIComponent(returnTo)}`));
  const authorization = new URL(connect.headers.get("location"));
  const stateCookie = cookieValue(connect, "atlastime_google_oauth");
  const callback = await gateway(new Request(`https://atlas.example/api/google-calendar/callback?code=authorization-code&state=${authorization.searchParams.get("state")}`, {
    headers: { cookie: stateCookie },
  }));
  return { connect, authorization, callback, tokenCookie: cookieValue(callback, "atlastime_google_calendar") };
}

function googleFetch() {
  return vi.fn(async (url, options = {}) => {
    if (url === config.tokenEndpoint) {
      const grantType = options.body.get("grant_type");
      if (grantType === "authorization_code") {
        return new Response(JSON.stringify({ refresh_token: "refresh-secret", scope: googleCalendarScope }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ access_token: "short-access-token", expires_in: 3600 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    if (String(url).startsWith(`${config.calendarApiEndpoint}/calendars/primary/events`)) {
      return new Response(JSON.stringify({ id: "event-1", htmlLink: "https://calendar.google.com/event?eid=1", status: "confirmed" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    if (url === config.revokeEndpoint) return new Response("", { status: 200 });
    return new Response("", { status: 404 });
  });
}

describe("Google Calendar gateway", () => {
  it("starts a narrow, state-bound authorization-code flow", async () => {
    const gateway = createGoogleCalendarGateway({ ...config, fetchImpl: googleFetch() });
    const response = await gateway(new Request("https://atlas.example/api/google-calendar/connect?returnTo=https%3A%2F%2Fevil.example%2Fsteal"));
    const authorization = new URL(response.headers.get("location"));
    const stateCookie = response.headers.get("set-cookie");

    expect(response.status).toBe(302);
    expect(authorization.origin).toBe("https://accounts.example");
    expect(authorization.searchParams.get("scope")).toBe(googleCalendarScope);
    expect(authorization.searchParams.get("response_type")).toBe("code");
    expect(authorization.searchParams.get("access_type")).toBe("offline");
    expect(authorization.searchParams.get("code_challenge_method")).toBe("S256");
    expect(authorization.searchParams.get("state")).toBeTruthy();
    expect(stateCookie).toContain("HttpOnly");
    expect(stateCookie).toContain("Secure");
    expect(stateCookie).toContain("SameSite=Lax");
    expect(stateCookie).not.toContain("evil.example");
  });

  it("exchanges the callback code and stores only an encrypted HttpOnly cookie", async () => {
    const fetchImpl = googleFetch();
    const gateway = createGoogleCalendarGateway({ ...config, fetchImpl });
    const { callback, tokenCookie } = await authorize(gateway);

    expect(callback.status).toBe(302);
    expect(callback.headers.get("location")).toBe("/planner?calendar=connected");
    expect(tokenCookie).toBeTruthy();
    expect(callback.headers.get("set-cookie")).toContain("HttpOnly");
    expect(callback.headers.get("set-cookie")).not.toContain("refresh-secret");
    expect(fetchImpl).toHaveBeenCalledWith(config.tokenEndpoint, expect.objectContaining({ method: "POST" }));
    expect(fetchImpl.mock.calls[0][1].body.get("code_verifier")).toBeTruthy();
  });

  it("rejects callback state that does not match", async () => {
    const fetchImpl = googleFetch();
    const gateway = createGoogleCalendarGateway({ ...config, fetchImpl });
    const connect = await gateway(new Request("https://atlas.example/api/google-calendar/connect"));
    const stateCookie = cookieValue(connect, "atlastime_google_oauth");
    const callback = await gateway(new Request("https://atlas.example/api/google-calendar/callback?code=authorization-code&state=wrong", {
      headers: { cookie: stateCookie },
    }));

    expect(callback.status).toBe(302);
    expect(callback.headers.get("location")).toContain("reason=invalid_state");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("reports connection without exposing token material", async () => {
    const gateway = createGoogleCalendarGateway({ ...config, fetchImpl: googleFetch() });
    const { tokenCookie } = await authorize(gateway);
    const status = await gateway(new Request("https://atlas.example/api/google-calendar/status", {
      headers: { cookie: tokenCookie },
    }));
    const payload = await status.json();

    expect(payload).toMatchObject({ provider: "google", connected: true, scope: googleCalendarScope });
    expect(JSON.stringify(payload)).not.toContain("refresh-secret");
  });

  it("requires same-origin CSRF proof before creating an event", async () => {
    const gateway = createGoogleCalendarGateway({ ...config, fetchImpl: googleFetch() });
    const forbidden = await gateway(new Request("https://atlas.example/api/google-calendar/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Project sync" }),
    }));
    expect(forbidden.status).toBe(403);
    await expect(forbidden.json()).resolves.toEqual({ error: "forbidden" });
  });

  it("creates a validated primary-calendar event and sends selected invitations", async () => {
    const fetchImpl = googleFetch();
    const gateway = createGoogleCalendarGateway({ ...config, fetchImpl });
    const { tokenCookie } = await authorize(gateway);
    fetchImpl.mockClear();
    const response = await gateway(new Request("https://atlas.example/api/google-calendar/events", {
      method: "POST",
      headers: {
        cookie: tokenCookie,
        origin: config.appOrigin,
        "x-atlastime-csrf": "1",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        title: "Project sync",
        description: "Timezone-aware agenda",
        location: "Room 4",
        start: "2026-07-23T13:30:00Z",
        end: "2026-07-23T14:30:00Z",
        attendees: [{ name: "Ana", email: "ANA@example.com" }, { name: "Invalid", email: "nope" }],
      }),
    }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      id: "event-1",
      htmlLink: "https://calendar.google.com/event?eid=1",
      status: "confirmed",
    });
    const eventCall = fetchImpl.mock.calls.find(([url]) => String(url).includes("/calendars/primary/events"));
    expect(eventCall[0]).toContain("sendUpdates=all");
    expect(eventCall[1].headers.authorization).toBe("Bearer short-access-token");
    expect(JSON.parse(eventCall[1].body)).toMatchObject({
      summary: "Project sync",
      attendees: [{ email: "ana@example.com", displayName: "Ana" }],
      start: { dateTime: "2026-07-23T13:30:00.000Z" },
      end: { dateTime: "2026-07-23T14:30:00.000Z" },
    });
  });

  it("revokes access and clears local connection state", async () => {
    const fetchImpl = googleFetch();
    const gateway = createGoogleCalendarGateway({ ...config, fetchImpl });
    const { tokenCookie } = await authorize(gateway);
    fetchImpl.mockClear();
    const response = await gateway(new Request("https://atlas.example/api/google-calendar/disconnect", {
      method: "POST",
      headers: { cookie: tokenCookie, origin: config.appOrigin, "x-atlastime-csrf": "1" },
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ provider: "google", connected: false });
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(fetchImpl).toHaveBeenCalledWith(config.revokeEndpoint, expect.objectContaining({ method: "POST" }));
  });
});
