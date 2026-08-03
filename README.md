# Brand Importer

## **Observe a brand. Export an identity. Leave nothing behind.**

Brand Importer is a **session-based developer toolkit** that transforms authorized brand sources into **portable, evidence-backed runtime identity** for AI-assisted and white-label software.

```text
Connect → Observe → Propose → Review → Export → Dispose
```

Every observation remains traceable to its source. Every inference is explicitly labeled. Every exported artifact belongs to the developer—not the importer. When the session ends, Brand Importer disconnects and retains no organizational memory.

> Ephemeral intelligence. Portable ownership. Clean disconnection.

## Why Brand Importer exists

Most white-label systems begin with a logo upload, a few colors, and a theme editor. Brand Importer begins with **understanding**.

Given an authorized website or supplied brand materials, it can:

- inventory pages, stylesheets, assets, and source limitations;
- discover logos, Open Graph images, inline SVG marks, colors, typography, imagery, language, and interface signals;
- rank primary-logo, alternate, wordmark, and mark candidates;
- deduplicate responsive image variants and filter utility noise;
- classify imagery as product, program, activity, people, staff, community, environment, instructional, campaign, editorial, and related categories;
- score quality, brand representativeness, hero suitability, activity relevance, and diversity independently;
- preserve evidence and distinguish observation, derivation, inference, owner confirmation, correction, and unknowns;
- generate provisional experience signals rather than presenting interpretation as immutable truth;
- create a profile-aware imagery review plan when a developer-confirmed Experience Profile is supplied;
- compile an application-facing `runtime-brand.json` containing only accepted or safely provisional identity;
- emit truthful progress events for host UIs;
- export an import receipt and dispose the session without retaining organizational memory.

Nothing is silently published. Consequential decisions remain reviewable, correctable, and attributable.

## Install as a Replit Agent skill

Brand Importer follows the open Agent Skills specification and can be installed directly into a Replit project:

```bash
npx skills add quenaF/brand-importer --skill import-brand -a replit
```

For a non-interactive install:

```bash
npx skills add quenaF/brand-importer --skill import-brand -a replit -y
```

Replit installs the skill under:

```text
.agents/skills/import-brand/
```

The installed package is self-contained and includes the host-agent and Replit usage references. See [`skills/import-brand/references/REPLIT.md`](skills/import-brand/references/REPLIT.md) for usage, update, and removal instructions.

Installing the skill teaches Replit Agent the workflow and safety boundaries. The executable importer library remains a separate host dependency when a project needs live extraction, schemas, progress events, and runtime compilation. Replit supports persistent project skills in `/.agents/skills`, and the open `skills` CLI supports the `replit` agent target. 

## Designed for AI-native software

Brand Importer is not tied to one framework, tenant, industry, or product type.

```text
Brand Importer
      ↓
runtime-brand.json
      +
Experience Profile
      +
Domain Adapter
      ↓
Host Application
```

The importer understands the organization. The host project defines the experience being built.

Brand Importer does **not** decide whether the host product is a youth camp, marketplace, patient portal, store, or another experience. It does not own tenant data, operational workflows, a runtime registry, deployment, or long-term brand memory.

The host project may supply:

- `experience-profile.json` — the product domain, audience, workflows, preview targets, imagery intent, and protected domain truth;
- a Domain Adapter — the project-specific mapping from runtime brand into tokens, components, and a reversible preview.

These are extension contracts, not importer-core assumptions.

## Core principles

- **Evidence before inference**
- **Human review before adoption**
- **Portable artifacts over hidden state**
- **Ephemeral sessions instead of permanent memory**
- **Versioned contracts over implicit behavior**
- **Developer ownership of exported outputs**
- **No example tenant or previous brand as fallback**
- **Rights-aware imagery handling**

## Architecture

```text
Authorized brand sources
        ↓
Evidence-backed Brand Importer
        ↓
runtime-brand.json
        +
experience-profile.json
        +
Domain Adapter
        ↓
Branded product preview
```

