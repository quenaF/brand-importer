---
name: import-brand
description: Convert a company website or supplied brand materials into a portable, evidence-backed Brand Pack for white-label product development. Use when a developer, designer, product team, or AI coding agent needs to analyze an existing brand; extract logos, colors, typography, imagery, voice, vocabulary, interface patterns, or emotional intent; create design tokens or theme files; adapt a product to a client’s brand; compare a white-label implementation against its source brand; or identify missing brand decisions. Do not use to imitate a brand deceptively, remove required attribution, fabricate authorization, or claim inferred brand rules as owner-approved facts.
---

# Import Brand

Turn public or supplied brand evidence into a portable Brand Pack that developers and AI agents can use to create coherent white-label products.

Use this governing idea:

> Preserve recognizable identity without pretending that observation equals authorization or that inference equals truth.

## Protect the boundary

- Treat Brand Importer as an evidence-backed brand translation skill, not proof of trademark permission, partnership, endorsement, or authorization.
- Do not claim that a generated implementation is official, approved, certified, or powered by the source company unless the user provides evidence of that relationship.
- Do not bypass access controls, scrape private systems, reproduce restricted assets, or remove legally required attribution.
- Do not create deceptive clones intended to impersonate an organization, capture credentials, mislead customers, or conceal who operates the resulting product.
- Preserve source URLs, asset origins, extraction timestamps, and relevant usage notes when available.
- Do not silently replace missing brand decisions with generic defaults. Label defaults and inferences at the point of use.
- Keep the canonical Brand Pack framework-neutral. Framework exports are adapters, not the source of truth.

## Work from evidence

Use the most specific applicable status:

- **Observed—live:** directly witnessed on the public website or supplied running experience.
- **Observed—source:** directly supported by supplied brand guidelines, source code, stylesheets, token files, or assets.
- **Derived:** mechanically calculated from observed evidence.
- **Inferred:** a plausible interpretation that needs validation.
- **Owner confirmed:** explicitly accepted by an authorized brand representative.
- **Owner corrected:** explicitly changed by an authorized brand representative.
- **Unknown:** missing or conflicting information that could materially change the output.

Never represent frequency as importance without evidence. A color that appears most often may be a background neutral, not the primary brand color. A phrase appearing once in a hero may be more strategically important than repeated utility copy.

When evidence conflicts, preserve the conflict and explain which source was prioritized. Prefer explicit brand guidelines over incidental implementation details, unless the user asks for the current live implementation as the source of truth.

## Select the operating mode

### Import Mode

Use when creating a Brand Pack from a website or supplied materials.

1. Establish the source scope and authorization context.
2. Inventory the available evidence and identify inaccessible or missing sources.
3. Capture source identity, timestamps, page locations, asset paths, and relevant snippets without over-collecting content.
4. Extract and classify visual identity, language, interaction patterns, and experience signals.
5. Separate direct observations, mechanical derivations, interpretations, and unknowns.
6. Produce the canonical Brand Pack.
7. Generate only the framework adapters requested or clearly useful in the current environment.
8. Present consequential ambiguities for owner review.

### Review Mode

Use when checking an existing white-label product against a source brand or Brand Pack.

1. Establish which artifact is authoritative: public site, supplied guide, owner-confirmed Brand Pack, or another source.
2. Compare visual tokens, assets, language, interaction patterns, and emotional intent.
3. Classify findings by consequence:
   - **Blocker:** deceptive representation, inaccessible critical contrast, broken identity, or material trust risk.
   - **Major:** prominent mismatch likely to make the product feel unaffiliated or off-brand.
   - **Moderate:** recurring inconsistency or unsupported interpretation.
   - **Polish:** refinement that improves coherence without changing recognition or trust.
4. Recommend implementation-ready corrections and acceptance criteria.

### Update Mode

Use when a Brand Pack already exists and the source brand or owner decisions have changed.

1. Preserve the previous version and provenance.
2. identify changed evidence rather than rebuilding blindly.
3. distinguish source changes from importer improvements.
4. apply owner corrections as explicit overrides.
5. increment the Brand Pack version and provide a migration summary.

## Build the Brand Pack

The canonical Brand Pack should include only supported fields and clearly labeled unknowns.

### Identity

Capture:

- canonical and alternate brand names;
- organization or product relationship when known;
- tagline and positioning statements;
- logo variants and usage evidence;
- favicon, app icon, and social marks when available;
- source URLs and timestamps.

### Visual system

Capture:

- semantic color roles rather than only raw color frequency;
- typography families, weights, hierarchy, and fallbacks;
- spacing, radius, border, shadow, and elevation patterns;
- iconography and illustration characteristics;
- photography subjects, composition, treatment, and exclusions;
- motion patterns when directly observable;
- accessibility measurements that can be mechanically verified.

Do not infer a complete design system from a small marketing page. Record limited evidence honestly.

### Voice and language

Capture:

- voice qualities supported by examples;
- recurring vocabulary and phrases;
- calls-to-action patterns;
- sentence length, formality, perspective, and rhythm;
- terms to avoid when supported by evidence or owner direction;
- language that carries the brand promise;
- context-specific variation between marketing, utility, error, and support copy.

Do not reduce voice to unsupported adjectives such as “friendly” or “modern.” Pair every meaningful interpretation with evidence and usable guidance.

### Experience intent

Using the Build with LumynQ discipline, identify only provisional experience signals such as:

- what the brand appears to help people understand, trust, do, or become able to do;
- desired emotional conditions the experience may support;
- trust-building behaviors;
- agency, correction, waiting, failure, and recovery expectations;
- interaction qualities that should remain consistent across white-label products.

Treat emotional intent as a hypothesis unless explicitly confirmed. Do not diagnose users, prescribe feelings, or claim proprietary LumynQ analysis.

### Implementation

The Brand Pack may generate:

- `brand-profile.json`;
- `design-tokens.json`;
- `asset-manifest.json`;
- `evidence.json`;
- `voice-and-language.md`;
- `BRAND.md`;
- `theme.css`;
- framework-specific adapters such as a Tailwind preset.

Generated code must distinguish canonical values from fallbacks and inferred defaults. Include comments or metadata where a developer may otherwise mistake a provisional choice for an approved rule.

## Owner verification

Request human review only for decisions that materially affect identity, trust, accessibility, or implementation.

For each review item, provide:

- the proposed decision;
- evidence status;
- source references;
- why the decision matters;
- available actions: confirm, correct, mark unknown, defer, or remove.

Owner corrections outrank inferred and observed implementation patterns, but do not erase the historical evidence. Preserve both the original observation and the confirmed override.

## Produce implementation-grade output

For a substantial import, include:

- source scope and limitations;
- brand summary;
- canonical Brand Pack files or file plan;
- evidence and uncertainty summary;
- owner-review items;
- requested framework adapters;
- accessibility concerns;
- acceptance criteria.

For a small request, scale down. Do not force the full Brand Pack onto a single logo, color, or copy question.

## Quality check

Before finalizing, verify that:

- every consequential conclusion has a status and source;
- no inference is presented as owner-approved truth;
- raw colors have been assigned semantic roles intentionally;
- generated text reflects observed voice patterns without copying substantial source content;
- framework adapters derive from the canonical Brand Pack;
- inaccessible combinations are flagged rather than normalized;
- the output does not imply authorization, endorsement, or official status;
- the resulting product can remain recognizably branded while being honest about who operates it;
- unknowns and conflicts remain visible and correctable.
