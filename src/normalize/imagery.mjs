const PEOPLE_TERMS = /\b(person|people|man|woman|boy|girl|child|children|kid|kids|family|families|team|staff|surfer|rider|student|instructor|coach)\b/i;
const MINOR_TERMS = /\b(child|children|kid|kids|youth|camper|campers|boy|girl|student)\b/i;
const LOGO_TERMS = /logo|wordmark|brand/i;
const PRODUCT_TERMS = /product|board|shirt|hat|merch|shop|catalog|collection|sku|variant/i;
const ACTIVITY_TERMS = /activity|lesson|class|camp|program|learn|training|workshop|ride|surf|forage|tour|practice/i;
const STAFF_TERMS = /staff|team|instructor|coach|guide|teacher|founder|owner/i;
const COMMUNITY_TERMS = /community|event|family|group|gather|festival|club|volunteer/i;
const ENVIRONMENT_TERMS = /ocean|wave|surf|beach|coast|water|forest|woods|trail|garden|field|facility|location|store|shop|studio/i;
const INSTRUCTION_TERMS = /lesson|instruction|learn|training|guide|teacher|coach|how-to|workshop/i;
const UTILITY_TERMS = /placeholder|spacer|pixel|tracking|badge|icon|payment|paypal|visa|mastercard|qr|qrcode|barcode|captcha|spinner|loader|avatar-default|swatch/i;

function uniq(items) { return [...new Set(items.filter(Boolean))]; }

function evidenceIdFor(image, index, evidence) {
  const byLocator = (evidence?.records ?? []).find((record) => record.sources?.some((source) => source.locator === image.src));
  return byLocator?.id ?? `ev.image.${index + 1}`;
}

function classifyImage(image) {
  const haystack = `${image.src} ${image.alt} ${image.className} ${image.elementId} ${image.contextText} ${image.sourcePage}`;
  const categories = [];
  if (PEOPLE_TERMS.test(haystack)) categories.push('people');
  if (STAFF_TERMS.test(haystack)) categories.push('staff', 'team');
  if (ACTIVITY_TERMS.test(haystack)) categories.push('activity', 'program-representation');
  if (INSTRUCTION_TERMS.test(haystack)) categories.push('instructional');
  if (COMMUNITY_TERMS.test(haystack)) categories.push('community');
  if (ENVIRONMENT_TERMS.test(haystack)) categories.push('environment', 'location', 'brand-atmosphere');
  if (PRODUCT_TERMS.test(haystack)) categories.push('product', 'storefront-product');
  if (image.discoveryMethod === 'open-graph') categories.push('campaign', 'editorial');
  if (!categories.length) categories.push('editorial');
  return uniq(categories);
}

function visualRoles(image, categories) {
  const roles = [];
  if (image.width && image.height && image.width / image.height >= 1.5) roles.push('hero', 'section-banner');
  if (categories.includes('storefront-product')) roles.push('product-card');
  if (categories.some((value) => ['activity', 'program-representation', 'community'].includes(value))) roles.push('experience-card');
  if (categories.includes('brand-atmosphere')) roles.push('brand-atmosphere');
  if (image.parentRegion === 'section' || image.parentRegion === 'article' || image.discoveryMethod === 'open-graph') roles.push('content-support');
  return uniq(roles.length ? roles : ['unknown']);
}

function qualityScore(image) {
  let score = 0.4;
  if (image.alt) score += 0.08;
  if (image.width && image.height) {
    const area = image.width * image.height;
    if (area >= 600000) score += 0.28;
    else if (area >= 160000) score += 0.16;
    else if (area < 40000) score -= 0.25;
  }
  if (image.discoveryMethod === 'open-graph') score += 0.12;
  return Number(Math.max(0, Math.min(1, score)).toFixed(3));
}

function representativenessScore(image, categories) {
  let score = 0.3;
  if (['main', 'section', 'article', 'header'].includes(image.parentRegion)) score += 0.15;
  if (categories.includes('brand-atmosphere')) score += 0.12;
  if (categories.includes('community')) score += 0.12;
  if (categories.includes('program-representation')) score += 0.12;
  if (image.discoveryMethod === 'open-graph') score += 0.15;
  if (categories.includes('storefront-product')) score -= 0.08;
  return Number(Math.max(0, Math.min(1, score)).toFixed(3));
}