Examples are never active defaults. A previous organization or test tenant may not be used as fallback identity or content.

## Headless API

```js
import { runBrandImport } from 'brand-importer';

const session = await runBrandImport(request, {
  experienceProfile,
  ownerDecisions,
  onProgress(event) {
    console.log(event.stage, event.state);
  }
});

const runtimeBrand = session.exportRuntimeBrand();
const auditBundle = session.exportBundle();
session.dispose();
```

Use `withBrandImportSession()` when cleanup should be guaranteed automatically.

## Session lifecycle

```text
created → running → awaiting-review → accepted → exported → disposed
                         ↘ cancelled / failed → disposed
```

Owner decisions are preserved during the active session and in the user-controlled export bundle. Brand Importer itself does not remember them after disposal. A future import begins fresh.

## Published contracts

Version 0.1 publishes `1.0.0` contracts for:

- runtime brand;
- Experience Profile;
- Domain Adapter manifest;
- owner decisions;
- imagery review plan;
- import progress events;
- import report;
- ephemeral import session.

Breaking contract changes require a new major contract version. Adapters declare accepted semantic-version ranges and must reject incompatible major versions.

## Imagery intelligence

The importer preserves the complete imagery catalog while preventing product volume from overwhelming experience-relevant content. A youth-program profile can prioritize program, instruction, staff, participants, environment, and community while deprioritizing storefront products. An ecommerce profile can reuse the same catalog and rank product imagery appropriately.

Recommendation never equals approval. Identifiable people and imagery likely to include minors require explicit review and cannot be bulk-approved. Only imagery with confirmed reuse rights enters `runtime-brand.json`.

## Evidence discipline

Every consequential conclusion uses the most specific status available:

- **Observed—live**
- **Observed—source**
- **Derived**
- **Inferred**
- **Owner confirmed**
- **Owner corrected**
- **Unknown**

Frequency is not treated as importance. Inference is not presented as owner-approved truth.

## Host-agent integration

AI coding agents and host applications should begin with [HOST_AGENT.md](HOST_AGENT.md). It defines:

- project discovery rules;
- Experience Profile creation and confirmation;
- Domain Adapter responsibilities;
- compatibility negotiation;
- review and rights boundaries;
- preview isolation tests;
- export and disposal behavior.

Agent ecosystems can install the published skill at [`skills/import-brand/SKILL.md`](skills/import-brand/SKILL.md).

## Documentation

- [Host Agent Guide](HOST_AGENT.md)
- [Replit Skill Guide](skills/import-brand/references/REPLIT.md)
- [Architecture](docs/architecture.md)
- [Philosophy](docs/philosophy.md)
- [Headless API](docs/api.md)
- [Host Agent Integration Protocol](docs/host-agent-integration.md)
- [Extension Kits](docs/extension-kits.md)
- [Examples](docs/examples.md)
- [Security and Privacy](docs/security.md)
- [Asset Rights](docs/rights.md)

## Development

```bash
npm install
npm test
npm run validate
npm run release:check
```

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request and follow the [Code of Conduct](CODE_OF_CONDUCT.md).

The project prioritizes evidence discipline, domain neutrality, session-only processing, deterministic testing, rights-aware imagery, and strict separation between examples and active runtime behavior.

## License

Licensed under the [Apache License 2.0](LICENSE). See [NOTICE](NOTICE) for attribution information.

The license permits commercial and private use, modification, and distribution subject to its terms. It does not grant rights to third-party trademarks, brand assets, or imported source content.

## LumynQ relationship

Brand Importer was designed using the public Build with LumynQ discipline for evidence, uncertainty, owner correction, trust boundaries, and human-centered integration. It remains independently usable and does not claim a proprietary LumynQ runtime integration.

## Status

**v0.1 release candidate engineering complete; ready for independent audit, standalone testing, and cross-domain validation.**
