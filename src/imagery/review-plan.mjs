function unique(items) { return [...new Set(items.filter(Boolean))]; }

function relevance(candidate, profile) {
  const prioritized = new Set(profile?.imageryIntent?.prioritize ?? []);
  const deprioritized = new Set(profile?.imageryIntent?.deprioritize ?? []);
  const required = new Set(profile?.imageryIntent?.requiredCoverage ?? []);
  let score = candidate.score ?? 0;
  for (const category of candidate.categories ?? []) {
    if (prioritized.has(category)) score += 0.22;
    if (required.has(category)) score += 0.14;
    if (deprioritized.has(category)) score -= 0.3;
  }
  if (candidate.utility) score -= 1;
  return Number(Math.max(0, Math.min(1, score)).toFixed(3));
}

function safety(candidate, profile) {
  const rules = profile?.imageryIntent?.safety ?? {};
  const reasons = [];
  let eligibleForAutoSelection = !candidate.utility;
  if (rules.excludePeopleByDefault && candidate.people?.presentLikely) {
    eligibleForAutoSelection = false;
    reasons.push('People imagery is excluded by this Experience Profile.');
  }
  if (rules.identifiablePeopleRequireApproval && candidate.people?.identifiableLikely) {
    reasons.push('Identifiable people require explicit owner approval.');
  }
  if (rules.minorsRequireExplicitApproval && candidate.people?.minorsLikely) {
    reasons.push('Likely-minor imagery requires explicit owner approval and cannot be bulk-approved.');
  }
  return { eligibleForAutoSelection, reasons };
}

export function createImageryReviewPlan({ imageryCatalog, experienceProfile }) {
  if (!experienceProfile || experienceProfile.status !== 'developer-confirmed') {
    throw new Error('A developer-confirmed Experience Profile is required.');
  }
  const max = experienceProfile.imageryIntent?.maxReviewCandidates ?? 12;
  const ranked = (imageryCatalog ?? []).map((candidate) => {
    const experienceRelevance = relevance(candidate, experienceProfile);
    const guard = safety(candidate, experienceProfile);
    return {
      ...candidate,
      experienceRelevance,
      reviewScore: Number((experienceRelevance * 0.55 + (candidate.brandRepresentativeness ?? 0) * 0.25 + (candidate.diversityValue ?? 0) * 0.2).toFixed(3)),
      selectionStatus: guard.eligibleForAutoSelection ? 'recommended' : candidate.selectionStatus,
      safetyReasons: unique([...(candidate.safeguards ?? []), ...guard.reasons]),
      bulkApprovalAllowed: !(candidate.people?.identifiableLikely || candidate.people?.minorsLikely)
    };
  }).filter((candidate) => !candidate.utility && candidate.experienceRelevance > 0);

  const selected = [];
  const categoryCounts = new Map();
  const requiredCoverage = experienceProfile.imageryIntent?.requiredCoverage ?? [];

  for (const category of requiredCoverage) {
    const candidate = ranked
      .filter((item) => item.categories?.includes(category) && !selected.some((chosen) => chosen.id === item.id))
      .sort((a, b) => b.reviewScore - a.reviewScore)[0];
    if (candidate) {
      selected.push(candidate);
      categoryCounts.set(category, 1);
    }
  }

  for (const candidate of ranked.sort((a, b) => b.reviewScore - a.reviewScore)) {
    if (selected.length >= max) break;
    if (selected.some((item) => item.id === candidate.id)) continue;
    const dominant = candidate.categories?.[0] ?? 'unknown';
    if ((categoryCounts.get(dominant) ?? 0) >= 3) continue;
    selected.push(candidate);
    categoryCounts.set(dominant, (categoryCounts.get(dominant) ?? 0) + 1);
  }

  const missingCoverage = requiredCoverage.filter((category) => !selected.some((candidate) => candidate.categories?.includes(category)));
  return {
    planVersion: '1.0.0',
    experienceProfileId: experienceProfile.id,
    generatedAt: new Date().toISOString(),
    candidates: selected,
    summary: {
      catalogCount: imageryCatalog?.length ?? 0,
      reviewCandidateCount: selected.length,
      missingCoverage,
      peopleCandidates: selected.filter((item) => item.people?.presentLikely).length,
      likelyMinorCandidates: selected.filter((item) => item.people?.minorsLikely).length,
      productCandidates: selected.filter((item) => item.categories?.includes('storefront-product')).length
    }
  };
}
