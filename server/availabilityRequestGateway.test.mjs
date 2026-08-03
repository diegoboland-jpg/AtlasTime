import { describe, expect, it } from "vitest";
import { createAvailabilityRequestGateway, createMemoryAvailabilityRequestStore } from "./availabilityRequestGateway.mjs";

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
    expect(await submitted.json()).toEqual({ status: "shared" });

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
});
