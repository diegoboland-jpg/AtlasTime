import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";

const GOOGLE_SCOPE = "https://www.googleapis.com/auth/calendar.events.owned";
const GOOGLE_AVAILABILITY_SCOPE = "https://www.googleapis.com/auth/calendar.events.freebusy";
const STATE_COOKIE = "atlastime_google_oauth";
const TOKEN_COOKIE = "atlastime_google_calendar";
const MAX_BODY_BYTES = 64 * 1024;

function json(value, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(value), { ...init, headers });
}

function parseCookies(request) {
  return Object.fromEntries((request.headers.get("cookie") ?? "").split(";").flatMap((part) => {
    const separator = part.indexOf("=");
    if (separator < 1) return [];
    return [[part.slice(0, separator).trim(), part.slice(separator + 1).trim()]];
  }));
}

function cookie(name, value, { maxAge, path, secure }) {
  return [
    `${name}=${value}`,
    `Path=${path}`,
    "HttpOnly",
    "SameSite=Lax",
    ...(secure ? ["Secure"] : []),
    ...(maxAge === undefined ? [] : [`Max-Age=${maxAge}`]),
  ].join("; ");
}

function safeEqual(left, right) {
  const first = Buffer.from(left);
  const second = Buffer.from(right);
  return first.length === second.length && timingSafeEqual(first, second);
}

function encryption(keyText) {
  const key = Buffer.from(keyText, "base64url");
  if (key.length !== 32) throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY must be a base64url-encoded 32-byte key.");

  return {
    seal(value) {
      const iv = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", key, iv);
      const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
      return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
    },
    open(value) {
      try {
        const [ivText, tagText, encryptedText] = value.split(".");
        if (!ivText || !tagText || !encryptedText) return null;
        const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivText, "base64url"));
        decipher.setAuthTag(Buffer.from(tagText, "base64url"));
        const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedText, "base64url")), decipher.final()]);
        return JSON.parse(decrypted.toString("utf8"));
      } catch {
        return null;
      }
    },
  };
}

function normalizeReturnTo(value, appOrigin) {
  if (!value) return "/?calendar=connected";
  try {
    const resolved = new URL(value, appOrigin);
    return resolved.origin === appOrigin ? `${resolved.pathname}${resolved.search}${resolved.hash}` : "/?calendar=connected";
  } catch {
    return "/?calendar=connected";
  }
}

function withCalendarResult(returnTo, result, reason) {
  const url = new URL(returnTo, "https://atlastime.local");
  url.searchParams.set("calendar", result);
  if (reason) url.searchParams.set("reason", reason);
  return `${url.pathname}${url.search}${url.hash}`;
}

function validEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function stringValue(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function calendarEvent(value) {
  if (!value || typeof value !== "object") return null;
  const title = stringValue(value.title, 120) || "Kikroo meeting";
  const description = stringValue(value.description, 5000);
  const location = stringValue(value.location, 500);
  const attendees = Array.isArray(value.attendees)
    ? value.attendees.slice(0, 50).flatMap((attendee) => validEmail(attendee?.email)
      ? [{ email: attendee.email.toLowerCase(), displayName: stringValue(attendee.name, 120) || undefined }]
      : [])
    : [];

  if (value.allDay === true) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(value.endDate) || value.startDate >= value.endDate) return null;
    return {
      summary: title,
      ...(description ? { description } : {}),
      ...(location ? { location } : {}),
      start: { date: value.startDate },
      end: { date: value.endDate },
      ...(attendees.length ? { attendees } : {}),
    };
  }

  const start = new Date(value.start);
  const end = new Date(value.end);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start || end.getTime() - start.getTime() > 86_400_000) return null;
  return {
    summary: title,
    ...(description ? { description } : {}),
    ...(location ? { location } : {}),
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
    ...(attendees.length ? { attendees } : {}),
  };
}

function availabilityQuery(value) {
  if (!value || typeof value !== "object") return null;
  const timeMin = new Date(value.timeMin);
  const timeMax = new Date(value.timeMax);
  if (!Number.isFinite(timeMin.getTime()) || !Number.isFinite(timeMax.getTime())) return null;
  if (timeMax <= timeMin || timeMax.getTime() - timeMin.getTime() > 7 * 86_400_000) return null;
  const requested = Array.isArray(value.calendarIds) ? value.calendarIds : ["primary"];
  const calendarIds = [...new Set(requested
    .map((id) => stringValue(id, 254))
    .filter((id) => id === "primary" || validEmail(id))
    .slice(0, 20))];
  if (!calendarIds.length) return null;
  return {
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    timeZone: "UTC",
    calendarExpansionMax: 20,
    items: calendarIds.map((id) => ({ id })),
  };
}

function hasScope(record, scope) {
  return typeof record?.scope === "string" && record.scope.split(/\s+/).includes(scope);
}

