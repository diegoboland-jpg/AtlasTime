import { createHash } from "node:crypto";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { createEncryptedFileAvailabilityRequestStore, decodeAvailabilityEncryptionKey } from "./availabilityRequestGateway.mjs";

const KEY_NAMES = ["GOOGLE_TOKEN_ENCRYPTION_KEY", "MICROSOFT_TOKEN_ENCRYPTION_KEY", "ATLASTIME_DATA_ENCRYPTION_KEY"];

function validUrl(value) {
  try { return new URL(value); } catch { return null; }
}

function configuredGroup(environment, names) {
  const present = names.filter((name) => Boolean(environment[name]));
  return { enabled: present.length > 0, complete: present.length === names.length, missing: names.filter((name) => !environment[name]) };
}

export function auditProductionEnvironment(environment) {
  const errors = [];
  const warnings = [];
  const origin = validUrl(environment.ATLASTIME_APP_ORIGIN);
  if (environment.NODE_ENV !== "production") errors.push("NODE_ENV must be production.");
  if (!origin || origin.protocol !== "https:") errors.push("ATLASTIME_APP_ORIGIN must be a valid HTTPS URL.");
  if (origin && ["localhost", "127.0.0.1", "::1"].includes(origin.hostname)) warnings.push("The public origin still points to the local computer.");

  try { decodeAvailabilityEncryptionKey(environment.ATLASTIME_DATA_ENCRYPTION_KEY); }
  catch (error) { errors.push(error.message); }
  if (!environment.ATLASTIME_DATA_FILE) errors.push("ATLASTIME_DATA_FILE must point to persistent storage.");
  else if (!isAbsolute(environment.ATLASTIME_DATA_FILE)) warnings.push("Use an absolute ATLASTIME_DATA_FILE path on the production host.");

  const googleNames = ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_OAUTH_REDIRECT_URI", "GOOGLE_TOKEN_ENCRYPTION_KEY"];
  const microsoftNames = ["MICROSOFT_OAUTH_CLIENT_ID", "MICROSOFT_OAUTH_CLIENT_SECRET", "MICROSOFT_OAUTH_REDIRECT_URI", "MICROSOFT_TOKEN_ENCRYPTION_KEY"];
  const google = configuredGroup(environment, googleNames);
  const outlook = configuredGroup(environment, microsoftNames);
  if (google.enabled && !google.complete) errors.push(`Google Calendar configuration is incomplete: ${google.missing.join(", ")}.`);
  if (outlook.enabled && !outlook.complete) errors.push(`Outlook Calendar configuration is incomplete: ${outlook.missing.join(", ")}.`);

  for (const [provider, redirectName] of [["Google", "GOOGLE_OAUTH_REDIRECT_URI"], ["Outlook", "MICROSOFT_OAUTH_REDIRECT_URI"]]) {
    const redirect = validUrl(environment[redirectName]);
    if (environment[redirectName] && (!redirect || redirect.protocol !== "https:")) errors.push(`${provider} redirect URI must use HTTPS.`);
    if (origin && redirect && redirect.origin !== origin.origin) errors.push(`${provider} redirect URI must use the AtlasTime origin.`);
  }

  const configuredKeys = KEY_NAMES.flatMap((name) => environment[name] ? [{ name, value: environment[name] }] : []);
  for (const { name, value } of configuredKeys) {
    try { decodeAvailabilityEncryptionKey(value); }
    catch { errors.push(`${name} must be a base64url-encoded 32-byte key.`); }
  }
  for (let left = 0; left < configuredKeys.length; left += 1) {
    for (let right = left + 1; right < configuredKeys.length; right += 1) {
      if (configuredKeys[left].value === configuredKeys[right].value) {
        errors.push(`${configuredKeys[left].name} and ${configuredKeys[right].name} must use different keys.`);
      }
    }
  }

  return {
    ready: errors.length === 0,
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
    calendarProviders: { google: google.complete, outlook: outlook.complete },
  };
}

function encryptedEnvelope(buffer) {
  const parsed = JSON.parse(buffer.toString("utf8"));
  if (parsed?.version !== 1 || parsed?.algorithm !== "A256GCM" || !parsed.iv || !parsed.tag || !parsed.ciphertext) {
    throw new Error("The data file is not an AtlasTime encrypted availability store.");
  }
  return parsed;
}

function timestamp(value) {
  return new Date(value).toISOString().replaceAll(":", "-").replaceAll(".", "-");
}

export async function verifyAvailabilityBackup(file, encryptionKey) {
  const buffer = await readFile(file);
  encryptedEnvelope(buffer);
  const store = createEncryptedFileAvailabilityRequestStore(file, encryptionKey);
  const records = await store.read();
  return {
    file,
    bytes: buffer.length,
    records: records.length,
    sha256: createHash("sha256").update(buffer).digest("hex"),
  };
}

export async function createAvailabilityBackup({ sourceFile, backupDirectory, encryptionKey, now = () => Date.now() }) {
  const verified = await verifyAvailabilityBackup(sourceFile, encryptionKey);
  await mkdir(backupDirectory, { recursive: true });
  const backupFile = join(backupDirectory, `availability-${timestamp(now())}.json.enc`);
  const buffer = await readFile(sourceFile);
  await writeFile(backupFile, buffer, { flag: "wx", mode: 0o600 });
  await writeFile(`${backupFile}.sha256`, `${verified.sha256}  ${backupFile.split(/[\\/]/).at(-1)}\n`, { flag: "wx", mode: 0o600 });
  return { ...verified, file: backupFile };
}

export async function restoreAvailabilityBackup({ backupFile, destinationFile, encryptionKey, confirmation, now = () => Date.now() }) {
  if (confirmation !== "RESTORE") throw new Error("Restore requires the exact confirmation RESTORE.");
  const verified = await verifyAvailabilityBackup(backupFile, encryptionKey);
  const buffer = await readFile(backupFile);
  await mkdir(dirname(destinationFile), { recursive: true });
  let previousFile = null;
  try {
    if ((await stat(destinationFile)).isFile()) {
      previousFile = `${destinationFile}.before-${timestamp(now())}.bak`;
      await writeFile(previousFile, await readFile(destinationFile), { flag: "wx", mode: 0o600 });
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const temporary = `${destinationFile}.${process.pid}.restore.tmp`;
  await writeFile(temporary, buffer, { flag: "wx", mode: 0o600 });
  await rename(temporary, destinationFile);
  await verifyAvailabilityBackup(destinationFile, encryptionKey);
  return { ...verified, file: destinationFile, previousFile };
}

export function resolveOperationalPath(value, fallback, baseDirectory) {
  const candidate = value || fallback;
  return isAbsolute(candidate) ? candidate : resolve(baseDirectory, candidate);
}
