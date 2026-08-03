import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { normalizeAssets } from '../src/normalize/assets.mjs';
import { normalizeImagery } from '../src/normalize/imagery.mjs';
import { createImageryReviewPlan } from '../src/imagery/review-plan.mjs';
import { compileRuntimeBrand } from '../src/runtime/compile.mjs';
import { contractVersions } from '../src/api.mjs';

const ROOT = process.cwd();
function readJson(relativePath) { return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8')); }
function validateWith(schemaPath, value) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(readJson(schemaPath));
  return { valid: validate(value), errors: validate.errors };
}

test('header SVG wordmark outranks social and favicon metadata', () => {
  const observations = {
    likelyLogos: [
      { src: 'https://example.test/social-share.png', alt: 'Example social share', discoveryMethod: 'open-graph', parentRegion: 'metadata' },
      { src: 'https://example.test/#brand-wordmark', alt: 'Example logo', elementId: 'brand-wordmark', discoveryMethod: 'inline-svg', parentRegion: 'header', inlineSvg: true, width: 420, height: 90 },
      { src: 'https://example.test/favicon-32.png', alt: '', discoveryMethod: 'icon', parentRegion: 'header', width: 32, height: 32 }
    ]
  };
  const ranked = normalizeAssets(observations, { records: [] });
  assert.equal(ranked[0].discoveryMethod, 'inline-svg');
  assert.ok(ranked[0].candidateRoles.includes('primary-logo'));
  assert.ok(ranked[0].candidateRoles.includes('wordmark'));
});

test('responsive image variants deduplicate to one catalog candidate', () => {
  const observations = {
    likelyLogos: [],
    images: [
      { src: 'https://cdn.test/camp-hero_800x600.jpg?width=800', alt: 'Camp activity', sourcePage: 'https://example.test/camp', parentRegion: 'main', width: 800, height: 600 },
      { src: 'https://cdn.test/camp-hero_1600x1200.jpg?width=1600', alt: 'Camp activity', sourcePage: 'https://example.test/camp', parentRegion: 'main', width: 1600, height: 1200 }
    ]
  };
  const catalog = normalizeImagery(observations, { records: [] });
  assert.equal(catalog.filter((item) => !item.utility).length, 1);
});

test('program hero ranks above repeated product imagery for youth-program profile', () => {
  const products = Array.from({ length: 30 }, (_, index) => ({
    src: `https://example.test/products/shirt-${index}.jpg`,
    alt: `Shirt product ${index}`,
    sourcePage: 'https://example.test/collections/shirts',
    parentRegion: 'main',
    width: 1600,
    height: 1600
  }));
  const activity = {
    src: 'https://example.test/camp/featured-surf-lesson.jpg',
    alt: 'Youth campers learning with instructors during a surf lesson',
    sourcePage: 'https://example.test/pages/surf-camp',
    parentRegion: 'main',
    width: 2000,
    height: 1000
  };
  const catalog = normalizeImagery({ likelyLogos: [], images: [...products, activity] }, { records: [] });
  const profile = {
    id: 'youth-program-parent',
    status: 'developer-confirmed',
    imageryIntent: {
      prioritize: ['program-representation', 'instructional', 'people', 'staff', 'environment'],
      deprioritize: ['storefront-product'],
      requiredCoverage: ['program-representation'],
      maxReviewCandidates: 8,
      safety: { identifiablePeopleRequireApproval: true, minorsRequireExplicitApproval: true, excludePeopleByDefault: false }
    }
  };
  const plan = createImageryReviewPlan({ imageryCatalog: catalog, experienceProfile: profile });
  assert.ok(plan.candidates[0].categories.includes('program-representation'));
  assert.ok(plan.summary.productCandidates < plan.summary.reviewCandidateCount);
  assert.equal(plan.candidates[0].bulkApprovalAllowed, false);
});

test('runtime compiler includes only explicitly approved imagery', () => {
  const request = { requestId: 'runtime-test', sourceUrl: 'https://example.test/' };
  const normalized = {
    colors: [{ id: 'color.1', value: '#112233', candidateRoles: ['primary'], evidenceIds: ['ev.1'] }],
    typography: [{ id: 'font.1', family: 'Example Sans', candidateRoles: ['body'], evidenceIds: ['ev.2'], excludedFromBrandTypography: false }],
    assets: [{ id: 'asset.logo.1', location: 'https://example.test/logo.svg', candidateRoles: ['primary-logo'], evidenceIds: ['ev.3'] }],
    imagery: [
      { id: 'imagery.1', location: 'https://example.test/approved.jpg', candidateRoles: ['hero'], evidenceIds: ['ev.4'], rightsStatus: 'unknown' },
      { id: 'imagery.2', location: 'https://example.test/held.jpg', candidateRoles: ['content-support'], evidenceIds: ['ev.5'], rightsStatus: 'unknown' }
    ],
    unknowns: []
  };
  const ownerDecisions = {
    status: 'confirmed',
    decidedAt: '2026-08-03T12:00:00.000Z',
    decidedBy: { name: 'Owner' },
    decisions: [
      { subjectId: 'imagery.1', action: 'approve', approvedRoles: ['hero'] },
      { subjectId: 'imagery.2', action: 'hold' }
    ]
  };
  const runtime = compileRuntimeBrand({ request, observations: { page: { title: 'Example' } }, normalized, ownerDecisions });
  assert.equal(runtime.identity.imagery.length, 1);
  assert.equal(runtime.identity.imagery[0].location, 'https://example.test/approved.jpg');
  assert.equal(runtime.identity.imagery[0].rightsStatus, 'owner-approved');
  const validation = validateWith('schemas/runtime-brand.schema.json', runtime);
  assert.equal(validation.valid, true, JSON.stringify(validation.errors));
});

test('all public contracts use compatible major version 1', () => {
  assert.deepEqual(contractVersions, {
    runtimeBrand: '1.0.0',
    experienceProfile: '1.0.0',
    domainAdapter: '1.0.0',
    ownerDecisions: '1.0.0',
    progressEvents: '1.0.0',
    importReport: '1.0.0'
  });
});

test('session-bound owner decision fixture validates and forbids importer persistence', () => {
  const decisions = {
    decisionVersion: '1.0.0',
    sessionId: 'session-test',
    sourceImportId: 'import-test',
    status: 'confirmed',
    decidedAt: '2026-08-03T12:00:00.000Z',
    decidedBy: { name: 'Owner', role: 'owner' },
    retention: { scope: 'current-session-and-export-bundle', persistedByImporter: false },
    decisions: [{ id: 'decision.logo', subjectType: 'logo', subjectId: 'asset.logo.1', action: 'confirm', sourceFingerprint: 'sha256:test', recordedAt: '2026-08-03T12:00:00.000Z' }]
  };
  const validation = validateWith('schemas/owner-decisions.schema.json', decisions);
  assert.equal(validation.valid, true, JSON.stringify(validation.errors));
  assert.equal(decisions.retention.persistedByImporter, false);
});
