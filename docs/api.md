# Headless API

## `runBrandImport(request, options)`

Runs the full evidence-to-runtime pipeline and returns an ephemeral session.

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

### Request

The request must satisfy `schemas/import-request.schema.json`, contain `requestId`, at least one authorized source URL, and an authorization statement.

### Options

- `onProgress(event)`: receives versioned truthful progress events.
- `experienceProfile`: optional developer-confirmed Experience Profile. When omitted or proposed, the importer preserves the imagery catalog but does not create a domain-specific shortlist.
- `ownerDecisions`: optional current-session owner decisions used by the runtime compiler.
- `sessionId`: optional caller-supplied identifier.

### Result session

- `sessionId`
- `status`
- `result`: intermediate and final artifacts while the session is active
- `exportRuntimeBrand()`
- `exportBundle()`
- `dispose()`

Access after disposal throws. The importer does not persist organization-specific state.

## `withBrandImportSession(request, callback, options)`

Guarantees disposal using `finally` semantics.

```js
import { withBrandImportSession } from 'brand-importer';

const runtimeBrand = await withBrandImportSession(
  request,
  async (session) => session.exportRuntimeBrand(),
  { onProgress }
);
```

## Progress events

Events follow `schemas/import-progress-event.schema.json` and include stages for connection, page discovery, identity extraction, imagery cataloging, profile-aware review planning, experience signals, owner review, runtime compilation, and completion.

A UI may animate these events but must not mark a stage complete before the corresponding event is emitted.

## Output bundle

The active result contains:

- source inventory
- observations
- evidence
- normalized candidates
- complete imagery catalog
- optional imagery review plan
- experience signals
- owner review questions
- provisional Brand Pack
- runtime brand
- import report
- progress events
- session manifest

Only `runtime-brand.json` is required by a consuming application. Other artifacts support review, audit, debugging, and developer trust.

## Errors

Errors are thrown to the caller and accompanied by a failed `import.complete` progress event. Host systems should display the failure truthfully and must not substitute another organization's artifact.
