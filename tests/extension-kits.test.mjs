import test from 'node:test';
import assert from 'node:assert/strict';
import { extractHtmlEvidence } from '../src/extract.mjs';
import { normalizeImagery } from '../src/normalize/imagery.mjs';
import { createImageryReviewPlan } from '../src/imagery/review-plan.mjs';

test('extractHtmlEvidence discovers Open Graph and inline SVG logo candidates', () => {
  const html = `<!doctype html><html><head>
    <title>Example Camp</title>
    <meta property="og:image" content="/share-card.jpg">
    <meta property="og:image:alt" content="Example Camp by the lake">
  </head><body><header><svg id="brand-logo" aria-label="Example Camp logo"><title>Example Camp</title></svg></header></body></html>`;
  const result = extractHtmlEvidence(html, 'https://example.test/');
  assert.equal(result.openGraphImages.length, 1);
  assert.equal(result.openGraphImages[0].src, 'https://example.test/share-card.jpg');
  assert.ok(result.likelyLogos.some((item) => item.discoveryMethod === 'inline-svg'));
});

test('imagery catalog filters utility noise and classifies program and product imagery', () => {
  const observations = {
    likelyLogos: [],
    images: [
      { src: 'https://example.test/qr-code.png', alt: 'QR code', width: 300, height: 300, sourcePage: 'https://example.test/' },
      { src: 'https://example.test/shirt-variant.jpg', alt: 'Blue shirt product', width: 1200, height: 1600, sourcePage: 'https://example.test/collections/shirts', parentRegion: 'main' },
      { src: 'https://example.test/camp-lesson.jpg', alt: 'Children learning with an instructor at camp', width: 1600, height: 900, sourcePage: 'https://example.test/camp', parentRegion: 'section' }
    ]
  };
  const catalog = normalizeImagery(observations, { records: [] });
  assert.equal(catalog.find((item) => item.location.includes('qr-code')).utility, true);
  assert.ok(catalog.find((item) => item.location.includes('shirt')).categories.includes('storefront-product'));
  const camp = catalog.find((item) => item.location.includes('camp-lesson'));
  assert.ok(camp.categories.includes('program-representation'));
  assert.equal(camp.people.minorsLikely, true);
});

test('youth-program profile surfaces camp imagery before product volume', () => {
  const productImages = Array.from({ length: 20 }, (_, index) => ({
    id: `product.${index}`,
    location: `https://example.test/product-${index}.jpg`,
    categories: ['product', 'storefront-product'],
    score: 0.8,
    brandRepresentativeness: 0.5,
    diversityValue: 0.4,
    utility: false,
    safeguards: [],
    people: { presentLikely: false, minorsLikely: false, identifiableLikely: false }
  }));
  const program = {
    id: 'program.1',
    location: 'https://example.test/camp.jpg',
    categories: ['people', 'activity', 'program-representation', 'instructional'],
    score: 0.65,
    brandRepresentativeness: 0.8,
    diversityValue: 0.95,
    utility: false,
    safeguards: [],
    people: { presentLikely: true, minorsLikely: true, identifiableLikely: true }
  };
  const profile = {
    status: 'developer-confirmed',
    id: 'youth-program-parent',
    imageryIntent: {
      prioritize: ['program-representation', 'instructional', 'people'],
      deprioritize: ['storefront-product'],
      requiredCoverage: ['program-representation'],
      maxReviewCandidates: 6,
      safety: { identifiablePeopleRequireApproval: true, minorsRequireExplicitApproval: true, excludePeopleByDefault: false }
    }
  };
  const plan = createImageryReviewPlan({ imageryCatalog: [...productImages, program], experienceProfile: profile });
  assert.equal(plan.candidates[0].id, 'program.1');
  assert.equal(plan.candidates[0].bulkApprovalAllowed, false);
  assert.ok(plan.summary.productCandidates < plan.summary.reviewCandidateCount);
});

test('review planning refuses an unconfirmed Experience Profile', () => {
  assert.throws(() => createImageryReviewPlan({ imageryCatalog: [], experienceProfile: { id: 'draft', status: 'proposed' } }), /developer-confirmed/);
});
