# Running the Brand Importer

The current v0.1 runtime performs **observed extraction only**. It inventories the authorized source and records raw evidence. It does not yet assign brand roles, infer emotional meaning, generate a Brand Pack, or apply the brand to an application.

## 1. Install

```bash
npm install
```

## 2. Prepare an import request

Create a JSON document that validates against `schemas/import-request.schema.json`.

At minimum, provide:

- a unique `requestId`;
- the authorized `sourceUrl`;
- an authorization status;
- requested outputs and owner context required by the schema.

Do not claim owner authorization unless it has actually been granted.

## 3. Run observed extraction

```bash
npm run import -- path/to/import-request.json path/to/output-directory
```

The output directory receives:

```text
import-request.json
source-inventory.json
observations.json
evidence.json
```

## What is observed

The first runtime currently inspects:

- homepage title and description metadata;
- theme color metadata;
- linked stylesheets;
- icon references;
- likely logo and wordmark image candidates;
- raw hexadecimal and RGB color occurrences;
- CSS custom properties;
- declared font families;
- headings;
- navigation labels;
- link, button, and submit-control language.

## What is deliberately not decided

The inspector does not decide:

- which color is primary;
- which logo is official;
- which font is the brand font;
- what the brand promise is;
- how the brand should make people feel;
- whether any observation is approved for production use.

Those decisions belong to normalization, LumynQ-guided interpretation, owner review, and Brand Pack generation.

## Validate fixtures and completed bundles

```bash
npm run validate
npm test
```

A completed import bundle must satisfy the schemas and cross-file validation gates before it may be described as production-ready.

## Current limitations

- Only the requested homepage and directly linked stylesheets are fetched.
- JavaScript-rendered styles and content are not executed.
- Image pixels are not sampled.
- Linked internal pages are not crawled yet.
- Font files are referenced but not downloaded or redistributed.
- `robots.txt`, crawl-delay policy, and configurable page scope will be added before multi-page crawling.
