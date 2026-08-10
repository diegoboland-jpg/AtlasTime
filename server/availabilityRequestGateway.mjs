import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const MAX_BODY_BYTES = 16 * 1024;
const MAX_LIFETIME_DAYS = 14;
const ENCRYPTED_STORE_AAD = Buffer.from("AtlasTime availability requests v1", "utf8");

function json(value, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(value), { ...init, headers });
}

function digest(value) {
  return createHash("sha256").update(value).digest("base64url");
}

function text(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function requestedWindow(value) {
  const timeMin = new Date(value?.timeMin);
  const timeMax = new Date(value?.timeMax);
  if (!Number.isFinite(timeMin.getTime()) || !Number.isFinite(timeMax.getTime())) return null;
  if (timeMax <= timeMin || timeMax.getTime() - timeMin.getTime() > 7 * 86_400_000) return null;
  return { timeMin: timeMin.toISOString(), timeMax: timeMax.toISOString() };
}

function safeBusy(value, window) {
  if (!Array.isArray(value)) return null;
  const lower = new Date(window.timeMin).getTime();
  const upper = new Date(window.timeMax).getTime();
  const busy = value.slice(0, 336).flatMap((period) => {
    const start = new Date(period?.start);
    const end = new Date(period?.end);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) return [];
    if (start.getTime() < lower || end.getTime() > upper) return [];
    return [{ start: start.toISOString(), end: end.toISOString() }];
  });
  return busy.length === value.length ? busy : null;
}

function mergeBusy(periods) {
  const sorted = periods.slice().sort((left, right) => new Date(left.start) - new Date(right.start));
  return sorted.reduce((merged, period) => {
    const previous = merged.at(-1);
    if (!previous || new Date(period.start) > new Date(previous.end)) {
      merged.push({ ...period });
    } else if (new Date(period.end) > new Date(previous.end)) {
      previous.end = period.end;
    }
    return merged;
  }, []);
}

async function limitedJson(request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) throw new Error("body_too_large");
  const body = await request.text();
  if (Buffer.byteLength(body) > MAX_BODY_BYTES) throw new Error("body_too_large");
  return JSON.parse(body);
}

function verifyMutation(request, origin) {
  return request.headers.get("origin") === origin && request.headers.get("x-atlastime-csrf") === "1";
}

export function createMemoryAvailabilityRequestStore(initial = []) {
  let records = structuredClone(initial);
  return {
    async read() { return structuredClone(records); },
    async write(next) { records = structuredClone(next); },
  };
}

export function createFileAvailabilityRequestStore(file) {
  let pending = Promise.resolve();
  return {
    async read() {
      try {
        const parsed = JSON.parse(await readFile(file, "utf8"));
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        if (error?.code === "ENOENT") return [];
        throw error;
      }
    },
    async write(records) {
      pending = pending.then(async () => {
        await mkdir(dirname(file), { recursive: true });
        const temporary = `${file}.${process.pid}.tmp`;
        await writeFile(temporary, JSON.stringify(records), { encoding: "utf8", mode: 0o600 });
        await rename(temporary, file);
      });
      return pending;
    },
  };
}

export function decodeAvailabilityEncryptionKey(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(value)) {
    throw new Error("ATLASTIME_DATA_ENCRYPTION_KEY must be a base64url-encoded 32-byte key.");
  }
  const key = Buffer.from(value, "base64url");
  if (key.length !== 32) throw new Error("ATLASTIME_DATA_ENCRYPTION_KEY must be a base64url-encoded 32-byte key.");
  return key;
}

export function createEncryptedFileAvailabilityRequestStore(file, encodedKey, { randomBytesImpl = randomBytes } = {}) {
  const key = decodeAvailabilityEncryptionKey(encodedKey);
  let pending = Promise.resolve();

  return {
    async read() {
      try {
        const parsed = JSON.parse(await readFile(file, "utf8"));
        // Read legacy development data once so the next write can migrate it to ciphertext.
        if (Array.isArray(parsed)) return parsed;
        if (parsed?.version !== 1 || parsed?.algorithm !== "A256GCM") throw new Error("invalid_encrypted_store");
        const iv = Buffer.from(parsed.iv ?? "", "base64url");
        const tag = Buffer.from(parsed.tag ?? "", "base64url");
        const ciphertext = Buffer.from(parsed.ciphertext ?? "", "base64url");
        if (iv.length !== 12 || tag.length !== 16 || ciphertext.length === 0) throw new Error("invalid_encrypted_store");
        const decipher = createDecipheriv("aes-256-gcm", key, iv);
        decipher.setAAD(ENCRYPTED_STORE_AAD);
        decipher.setAuthTag(tag);
        const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        const records = JSON.parse(plaintext.toString("utf8"));
        if (!Array.isArray(records)) throw new Error("invalid_encrypted_store");
        return records;
      } catch (error) {
        if (error?.code === "ENOENT") return [];
        throw error;
      }
    },
    async write(records) {
      pending = pending.then(async () => {
        const iv = randomBytesImpl(12);
        const cipher = createCipheriv("aes-256-gcm", key, iv);
        cipher.setAAD(ENCRYPTED_STORE_AAD);
        const ciphertext = Buffer.concat([cipher.update(JSON.stringify(records), "utf8"), cipher.final()]);
        const envelope = {
          version: 1,
          algorithm: "A256GCM",
          iv: iv.toString("base64url"),
          tag: cipher.getAuthTag().toString("base64url"),
          ciphertext: ciphertext.toString("base64url"),
        };
        await mkdir(dirname(file), { recursive: true });
        const temporary = `${file}.${process.pid}.tmp`;
        await writeFile(temporary, JSON.stringify(envelope), { encoding: "utf8", mode: 0o600 });
        await rename(temporary, file);
      });
      return pending;
    },
  };
}

