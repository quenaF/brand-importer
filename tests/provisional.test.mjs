import test from 'node:test';
import assert from 'node:assert/strict';
import { generateOwnerReviewSession } from '../src/review/questions.mjs';
import { generateProvisionalBrandPack } from '../src/brand-pack/provisional.mjs';

const request = {
  requestId: 'test-001',
  sources: [{ id: 'src.web', type: 'website', location: 'https://example.com' }]
};
const normalized = {
  requestId: 'test-001',
  colors: [{ id: 'color.ff4f4f', value: '#ff4f4f', score: 0.8, candidateRoles: ['accent'], evidenceIds: ['ev.color.1'] }],
  typography: [{ id: 'font.poppins', family: 'Poppins', score: 0.7, candidateRoles: ['heading'], evidenceIds: ['ev.font.1'], excludedFromBrandTypography: false }],
  assets: [{ id: 'asset.logo.1', location: 'https://example.com/logo.png', score: 0.9, candidateRoles: ['primary-logo'], evidenceIds: ['ev.logo.1'] }],
  imagery: [{ id: 'image.hero', location: 'https://example.com/hero.jpg', score: 0.75, candidateRoles: ['hero'], evidenceIds: ['ev.image.1'], rightsStatus: 'unknown', safeguards: ['Confirm reuse rights.'] }],
  unknowns: [{ id: 'unknown.font-variables', question: 'Which fonts resolve the variables?', impact: 'material', recommendedAction: 'Inspect rendered styles.', references: ['var(--font-body-family)'] }]
};

test('owner review prioritizes rights and consequential roles', () => {
  const review = generateOwnerReviewSession({ request, normalized });
  assert.equal(review.status, 'not-started');
  assert.ok(review.questions.some((item) => item.id === 'review.imagery.rights' && item.impact === 'blocking'));
  assert.ok(review.questions.some((item) => item.id === 'review.color.roles'));
  assert.ok(review.questions.some((item) => item.id === 'review.unknown.font-variables'));
});

test('provisional pack preserves inferred and owner-review boundaries', () => {
  const pack = generateProvisionalBrandPack({ request, observations: { page: { title: 'Example Brand', description: 'Example description.' } }, normalized });
  assert.equal(pack.status, 'provisional');
  assert.equal(pack.ownerReview.status, 'not-started');
  assert.equal(pack.voice.qualities[0].status, 'inferred');
  assert.equal(pack.assets.imageryCandidates[0].requiresOwnerReview, true);
  assert.ok(pack.assets.imageryCandidates[0].restrictions.includes('Confirm reuse rights.'));
});
