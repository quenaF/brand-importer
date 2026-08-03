# Host Agent Integration Protocol

Brand Importer understands an organization. The host project defines the experience being built.

## Required sequence

1. Establish authorized import scope.
2. Run `runBrandImport()` and listen to truthful progress events.
3. Validate `runtime-brand.json` against its published schema.
4. Look for `experience-profile.json` in the host project.
5. If absent, inspect project documentation, routes, navigation, components, user roles, design tokens, and safety language. Propose a profile and require developer confirmation before using it for domain-specific selection.
6. Look for a Domain Adapter manifest and implementation.
7. Validate runtime-brand, Experience Profile, and adapter contract compatibility.
8. If no compatible adapter exists, generate one inside the host project. Do not modify Brand Importer core to understand the host domain.
9. Apply identity only through the adapter and within the Experience Profile's `brandInfluence` boundaries.
10. Preserve `protectedDomainTruth` and adapter `protectedSemantics` exactly.
11. Generate a reversible preview before persistent application changes.
12. Export caller-owned artifacts and dispose the importer session.

## Separation of concerns

- `runtime-brand.json`: organization identity and evidence-backed experience guidance.
- `experience-profile.json`: developer intent, audience, workflows, imagery priorities, and safety boundaries.
- Domain Adapter: project-specific mapping into tokens, components, and preview targets.
- Host application data: operational content, workflows, sample fixtures, registry, deployment, and persistence.

The importer must not populate a product with another organization's operational data or infer the application domain solely from the brand website.

## Experience Profile discovery

The agent may infer a proposal from repository evidence, but it must remain `proposed` until the developer confirms:

- domain;
- primary audience;
- initial preview target;
- core workflows;
- brand influence boundaries;
- protected domain truth;
- imagery priorities and required coverage;
- people and minor-safety rules.

Profile-aware imagery review planning requires status `developer-confirmed`.

## Domain Adapter generation

A generated adapter must:

- validate contract compatibility before applying anything;
- map into the host design system rather than patching individual components ad hoc;
- apply approved colors, typography, logos, and imagery only;
- translate experience signals into bounded guidance rather than new product behavior;
- preserve protected semantics;
- report unsupported capabilities;
- support apply and revert;
- use neutral or host-owned fallbacks according to the manifest;
- set `exampleTenantFallback` to `forbidden`;
- include leakage tests with at least two distinct runtime-brand fixtures.

## Progress UI

The host may create a pulsing-dot or staged-check animation, but the UI must reflect emitted progress events. It must not fake completed stages or substitute fixed timers for pipeline truth.

## Session handling

Use `withBrandImportSession()` where possible. If using `runBrandImport()` directly, call `dispose()` in a `finally` block after export, cancellation, or error handling.

The importer must not retain organization-specific memory, owner decisions, cached content, or a registry record after disposal. Caller-owned exports remain under host control.

## Acceptance tests

### Cross-brand isolation

For Brand A and Brand B applied through the same Experience Profile and adapter:

- workflow structure remains the same;
- organization identity changes;
- no Brand A text, logo, image, token, or sample content appears under Brand B;
- no example tenant activates implicitly.

### Cross-profile independence

The same runtime brand may be applied through two different confirmed Experience Profiles without changing importer core.

### Failure safety

- invalid contract versions block preview;
- missing values follow the adapter's neutral fallback policy;
- unapproved imagery is omitted;
- failed imports never become another organization;
- access to disposed session results fails.
