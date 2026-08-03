import { randomUUID } from 'node:crypto';
import { inspectUrl } from './inspect.mjs';
import { normalizeImport } from './normalize/index.mjs';
import { generateExperienceDna } from './experience-dna/index.mjs';
import { generateOwnerReviewSession } from './review/questions.mjs';
import { generateProvisionalBrandPack } from './brand-pack/provisional.mjs';
import { createImageryReviewPlan } from './imagery/review-plan.mjs';
import { compileRuntimeBrand } from './runtime/compile.mjs';

const CONTRACTS = Object.freeze({
  runtimeBrand: '1.0.0',
  experienceProfile: '1.0.0',
  domainAdapter: '1.0.0',
  ownerDecisions: '1.0.0',
  progressEvents: '1.0.0',
  importReport: '1.0.0'
});

function sourceUrl(request) {
  return request?.sources?.[0]?.url ?? request?.sourceUrl;
}

function authorizationLabel(request) {
  const authorization = request?.authorization;
  if (typeof authorization === 'string') return authorization;
  return authorization?.basis ?? authorization?.type ?? 'user-asserted-authorization';
}

function makeEmitter(importId, onProgress) {
  let sequence = 0;
  const events = [];
  return {
    events,
    emit(stage, state, message, extra = {}) {
      const event = {
        eventVersion: '1.0.0',
        importId,
        sequence: sequence++,
        stage,
        state,
        occurredAt: new Date().toISOString(),
        ...(message ? { message } : {}),
        ...extra
      };
      events.push(event);
      onProgress?.(event);
      return event;
    }
  };
}

function createSessionManifest({ sessionId, requestId, status, createdAt, outputs = [], warnings = [], failure = null }) {
  const now = new Date().toISOString();
  return {
    sessionVersion: '1.0.0',
    sessionId,
    requestId,
    status,
    createdAt,
    updatedAt: now,
    completedAt: ['awaiting-review', 'accepted', 'exported', 'failed', 'cancelled', 'disposed'].includes(status) ? now : null,
    disposedAt: status === 'disposed' ? now : null,
    retention: { mode: 'session-only', disposeAfterExport: true, persistentOrganizationMemory: false },
    contracts: CONTRACTS,
    outputs,
    warnings,
    failure
  };
}

function createImportReport({ sessionId, request, startedAt, completedAt, result, status = 'awaiting-review', disposed = false }) {
  const normalized = result?.normalizedCandidates ?? {};
  const inventoryCount = result?.sourceInventory?.items?.length ?? 0;
  const warnings = [
    ...(result?.warnings ?? []),
    ...((normalized.unknowns ?? []).map((item) => `${item.id}: ${item.question}`))
  ];
  return {
    reportVersion: '1.0.0',
    sessionId,
    requestId: request.requestId,
    status: disposed ? 'disposed' : status,
    source: { url: sourceUrl(request), authorization: authorizationLabel(request) },
    startedAt,
    completedAt,
    durationMs: Math.max(0, new Date(completedAt).getTime() - new Date(startedAt).getTime()),
    counts: {
      inventoriedSources: inventoryCount,
      observedColors: result?.observations?.colors?.length ?? 0,
      observedFonts: result?.observations?.fonts?.length ?? 0,
      logoCandidates: normalized.assets?.length ?? 0,
      imageryCandidates: normalized.imagery?.length ?? 0,
      reviewQuestions: result?.ownerReview?.questions?.length ?? 0
    },
    observed: ['source inventory', 'colors', 'typography', 'logo candidates', 'imagery and source context'],
    inferred: ['semantic roles', 'imagery categories', 'experience signals', 'candidate ranking'],
    review: {
      required: true,
      blockingItems: (normalized.unknowns ?? []).filter((item) => item.impact === 'blocking').length,
      materialItems: (normalized.unknowns ?? []).filter((item) => item.impact === 'material').length
    },
    warnings,
    exports: result ? ['runtime-brand.json', 'import-report.json'] : [],
    disposal: { required: true, completed: disposed, disposedAt: disposed ? new Date().toISOString() : null }
  };
}

