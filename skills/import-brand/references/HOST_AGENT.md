# Host Agent Integration Guide

This reference travels with the installed `import-brand` skill. It defines how Replit Agent or another host agent should consume Brand Importer without importing demo-tenant assumptions.

> Observe a brand. Export an identity. Leave nothing behind.

```text
Connect → Observe → Propose → Review → Export → Dispose
```

## Operating boundary

Brand Importer answers:

> How should this organization's identity be faithfully represented in software?

It does not decide what product is being built, which workflows it needs, what operational data should populate it, or how host behavior should change.

The importer produces portable identity. The host project owns product intent and application behavior.

## Required host responsibilities

Before applying an imported brand, the host agent must:

1. establish the authorized import source and scope;
2. inspect the host project for an Experience Profile;
3. propose and confirm one when absent;
4. locate or generate a compatible Domain Adapter;
5. validate contract compatibility;
6. create a reversible preview;
7. prevent identity or content leakage from examples and previous tenants;
8. dispose importer-owned session state after export, cancellation, or failure.

Never use a bundled example, demonstration organization, or previous tenant as fallback identity or content.

## Canonical integration flow

```text
Authorized source
      ↓
runBrandImport(...)
      ↓
Evidence + normalized candidates
      ↓
Owner review and current-session decisions
      ↓
runtime-brand.json
      +
experience-profile.json
      +
Domain Adapter
      ↓
Reversible branded preview
      ↓
Host adopts exported artifacts
      ↓
Importer session is disposed
```

## Experience Profile

The Experience Profile describes the host experience, not the imported organization. It should define:

- domain and experience identifier;
- primary audience and preview target;
- core workflows;
- brand influence boundaries;
- protected domain truth;
- imagery priorities and exclusions;
- safety and consent requirements;
- confirmation status.

When no profile exists, inspect the host project's documentation, routes, roles, components, tokens, tenant configuration, and safety language. Propose a profile with status `proposed`; do not make it `developer-confirmed` until the developer explicitly confirms it. Do not infer the product domain solely from the organization's website.

## Domain Adapter

The Domain Adapter maps portable brand identity into the host application's existing design system. It must:

- declare accepted runtime-brand and Experience Profile contract ranges;
- validate compatibility before applying a brand;
- map semantic colors, typography, logos, and approved imagery intentionally;
- preserve workflows, safety semantics, regulated language, and application behavior;
- report unsupported capabilities;
- support apply and revert;
- include cross-brand isolation tests;
- forbid example-tenant fallback.

## Progress behavior

Host UIs must render only progress states emitted by Brand Importer. They may animate the active `running` event with a pulsing indicator, but must not mark a stage complete until the importer emits `completed` or `completed-with-warning`.

Supported states:

- `queued`
- `running`
- `completed`
- `completed-with-warning`
- `failed`

Do not use fake completion timers.

## Owner review and rights

Provide clear actions to confirm, correct, approve, reject, hold, deprioritize, leave unresolved, or replace a candidate.

Require explicit review for:

- primary and alternate logos;
- semantic color and typography roles;
- experience signals;
- imagery roles and reuse rights;
- identifiable people;
- imagery likely to include minors.

Recommendation does not equal approval. Relevance does not establish reuse rights. Likely-minor or identifiable-person imagery may not be bulk-approved.

## Runtime boundary

`runtime-brand.json` may contain portable brand identity and experience guidance. It must not contain host workflows, tenant operational records, previous-tenant copy, hidden registry state, or reusable imagery whose rights are unconfirmed.

The host owns its Experience Profile, Domain Adapter, operational data, and adopted runtime artifact.

## Preview rules

A preview must:

- use imported or explicitly neutral identity only;
- keep workflow structure owned by the host;
- use neutral sample data unless domain-specific sample data is intentionally supplied;
- omit unresolved imagery rather than substituting another organization's images;
- preserve protected safety, custody, emergency, compliance, and authorization semantics;
- be reversible;
- remain labeled as a preview until adopted.

## Isolation acceptance tests

Before adoption, verify:

- Brand A and Brand B can use the same Experience Profile and adapter without identity leakage;
- one runtime brand can support different Experience Profiles without importer-core changes;
- missing identity produces an explicit unknown or neutral host fallback, never another tenant's value;
- examples are unreachable as active defaults;
- operational workflows do not change when branding changes;
- rejected, held, unreviewed, or rights-unknown imagery is omitted;
- progress UI is driven by emitted events;
- apply and revert restore the expected host state;
- session access fails after disposal.

## Disposal

After export, cancellation, or failure, dispose importer-owned source content, temporary HTML/CSS and downloaded caches, evidence indexes, review state, progress history, and authorization context. Retain no global organization record, cross-session decision store, or hidden import memory.

Only artifacts explicitly exported to a user-controlled host location survive. A later import starts fresh.

## Reference API

```js
import { runBrandImport } from 'brand-importer';

const session = await runBrandImport(request, {
  experienceProfile,
  ownerDecisions,
  onProgress(event) {
    renderProgress(event);
  }
});

try {
  const runtimeBrand = session.exportRuntimeBrand();
  const auditBundle = session.exportBundle();
  await previewAdapter.apply({ runtimeBrand, experienceProfile });
} finally {
  session.dispose();
}
```

Use `withBrandImportSession()` when automatic cleanup is preferred.

The full schemas, templates, library code, and documentation live in the source repository: `quenaF/brand-importer`.