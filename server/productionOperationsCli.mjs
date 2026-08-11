import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
import {
  auditProductionEnvironment,
  createAvailabilityBackup,
  resolveOperationalPath,
  restoreAvailabilityBackup,
  verifyAvailabilityBackup,
} from "./productionOperations.mjs";

try { loadEnvFile(fileURLToPath(new URL("../.env", import.meta.url))); }
catch (error) { if (error?.code !== "ENOENT") throw error; }

const serverDirectory = fileURLToPath(new URL(".", import.meta.url));
const dataFile = resolveOperationalPath(process.env.ATLASTIME_DATA_FILE, "../.data/availability-requests.json", serverDirectory);
const backupDirectory = resolveOperationalPath(process.env.ATLASTIME_BACKUP_DIR, "../.data/backups", serverDirectory);
const encryptionKey = process.env.ATLASTIME_DATA_ENCRYPTION_KEY;
const [command, argument, confirmation] = process.argv.slice(2);

function printAudit(result) {
  console.log(result.ready ? "AtlasTime production configuration: READY" : "AtlasTime production configuration: NOT READY");
  for (const error of result.errors) console.log(`ERROR: ${error}`);
  for (const warning of result.warnings) console.log(`WARNING: ${warning}`);
  console.log(`Google Calendar: ${result.calendarProviders.google ? "configured" : "disabled"}`);
  console.log(`Outlook Calendar: ${result.calendarProviders.outlook ? "configured" : "disabled"}`);
}

if (command === "check") {
  const result = auditProductionEnvironment(process.env);
  printAudit(result);
  if (!result.ready) process.exitCode = 1;
} else if (command === "backup") {
  const result = await createAvailabilityBackup({ sourceFile: dataFile, backupDirectory, encryptionKey });
  console.log(`Encrypted backup created: ${result.file}`);
  console.log(`Records verified: ${result.records}; SHA-256: ${result.sha256}`);
} else if (command === "verify") {
  if (!argument) throw new Error("Usage: npm run verify:data -- <backup-file>");
  const result = await verifyAvailabilityBackup(resolveOperationalPath(argument, argument, process.cwd()), encryptionKey);
  console.log(`Encrypted backup verified: ${result.file}`);
  console.log(`Records: ${result.records}; SHA-256: ${result.sha256}`);
} else if (command === "restore") {
  if (!argument) throw new Error("Usage: npm run restore:data -- <backup-file> RESTORE");
  const result = await restoreAvailabilityBackup({
    backupFile: resolveOperationalPath(argument, argument, process.cwd()),
    destinationFile: dataFile,
    encryptionKey,
    confirmation,
  });
  console.log(`Encrypted backup restored: ${result.file}`);
  if (result.previousFile) console.log(`Previous encrypted data preserved: ${result.previousFile}`);
} else {
  throw new Error("Use one of: check, backup, verify, restore.");
}
