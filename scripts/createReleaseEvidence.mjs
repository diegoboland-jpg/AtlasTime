import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const packageJson = JSON.parse(await readFile(join(repositoryRoot, "package.json"), "utf8"));
const releaseName = `kikroo-${packageJson.version}`;
const destination = resolve(process.argv[2] ?? join(repositoryRoot, ".release-evidence", releaseName));

const evidenceFiles = [
  "public/icons/kikroo-logo.png",
  "public/icons/kikroo-icon-192.png",
  "public/icons/kikroo-icon-512.png",
  "public/icons/kikroo-icon-maskable-512.png",
  "public/icons/kikroo-apple-touch-icon.png",
  "public/manifest.webmanifest",
  "android/release-config.json",
  "CHANGELOG.md",
  "THIRD_PARTY_NOTICES.md",
  "docs/IP_ASSET_REGISTER.md",
  "docs/BRAND_PROTECTION_PLAN.md",
  "docs/BETA_PRIVACY_NOTICE.md",
  "docs/BETA_VALIDATION_PLAN.md",
  "docs/BETA_RELEASE_CHECKLIST.md",
  "docs/BETA_TESTER_INVITATION.md",
  "docs/BETA_EXIT_REPORT_TEMPLATE.md",
  "docs/LEGAL_DECISION_RECORD.md",
  "docs/INTERNATIONAL_TRADEMARK_STRATEGY.md",
  "docs/TESTER_RECRUITMENT_PLAN.md",
  "docs/V1_15_PROTECTED_BETA.md",
  "docs/V1_16_ANDROID_INTERNAL_BETA.md",
];

function gitValue(args) {
  try {
    return execFileSync("git", args, { cwd: repositoryRoot, encoding: "utf8" }).trim();
  } catch {
    return "unavailable";
  }
}

await mkdir(join(destination, "assets"), { recursive: true });
const files = [];
for (const relativePath of evidenceFiles) {
  const source = join(repositoryRoot, relativePath);
  const content = await readFile(source);
  const sha256 = createHash("sha256").update(content).digest("hex");
  const copiedName = `${relativePath.replaceAll("/", "__").replaceAll("\\", "__")}`;
  await copyFile(source, join(destination, "assets", copiedName));
  files.push({ path: relativePath, copiedAs: `assets/${copiedName}`, bytes: content.byteLength, sha256 });
}

const manifest = {
  product: "Kikroo",
  version: packageJson.version,
  generatedAt: new Date().toISOString(),
  gitCommit: gitValue(["rev-parse", "HEAD"]),
  gitBranch: gitValue(["branch", "--show-current"]),
  workingTreeStatus: gitValue(["status", "--short"]),
  purpose: "Protected-beta release evidence; contains no credentials, signing keys, OAuth secrets, contact data, or calendar data.",
  files,
};

await writeFile(join(destination, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
await writeFile(join(destination, "README.txt"), [
  `Kikroo ${packageJson.version} release evidence`,
  "",
  "Keep this folder in protected, backed-up storage outside the public repository.",
  "Add separately: approved editable logo master, original design panel, human-selection notes, redacted release screenshots, trademark search exports, contributor assignments, and signing-recovery evidence.",
  "Never add passwords, private keys, OAuth secrets, recovery codes, personal identity documents, tester contact lists, or calendar content.",
  "",
  `Manifest: ${basename(join(destination, "manifest.json"))}`,
].join("\n"), "utf8");

console.log(`Release evidence created at ${destination}`);
