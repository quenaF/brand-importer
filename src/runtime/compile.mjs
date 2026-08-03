function decisionMap(ownerDecisions) {
  return new Map((ownerDecisions?.decisions ?? []).map((decision) => [decision.subjectId, decision]));
}

function applyStatus(candidate, decision, defaultStatus = 'provisional') {
  if (!decision) return defaultStatus;
  if (decision.action === 'reject') return 'rejected';
  if (decision.action === 'hold' || decision.action === 'leave-unresolved') return 'held';
  if (decision.action === 'correct') return 'corrected';
  if (['confirm', 'approve'].includes(decision.action)) return 'approved';
  return defaultStatus;
}

export function compileRuntimeBrand({ request, observations, normalized, experienceSignals = {}, ownerDecisions = null }) {
  const decisions = decisionMap(ownerDecisions);
  const accepted = ['confirmed', 'confirmed-with-corrections'].includes(ownerDecisions?.status);
  const organizationName = observations?.pages?.[0]?.title || observations?.page?.title || request?.organizationName || new URL(request.sources?.[0]?.url ?? request.sourceUrl).hostname;
  const sourceUrl = request.sources?.[0]?.url ?? request.sourceUrl;
  const imagery = (normalized?.imagery ?? []).map((candidate) => {
    const decision = decisions.get(candidate.id);
    const status = applyStatus(candidate, decision, 'held');
    return {
      location: decision?.correctedValue?.location ?? candidate.location,
      roles: decision?.approvedRoles ?? candidate.candidateRoles ?? [],
      status,
      rightsStatus: status === 'approved' ? 'owner-approved' : candidate.rightsStatus ?? 'unknown',
      evidenceIds: candidate.evidenceIds ?? []
    };
  }).filter((item) => item.status === 'approved');

  return {
    contractVersion: '1.0.0',
    status: accepted ? 'accepted' : 'provisional',
    organization: { name: organizationName, website: sourceUrl },
    identity: {
      colors: (normalized?.colors ?? []).map((candidate) => {
        const decision = decisions.get(candidate.id);
        return { value: decision?.correctedValue ?? candidate.value, roles: decision?.approvedRoles ?? candidate.candidateRoles ?? [], status: applyStatus(candidate, decision), evidenceIds: candidate.evidenceIds ?? [] };
      }).filter((item) => item.status !== 'rejected'),
      typography: (normalized?.typography ?? []).filter((candidate) => !candidate.excludedFromBrandTypography).map((candidate) => {
        const decision = decisions.get(candidate.id);
        return { family: decision?.correctedValue ?? candidate.family, roles: decision?.approvedRoles ?? candidate.candidateRoles ?? [], status: applyStatus(candidate, decision), evidenceIds: candidate.evidenceIds ?? [] };
      }).filter((item) => item.status !== 'rejected'),
      logos: (normalized?.assets ?? []).map((candidate) => {
        const decision = decisions.get(candidate.id);
        return { location: decision?.correctedValue?.location ?? candidate.location, roles: decision?.approvedRoles ?? candidate.candidateRoles ?? [], status: applyStatus(candidate, decision), evidenceIds: candidate.evidenceIds ?? [] };
      }).filter((item) => item.status !== 'rejected'),
      imagery
    },
    experienceSignals,
    voice: {},
    accessibility: { notes: ['Host applications must validate contrast and typography in their actual component contexts.'] },
    approval: {
      status: ownerDecisions?.status === 'confirmed-with-corrections' ? 'accepted-with-corrections' : ownerDecisions?.status === 'confirmed' ? 'accepted' : ownerDecisions?.status === 'in-progress' ? 'in-progress' : 'not-reviewed',
      reviewedAt: ownerDecisions?.decidedAt ?? null,
      reviewedBy: ownerDecisions?.decidedBy?.name ?? null
    },
    blockers: (normalized?.unknowns ?? []).map((unknown) => ({ id: unknown.id, message: unknown.question, severity: unknown.impact })),
    provenance: { requestId: request.requestId, generatedAt: new Date().toISOString(), evidenceBacked: true, sourceUrl }
  };
}
