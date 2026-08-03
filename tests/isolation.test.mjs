import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { compileRuntimeBrand } from '../src/runtime/compile.mjs';
import { createImageryReviewPlan } from '../src/imagery/review-plan.mjs';

const ROOT = process.cwd();
function validate(schemaPath, value) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const schema = JSON.parse(fs.readFileSync(path.join(ROOT, schemaPath), 'utf8'));
  const check = ajv.compile(schema);
  return { valid: check(value), errors: check.errors };
}

function brandFixture({ requestId, url, name, color, logo }) {
  return compileRuntimeBrand({
    request: { requestId, sourceUrl: url },
    observations: { page: { title: name } },
    normalized: {
      colors: [{ id: `${requestId}.color`, value: color, candidateRoles: ['primary'], evidenceIds: [`${requestId}.ev.color`] }],
      typography: [],
      assets: [{ id: `${requestId}.logo`, location: logo, candidateRoles: ['primary-logo'], evidenceIds: [`${requestId}.ev.logo`] }],
      imagery: [],
      unknowns: []
    },
    ownerDecisions: {
      status: 'confirmed',
      decidedAt: '2026-08-03T12:00:00.000Z',
      decidedBy: { name: 'Owner' },
      decisions: [
        { subjectId: `${requestId}.color`, action: 'confirm' },
        { subjectId: `${requestId}.logo`, action: 'confirm' }
      ]
    }
  });
}

test('two brands compiled through the same runtime contract contain no identity leakage', () => {
  const brandA = brandFixture({ requestId: 'brand-a', url: 'https://a.example/', name: 'Brand A', color: '#112233', logo: 'https://a.example/logo.svg' });
  const brandB = brandFixture({ requestId: 'brand-b', url: 'https://b.example/', name: 'Brand B', color: '#aa5500', logo: 'https://b.example/logo.svg' });

  const serializedA = JSON.stringify(brandA);
  const serializedB = JSON.stringify(brandB);
  assert.ok(!serializedA.includes('Brand B'));
  assert.ok(!serializedA.includes('b.example'));
  assert.ok(!serializedB.includes('Brand A'));
  assert.ok(!serializedB.includes('a.example'));
  assert.equal(brandA.identity.colors[0].value, '#112233');
  assert.equal(brandB.identity.colors[0].value, '#aa5500');
});

test('one imagery catalog produces different review plans for different confirmed profiles', () => {
  const catalog = [
    {
      id: 'program', location: 'https://example.test/program.jpg', categories: ['people', 'activity', 'program-representation', 'instructional'], score: 0.72,
      brandRepresentativeness: 0.82, diversityValue: 0.9, utility: false, safeguards: [], people: { presentLikely: true, minorsLikely: true, identifiableLikely: true }
    },
    {
      id: 'product', location: 'https://example.test/product.jpg', categories: ['product', 'storefront-product'], score: 0.84,
      brandRepresentativeness: 0.6, diversityValue: 0.5, utility: false, safeguards: [], people: { presentLikely: false, minorsLikely: false, identifiableLikely: false }
    }
  ];
  const safety = { identifiablePeopleRequireApproval: true, minorsRequireExplicitApproval: true, excludePeopleByDefault: false };
  const youth = {
    id: 'youth', status: 'developer-confirmed',
    imageryIntent: { prioritize: ['program-representation', 'instructional'], deprioritize: ['storefront-product'], requiredCoverage: ['program-representation'], maxReviewCandidates: 2, safety }
  };
  const commerce = {
    id: 'commerce', status: 'developer-confirmed',
    imageryIntent: { prioritize: ['storefront-product', 'product'], deprioritize: ['program-representation'], requiredCoverage: ['storefront-product'], maxReviewCandidates: 2, safety }
  };
  const youthPlan = createImageryReviewPlan({ imageryCatalog: catalog, experienceProfile: youth });
  const commercePlan = createImageryReviewPlan({ imageryCatalog: catalog, experienceProfile: commerce });
  assert.equal(youthPlan.candidates[0].id, 'program');
  assert.equal(commercePlan.candidates[0].id, 'product');
});

test('import report and disposed session manifests validate', () => {
  const importReport = {
    reportVersion: '1.0.0',
    sessionId: 'session-1',
    requestId: 'request-1',
    status: 'disposed',
    source: { url: 'https://example.test/', authorization: 'owner-authorized' },
    startedAt: '2026-08-03T12:00:00.000Z',
    completedAt: '2026-08-03T12:00:01.000Z',
    durationMs: 1000,
    counts: { inventoriedSources: 1 },
    observed: ['source inventory'],
    inferred: ['candidate ranking'],
    review: { required: true, blockingItems: 0, materialItems: 1 },
    warnings: [],
    exports: ['runtime-brand.json'],
    disposal: { required: true, completed: true, disposedAt: '2026-08-03T12:00:01.000Z' }
  };
  const session = {
    sessionVersion: '1.0.0',
    sessionId: 'session-1',
    requestId: 'request-1',
    status: 'disposed',
    createdAt: '2026-08-03T12:00:00.000Z',
    updatedAt: '2026-08-03T12:00:01.000Z',
    completedAt: '2026-08-03T12:00:01.000Z',
    disposedAt: '2026-08-03T12:00:01.000Z',
    retention: { mode: 'session-only', disposeAfterExport: true, persistentOrganizationMemory: false },
    contracts: { runtimeBrand: '1.0.0', experienceProfile: '1.0.0', domainAdapter: '1.0.0', ownerDecisions: '1.0.0', progressEvents: '1.0.0', importReport: '1.0.0' },
    outputs: ['runtime-brand.json'],
    warnings: [],
    failure: null
  };
  const reportValidation = validate('schemas/import-report-v1.schema.json', importReport);
  const sessionValidation = validate('schemas/import-session.schema.json', session);
  assert.equal(reportValidation.valid, true, JSON.stringify(reportValidation.errors));
  assert.equal(sessionValidation.valid, true, JSON.stringify(sessionValidation.errors));
});
