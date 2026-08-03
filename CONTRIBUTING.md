# Contributing to Brand Importer

Thank you for helping improve Brand Importer.

Brand Importer is evidence-backed, domain-neutral, and session-bound. Contributions should strengthen those guarantees rather than introduce hidden assumptions, persistent organization memory, or example-tenant fallbacks.

## Before contributing

Please read:

- `README.md`
- `docs/architecture.md`
- `docs/philosophy.md`
- `docs/host-agent-integration.md`
- `docs/security.md`
- `docs/rights.md`
- `CODE_OF_CONDUCT.md`

## Development setup

Requirements:

- Node.js 22 or newer
- npm

```bash
npm install
npm test
npm run validate
npm run validate:contracts
npm run release:check
```

All release-gate checks must pass before a contribution is merged.

## Contribution principles

### Evidence before inference

Do not present an inferred brand rule as observed or owner-confirmed. Preserve provenance and uncertainty at every consequential boundary.

### Contracts before convenience

Changes to public outputs must begin with the relevant schema and compatibility impact. Breaking changes require a new major contract version.

### Domain neutrality

Importer core must not contain youth-camp, ecommerce, healthcare, marketplace, or prior-tenant assumptions. Domain behavior belongs in an Experience Profile and Domain Adapter.

### Ephemeral sessions

The importer observes, proposes, reviews, exports, and disposes. Do not add persistent organization memory, hidden registries, or retained source material to importer core.

### No example-tenant fallback

Examples are documentation and test fixtures only. They may never populate an unknown organization or become an active runtime fallback.

### Rights-aware imagery

Recommendation is not approval. Imagery containing identifiable people or likely minors must retain explicit review safeguards. Runtime export requires confirmed reuse rights.

## Pull requests

Keep pull requests focused and explain:

- the problem being solved;
- the contract or behavior affected;
- evidence for the chosen approach;
- tests added or updated;
- compatibility implications;
- security, privacy, or rights considerations.

Include deterministic tests for bug fixes and new behavior. Avoid tests that depend on a live third-party website unless the test is explicitly isolated as an integration test.

## Commit messages

Use concise, action-oriented messages, for example:

- `Improve SVG wordmark ranking`
- `Reject incompatible adapter major versions`
- `Add profile-aware imagery isolation test`

## Generated and third-party content

Do not commit proprietary brand assets, copied site content, credentials, private source material, or imagery without clear permission. Synthetic fixtures are preferred.

## Licensing contributions

Unless explicitly stated otherwise, contributions intentionally submitted to this repository are licensed under the Apache License 2.0, consistent with the project license.