async function limitedJson(request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) throw new Error("body_too_large");
  const text = await request.text();
  if (Buffer.byteLength(text) > MAX_BODY_BYTES) throw new Error("body_too_large");
  return JSON.parse(text);
}

export function createGoogleCalendarGateway(options) {
  const {
    clientId,
    clientSecret,
    redirectUri,
    appOrigin,
    encryptionKey,
    fetchImpl = fetch,
    authorizationEndpoint = "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint = "https://oauth2.googleapis.com/token",
    revokeEndpoint = "https://oauth2.googleapis.com/revoke",
    calendarApiEndpoint = "https://www.googleapis.com/calendar/v3",
  } = options;
  if (!clientId || !clientSecret || !redirectUri || !appOrigin || !encryptionKey) throw new Error("Google Calendar gateway configuration is incomplete.");

  const redirectUrl = new URL(redirectUri);
  const normalizedOrigin = new URL(appOrigin).origin;
  if (redirectUrl.origin !== normalizedOrigin) throw new Error("GOOGLE_OAUTH_REDIRECT_URI must use the Kikroo application origin.");
  const secure = redirectUrl.protocol === "https:";
  const crypt = encryption(encryptionKey);

  function verifyMutation(request) {
    const origin = request.headers.get("origin");
    return origin === normalizedOrigin && request.headers.get("x-atlastime-csrf") === "1";
  }

  async function exchangeRefreshToken(refreshToken) {
    const response = await fetchImpl(tokenEndpoint, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });
    if (!response.ok) throw new Error("token_refresh_failed");
    const payload = await response.json();
    if (!payload.access_token) throw new Error("token_refresh_failed");
    return payload.access_token;
  }

  return async function handleGoogleCalendar(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const cookies = parseCookies(request);

    if (request.method === "GET" && path === "/api/google-calendar/connect") {
      const availability = url.searchParams.get("availability") === "1";
      const state = randomBytes(24).toString("base64url");
      const verifier = randomBytes(48).toString("base64url");
      const challenge = createHash("sha256").update(verifier).digest("base64url");
      const returnTo = normalizeReturnTo(url.searchParams.get("returnTo"), normalizedOrigin);
      const stateValue = crypt.seal({ state, verifier, returnTo, availability, createdAt: Date.now() });
      const authorization = new URL(authorizationEndpoint);
      authorization.search = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: availability ? `${GOOGLE_SCOPE} ${GOOGLE_AVAILABILITY_SCOPE}` : GOOGLE_SCOPE,
        access_type: "offline",
        include_granted_scopes: "true",
        prompt: "consent",
        state,
        code_challenge: challenge,
        code_challenge_method: "S256",
      }).toString();
      return new Response(null, {
        status: 302,
        headers: {
          location: authorization.toString(),
          "cache-control": "no-store",
          "set-cookie": cookie(STATE_COOKIE, stateValue, { maxAge: 600, path: "/api/google-calendar/callback", secure }),
        },
      });
    }

    if (request.method === "GET" && path === "/api/google-calendar/callback") {
      const stateRecord = cookies[STATE_COOKIE] ? crypt.open(cookies[STATE_COOKIE]) : null;
      const clearState = cookie(STATE_COOKIE, "", { maxAge: 0, path: "/api/google-calendar/callback", secure });
      const returnTo = normalizeReturnTo(stateRecord?.returnTo, normalizedOrigin);
      const callbackError = url.searchParams.get("error");
      if (callbackError) {
        return new Response(null, { status: 302, headers: { location: withCalendarResult(returnTo, "error", callbackError), "set-cookie": clearState } });
      }
      const returnedState = url.searchParams.get("state") ?? "";
      const code = url.searchParams.get("code") ?? "";
      if (!stateRecord?.state || !stateRecord.verifier || !code || !safeEqual(returnedState, stateRecord.state) || Date.now() - stateRecord.createdAt > 600_000) {
        return new Response(null, { status: 302, headers: { location: withCalendarResult(returnTo, "error", "invalid_state"), "set-cookie": clearState } });
      }

      let tokenResponse;
      let tokenPayload;
      try {
        tokenResponse = await fetchImpl(tokenEndpoint, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            code_verifier: stateRecord.verifier,
            grant_type: "authorization_code",
            redirect_uri: redirectUri,
          }),
        });
        tokenPayload = await tokenResponse.json().catch(() => ({}));
      } catch {
        tokenResponse = { ok: false };
        tokenPayload = {};
      }
      const existingRecord = cookies[TOKEN_COOKIE] ? crypt.open(cookies[TOKEN_COOKIE]) : null;
      const refreshToken = tokenPayload.refresh_token ?? existingRecord?.refreshToken;
      if (!tokenResponse.ok || !refreshToken) {
        return new Response(null, { status: 302, headers: { location: withCalendarResult(returnTo, "error", "token_exchange_failed"), "set-cookie": clearState } });
      }

      const tokenValue = crypt.seal({
        refreshToken,
        scope: tokenPayload.scope ?? existingRecord?.scope ?? GOOGLE_SCOPE,
        connectedAt: existingRecord?.connectedAt ?? Date.now(),
      });
      const headers = new Headers({ location: withCalendarResult(returnTo, "connected") });
      headers.append("set-cookie", clearState);
      headers.append("set-cookie", cookie(TOKEN_COOKIE, tokenValue, { maxAge: 60 * 60 * 24 * 30, path: "/api/google-calendar", secure }));
      return new Response(null, { status: 302, headers });
    }

    if (request.method === "GET" && path === "/api/google-calendar/status") {
      const record = cookies[TOKEN_COOKIE] ? crypt.open(cookies[TOKEN_COOKIE]) : null;
      return json({
        provider: "google",
        connected: Boolean(record?.refreshToken),
        scope: record?.scope ?? null,
        availabilityGranted: hasScope(record, GOOGLE_AVAILABILITY_SCOPE),
        connectedAt: record?.connectedAt ?? null,
      });
    }

    if (request.method === "POST" && path === "/api/google-calendar/disconnect") {
      if (!verifyMutation(request)) return json({ error: "forbidden" }, { status: 403 });
      const record = cookies[TOKEN_COOKIE] ? crypt.open(cookies[TOKEN_COOKIE]) : null;
      if (record?.refreshToken) {
        await fetchImpl(revokeEndpoint, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ token: record.refreshToken }),
        }).catch(() => null);
      }
      return json({ provider: "google", connected: false }, {
        headers: { "set-cookie": cookie(TOKEN_COOKIE, "", { maxAge: 0, path: "/api/google-calendar", secure }) },
      });
    }

    if (request.method === "POST" && path === "/api/google-calendar/events") {
      if (!verifyMutation(request)) return json({ error: "forbidden" }, { status: 403 });
      const record = cookies[TOKEN_COOKIE] ? crypt.open(cookies[TOKEN_COOKIE]) : null;
      if (!record?.refreshToken) return json({ error: "not_connected" }, { status: 401 });
      let event;
      try {
        event = calendarEvent(await limitedJson(request));
      } catch {
        return json({ error: "invalid_request" }, { status: 400 });
      }
      if (!event) return json({ error: "invalid_event" }, { status: 400 });

      try {
        const accessToken = await exchangeRefreshToken(record.refreshToken);
        const response = await fetchImpl(`${calendarApiEndpoint}/calendars/primary/events?sendUpdates=all`, {
          method: "POST",
          headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
          body: JSON.stringify(event),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) return json({ error: "event_creation_failed" }, { status: 502 });
        return json({ id: payload.id, htmlLink: payload.htmlLink, status: payload.status }, { status: 201 });
      } catch {
        return json({ error: "authorization_expired" }, { status: 401 });
      }
    }

    if (request.method === "POST" && path === "/api/google-calendar/freebusy") {
      if (!verifyMutation(request)) return json({ error: "forbidden" }, { status: 403 });
      const record = cookies[TOKEN_COOKIE] ? crypt.open(cookies[TOKEN_COOKIE]) : null;
      if (!record?.refreshToken) return json({ error: "not_connected" }, { status: 401 });
      if (!hasScope(record, GOOGLE_AVAILABILITY_SCOPE)) return json({ error: "availability_permission_required" }, { status: 403 });
      let query;
      try {
        query = availabilityQuery(await limitedJson(request));
      } catch {
        return json({ error: "invalid_request" }, { status: 400 });
      }
      if (!query) return json({ error: "invalid_availability_query" }, { status: 400 });

      try {
        const accessToken = await exchangeRefreshToken(record.refreshToken);
        const response = await fetchImpl(`${calendarApiEndpoint}/freeBusy`, {
          method: "POST",
          headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
          body: JSON.stringify(query),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) return json({ error: "availability_lookup_failed" }, { status: 502 });
        const calendars = query.items.map(({ id }) => {
          const result = payload.calendars?.[id];
          const unavailable = !result || (Array.isArray(result.errors) && result.errors.length > 0);
          return {
            id,
            status: unavailable ? "unavailable" : "available",
            busy: unavailable ? [] : (Array.isArray(result.busy) ? result.busy : []).flatMap((period) => {
              const start = new Date(period?.start);
              const end = new Date(period?.end);
              return Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()) && end > start
                ? [{ start: start.toISOString(), end: end.toISOString() }]
                : [];
            }),
          };
        });
        return json({ timeMin: query.timeMin, timeMax: query.timeMax, calendars });
      } catch {
        return json({ error: "authorization_expired" }, { status: 401 });
      }
    }

    return json({ error: "not_found" }, { status: 404 });
  };
}

export const googleCalendarScope = GOOGLE_SCOPE;
export const googleCalendarAvailabilityScope = GOOGLE_AVAILABILITY_SCOPE;
