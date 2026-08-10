import { describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createAvailabilityRequestGateway,
  createEncryptedFileAvailabilityRequestStore,
  createMemoryAvailabilityRequestStore,
  decodeAvailabilityEncryptionKey,
} from "./availabilityRequestGateway.mjs";

const origin = "https://atlas.example";
const mutationHeaders = { origin, "x-atlastime-csrf": "1", "content-type": "application/json" };

function deterministicBytes(size) {
  deterministicBytes.call = (deterministicBytes.call ?? 0) + 1;
  return Buffer.alloc(size, deterministicBytes.call);
}

async function create(gateway, body = {
  personName: "Ana",
  expiresInDays: 7,
  timeMin: "2026-08-01T00:00:00Z",
  timeMax: "2026-08-02T00:00:00Z",
}) {
  const response = await gateway(new Request(`${origin}/api/availability-requests`, {
    method: "POST",
    headers: mutationHeaders,
    body: JSON.stringify(body),
  }));
  return { response, payload: await response.json() };
}

describe("availability request gateway", () => {
  it("creates an opaque expiring link and stores only token hashes", async () => {
    deterministicBytes.call = 0;
    const store = createMemoryAvailabilityRequestStore();
    const gateway = createAvailabilityRequestGateway({ appOrigin: origin, store, now: () => 1_000, randomBytesImpl: deterministicBytes });
    const { response, payload } = await create(gateway);

    expect(response.status).toBe(201);
    expect(payload.url).toMatch(/^https:\/\/atlas\.example\/availability\/[A-Za-z0-9_-]{43}$/);
    expect(payload.managementKey).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(payload.expiresAt).toBe(new Date(1_000 + 7 * 86_400_000).toISOString());
    const serialized = JSON.stringify(await store.read());
    expect(serialized).not.toContain(payload.url.split("/").at(-1));
    expect(serialized).not.toContain(payload.managementKey);
  });

  it("requires same-origin mutation proof", async () => {
    const gateway = createAvailabilityRequestGateway({ appOrigin: origin });
    const response = await gateway(new Request(`${origin}/api/availability-requests`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ personName: "Ana" }),
    }));
    expect(response.status).toBe(403);
  });

  it("reveals only consent metadata and expires automatically", async () => {
    deterministicBytes.call = 0;
    let time = 5_000;
    const gateway = createAvailabilityRequestGateway({ appOrigin: origin, now: () => time, randomBytesImpl: deterministicBytes });
    const { payload } = await create(gateway, {
      personName: "Ana",
      expiresInDays: 1,
      timeMin: "2026-08-01T00:00:00Z",
      timeMax: "2026-08-02T00:00:00Z",
    });
    const token = payload.url.split("/").at(-1);
    const pending = await gateway(new Request(`${origin}/api/availability-requests/${token}`));
    expect(await pending.json()).toMatchObject({ personName: "Ana", status: "pending" });
    time += 86_400_001;
    const expired = await gateway(new Request(`${origin}/api/availability-requests/${token}`));
    expect(await expired.json()).toMatchObject({ status: "expired" });
  });

  it("revokes only with the separate management key", async () => {
    deterministicBytes.call = 0;
    const gateway = createAvailabilityRequestGateway({ appOrigin: origin, randomBytesImpl: deterministicBytes });
    const { payload } = await create(gateway);
    const token = payload.url.split("/").at(-1);
    const denied = await gateway(new Request(`${origin}/api/availability-requests/${token}/revoke`, {
      method: "POST", headers: mutationHeaders, body: JSON.stringify({ managementKey: "wrong" }),
    }));
    expect(denied.status).toBe(403);
    const revoked = await gateway(new Request(`${origin}/api/availability-requests/${token}/revoke`, {
      method: "POST", headers: mutationHeaders, body: JSON.stringify({ managementKey: payload.managementKey }),
    }));
    expect(await revoked.json()).toEqual({ status: "revoked" });
  });

  it("accepts only sanitized busy blocks inside the requested window and protects results", async () => {
    deterministicBytes.call = 0;
    const gateway = createAvailabilityRequestGateway({ appOrigin: origin, randomBytesImpl: deterministicBytes });
    const { payload } = await create(gateway);
    const token = payload.url.split("/").at(-1);
    const submitted = await gateway(new Request(`${origin}/api/availability-requests/${token}/submit`, {
      method: "POST",
      headers: mutationHeaders,
      body: JSON.stringify({
        provider: "google",
        busy: [{ start: "2026-08-01T09:00:00Z", end: "2026-08-01T10:30:00Z" }],
      }),
    }));
    expect(await submitted.json()).toEqual({ status: "shared", providers: ["google"] });

    const publicView = await gateway(new Request(`${origin}/api/availability-requests/${token}`));
    expect(JSON.stringify(await publicView.json())).not.toContain("09:00:00");

    const result = await gateway(new Request(`${origin}/api/availability-requests/${token}/result`, {
      method: "POST",
      headers: mutationHeaders,
      body: JSON.stringify({ managementKey: payload.managementKey }),
    }));
    await expect(result.json()).resolves.toMatchObject({
      status: "shared",
      provider: "google",
      busy: [{ start: "2026-08-01T09:00:00.000Z", end: "2026-08-01T10:30:00.000Z" }],
    });
  });

  it("combines Google and Outlook blocks while exposing no public schedule", async () => {
    deterministicBytes.call = 0;
    const gateway = createAvailabilityRequestGateway({ appOrigin: origin, randomBytesImpl: deterministicBytes });
    const { payload } = await create(gateway);
    const token = payload.url.split("/").at(-1);
    const submit = (provider, busy) => gateway(new Request(`${origin}/api/availability-requests/${token}/submit`, {
      method: "POST",
      headers: mutationHeaders,
      body: JSON.stringify({ provider, busy }),
    }));

    await submit("google", [{ start: "2026-08-01T09:00:00Z", end: "2026-08-01T10:00:00Z" }]);
    const outlook = await submit("outlook", [
      { start: "2026-08-01T09:30:00Z", end: "2026-08-01T11:00:00Z" },
      { start: "2026-08-01T15:00:00Z", end: "2026-08-01T16:00:00Z" },
    ]);
    expect(await outlook.json()).toEqual({ status: "shared", providers: ["google", "outlook"] });

    const publicView = await gateway(new Request(`${origin}/api/availability-requests/${token}`));
    const publicPayload = await publicView.json();
    expect(publicPayload.providers).toEqual(["google", "outlook"]);
    expect(JSON.stringify(publicPayload)).not.toContain("09:00:00");

    const result = await gateway(new Request(`${origin}/api/availability-requests/${token}/result`, {
      method: "POST",
      headers: mutationHeaders,
      body: JSON.stringify({ managementKey: payload.managementKey }),
    }));
    await expect(result.json()).resolves.toMatchObject({
      provider: "combined",
      providers: ["google", "outlook"],
      busy: [
        { start: "2026-08-01T09:00:00.000Z", end: "2026-08-01T11:00:00.000Z" },
        { start: "2026-08-01T15:00:00.000Z", end: "2026-08-01T16:00:00.000Z" },
      ],
    });
  });

  it("expires previously shared results and stops returning their busy blocks", async () => {
    deterministicBytes.call = 0;
    let time = 10_000;
    const gateway = createAvailabilityRequestGateway({ appOrigin: origin, now: () => time, randomBytesImpl: deterministicBytes });
    const { payload } = await create(gateway, {
      personName: "Ana",
      expiresInDays: 1,
      timeMin: "2026-08-01T00:00:00Z",
      timeMax: "2026-08-02T00:00:00Z",
    });
    const token = payload.url.split("/").at(-1);
    await gateway(new Request(`${origin}/api/availability-requests/${token}/submit`, {
      method: "POST",
      headers: mutationHeaders,
      body: JSON.stringify({ provider: "google", busy: [{ start: "2026-08-01T09:00:00Z", end: "2026-08-01T10:00:00Z" }] }),
    }));
    time += 86_400_001;

    const result = await gateway(new Request(`${origin}/api/availability-requests/${token}/result`, {
      method: "POST",
      headers: mutationHeaders,
      body: JSON.stringify({ managementKey: payload.managementKey }),
    }));
    await expect(result.json()).resolves.toMatchObject({ status: "expired", busy: [] });
  });
});

