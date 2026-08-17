# Kikroo intellectual-property asset register

**Register version:** 1.0
**Inventory date:** 2026-08-17
**Product version reviewed:** Kikroo 1.15.0
**Purpose:** preserve evidence of creation, ownership decisions, third-party material, and protection actions before broader beta distribution.

This register is an operational record, not a legal opinion. Do not insert passwords, private signing keys, OAuth secrets, recovery codes, or unredacted personal documents.

## Ownership decision gate

Before any trademark or copyright filing, record:

- legal applicant/owner: **DIEGO BOLAND AUSILIO CONSULTORIA EM TECNOLOGIA DA INFORMACAO LTDA**;
- applicant country and address: **not stored in this repository**;
- contributors with creative or code authorship: **confirm before filing**;
- written assignment needed from any external contributor: **confirm**;
- first target territory: **Brazil**; tax identifier, address, signatory evidence, and corporate certificate remain outside Git and must be rechecked before filing.

The GitHub repository owner and the future legal rights holder are not automatically the same person. Evidence of authorship and any assignment should be kept in protected storage outside Git.

## Core asset inventory

| Asset | Repository evidence | Current status | Protection/evidence action |
| --- | --- | --- | --- |
| Word name `KIKROO` | `README.md`, `package.json`, Git history | Public use; registration not confirmed | Run official clearance search; decide applicant; consider a word-mark application |
| Tagline `A friendly time for everyone.` | `README.md`, `src/App.tsx` | Public use | Preserve dated copy decisions; assess whether separate trademark protection is commercially useful later |
| Primary rooster/world-clock logo | `public/icons/kikroo-logo.png` | Public visual identity | Preserve the highest-resolution source, generation history, prompts, selections, and human edits outside Git; consider a combined word-and-device application |
| App icons | `public/icons/kikroo-icon-192.png`, `kikroo-icon-512.png`, `kikroo-icon-maskable-512.png`, `kikroo-apple-touch-icon.png` | Distributed with PWA | Retain source artwork and export settings; ensure every store submission uses approved files |
| Android identity | `android/release-config.json` (`com.badie.kikroo`) | Stable technical identifier | Do not change after creating the Play application; store signing evidence privately |
| Visual system | Kikroo tokens and component rules in `src/styles.css` | Implemented | Preserve dated palette, typography, spacing, and component screenshots in a brand archive |
| Source code and architecture | `src/`, `server/`, `scripts/`, `docs/`, Git history | Copyright expression; no open-source license selected | Keep signed commits and release tags; confirm contributor ownership; do not publish secrets |
| Product copy and documentation | `README.md`, `CHANGELOG.md`, `docs/` | Copyright expression | Preserve release snapshots and authored drafts |
| Time-scoring behavior | `src/meeting.ts` and tests | Functional method embodied in code | Copyright protects code expression, not the scheduling idea itself; keep non-public know-how confidential where appropriate |
| Public beta origin | `https://atlastime-staging.onrender.com` | Operational staging address | Decide and reserve a final first-party domain; a domain is not a trademark registration |
| Calendar integrations | Google and Microsoft gateway code and configuration documentation | Optional connected feature | Keep client secrets, token-encryption keys, and provider-console evidence outside Git |
| Android signing material | External to repository by design | Not inventoried in Git | Maintain two protected backups and record custodian, alias, creation date, and recovery test privately |

## Third-party material

| Material | Location/use | License evidence | Required action |
| --- | --- | --- | --- |
| Flag Icons | `public/flags/4x3/` | `public/flags/FLAG_ICONS_LICENSE.txt` (MIT) | Retain copyright and license text in distributions containing the assets |
| Lucide icons | UI icon components | `lucide-react` package metadata (ISC) | Retain applicable notice in release attribution |
| React / React DOM | Application runtime | Package metadata (MIT) | Retain applicable notice in release attribution |
| Vite and TypeScript | Build tooling | Package metadata (MIT / Apache-2.0) | Keep dependency records for reproducible builds |

See `THIRD_PARTY_NOTICES.md` for the release-facing summary. A complete store-release review must include transitive dependencies, not only the direct packages listed here.

## Evidence archive checklist

Keep these items outside the public repository in a backed-up folder:

- [ ] original logo panel, individual logo source, and lossless exports;
- [ ] prompts/references used during logo exploration and the dated human selection record;
- [ ] editable design source or documented reconstruction instructions;
- [ ] dated screenshots of the first public Kikroo use;
- [ ] release tags, commit hashes, and changelog snapshots;
- [ ] invoices, contracts, contributor agreements, and assignments;
- [ ] domain and store-account receipts;
- [ ] trademark searches, filing receipts, classifications, and deadlines;
- [ ] signing-certificate fingerprints and recovery procedure, without storing private keys in this register.

## Quarterly review

Review this register when the logo, product name, legal owner, app identifier, domain, signing authority, material contributor, or major third-party asset changes.
