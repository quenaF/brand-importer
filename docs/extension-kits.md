# Extension Kits

Brand Importer publishes two official extension contracts so host agents can apply identity to many software domains without changing importer core.

## Experience Profile Kit

Files:

- `schemas/experience-profile.schema.json`
- `templates/experience-profile.template.json`
- `docs/host-agent-integration.md`

The Experience Profile describes the software being built, not the imported organization. It defines the domain, audiences, preview targets, core workflows, sensitive contexts, permitted brand influence, protected domain truth, imagery priorities, and safety rules.

A host agent may infer a `proposed` profile from project evidence, but domain, primary audience, preview target, brand boundaries, and imagery intent require developer confirmation before profile-aware selection occurs.

The brand website must never be the sole source for deciding the application domain.

## Domain Adapter Kit

Files:

- `schemas/domain-adapter-manifest.schema.json`
- `templates/domain-adapter-manifest.template.json`
- `docs/host-agent-integration.md`

The adapter maps runtime-brand capabilities into the host application's tokens and components. It must validate compatibility, preserve protected semantics, use only approved imagery, support apply and revert, and declare unsupported capabilities.

`fallbackPolicy.exampleTenantFallback` is always `forbidden`.

## Compatibility

Adapters declare accepted semantic versions for runtime brand and Experience Profile contracts. For v0.1:

```json
{
  "runtimeBrand": "^1.0.0",
  "experienceProfile": "^1.0.0"
}
```

A host must reject incompatible major versions. Missing optional capabilities may fall back according to the adapter manifest; missing or invalid identity must never activate a previous organization.

## Generation sequence for host agents

1. Import and validate the runtime brand.
2. Find or propose an Experience Profile.
3. Obtain developer confirmation.
4. Find or generate a compatible Domain Adapter.
5. Run leakage and compatibility tests.
6. Apply a reversible preview.
7. Keep product behavior and protected domain truth unchanged.

## Required leakage test

Apply Brand A and Brand B through the same profile and adapter. Workflow structure must remain constant while organization identity changes. No text, logo, image, token, or sample content from Brand A may appear under Brand B.
