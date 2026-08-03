# Asset Rights and Human Review

Brand Importer discovers and recommends assets; it does not grant permission to reuse them.

## Logos

A logo discovered on an authorized website may be ranked as a likely primary logo, alternate, wordmark, or mark. That ranking does not establish trademark ownership, licensing, partnership, endorsement, or permission to modify the asset.

Owner review should confirm:

- correct primary and alternate variants;
- permitted contexts and backgrounds;
- clear-space or modification restrictions when known;
- whether supplied files should replace scraped references.

## Imagery

Every discovered image begins with `rightsStatus: unknown` unless explicit owner-authorized information is supplied. Relevance, quality, or prominent placement does not imply reuse permission.

The review plan separates:

- selection status: recommended, supporting, or excluded;
- approval status: approved, rejected, held, or unreviewed;
- rights status: owner-approved, owner-authorized-source, unknown, or restricted.

Only explicitly approved imagery may enter `runtime-brand.json`.

## People and minors

People classification is probabilistic and must be presented as likely or uncertain, never as confirmed age, identity, or consent.

- identifiable people require explicit review;
- imagery likely to include minors cannot be bulk-approved;
- consent and reuse rights must be confirmed outside the importer when required;
- an approved source website does not automatically authorize use in a new application;
- rejected, held, or unreviewed imagery must be omitted from runtime output.

## Accessibility

Imported alt text is evidence, not necessarily suitable application copy. The host project must write contextual alt text based on the image's actual function in the product. Decorative imagery should be treated as decorative; meaningful imagery requires useful alternatives.

## Owner decisions

An imagery approval decision should include `rightsConfirmation`. The decision is scoped to the active session and exported bundle. The importer does not retain the approval for a future import.

## Safe fallback

When no imagery is approved, the Domain Adapter should omit imagery or use a neutral host-owned placeholder according to its manifest. It must never use another organization's image library.