export function createAvailabilityRequestGateway({
  appOrigin,
  store = createMemoryAvailabilityRequestStore(),
  now = () => Date.now(),
  randomBytesImpl = randomBytes,
}) {
  const origin = new URL(appOrigin).origin;

  async function records() {
    return (await store.read()).filter((record) => record && typeof record === "object");
  }

  return async function handleAvailabilityRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "POST" && path === "/api/availability-requests") {
      if (!verifyMutation(request, origin)) return json({ error: "forbidden" }, { status: 403 });
      try {
        const body = await limitedJson(request);
        const personName = text(body?.personName, 120);
        const window = requestedWindow(body);
        if (!personName || !window) return json({ error: "invalid_request" }, { status: 400 });
        const requestedDays = Number(body?.expiresInDays ?? 7);
        const lifetimeDays = Number.isInteger(requestedDays) ? Math.min(MAX_LIFETIME_DAYS, Math.max(1, requestedDays)) : 7;
        const token = randomBytesImpl(32).toString("base64url");
        const managementKey = randomBytesImpl(32).toString("base64url");
        const createdAt = now();
        const record = {
          id: randomBytesImpl(12).toString("base64url"),
          tokenHash: digest(token),
          managementHash: digest(managementKey),
          personName,
          ...window,
          status: "pending",
          createdAt,
          expiresAt: createdAt + lifetimeDays * 86_400_000,
        };
        const current = await records();
        await store.write([...current.filter((item) => item.expiresAt > createdAt), record]);
        return json({
          url: `${origin}/availability/${token}`,
          managementKey,
          status: record.status,
          expiresAt: new Date(record.expiresAt).toISOString(),
        }, { status: 201 });
      } catch (error) {
        return json({ error: error?.message === "body_too_large" ? "body_too_large" : "invalid_json" }, { status: 400 });
      }
    }

    const match = path.match(/^\/api\/availability-requests\/([A-Za-z0-9_-]{43})(?:\/(revoke|submit|result))?$/);
    if (!match) return json({ error: "not_found" }, { status: 404 });
    const [, token, action] = match;
    const current = await records();
    const record = current.find((item) => item.tokenHash === digest(token));
    if (!record) return json({ error: "not_found" }, { status: 404 });
    const expired = record.expiresAt <= now();
    const visibleStatus = expired && record.status !== "revoked" ? "expired" : record.status;

    if (request.method === "GET" && !action) {
      return json({
        personName: record.personName,
        status: visibleStatus,
        expiresAt: new Date(record.expiresAt).toISOString(),
        timeMin: record.timeMin,
        timeMax: record.timeMax,
        providers: record.providers ?? (record.provider ? [record.provider] : []),
      });
    }

    if (request.method === "POST" && action === "submit") {
      if (!verifyMutation(request, origin)) return json({ error: "forbidden" }, { status: 403 });
      if (expired || record.status === "revoked") return json({ error: expired ? "expired" : "revoked" }, { status: 410 });
      try {
        const body = await limitedJson(request);
        const busy = safeBusy(body?.busy, record);
        if (!["google", "outlook"].includes(body?.provider) || !busy) return json({ error: "invalid_request" }, { status: 400 });
        const existingBusyByProvider = record.busyByProvider ?? (
          record.provider && record.provider !== "combined" ? { [record.provider]: record.busy ?? [] } : {}
        );
        const busyByProvider = { ...existingBusyByProvider, [body.provider]: busy };
        const providers = Object.keys(busyByProvider).filter((provider) => ["google", "outlook"].includes(provider));
        const combinedBusy = mergeBusy(providers.flatMap((provider) => busyByProvider[provider] ?? []));
        const next = current.map((item) => item.id === record.id
          ? {
              ...item,
              status: "shared",
              provider: providers.length > 1 ? "combined" : providers[0],
              providers,
              busyByProvider,
              busy: combinedBusy,
              sharedAt: now(),
            }
          : item);
        await store.write(next);
        return json({ status: "shared", providers });
      } catch {
        return json({ error: "invalid_json" }, { status: 400 });
      }
    }

    if (request.method === "POST" && action === "result") {
      if (!verifyMutation(request, origin)) return json({ error: "forbidden" }, { status: 403 });
      try {
        const body = await limitedJson(request);
        if (!body?.managementKey || digest(body.managementKey) !== record.managementHash) {
          return json({ error: "forbidden" }, { status: 403 });
        }
        return json({
          status: visibleStatus,
          provider: record.provider ?? null,
          providers: record.providers ?? (record.provider ? [record.provider] : []),
          timeMin: record.timeMin,
          timeMax: record.timeMax,
          busy: visibleStatus === "shared" ? record.busy : [],
        });
      } catch {
        return json({ error: "invalid_json" }, { status: 400 });
      }
    }

    if (request.method === "POST" && action === "revoke") {
      if (!verifyMutation(request, origin)) return json({ error: "forbidden" }, { status: 403 });
      try {
        const body = await limitedJson(request);
        if (!body?.managementKey || digest(body.managementKey) !== record.managementHash) {
          return json({ error: "forbidden" }, { status: 403 });
        }
        const next = current.map((item) => item.id === record.id ? { ...item, status: "revoked", revokedAt: now() } : item);
        await store.write(next);
        return json({ status: "revoked" });
      } catch {
        return json({ error: "invalid_json" }, { status: 400 });
      }
    }

    return json({ error: "method_not_allowed" }, { status: 405 });
  };
}
