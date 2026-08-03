# Host Agent Integration Protocol

Brand Importer understands an organization. The host project defines the experience being built.

## Required sequence

1. Run Brand Importer and validate `runtime-brand.json`.
2. Look for `experience-profile.json` in the host project.
3. If absent, inspect project documentation, routes, navigation, components, roles, token architecture, and safety language. Propose an Experience Profile and require developer confirmation before using it.
4. Look for a Domain Adapter manifest and implementation compatible with the runtime-brand and Experience Profile contract versions.
5. If absent, generate a project-local adapter. Do not modify Brand Importer core to understand the host domain.
6. Apply brand identity only through the adapter and only within the Experience Profile's `brandInfluence` boundaries.
7. Preserve `protectedDomainTruth` and adapter `protectedSemantics` exactly.
8. Generate a reversible preview before any persistent application change.
9. Never use an example organization, prior tenant, or bundled fixture as fallback identity or domain content.
10. Report unsupported capabilities, unresolved brand values, and approval blockers rather than inventing replacements.

## Separation of concerns

- `runtime-brand.json`: organization identity and evidence-backed experience guidance.
- `experience-profile.json`: developer intent, audience, workflows, imagery priorities, and safety boundaries.
- Domain Adapter: project-specific mapping into tokens, components, and preview targets.

## Experience Profile discovery

The agent may infer a proposal from repository evidence, but must label it `proposed`. It becomes `developer-confirmed` only after the developer confirms the domain, primary audience, preview target, brand influence, protected truth, and imagery intent.

The brand website must not be used as the sole source for determining the application domain. The same organization may support many product experiences.

## Adapter generation requirements

A generated adapter must:

- validate contract compatibility before applying anything;
- map into the host design system rather than patching individual components ad hoc;
- use only approved imagery;
- omit unsupported capabilities safely;
- support apply and revert;
- keep behavior, workflows, and protected semantics unchanged;
- forbid example-tenant fallback;
- include leakage tests using at least two distinct runtime-brand fixtures.

## Acceptance test

For Brand A and Brand B applied through the same Experience Profile and adapter:

- workflow structure remains the same;
- organization identity changes;
- no Brand A text, logo, imagery, or tokens appear in Brand B;
- missing values use neutral or host defaults according to the adapter manifest;
- no example tenant is activated implicitly.
