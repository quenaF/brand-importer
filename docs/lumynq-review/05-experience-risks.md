# Experience Risks

## Blockers

### Unauthorized reproduction
The importer is used to clone or impersonate a brand without permission.

**Safeguard:** require an authorization declaration, preserve source provenance, refuse deceptive or credential-capture use cases, and never present authorization as verified unless it actually is.

### Inference presented as fact
The importer assigns meaning, tone, or emotional promise and presents it as owner-approved.

**Safeguard:** use explicit evidence labels and require owner confirmation for consequential interpretations.

### Silent loss of owner corrections
A re-import overwrites confirmed or corrected decisions.

**Safeguard:** corrections outrank automated findings; replacement requires an explicit conflict review.

## Major risks

### Visual resemblance mistaken for fidelity
A polished theme appears correct even though its hierarchy, language, or experience behavior contradicts the brand.

### Noisy extraction
Incidental colors, unused fonts, browser defaults, campaign assets, or outdated pages are promoted into canonical tokens.

### Inaccessible reproduction
The importer faithfully copies low-contrast or otherwise inaccessible combinations without warning or safer alternatives.

### Unreviewable output
The owner receives dozens of technical values instead of a small set of meaningful decisions.

### Framework drift
CSS and Tailwind exporters independently reinterpret the source and produce inconsistent products.

## Moderate risks

- vague voice labels such as “friendly” without operational guidance;
- confidence scores obscuring weak evidence;
- blocked or skipped sources disappearing from the report;
- asset licensing and usage restrictions being ignored;
- technical failures forcing the user to restart;
- a provisional pack being mistaken for approved production branding.

## Required recovery behavior

- preserve completed work after recoverable failure;
- identify exactly what failed and what remains valid;
- offer a manual source or owner-input path;
- allow the user to continue with an explicitly provisional pack when safe;
- block production-ready status when authorization or material identity decisions remain unresolved.

## Evidence status

These risks are **Inferred** from the intended workflow and LumynQ review. They require validation during implementation, dogfooding, and external use.