# Acceptance Criteria

## Import and evidence

- A user can submit an authorized public website and optional owner-provided sources.
- The importer records exactly which sources were inspected, skipped, blocked, or unavailable.
- Direct observations, normalized values, interpretations, owner decisions, and unknowns are distinguishable in both human-readable and machine-readable outputs.
- Every consequential Brand Pack value references valid evidence records.

## Owner review

- A nontechnical owner can understand and review the small set of decisions that materially shape the brand.
- The owner can confirm, correct, replace, deprioritize, or mark a decision unknown.
- Corrections remain traceable to the original finding and survive re-import.
- Review status is explicit: not started, in progress, confirmed, or confirmed with corrections.

## Brand fidelity and safety

- The importer never claims that public access proves authorization.
- Emotional promise, desired outcomes, and voice intent remain hypotheses until supported by direct owner evidence.
- Material conflicts are visible and cannot be silently resolved.
- Inaccessible observed combinations are flagged and paired with disclosed adaptation guidance.
- Provisional output is never labeled production ready while blocking unknowns remain.

## Portability

- The canonical Brand Pack validates against the published schema.
- CSS variables and Tailwind exports are generated only from the canonical Brand Pack.
- Equivalent semantic tokens remain consistent across exporters.
- Export generation is deterministic for the same validated Brand Pack.

## Failure and recovery

- A blocked page, malformed stylesheet, missing asset, or exporter failure does not erase valid completed work.
- Errors identify what failed, what remains trustworthy, and the next available action.
- A user can resume or revise an import without starting over.

## Dogfood proof

The Youth Experience Platform dogfood is successful when a brand can be imported and applied without tenant-specific hard-coding, every applied decision is traceable, and an owner correction updates all supported exports through the canonical pack.

## Verdict rule

A v0.1 acceptance verdict is **NOT ADJUDICATED** when available tooling cannot exercise the consequential workflow end to end. Code or schema evidence must not be reported as live proof.