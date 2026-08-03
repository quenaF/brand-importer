# Session Lifecycle

Brand Importer sessions are intentionally ephemeral.

## States

```text
created
  ↓
running
  ↓
awaiting-review
  ↓
accepted
  ↓
exported
  ↓
disposed
```

Alternative terminal paths:

```text
running → failed → disposed
running → cancelled → disposed
awaiting-review → cancelled → disposed
```

## State meanings

- `created`: request accepted and session identity assigned.
- `running`: source inspection and generation are active.
- `awaiting-review`: provisional outputs exist and consequential decisions remain reviewable.
- `accepted`: current-session decisions have produced an accepted runtime brand.
- `exported`: caller-controlled artifacts have been returned or written.
- `cancelled`: the caller abandoned the session.
- `failed`: the pipeline could not complete truthfully.
- `disposed`: importer-owned state is no longer accessible.

## Disposal requirements

The headless API invalidates in-memory result access after `dispose()`. Wrappers that use temporary storage must additionally remove:

- fetched HTML and CSS;
- cached image bytes and derived thumbnails;
- source inventories and evidence indexes not explicitly exported;
- progress logs not explicitly exported;
- review state and authorization context;
- temporary generated artifacts.

The importer does not maintain a persistent organization record, owner-decision database, or hidden registry.

## Export ownership

`exportRuntimeBrand()` and `exportBundle()` return caller-owned copies. The caller may commit, upload, register, or discard them. Disposal does not delete caller-controlled exports.

## Re-import

A new import after site changes is a fresh session. Previous decisions are not loaded automatically. Explicit prior-artifact comparison is reserved for a future contract version.

## Recommended integration

Use `withBrandImportSession()` where possible so cleanup runs in a `finally` block even when review or export code throws.
