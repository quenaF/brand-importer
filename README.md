# Brand Importer

**An open developer skill for turning a company’s public brand identity into a portable, implementation-ready Brand Pack.**

Brand Importer helps developers and AI coding agents create white-label products without starting from a blank theme or loosely copying a website. It collects brand evidence, separates observation from inference, invites owner correction where needed, and produces structured outputs that can be reused across applications and frameworks.

> Do not merely copy what a brand looks like. Preserve what the brand is trying to help people recognize, trust, and experience.

## What it does

Given a company website or supplied brand materials, Brand Importer can:

- discover public logos, colors, typography, imagery, interface patterns, and recurring language;
- distinguish observed evidence, derived values, inferences, owner-confirmed decisions, corrections, and unknowns;
- identify a provisional brand promise, voice qualities, vocabulary, and emotional intent without presenting interpretation as fact;
- create a portable Brand Pack for use in white-label applications;
- generate implementation-ready CSS variables, design tokens, and framework adapters;
- preserve provenance so developers and brand owners can understand why each decision was made;
- identify missing or ambiguous brand decisions that require human review.

## Initial inputs

Version 0.1 is designed around:

- a public website URL;
- optional logos and image assets;
- optional brand guidelines;
- optional existing CSS, tokens, or Tailwind configuration;
- optional owner corrections and overrides.

## Initial outputs

```text
brand-pack/
├── brand-profile.json
├── design-tokens.json
├── voice-and-language.md
├── asset-manifest.json
├── evidence.json
├── theme.css
├── tailwind.preset.ts
└── BRAND.md
```

The exact export set may vary by environment. The canonical output is the structured Brand Pack, not any single framework adapter.

## Evidence discipline

Every consequential brand conclusion should carry the most specific applicable status:

- **Observed—live:** directly witnessed on the public website or supplied running experience.
- **Observed—source:** directly supported by an uploaded brand guide, source file, stylesheet, token file, or asset.
- **Derived:** mechanically calculated from observed evidence, such as a color conversion or contrast ratio.
- **Inferred:** a plausible interpretation that requires validation.
- **Owner confirmed:** explicitly accepted by an authorized brand representative.
- **Owner corrected:** explicitly changed by an authorized brand representative.
- **Unknown:** material information is missing or conflicting.

Brand Importer must not silently convert an inference into a brand rule.

## LumynQ relationship

Brand Importer is being designed using the public **Build with LumynQ** skill. LumynQ informs its evidence handling, owner-verification experience, uncertainty behavior, trust boundaries, and human-centered workflow.

Brand Importer remains independently usable. A real LumynQ runtime integration must not be claimed unless one is actually implemented against documented public interfaces.

## Repository structure

```text
.
├── skills/
│   └── import-brand/
│       ├── references/
│       └── SKILL.md
├── schemas/
├── examples/
├── docs/
├── LICENSE
└── README.md
```

## Status

**Pre-release / v0.1 design phase.**

The current goal is to establish the skill contract, canonical Brand Pack schema, evidence model, owner-review workflow, and a small set of complete examples before publishing the first release.