function utilityStatus(image) {
  const haystack = `${image.src} ${image.alt} ${image.className} ${image.elementId}`;
  if (UTILITY_TERMS.test(haystack)) return { utility: true, reason: 'Filename or markup suggests a utility, tracking, payment, QR, icon, or placeholder asset.' };
  if (image.width && image.height && image.width * image.height < 10000) return { utility: true, reason: 'Declared dimensions are too small for storytelling use.' };
  return { utility: false, reason: null };
}

function stableFingerprint(image) {
  try {
    const url = new URL(image.src);
    url.searchParams.delete('width');
    url.searchParams.delete('height');
    url.searchParams.delete('w');
    url.searchParams.delete('h');
    return `${url.origin}${url.pathname}`.toLowerCase();
  } catch {
    return image.src.toLowerCase();
  }
}

export function normalizeImagery(observations, evidence) {
  const logos = new Set((observations?.likelyLogos ?? []).map((item) => item.src));
  const seen = new Set();
  return (observations?.images ?? [])
    .map((image, index) => ({ image, index }))
    .filter(({ image }) => !logos.has(image.src))
    .filter(({ image }) => {
      const fingerprint = stableFingerprint(image);
      if (seen.has(fingerprint)) return false;
      seen.add(fingerprint);
      return true;
    })
    .map(({ image, index }) => {
      const categories = classifyImage(image);
      const { utility, reason: utilityReason } = utilityStatus(image);
      const peopleLikely = categories.includes('people');
      const minorsLikely = MINOR_TERMS.test(`${image.alt} ${image.contextText} ${image.sourcePage}`);
      const identifiableLikely = peopleLikely && !/silhouette|crowd|distance|back view|hands only/i.test(`${image.alt} ${image.contextText}`);
      const qualitySuitability = qualityScore(image);
      const brandRepresentativeness = representativenessScore(image, categories);
      const diversityValue = Number((1 - Math.min(0.8, categories.includes('storefront-product') ? 0.35 : 0.05)).toFixed(3));
      const score = Number(Math.max(0, Math.min(1,
        qualitySuitability * 0.38 + brandRepresentativeness * 0.42 + diversityValue * 0.2 - (utility ? 0.7 : 0)
      )).toFixed(3));
      const safeguards = ['Owner approval required before reuse outside the source website.'];
      if (peopleLikely) safeguards.push('Confirm consent and appropriate reuse rights for identifiable people.');
      if (minorsLikely) safeguards.push('Explicit approval is required before imagery likely to include minors can be used.');
      if (!image.alt) safeguards.push('Create contextual alt text before application use.');
      if (!image.width || !image.height) safeguards.push('Verify intrinsic dimensions and crop suitability before prominent placement.');
      const sourcePages = uniq([image.sourcePage, image.pageUrl]);
      return {
        id: `imagery.${String(index + 1).padStart(3, '0')}`,
        location: image.src,
        sourcePages,
        discoveryMethod: image.discoveryMethod ?? 'img',
        categories,
        candidateRoles: visualRoles(image, categories),
        score,
        brandRepresentativeness,
        qualitySuitability,
        diversityValue,
        utility,
        utilityReason,
        status: 'derived',
        requiresOwnerReview: true,
        evidenceIds: [evidenceIdFor(image, index, evidence)],
        rationale: [
          `Classified as ${categories.join(', ')} from source context, markup, and asset metadata.`,
          `Brand representativeness ${brandRepresentativeness}; quality suitability ${qualitySuitability}; diversity value ${diversityValue}.`,
          utility ? utilityReason : 'Retained as a storytelling or brand-context candidate.'
        ],
        alt: image.alt || '',
        parentRegion: image.parentRegion || 'unknown',
        width: image.width,
        height: image.height,
        orientation: image.width && image.height ? (image.width > image.height ? 'landscape' : image.width < image.height ? 'portrait' : 'square') : 'unknown',
        people: { presentLikely: peopleLikely, minorsLikely, identifiableLikely },
        peopleLikely,
        rightsStatus: 'unknown',
        selectionStatus: utility ? 'excluded' : 'supporting',
        approvalStatus: 'unreviewed',
        safeguards
      };
    })
    .filter((candidate) => candidate.utility || candidate.score >= 0.2)
    .sort((a, b) => Number(a.utility) - Number(b.utility) || b.score - a.score);
}
