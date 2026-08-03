# Examples

## Domain-neutral import

```js
import { runBrandImport } from 'brand-importer';

const request = {
  requestId: 'example-001',
  sources: [{ type: 'website', url: 'https://example.org/' }],
  authorization: {
    basis: 'owner-authorized prototype import'
  }
};

const session = await runBrandImport(request, {
  onProgress: ({ stage, state }) => console.log(stage, state)
});

const runtimeBrand = session.exportRuntimeBrand();
session.dispose();
```

Without a developer-confirmed Experience Profile, the importer still produces the complete domain-neutral imagery catalog. It does not pretend to know which application experience is being built.

## Youth-program parent preview

The host project supplies an Experience Profile that prioritizes program representation, instruction, people, staff, environment, and community while deprioritizing storefront products. Likely-minor imagery remains review-only and cannot be bulk-approved.

The Youth Program Domain Adapter maps approved identity into a neutral parent workflow while preserving safety status, custody language, emergency alerts, and release authorization.

The same profile and adapter must accept multiple runtime brands without changing application code or inheriting another organization's language.

## Ecommerce preview

An ecommerce Experience Profile may prioritize storefront products, campaign imagery, editorial photography, and product detail views. The same imagery catalog can produce a different review plan without rerunning extraction or altering evidence.

## One brand, two experiences

```text
runtime-brand.json
    + youth-program experience-profile.json
    + youth-program adapter
    → parent preview

runtime-brand.json
    + ecommerce experience-profile.json
    + ecommerce adapter
    → store preview
```

Brand Importer core remains unchanged.

## No approved imagery

When all imagery is held or unreviewed, `runtime-brand.json` contains no reusable images. The adapter follows its declared fallback policy, typically `omit`, and the preview remains valid using colors, typography, and approved logos.

## Failed import

A blocked, invalid, or unreachable source produces a truthful failure. The host displays the error and offers correction or retry. It does not substitute a sample brand.

## Fresh re-import

A later import starts a new session with no remembered decisions. The user may adopt the new runtime output independently. Comparison against prior artifacts is outside v0.1 and may be introduced later only through explicitly supplied context.