describe("encrypted availability request storage", () => {
  const encodedKey = Buffer.alloc(32, 7).toString("base64url");

  it("rejects missing or malformed production keys", () => {
    expect(() => decodeAvailabilityEncryptionKey("")).toThrow(/base64url-encoded 32-byte key/);
    expect(() => decodeAvailabilityEncryptionKey(Buffer.alloc(31).toString("base64url"))).toThrow(/base64url-encoded 32-byte key/);
    expect(decodeAvailabilityEncryptionKey(encodedKey)).toHaveLength(32);
  });

  it("persists authenticated ciphertext and restores records", async () => {
    const directory = await mkdtemp(join(tmpdir(), "atlastime-encrypted-store-"));
    const file = join(directory, "availability.json");
    try {
      const store = createEncryptedFileAvailabilityRequestStore(file, encodedKey, {
        randomBytesImpl: (size) => Buffer.alloc(size, 3),
      });
      const records = [{ id: "request-one", personName: "Ana", busy: [{ start: "private-start", end: "private-end" }] }];
      await store.write(records);

      const serialized = await readFile(file, "utf8");
      expect(serialized).toContain('"algorithm":"A256GCM"');
      expect(serialized).not.toContain("Ana");
      expect(serialized).not.toContain("private-start");
      await expect(store.read()).resolves.toEqual(records);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("reads a legacy plaintext file so the next write migrates it", async () => {
    const directory = await mkdtemp(join(tmpdir(), "atlastime-legacy-store-"));
    const file = join(directory, "availability.json");
    try {
      const records = [{ id: "legacy" }];
      await writeFile(file, JSON.stringify(records));
      const store = createEncryptedFileAvailabilityRequestStore(file, encodedKey);
      await expect(store.read()).resolves.toEqual(records);
      await store.write(records);
      expect(JSON.parse(await readFile(file, "utf8"))).toMatchObject({ version: 1, algorithm: "A256GCM" });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("fails closed when ciphertext is altered", async () => {
    const directory = await mkdtemp(join(tmpdir(), "atlastime-tampered-store-"));
    const file = join(directory, "availability.json");
    try {
      const store = createEncryptedFileAvailabilityRequestStore(file, encodedKey);
      await store.write([{ id: "request-one" }]);
      const envelope = JSON.parse(await readFile(file, "utf8"));
      envelope.ciphertext = `${envelope.ciphertext.slice(0, -1)}${envelope.ciphertext.endsWith("A") ? "B" : "A"}`;
      await writeFile(file, JSON.stringify(envelope));
      await expect(store.read()).rejects.toThrow();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
