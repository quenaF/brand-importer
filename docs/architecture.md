# Architecture

Brand Importer is a domain-neutral, ephemeral producer of portable brand identity artifacts.

## System boundary

```text
Authorized organization sources
        ↓
Inspection and evidence capture
        ↓
Normalization and candidate ranking
        ↓
Imagery catalog and experience signals
        ↓
Owner review within the active session
        ↓
Portable runtime-brand.json
        ↓
Host project Experience Profile + Domain Adapter
        ↓
Reversible product preview
```

Brand Importer does not own the consuming product's workflows, tenant data, registry, database, or deployment lifecycle.

## Core layers

### Inspection

`src/inspect.mjs` reads only authorized public sources and produces source inventory, observations, and evidence. Extraction includes HTML images, lazy-loaded images, picture sources, Open Graph and Twitter images, inline SVG logo candidates, stylesheets, colors, typography, headings, navigation, and calls to action.

### Normalization

`src/normalize/` converts raw observations into versioned candidates. Every candidate remains provisional and evidence-linked. Logo ranking considers placement, accessibility labels, vector format, wordmark/mark signals, and metadata exclusions. Imagery normalization deduplicates responsive variants, filters utility assets, classifies semantic categories, and exposes separate quality, representativeness, hero, activity, and diversity scores.

### Profile-aware review planning

The complete imagery catalog is domain-neutral. `createImageryReviewPlan` uses a developer-confirmed Experience Profile to create a balanced review shortlist. It never changes the underlying evidence catalog and never auto-approves identifiable people or likely-minor imagery.

### Review and compilation

Owner decisions exist only within the current session and exported bundle. `compileRuntimeBrand` applies approved or corrected decisions to candidates and emits the portable runtime contract. Unapproved imagery is omitted.

### Headless API

`runBrandImport(request, options)` is the canonical integration interface. The CLI and host applications should use the same pipeline. Progress events are truthful pipeline events, not animation timers.

### Host integration

The consuming project supplies:

- `experience-profile.json`: product intent, audience, workflows, imagery priorities, and protected domain truth.
- Domain Adapter manifest and implementation: mappings into the host design system and reversible preview behavior.

Examples are never defaults. A previous organization or example tenant may not be used as fallback identity or content.

## Contract versions

Version 0.1 publishes stable `1.0.0` contracts for runtime brand, Experience Profile, Domain Adapter manifest, owner decisions, progress events, import report, imagery review plan, and import-session lifecycle. Breaking schema changes require a major contract version.

## Data lifecycle

Sessions move through:

```text
created → running → awaiting-review → accepted → exported → disposed
                         ↘ cancelled / failed → disposed
```

After disposal, importer-owned in-memory state is inaccessible. Persistent storage, if desired, is explicitly owned by the host project or user-controlled export destination.
