# Brand Importer v0.1 Specification

## Product definition

Brand Importer is a reusable Agent Skill that converts a company’s public website and supplied brand materials into a portable, evidence-backed Brand Pack for white-label product development.

Its purpose is to reduce the time, ambiguity, and inconsistency involved in adapting one product to many client brands while preserving truth, provenance, accessibility, and human review.

## v0.1 success condition

A developer can provide a public brand URL and receive a structured Brand Pack that is useful enough to theme a representative product shell without manually rediscovering the brand’s core visual and verbal identity.

The result must make clear:

1. what was directly observed;
2. what was mechanically derived;
3. what was inferred;
4. what remains unknown;
5. which decisions need owner confirmation.

## Primary user

A developer or AI coding agent building a legitimate white-label product for a client, partner, internal business unit, or multi-tenant platform.

## Secondary users

- product designers;
- design-system maintainers;
- implementation partners;
- brand owners reviewing imported decisions;
- platform teams maintaining multiple tenant themes.

## Core jobs

### Import

Turn a URL and optional source materials into a canonical Brand Pack.

### Apply

Use the Brand Pack to theme or generate a white-label application.

### Review

Compare an implementation against the source brand or confirmed Brand Pack.

### Update

Refresh an existing Brand Pack when the source identity changes.

## Supported inputs for v0.1

### Required

At least one of:

- public website URL;
- supplied brand guide;
- supplied stylesheet or token file;
- supplied logo and supporting brand assets.

### Optional

- business or product name;
- authorization context;
- preferred source-of-truth order;
- target framework;
- existing product repository;
- owner corrections;
- accessibility requirements;
- dark-mode requirement;
- asset usage constraints.

## Canonical outputs

### `brand-profile.json`

Defines brand identity, promise, positioning, voice, experience intent, and metadata.

### `design-tokens.json`

Defines semantic visual tokens in a framework-neutral structure.

### `asset-manifest.json`

Defines discovered or supplied assets, variants, source locations, formats, and usage evidence.

### `evidence.json`

Defines provenance and status for consequential decisions.

### `voice-and-language.md`

Provides implementation-ready writing guidance supported by observed examples and clearly labeled interpretations.

### `BRAND.md`

Provides a human-readable summary of the imported brand, limitations, unknowns, and owner-review items.

### Optional adapters

- `theme.css`;
- `tailwind.preset.ts`;
- framework-specific theme files requested by the user.

## Evidence statuses

The v0.1 status vocabulary is fixed:

```text
observed_live
observed_source
derived
inferred
owner_confirmed
owner_corrected
unknown
```

Every consequential value must either contain evidence metadata directly or reference an evidence record by ID.

## Source precedence

Default precedence:

1. explicit owner correction;
2. explicit owner confirmation;
3. supplied official brand guide;
4. supplied canonical token or source file;
5. current public production website;
6. derived values;
7. inferred interpretation;
8. generic fallback.

The importer must preserve conflicts rather than silently discard lower-priority evidence.

## Minimum v0.1 extraction coverage

### Identity

- brand name;
- tagline or hero positioning statement when available;
- logo candidates;
- favicon or app mark when available;
- source URL and extraction timestamp.

### Color

- raw observed colors;
- semantic role candidates;
- primary and secondary candidates;
- surface, text, border, action, feedback, and focus roles when supported;
- contrast checks for key foreground/background pairs.

### Typography

- observed font families;
- fallback families;
- heading and body role candidates;
- observed weights and hierarchy;
- source evidence.

### Shape and surface

- radius patterns;
- border patterns;
- shadow or elevation patterns;
- spacing tendencies where enough evidence exists.

### Voice

- evidence-backed voice qualities;
- recurring vocabulary;
- CTA patterns;
- sentence and perspective patterns;
- provisional avoid-list when supported.

### Experience intent

- provisional brand promise;
- user outcome the brand appears to support;
- trust-building behaviors;
- interaction qualities worth preserving;
- uncertainty and owner-review notes.

## Required safeguards

Brand Importer must not:

- claim trademark or asset-use permission;
- imply endorsement or official status;
- assist deceptive impersonation or credential capture;
- bypass private access controls;
- reproduce substantial copyrighted copy unnecessarily;
- present inferred emotional intent as fact;
- hide inaccessible color combinations;
- treat a generic fallback as an observed brand rule;
- claim a LumynQ runtime integration unless one exists.

## Owner-review model

The v0.1 owner review should prioritize a small number of consequential decisions, not ask the owner to approve every token.

Review candidates include:

- canonical logo selection;
- primary brand color role;
- typography substitution;
- brand promise;
- voice interpretation;
- dark-mode behavior;
- asset exclusions;
- accessibility changes that intentionally differ from the source implementation.

Each review item must include:

- proposed value;
- evidence status;
- source references;
- reason review is needed;
- actions: confirm, correct, unknown, defer, remove.

## Framework boundary

The canonical Brand Pack must remain independent from React, Vue, Tailwind, Flutter, SwiftUI, or any other framework.

Adapters must be deterministic transformations of canonical data wherever practical. Framework-specific decisions that cannot be derived must be labeled as adapter policy.

## Acceptance criteria for the first complete example

A first complete example passes when:

1. a public website is used as the primary source;
2. the output includes all canonical files;
3. each consequential conclusion links to evidence;
4. at least one ambiguity remains visibly unresolved or is owner-reviewed;
5. generated CSS variables can theme a small representative interface;
6. color contrast is measured for key interface pairs;
7. voice guidance contains concrete do/don’t examples without copying substantial source text;
8. no output claims authorization or owner approval without evidence;
9. the Brand Pack can be consumed without installing LumynQ;
10. the workflow demonstrates LumynQ’s evidence, agency, and correction principles.

## Deferred beyond v0.1

- autonomous crawling of very large sites;
- private authenticated design systems;
- Figma API import;
- Storybook ingestion;
- screenshot-based visual regression;
- automatic trademark clearance;
- automatic licensing determination;
- full multi-language voice modeling;
- continuous brand-change monitoring;
- production LumynQ Core runtime integration.
