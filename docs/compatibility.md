# Contract Compatibility

Brand Importer contracts use semantic versioning independently from the npm package version.

## Rules

- Same major version: potentially compatible; validate the complete artifact and declared capabilities.
- Different major version: incompatible; do not apply the artifact.
- New optional fields may appear in minor versions.
- New required fields or changed semantics require a major version.
- Patch versions may clarify validation or fix non-semantic defects.

## Adapter negotiation

A Domain Adapter declares accepted ranges:

```json
{
  "accepts": {
    "runtimeBrand": "^1.0.0",
    "experienceProfile": "^1.0.0"
  }
}
```

Before preview, call `validateAdapterCompatibility()` and validate all three artifacts against their schemas. An adapter may report requested but unsupported capabilities and safely omit them according to its fallback policy.

## Failure behavior

Incompatibility blocks preview. The host must not coerce values, silently downgrade, or load an example tenant. It should retain its neutral state and explain the incompatible contract versions.

## v0.1 contract set

The initial stable major version is `1.0.0` for runtime brand, Experience Profile, Domain Adapter manifest, owner decisions, progress events, imagery review plan, import report, and import-session lifecycle.
