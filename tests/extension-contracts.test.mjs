import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { createImageryReviewPlan } from '../src/imagery/review-plan.mjs';

const ROOT = process.cwd();
function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}
function validator(schemaPath) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(readJson(schemaPath));
}

test('Experience Profile template validates after confirmation fields are supplied', () => {
  const profile = readJson('templates/experience-profile.template.json');
  profile.id = 'youth-program-parent';
  profile.domain = 'youth-program';
  profile.primaryAudience = 'parent';
  profile.previewTargets = ['parent-home'];
  profile.status = 'developer-confirmed';
  profile.provenance = {
    method: 'developer-authored',
    confirmedBy: 'developer',
    confirmedAt: '2026-08-03T12:00:00.000Z'
  };
  const validate = validator('schemas/experience-profile.schema.json');
  assert.equal(validate(profile), true, JSON.stringify(validate.errors));
});

test('Domain Adapter manifest template validates after project values are supplied', () => {
  const manifest = readJson('templates/domain-adapter-manifest.template.json');
  manifest.id = 'youth-program-parent';
  manifest.previewTargets = ['parent-home'];
  const validate = validator('schemas/domain-adapter-manifest.schema.json');
  assert.equal(validate(manifest), true, JSON.stringify(validate.errors));
  assert.equal(manifest.fallbackPolicy.exampleTenantFallback, 'forbidden');
});

test('imagery review plan validates against its published schema', () => {
  const experienceProfile = {
    id: 'youth-program-parent',
    status: 'developer-confirmed',
    imageryIntent: {
      prioritize: ['program-representation'],
      deprioritize: ['storefront-product'],
      requiredCoverage: ['program-representation'],
      maxReviewCandidates: 4,
      safety: {
        identifiablePeopleRequireApproval: true,
        minorsRequireExplicitApproval: true,
        excludePeopleByDefault: false
      }
    }
  };
  const imageryCatalog = [{
    id: 'imagery.001',
    location: 'https://example.test/program.jpg',
    categories: ['people', 'activity', 'program-representation'],
    score: 0.7,
    brandRepresentativeness: 0.8,
    diversityValue: 0.9,
    utility: false,
    selectionStatus: 'supporting',
    safeguards: ['Owner approval required.'],
    people: { presentLikely: true, minorsLikely: true, identifiableLikely: true }
  }];
  const plan = createImageryReviewPlan({ imageryCatalog, experienceProfile });
  const validate = validator('schemas/imagery-review-plan.schema.json');
  assert.equal(validate(plan), true, JSON.stringify(validate.errors));
  assert.equal(plan.candidates[0].bulkApprovalAllowed, false);
});
