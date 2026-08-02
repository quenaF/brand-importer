function uniq(items) {
  return [...new Set(items.filter(Boolean))];
}

function top(items, count = 3) {
  return [...(items ?? [])].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, count);
}

function evidenceIds(items) {
  return uniq(items.flatMap((item) => item.evidenceIds ?? []));
}

export function generateOwnerReviewSession({ request, normalized }) {
  if (!request?.requestId || normalized?.requestId !== request.requestId) {
    throw new Error('Matching canonical request and normalized candidates are required.');
  }

  const questions = [];
  const colors = top(normalized.colors, 6);
  const fonts = top((normalized.typography ?? []).filter((item) => !item.excludedFromBrandTypography), 3);
  const logos = top(normalized.assets, 3);
  const imagery = top(normalized.imagery, 8);

  questions.push({
    id: 'review.color.roles',
    category: 'color',
    prompt: 'Which colors should define primary actions, accents, surfaces, and text?',
    impact: 'material',
    candidateIds: colors.map((item) => item.id),
    evidenceIds: evidenceIds(colors),
    allowedActions: ['confirm', 'correct', 'deprioritize', 'mark-unknown', 'add-context'],
    whyItMatters: 'Color roles determine hierarchy, accessibility testing, and how the white-label product communicates action and trust.',
    suggestedAnswer: colors.map((item) => ({ id: item.id, value: item.value, suggestedRoles: item.candidateRoles, score: item.score })),
    notes: ['Scores rank evidence strength only; they are not owner approval.']
  });

  questions.push({
    id: 'review.typography.roles',
    category: 'typography',
    prompt: 'Which font families are approved for headings, body copy, navigation, and labels?',
    impact: 'material',
    candidateIds: fonts.map((item) => item.id),
    evidenceIds: evidenceIds(fonts),
    allowedActions: ['confirm', 'correct', 'replace', 'deprioritize', 'mark-unknown'],
    whyItMatters: 'Typography affects recognition, readability, performance, and licensing requirements.',
    suggestedAnswer: fonts.map((item) => ({ id: item.id, family: item.family, suggestedRoles: item.candidateRoles, score: item.score })),
    notes: normalized.unknowns?.filter((item) => item.id === 'unknown.font-variables').map((item) => item.question) ?? []
  });

  questions.push({
    id: 'review.logo.default',
    category: 'logo',
    prompt: 'Which logo is the default application logo, and when should alternates be used?',
    impact: 'material',
    candidateIds: logos.map((item) => item.id),
    evidenceIds: evidenceIds(logos),
    allowedActions: ['confirm', 'correct', 'replace', 'deprioritize', 'mark-unknown'],
    whyItMatters: 'A default and approved alternates prevent inconsistent or misleading brand representation.',
    suggestedAnswer: logos.map((item) => ({ id: item.id, location: item.location, suggestedRoles: item.candidateRoles, score: item.score }))
  });

  questions.push({
    id: 'review.imagery.rights',
    category: 'rights',
    prompt: 'Which site images may be reused in the white-label product?',
    impact: 'blocking',
    candidateIds: imagery.map((item) => item.id),
    evidenceIds: evidenceIds(imagery),
    allowedActions: ['confirm', 'correct', 'replace', 'deprioritize', 'mark-unknown', 'add-context'],
    whyItMatters: 'Public visibility does not prove reuse rights, consent, or suitability for a new product context.',
    suggestedAnswer: imagery.map((item) => ({ id: item.id, location: item.location, proposedRoles: item.candidateRoles, rightsStatus: item.rightsStatus })),
    notes: ['Confirm people and minor consent before approving identifiable-person imagery.']
  });

  questions.push({
    id: 'review.imagery.roles',
    category: 'imagery',
    prompt: 'Which approved images best represent programs, atmosphere, products, and supporting content?',
    impact: 'material',
    candidateIds: imagery.map((item) => item.id),
    evidenceIds: evidenceIds(imagery),
    allowedActions: ['confirm', 'correct', 'deprioritize', 'mark-unknown', 'add-context'],
    whyItMatters: 'Strategic placement should reinforce the organization rather than decorate unrelated screens.',
    suggestedAnswer: imagery.map((item) => ({ id: item.id, proposedRoles: item.candidateRoles, orientation: item.orientation, score: item.score }))
  });

  questions.push({
    id: 'review.experience.intent',
    category: 'experience',
    prompt: 'Should the product primarily express surf performance, coastal lifestyle, youth learning, community, or a deliberate blend?',
    impact: 'material',
    candidateIds: [],
    evidenceIds: uniq([
      ...(normalized.imagery ?? []).slice(0, 12).flatMap((item) => item.evidenceIds ?? []),
      ...(normalized.assets ?? []).flatMap((item) => item.evidenceIds ?? [])
    ]),
    allowedActions: ['confirm', 'correct', 'mark-unknown', 'add-context'],
    whyItMatters: 'The intended experience controls which observed storefront signals should carry into a youth experience platform.',
    suggestedAnswer: ['surf performance', 'coastal lifestyle', 'youth learning', 'community', 'deliberate blend']
  });

  for (const unknown of normalized.unknowns ?? []) {
    questions.push({
      id: `review.${unknown.id}`,
      category: 'unknown',
      prompt: unknown.question,
      impact: unknown.impact,
      candidateIds: [],
      evidenceIds: [],
      allowedActions: ['correct', 'replace', 'mark-unknown', 'add-context'],
      whyItMatters: unknown.recommendedAction ?? 'Resolving this uncertainty improves the reliability of the generated Brand Pack.',
      notes: unknown.references ?? []
    });
  }

  return {
    schemaVersion: '0.1.0',
    requestId: request.requestId,
    status: 'not-started',
    generatedAt: new Date().toISOString(),
    questions
  };
}