export async function runBrandImport(request, options = {}) {
  if (!request?.requestId) throw new Error('runBrandImport requires a canonical request with requestId.');
  if (!sourceUrl(request)) throw new Error('runBrandImport requires at least one authorized source URL.');
  const sessionId = options.sessionId ?? `session-${randomUUID()}`;
  const startedAt = new Date().toISOString();
  const emitter = makeEmitter(request.requestId, options.onProgress);
  let disposed = false;
  let result = null;

  emitter.emit('source.connecting', 'running', 'Connecting to the authorized source.');
  try {
    const inspected = await inspectUrl(request);
    emitter.emit('source.connected', 'completed', 'Authorized source connected.');
    emitter.emit('pages.discovering', 'completed', 'Relevant pages and assets discovered.', { counts: { sources: inspected.sourceInventory?.items?.length ?? 0 } });
    emitter.emit('pages.inspected', 'completed', 'Source evidence captured.');

    const normalizedCandidates = normalizeImport({ request, observations: inspected.observations, evidence: inspected.evidence });
    emitter.emit('identity.logos', normalizedCandidates.assets.length ? 'completed' : 'completed-with-warning', 'Logo candidates ranked.', { counts: { logos: normalizedCandidates.assets.length } });
    emitter.emit('identity.colors', normalizedCandidates.colors.length ? 'completed' : 'completed-with-warning', 'Color candidates normalized.', { counts: { colors: normalizedCandidates.colors.length } });
    emitter.emit('identity.typography', normalizedCandidates.typography.length ? 'completed' : 'completed-with-warning', 'Typography candidates normalized.', { counts: { fonts: normalizedCandidates.typography.length } });
    emitter.emit('imagery.catalog', 'completed', 'Imagery classified, deduplicated, and ranked.', { counts: { imagery: normalizedCandidates.imagery.length } });

    const experienceSignals = generateExperienceDna({ request, observations: inspected.observations, normalized: normalizedCandidates, evidence: inspected.evidence });
    emitter.emit('experience-dna', 'completed', 'Experience signals generated as provisional hypotheses.');
    const ownerReview = generateOwnerReviewSession({ request, normalized: normalizedCandidates, experienceDna: experienceSignals });
    emitter.emit('owner-review', 'completed', 'Owner review questions prepared.', { counts: { questions: ownerReview.questions?.length ?? 0 } });
    const provisionalBrandPack = generateProvisionalBrandPack({ request, observations: inspected.observations, normalized: normalizedCandidates });

    let imageryReviewPlan = null;
    if (options.experienceProfile?.status === 'developer-confirmed') {
      imageryReviewPlan = createImageryReviewPlan({ imageryCatalog: normalizedCandidates.imagery, experienceProfile: options.experienceProfile });
      emitter.emit('imagery.review-plan', 'completed', 'Profile-aware imagery review plan prepared.', { counts: { candidates: imageryReviewPlan.candidates.length } });
    } else {
      emitter.emit('imagery.review-plan', 'completed-with-warning', 'No developer-confirmed Experience Profile was supplied; no domain-specific imagery shortlist was created.', { warningCodes: ['EXPERIENCE_PROFILE_NOT_CONFIRMED'] });
    }

    const runtimeBrand = compileRuntimeBrand({ request, observations: inspected.observations, normalized: normalizedCandidates, experienceSignals, ownerDecisions: options.ownerDecisions ?? null });
    emitter.emit('runtime-brand', 'completed', 'Portable runtime brand compiled.');

    result = {
      sourceInventory: inspected.sourceInventory,
      observations: inspected.observations,
      evidence: inspected.evidence,
      normalizedCandidates,
      imageryCatalog: normalizedCandidates.imagery,
      imageryReviewPlan,
      experienceSignals,
      ownerReview,
      provisionalBrandPack,
      runtimeBrand,
      progressEvents: emitter.events
    };
    const completedAt = new Date().toISOString();
    result.importReport = createImportReport({ sessionId, request, startedAt, completedAt, result });
    emitter.emit('import.complete', 'completed', 'Import is ready for review and export.');
    result.sessionManifest = createSessionManifest({ sessionId, requestId: request.requestId, status: 'awaiting-review', createdAt: startedAt, outputs: ['runtime-brand.json', 'import-report.json'] });

    return {
      sessionId,
      get status() { return disposed ? 'disposed' : 'awaiting-review'; },
      get result() {
        if (disposed) throw new Error('This import session has been disposed.');
        return result;
      },
      exportRuntimeBrand() {
        if (disposed) throw new Error('This import session has been disposed.');
        return structuredClone(result.runtimeBrand);
      },
      exportBundle() {
        if (disposed) throw new Error('This import session has been disposed.');
        return structuredClone({ ...result, sessionManifest: createSessionManifest({ sessionId, requestId: request.requestId, status: 'exported', createdAt: startedAt, outputs: ['runtime-brand.json', 'import-report.json'] }) });
      },
      dispose() {
        if (disposed) return;
        disposed = true;
        const completedAt = new Date().toISOString();
        if (result) result.importReport = createImportReport({ sessionId, request, startedAt, completedAt, result, disposed: true });
        result = null;
      }
    };
  } catch (error) {
    emitter.emit('import.complete', 'failed', 'Brand import failed.', { error: { code: 'IMPORT_FAILED', message: error.message, retryable: true } });
    throw error;
  }
}

export async function withBrandImportSession(request, callback, options = {}) {
  const session = await runBrandImport(request, options);
  try {
    return await callback(session);
  } finally {
    session.dispose();
  }
}

export { CONTRACTS as contractVersions };
