import { describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createEncryptedFileAvailabilityRequestStore } from "./availabilityRequestGateway.mjs";
import {
  auditProductionEnvironment,
  createAvailabilityBackup,
  restoreAvailabilityBackup,
  verifyAvailabilityBackup,
} from "./productionOperations.mjs";

const dataKey = Buffer.alloc(32, 1).toString("base64url");
const googleKey = Buffer.alloc(32, 2).toString("base64url");
const outlookKey = Buffer.alloc(32, 3).toString("base64url");

function productionEnvironment(overrides = {}) {
  return {
    NODE_ENV: "production",
    ATLASTIME_APP_ORIGIN: "https://atlas.example",
    ATLASTIME_DATA_FILE: "/data/availability.json",
    ATLASTIME_DATA_ENCRYPTION_KEY: dataKey,
    GOOGLE_OAUTH_CLIENT_ID: "google-id",
    GOOGLE_OAUTH_CLIENT_SECRET: "google-secret",
    GOOGLE_OAUTH_REDIRECT_URI: "https://atlas.example/api/google-calendar/callback",
    GOOGLE_TOKEN_ENCRYPTION_KEY: googleKey,
    MICROSOFT_OAUTH_CLIENT_ID: "microsoft-id",
    MICROSOFT_OAUTH_CLIENT_SECRET: "microsoft-secret",
    MICROSOFT_OAUTH_REDIRECT_URI: "https://atlas.example/api/outlook-calendar/callback",
    MICROSOFT_TOKEN_ENCRYPTION_KEY: outlookKey,
    ...overrides,
  };
}

describe("production readiness audit", () => {
  it("accepts a complete HTTPS deployment with independent keys", () => {
    expect(auditProductionEnvironment(productionEnvironment())).toEqual({
      ready: true,
      errors: [],
      warnings: [],
      calendarProviders: { google: true, outlook: true },
    });
  });

  it("rejects unsafe origins, incomplete providers, and reused keys", () => {
    const result = auditProductionEnvironment(productionEnvironment({
      ATLASTIME_APP_ORIGIN: "http://localhost:4173",
      GOOGLE_OAUTH_CLIENT_SECRET: "",
      MICROSOFT_TOKEN_ENCRYPTION_KEY: dataKey,
    }));
    expect(result.ready).toBe(false);
    expect(result.errors.join(" ")).toMatch(/valid HTTPS URL/);
    expect(result.errors.join(" ")).toMatch(/Google Calendar configuration is incomplete/);
    expect(result.errors.join(" ")).toMatch(/must use different keys/);
    expect(result.warnings.join(" ")).toMatch(/local computer/);
  });
});

describe("encrypted availability backup operations", () => {
  it("creates a ciphertext-only backup with a checksum", async () => {
    const directory = await mkdtemp(join(tmpdir(), "atlastime-backup-"));
    try {
      const source = join(directory, "availability.json");
      const store = createEncryptedFileAvailabilityRequestStore(source, dataKey);
      await store.write([{ id: "one", personName: "Private name" }]);
      const result = await createAvailabilityBackup({
        sourceFile: source,
        backupDirectory: join(directory, "backups"),
        encryptionKey: dataKey,
        now: () => Date.UTC(2026, 7, 10, 12),
      });
      expect(result.records).toBe(1);
      expect(await readFile(result.file, "utf8")).not.toContain("Private name");
      expect(await readFile(`${result.file}.sha256`, "utf8")).toContain(result.sha256);
      await expect(verifyAvailabilityBackup(result.file, dataKey)).resolves.toMatchObject({ records: 1 });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("requires confirmation and preserves the previous file during restore", async () => {
    const directory = await mkdtemp(join(tmpdir(), "atlastime-restore-"));
    try {
      const source = join(directory, "source.json");
      const destination = join(directory, "destination.json");
      await createEncryptedFileAvailabilityRequestStore(source, dataKey).write([{ id: "backup" }]);
      await createEncryptedFileAvailabilityRequestStore(destination, dataKey).write([{ id: "current" }]);
      await expect(restoreAvailabilityBackup({
        backupFile: source,
        destinationFile: destination,
        encryptionKey: dataKey,
        confirmation: "yes",
      })).rejects.toThrow(/exact confirmation RESTORE/);
      const result = await restoreAvailabilityBackup({
        backupFile: source,
        destinationFile: destination,
        encryptionKey: dataKey,
        confirmation: "RESTORE",
        now: () => Date.UTC(2026, 7, 10, 13),
      });
      expect(result.previousFile).toMatch(/\.before-/);
      await expect(createEncryptedFileAvailabilityRequestStore(destination, dataKey).read()).resolves.toEqual([{ id: "backup" }]);
      await expect(createEncryptedFileAvailabilityRequestStore(result.previousFile, dataKey).read()).resolves.toEqual([{ id: "current" }]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("rejects backups when the encryption key is wrong", async () => {
    const directory = await mkdtemp(join(tmpdir(), "atlastime-wrong-key-"));
    try {
      const file = join(directory, "availability.json");
      await createEncryptedFileAvailabilityRequestStore(file, dataKey).write([{ id: "one" }]);
      await expect(verifyAvailabilityBackup(file, googleKey)).rejects.toThrow();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
