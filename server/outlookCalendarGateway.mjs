import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";

const OUTLOOK_AVAILABILITY_SCOPE = "Calendars.Read";
const STATE_COOKIE = "atlastime_outlook_oauth";
const TOKEN_COOKIE = "atlastime_outlook_calendar";
const MAX_BODY_BYTES = 16 * 1024;

function json(value, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(value), { ...init, headers });
}

function parseCookies(request) {
  return Object.fromEntries((request.headers.get("cookie") ?? "").split(";").flatMap((part) => {
    const separator = part.indexOf("=");
    return separator < 1 ? [] : [[part.slice(0, separator).trim(), part.slice(separator + 1).trim()]];
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

function encryption(keyText) {
  const key = Buffer.from(keyText, "base64url");
  if (key.length !== 32) throw new Error("MICROSOFT_TOKEN_ENCRYPTION_KEY must be a base64url-encoded 32-byte key.");
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

function safeEqual(left, right) {
  const first = Buffer.from(left);
  const second = Buffer.from(right);
  return first.length === second.length && timingSafeEqual(first, second);
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
  url.searchParams.set("outlook", result);
  if (reason) url.searchParams.set("reason", reason);
  return `${url.pathname}${url.search}${url.hash}`;
}

function hasScope(record, scope) {
  return typeof record?.scope === "string" && record.scope.split(/\s+/).some((value) => value.toLowerCase() === scope.toLowerCase());
}

async function limitedJson(request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) throw new Error("body_too_large");
  const body = await request.text();
  if (Buffer.byteLength(body) > MAX_BODY_BYTES) throw new Error("body_too_large");
  return JSON.parse(body);
}

function availabilityWindow(value) {
  const timeMin = new Date(value?.timeMin);
  const timeMax = new Date(value?.timeMax);
  if (!Number.isFinite(timeMin.getTime()) || !Number.isFinite(timeMax.getTime())) return null;
  if (timeMax <= timeMin || timeMax.getTime() - timeMin.getTime() > 7 * 86_400_000) return null;
  return { timeMin: timeMin.toISOString(), timeMax: timeMax.toISOString() };
}

function graphInstant(value) {
  if (typeof value !== "string") return null;
  const normalized = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`;
  const date = new Date(normalized);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function createOutlookCalendarGateway({
  clientId,
  clientSecret,
  redirectUri,
  appOrigin,
  encryptionKey,
  fetchImpl = fetch,
  authorizationEndpoint = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
  tokenEndpoint = "https://login.microsoftonline.com/common/oauth2/v2.0/token",
  graphApiEndpoint = "https://graph.microsoft.com/v1.0",
}) {
  if (!clientId || !clientSecret || !redirectUri || !appOrigin || !encryptionKey) throw new Error("Outlook Calendar gateway configuration is incomplete.");
  const redirectUrl = new URL(redirectUri);
  const normalizedOrigin = new URL(appOrigin).origin;
  if (redirectUrl.origin !== normalizedOrigin) throw new Error("MICROSOFT_OAUTH_REDIRECT_URI must use the AtlasTime application origin.");
  const secure = redirectUrl.protocol === "https:";
  const crypt = encryption(encryptionKey);

  function verifyMutation(request) {
    return request.headers.get("origin") === normalizedOrigin && request.headers.get("x-atlastime-csrf") === "1";
  }

  async function accessToken(refreshToken) {
    const response = await fetchImpl(tokenEndpoint, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        scope: `offline_access ${OUTLOOK_AVAILABILITY_SCOPE}`,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.access_token) throw new Error("authorization_expired");
    return payload.access_token;
  }

  return async function handleOutlookCalendar(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const cookies = parseCookies(request);

    if (request.method === "GET" && path === "/api/outlook-calendar/connect") {
      const state = randomBytes(24).toString("base64url");
      const verifier = randomBytes(48).toString("base64url");
      const challenge = createHash("sha256").update(verifier).digest("base64url");
      const returnTo = normalizeReturnTo(url.searchParams.get("returnTo"), normalizedOrigin);
      const stateValue = crypt.seal({ state, verifier, returnTo, createdAt: Date.now() });
      const authorization = new URL(authorizationEndpoint);
      authorization.search = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        response_mode: "query",
        scope: `offline_access ${OUTLOOK_AVAILABILITY_SCOPE}`,
        prompt: "select_account",
        state,
        code_challenge: challenge,
        code_challenge_method: "S256",
      }).toString();
      return new Response(null, {
        status: 302,
        headers: {
          location: authorization.toString(),
          "cache-control": "no-store",
          "set-cookie": cookie(STATE_COOKIE, stateValue, { maxAge: 600, path: "/api/outlook-calendar/callback", secure }),
        },
      });
    }

    if (request.method === "GET" && path === "/api/outlook-calendar/callback") {
      const stateRecord = cookies[STATE_COOKIE] ? crypt.open(cookies[STATE_COOKIE]) : null;
      const clearState = cookie(STATE_COOKIE, "", { maxAge: 0, path: "/api/outlook-calendar/callback", secure });
      const returnTo = normalizeReturnTo(stateRecord?.returnTo, normalizedOrigin);
      const callbackError = url.searchParams.get("error");
      if (callbackError) return new Response(null, { status: 302, headers: { location: withCalendarResult(returnTo, "error", callbackError), "set-cookie": clearState } });
      const returnedState = url.searchParams.get("state") ?? "";
      const code = url.searchParams.get("code") ?? "";
      if (!stateRecord?.state || !stateRecord.verifier || !code || !safeEqual(returnedState, stateRecord.state) || Date.now() - stateRecord.createdAt > 600_000) {
        return new Response(null, { status: 302, headers: { location: withCalendarResult(returnTo, "error", "invalid_state"), "set-cookie": clearState } });
      }
      let response;
      let payload;
      try {
        response = await fetchImpl(tokenEndpoint, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            code_verifier: stateRecord.verifier,
            grant_type: "authorization_code",
            redirect_uri: redirectUri,
            scope: `offline_access ${OUTLOOK_AVAILABILITY_SCOPE}`,
          }),
        });
        payload = await response.json().catch(() => ({}));
      } catch {
        response = { ok: false };
        payload = {};
      }
      if (!response.ok || !payload.refresh_token) {
        return new Response(null, { status: 302, headers: { location: withCalendarResult(returnTo, "error", "token_exchange_failed"), "set-cookie": clearState } });
      }
      const tokenValue = crypt.seal({ refreshToken: payload.refresh_token, scope: payload.scope ?? OUTLOOK_AVAILABILITY_SCOPE, connectedAt: Date.now() });
      const headers = new Headers({ location: withCalendarResult(returnTo, "connected") });
      headers.append("set-cookie", clearState);
      headers.append("set-cookie", cookie(TOKEN_COOKIE, tokenValue, { maxAge: 60 * 60 * 24 * 30, path: "/api/outlook-calendar", secure }));
      return new Response(null, { status: 302, headers });
    }

    if (request.method === "GET" && path === "/api/outlook-calendar/status") {
      const record = cookies[TOKEN_COOKIE] ? crypt.open(cookies[TOKEN_COOKIE]) : null;
      return json({ provider: "outlook", connected: Boolean(record?.refreshToken), availabilityGranted: hasScope(record, OUTLOOK_AVAILABILITY_SCOPE), connectedAt: record?.connectedAt ?? null });
    }

    if (request.method === "POST" && path === "/api/outlook-calendar/disconnect") {
      if (!verifyMutation(request)) return json({ error: "forbidden" }, { status: 403 });
      return json({ provider: "outlook", connected: false, availabilityGranted: false, connectedAt: null }, {
        headers: { "set-cookie": cookie(TOKEN_COOKIE, "", { maxAge: 0, path: "/api/outlook-calendar", secure }) },
      });
    }

    if (request.method === "POST" && path === "/api/outlook-calendar/freebusy") {
      if (!verifyMutation(request)) return json({ error: "forbidden" }, { status: 403 });
      const record = cookies[TOKEN_COOKIE] ? crypt.open(cookies[TOKEN_COOKIE]) : null;
      if (!record?.refreshToken) return json({ error: "not_connected" }, { status: 401 });
      if (!hasScope(record, OUTLOOK_AVAILABILITY_SCOPE)) return json({ error: "availability_permission_required" }, { status: 403 });
      let window;
      try { window = availabilityWindow(await limitedJson(request)); } catch { return json({ error: "invalid_request" }, { status: 400 }); }
      if (!window) return json({ error: "invalid_availability_query" }, { status: 400 });
      try {
        const token = await accessToken(record.refreshToken);
        const endpoint = new URL(`${graphApiEndpoint}/me/calendarView`);
        endpoint.searchParams.set("startDateTime", window.timeMin);
        endpoint.searchParams.set("endDateTime", window.timeMax);
        endpoint.searchParams.set("$select", "start,end,showAs,isCancelled");
        endpoint.searchParams.set("$top", "1000");
        const events = [];
        let nextPage = endpoint.toString();
        const graphOrigin = new URL(graphApiEndpoint).origin;
        for (let page = 0; nextPage && page < 5; page += 1) {
          const response = await fetchImpl(nextPage, {
            headers: { authorization: `Bearer ${token}`, prefer: 'outlook.timezone="UTC"' },
          });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) return json({ error: "availability_lookup_failed" }, { status: 502 });
          if (Array.isArray(payload.value)) events.push(...payload.value);
          const candidate = typeof payload["@odata.nextLink"] === "string" ? payload["@odata.nextLink"] : "";
          nextPage = candidate && new URL(candidate).origin === graphOrigin ? candidate : "";
        }
        const lower = new Date(window.timeMin);
        const upper = new Date(window.timeMax);
        const busy = events.flatMap((event) => {
          if (event?.isCancelled || event?.showAs === "free") return [];
          const start = graphInstant(event?.start?.dateTime);
          const end = graphInstant(event?.end?.dateTime);
          if (!start || !end || end <= lower || start >= upper) return [];
          const clippedStart = start < lower ? lower : start;
          const clippedEnd = end > upper ? upper : end;
          return clippedEnd > clippedStart ? [{ start: clippedStart.toISOString(), end: clippedEnd.toISOString() }] : [];
        });
        return json({ provider: "outlook", timeMin: window.timeMin, timeMax: window.timeMax, busy });
      } catch {
        return json({ error: "authorization_expired" }, { status: 401 });
      }
    }

    return json({ error: "not_found" }, { status: 404 });
  };
}

export const outlookCalendarAvailabilityScope = OUTLOOK_AVAILABILITY_SCOPE;
