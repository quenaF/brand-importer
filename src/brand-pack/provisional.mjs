function top(items, count) {
  return [...(items ?? [])].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, count);
}

function ref(item, role) {
  return {
    candidateId: item.id,
    score: item.score,
    recommendedRole: role,
    evidenceIds: item.evidenceIds,
    requiresOwnerReview: true,
    ...(item.safeguards?.length ? { restrictions: item.safeguards } : {})
  };
}

function inferred(value, evidenceIds, rationale) {
  return { value, status: 'inferred', evidenceIds, requiresOwnerReview: true, rationale };
}

function evidenceFrom(items) {
  return [...new Set(items.flatMap((item) => item.evidenceIds ?? []))];
}

export function generateProvisionalBrandPack({ request, observations, normalized }) {
  if (!request?.requestId || normalized?.requestId !== request.requestId) {
    throw new Error('Matching canonical request and normalized candidates are required.');
  }
  const website = request.sources?.find((source) => source.type === 'website')?.location;
  if (!website) throw new Error('A website source is required.');

  const colors = top(normalized.colors, 8);
  const fonts = top((normalized.typography ?? []).filter((item) => !item.excludedFromBrandTypography), 3);
  const logos = top(normalized.assets, 3);
  const imagery = top(normalized.imagery, 12);
  const pageEvidence = ['ev.page.title', 'ev.page.description'].filter((id) => id === 'ev.page.title' || observations?.page?.description);
  const languageEvidence = pageEvidence.length ? pageEvidence : evidenceFrom(logos).slice(0, 1);
  const imageryEvidence = evidenceFrom(imagery);

  return {
    schemaVersion: '0.1.0',
    requestId: request.requestId,
    status: 'provisional',
    generatedAt: new Date().toISOString(),
    brand: {
      name: observations?.page?.title || 'Unknown brand',
      website,
      ...(observations?.page?.description ? {
        description: inferred(
          observations.page.description,
          ['ev.page.description'],
          'Copied from observed website metadata; owner must confirm it represents the organization in this product context.'
        )
      } : {})
    },
    identity: {
      colorCandidates: colors.map((item, index) => ref(item, index === 0 ? 'leading-palette-candidate' : item.candidateRoles?.[0] ?? 'unresolved')),
      typographyCandidates: fonts.map((item, index) => ref(item, index === 0 ? 'leading-typography-candidate' : item.candidateRoles?.[0] ?? 'unresolved')),
      imageryGuidance: inferred(
        'Favor authentic, context-relevant coastal, surf, community, program, and product imagery. Use each image only in a role the owner approves; do not reuse identifiable-person imagery until rights and consent are confirmed.',
        imageryEvidence.length ? imageryEvidence : ['ev.page.title'],
        'Synthesized from ranked site imagery and its safeguards; this is guidance, not a claim of approved reuse.'
      )
    },
    assets: {
      logoCandidates: logos.map((item, index) => ref(item, index === 0 ? 'default-logo-candidate' : 'alternate-logo-candidate')),
      imageryCandidates: imagery.map((item) => ref(item, item.candidateRoles?.[0] ?? 'supporting-imagery-candidate'))
    },
    voice: {
      qualities: [
        inferred('direct', languageEvidence, 'The storefront uses concise navigation and action language; owner confirmation is required before extending that tone to operational experiences.'),
        inferred('active', languageEvidence, 'Observed surf and product context suggests movement and participation, but the intended youth-program tone remains unresolved.'),
        inferred('community-aware', imageryEvidence.length ? imageryEvidence : languageEvidence, 'People and lifestyle imagery suggest community context; this requires owner validation and must not overstate the evidence.')
      ],
      principles: [
        inferred('Use clear, specific actions instead of vague promotional language in consequential flows.', languageEvidence, 'White-label product actions require operational clarity even when storefront language is promotional.'),
        inferred('Preserve surf culture without sacrificing parent trust, accessibility, or safety clarity.', imageryEvidence.length ? imageryEvidence : languageEvidence, 'This balances the observed brand context with the consuming youth experience platform.')
      ],
      ctaPattern: inferred('Prefer concise participation-oriented actions, then make safety and responsibility actions explicit.', languageEvidence, 'Derived from observed action language and the product context; owner review must determine final wording.')
    },
    experience: {
      brandPromise: inferred('Help people feel connected to surf culture, confident in participation, and clearly supported through the experience.', [...new Set([...languageEvidence, ...imageryEvidence])], 'Synthesized from observed storefront signals and the youth experience use case; not an official brand promise.'),
      desiredOutcomes: [
        inferred('Participants feel welcomed into the experience rather than intimidated by it.', imageryEvidence.length ? imageryEvidence : languageEvidence, 'Inferred from community and lifestyle signals.'),
        inferred('Parents feel the organization is both culturally authentic and operationally trustworthy.', [...new Set([...languageEvidence, ...imageryEvidence])], 'This outcome belongs to the consuming product context and requires owner confirmation.'),
        inferred('Staff can represent the brand consistently without guessing which visual or language signals matter.', evidenceFrom([...colors, ...fonts, ...logos]), 'Derived from the need for a portable, evidence-backed Brand Pack.')
      ],
      trustPrinciples: [
        inferred('Never present inferred brand roles or image rights as approved.', evidenceFrom([...colors, ...fonts, ...logos, ...imagery]), 'Core evidence and owner-authority safeguard.'),
        inferred('Do not reuse identifiable-person imagery until rights and consent are confirmed.', imageryEvidence.length ? imageryEvidence : ['ev.page.title'], 'Required by imagery safeguards and owner review boundary.'),
        inferred('Keep storefront branding distinct from youth-program safety and operational truth.', languageEvidence, 'The consuming platform must preserve trust even when the source website prioritizes retail or lifestyle messaging.')
      ]
    },
    unknowns: normalized.unknowns ?? [],
    ownerReview: {
      status: 'not-started',
      sessionFile: 'owner-review-session.json'
    }
  };
}
