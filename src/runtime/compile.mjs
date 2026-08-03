function decisionMap(ownerDecisions) {
  return new Map((ownerDecisions?.decisions ?? []).map((decision) => [decision.subjectId, decision]));
}

function applyStatus(decision, defaultStatus = 'provisional') {
  if (!decision) return defaultStatus;
  if (decision.action === 'reject') return 'rejected';
  if (decision.action === 'hold' || decision.action === 'leave-unresolved' || decision.action === 'deprioritize') return 'held';
  if (decision.action === 'correct') return 'corrected';
  if (['confirm', 'approve'].includes(decision.action)) return 'approved';
  return defaultStatus;
}

function keepIdentityItem(item, accepted) {
  if (['rejected', 'held'].includes(item.status)) return false;
  if (!accepted) return true;
  return ['approved', 'corrected'].includes(item.status);
}

export function compileRuntimeBrand({ request, observations, normalized, experienceSignals = {}, ownerDecisions = null }) {
  const decisions = decisionMap(ownerDecisions);
  const accepted = ['confirmed', 'confirmed-with-corrections'].includes(ownerDecisions?.status);
  const sourceUrl = request.sources?.[0]?.url ?? request.sourceUrl;
  const organizationName = observations?.pages?.[0]?.title || observations?.page?.title || request?.organizationName || new URL(sourceUrl).hostname;

  const imagery = (normalized?.imagery ?? []).map((candidate) => {
    const decision = decisions.get(candidate.id);
    const status = applyStatus(decision, 'held');
    const rightsConfirmed = decision?.rightsConfirmation === 'confirmed';
    return {
      location: decision?.correctedValue?.location ?? candidate.location,
      roles: decision?.approvedRoles ?? candidate.candidateRoles ?? [],
      status: status === 'approved' && rightsConfirmed ? 'approved' : status === 'rejected' ? 'rejected' : 'held',
      rightsStatus: status === 'approved' && rightsConfirmed ? 'owner-approved' : candidate.rightsStatus ?? 'unknown',
      evidenceIds: candidate.evidenceIds ?? []
    };
  }).filter((item) => item.status === 'approved' && item.rightsStatus === 'owner-approved');

  const colors = (normalized?.colors ?? []).map((candidate) => {
    const decision = decisions.get(candidate.id);
    return {
      value: decision?.correctedValue ?? candidate.value,
      roles: decision?.approvedRoles ?? candidate.candidateRoles ?? [],
      status: applyStatus(decision),
      evidenceIds: candidate.evidenceIds ?? []
    };
  }).filter((item) => keepIdentityItem(item, accepted));

  const typography = (normalized?.typography ?? [])
    .filter((candidate) => !candidate.excludedFromBrandTypography)
    .map((candidate) => {
      const decision = decisions.get(candidate.id);
      return {
        family: decision?.correctedValue ?? candidate.family,
        roles: decision?.approvedRoles ?? candidate.candidateRoles ?? [],
        status: applyStatus(decision),
        evidenceIds: candidate.evidenceIds ?? []
      };
    })
    .filter((item) => keepIdentityItem(item, accepted));

  const logos = (normalized?.assets ?? []).map((candidate) => {
    const decision = decisions.get(candidate.id);
    return {
      location: decision?.correctedValue?.location ?? candidate.location,
      roles: decision?.approvedRoles ?? candidate.candidateRoles ?? [],
      status: applyStatus(decision),
      evidenceIds: candidate.evidenceIds ?? []
    };
  }).filter((item) => keepIdentityItem(item, accepted));

  const unresolvedAcceptedIdentity = accepted ? [
    ...(normalized?.colors ?? []).filter((candidate) => !decisions.has(candidate.id)).map((candidate) => candidate.id),
    ...(normalized?.typography ?? []).filter((candidate) => !candidate.excludedFromBrandTypography && !decisions.has(candidate.id)).map((candidate) => candidate.id),
    ...(normalized?.assets ?? []).filter((candidate) => !decisions.has(candidate.id)).map((candidate) => candidate.id)
  ] : [];

  const blockers = [
    ...(normalized?.unknowns ?? []).map((unknown) => ({ id: unknown.id, message: unknown.question, severity: unknown.impact })),
    ...unresolvedAcceptedIdentity.map((id) => ({ id: `unresolved.${id}`, message: `Accepted runtime omitted unresolved candidate ${id}.`, severity: 'material' }))
  ];

  return {
    contractVersion: '1.0.0',
    status: accepted ? 'accepted' : 'provisional',
    organization: { name: organizationName, website: sourceUrl },
    identity: { colors, typography, logos, imagery },
    experienceSignals,
    voice: {},
    accessibility: { notes: ['Host applications must validate contrast and typography in their actual component contexts.'] },
    approval: {
      status: ownerDecisions?.status === 'confirmed-with-corrections' ? 'accepted-with-corrections' : ownerDecisions?.status === 'confirmed' ? 'accepted' : ownerDecisions?.status === 'in-progress' ? 'in-progress' : 'not-reviewed',
      reviewedAt: ownerDecisions?.decidedAt ?? null,
      reviewedBy: ownerDecisions?.decidedBy?.name ?? null
    },
    blockers,
    provenance: { requestId: request.requestId, generatedAt: new Date().toISOString(), evidenceBacked: true, sourceUrl }
  };
}
