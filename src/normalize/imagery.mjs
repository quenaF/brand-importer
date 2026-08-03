const PEOPLE_TERMS = /\b(person|people|man|woman|boy|girl|child|children|kid|kids|family|families|team|staff|surfer|rider|student|instructor|coach|guide)\b/i;
const MINOR_TERMS = /\b(child|children|kid|kids|youth|camper|campers|boy|girl|student|junior)\b/i;
const PRODUCT_TERMS = /\b(product|board|shirt|hat|merch|shop|catalog|collection|sku|variant|price|cart|checkout|inventory)\b/i;
const ACTIVITY_TERMS = /\b(activity|lesson|class|camp|program|learn|training|workshop|ride|surf|forage|tour|practice|session|experience)\b/i;
const STAFF_TERMS = /\b(staff|team|instructor|coach|guide|teacher|founder|owner|counselor)\b/i;
const COMMUNITY_TERMS = /\b(community|event|family|group|gather|festival|club|volunteer|together)\b/i;
const ENVIRONMENT_TERMS = /\b(ocean|wave|surf|beach|coast|water|forest|woods|trail|garden|field|facility|location|store|shop|studio|campus|venue)\b/i;
const INSTRUCTION_TERMS = /\b(lesson|instruction|learn|training|guide|teacher|coach|how-to|workshop|demonstration)\b/i;
const HERO_TERMS = /\b(hero|masthead|banner|cover|featured|campaign|welcome)\b/i;
const UTILITY_TERMS = /placeholder|spacer|pixel|tracking|badge|icon|payment|paypal|visa|mastercard|qr|qrcode|barcode|captcha|spinner|loader|avatar-default|swatch|sprite|separator/i;

function uniq(items) { return [...new Set(items.filter(Boolean))]; }
function textFor(image) { return `${image.src ?? ''} ${image.alt ?? ''} ${image.className ?? ''} ${image.elementId ?? ''} ${image.contextText ?? ''} ${image.sourcePage ?? ''} ${image.link ?? ''}`; }
function evidenceIdFor(image, index, evidence) {
  const byLocator = (evidence?.records ?? []).find((record) => record.sources?.some((source) => source.locator === image.src));
  return byLocator?.id ?? `ev.image.${index + 1}`;
}

function classifyImage(image) {
  const text = textFor(image);
  const categories = [];
  if (PEOPLE_TERMS.test(text)) categories.push('people');
  if (STAFF_TERMS.test(text)) categories.push('staff', 'team');
  if (ACTIVITY_TERMS.test(text)) categories.push('activity', 'program-representation');
  if (INSTRUCTION_TERMS.test(text)) categories.push('instructional');
  if (COMMUNITY_TERMS.test(text)) categories.push('community', 'event');
  if (ENVIRONMENT_TERMS.test(text)) categories.push('environment', 'location', 'brand-atmosphere');
  if (PRODUCT_TERMS.test(text)) categories.push('product', 'storefront-product');
  if (image.discoveryMethod === 'open-graph') categories.push('campaign', 'editorial');
  if (!categories.length) categories.push('editorial');
  return uniq(categories);
}

function visualRoles(image, categories) {
  const roles = [];
  const ratio = image.width && image.height ? image.width / image.height : null;
  if ((ratio && ratio >= 1.7) || HERO_TERMS.test(textFor(image)) || image.discoveryMethod === 'open-graph') roles.push('hero', 'section-banner');
  if (categories.includes('storefront-product')) roles.push('product-card');
  if (categories.some((value) => ['activity', 'program-representation', 'community', 'staff'].includes(value))) roles.push('experience-card');
  if (categories.includes('brand-atmosphere')) roles.push('brand-atmosphere');
  if (['section', 'article', 'main', 'metadata'].includes(image.parentRegion) || image.discoveryMethod === 'open-graph') roles.push('content-support');
  return uniq(roles.length ? roles : ['unknown']);
}

function qualityScore(image) {
  let score = 0.34;
  if (image.alt) score += 0.08;
  if (image.width && image.height) {
    const area = image.width * image.height;
    if (area >= 1200000) score += 0.32;
    else if (area >= 600000) score += 0.25;
    else if (area >= 160000) score += 0.12;
    else if (area < 40000) score -= 0.28;
  }
  if (image.discoveryMethod === 'open-graph') score += 0.1;
  return Number(Math.max(0, Math.min(1, score)).toFixed(3));
}

function representativenessScore(image, categories) {
  let score = 0.28;
  if (['main', 'section', 'article', 'header', 'metadata'].includes(image.parentRegion)) score += 0.13;
  if (categories.includes('brand-atmosphere')) score += 0.11;
  if (categories.includes('community')) score += 0.1;
  if (categories.includes('program-representation')) score += 0.14;
  if (categories.includes('staff')) score += 0.08;
  if (image.discoveryMethod === 'open-graph') score += 0.12;
  if (categories.includes('storefront-product')) score -= categories.includes('program-representation') ? 0.04 : 0.16;
  return Number(Math.max(0, Math.min(1, score)).toFixed(3));
}

function heroScore(image, categories, quality) {
  let score = quality * 0.45;
  const ratio = image.width && image.height ? image.width / image.height : 0;
  if (ratio >= 1.7 && ratio <= 3.2) score += 0.22;
  if (HERO_TERMS.test(textFor(image))) score += 0.16;
  if (image.discoveryMethod === 'open-graph') score += 0.12;
  if (categories.some((category) => ['program-representation', 'community', 'environment', 'brand-atmosphere'].includes(category))) score += 0.12;
  if (categories.includes('storefront-product') && !categories.includes('program-representation')) score -= 0.28;
  return Number(Math.max(0, Math.min(1, score)).toFixed(3));
}

function utilityStatus(image) {
  const text = textFor(image);
  if (UTILITY_TERMS.test(text)) return { utility: true, reason: 'Asset metadata suggests utility, tracking, payment, QR, icon, swatch, or placeholder content.' };
  if (image.width && image.height && image.width * image.height < 10000) return { utility: true, reason: 'Declared dimensions are too small for storytelling use.' };
  return { utility: false, reason: null };
}

function stableFingerprint(image) {
  try {
    const url = new URL(image.src);
    for (const key of ['width', 'height', 'w', 'h', 'crop', 'fit', 'format', 'quality', 'q', 'v']) url.searchParams.delete(key);
    const pathname = url.pathname
      .replace(/[-_](?:thumb|thumbnail|small|medium|large|master|\d+x\d+)(?=\.[a-z0-9]+$)/i, '')
      .replace(/@\d+x(?=\.[a-z0-9]+$)/i, '');
    return `${url.origin}${pathname}`.toLowerCase();
  } catch {
    return String(image.src ?? '').toLowerCase();
  }
}

export function normalizeImagery(observations, evidence) {
  const logos = new Set((observations?.likelyLogos ?? []).map((item) => item.src));
  const seen = new Set();
  return (observations?.images ?? [])
    .map((image, index) => ({ image, index }))
    .filter(({ image }) => image.src && !logos.has(image.src))
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
      const minorsLikely = MINOR_TERMS.test(textFor(image));
      const identifiableLikely = peopleLikely && !/silhouette|crowd|distance|back view|hands only|faceless/i.test(textFor(image));
      const qualitySuitability = qualityScore(image);
      const brandRepresentativeness = representativenessScore(image, categories);
      const heroSuitability = heroScore(image, categories, qualitySuitability);
      const productOnly = categories.includes('storefront-product') && !categories.some((category) => ['activity', 'program-representation', 'community', 'staff'].includes(category));
      const activityRelevance = Number(Math.max(0, Math.min(1,
        (categories.includes('program-representation') ? 0.48 : 0) +
        (categories.includes('activity') ? 0.22 : 0) +
        (categories.includes('instructional') ? 0.16 : 0) +
        (categories.includes('people') ? 0.08 : 0) -
        (productOnly ? 0.35 : 0)
      )).toFixed(3));
      const diversityValue = productOnly ? 0.35 : categories.length >= 3 ? 0.95 : 0.72;
      const score = Number(Math.max(0, Math.min(1,
        qualitySuitability * 0.3 + brandRepresentativeness * 0.34 + heroSuitability * 0.16 + activityRelevance * 0.2 - (utility ? 0.75 : 0)
      )).toFixed(3));
      const safeguards = ['Owner approval required before reuse outside the source website.'];
      if (peopleLikely) safeguards.push('Confirm consent and appropriate reuse rights for identifiable people.');
      if (minorsLikely) safeguards.push('Explicit approval is required before imagery likely to include minors can be used.');
      if (!image.alt) safeguards.push('Create contextual alt text before application use.');
      if (!image.width || !image.height) safeguards.push('Verify intrinsic dimensions and crop suitability before prominent placement.');
      return {
        id: `imagery.${String(index + 1).padStart(3, '0')}`,
        location: image.src,
        sourcePages: uniq([image.sourcePage, image.pageUrl]),
        discoveryMethod: image.discoveryMethod ?? 'img',
        categories,
        candidateRoles: visualRoles(image, categories),
        score,
        brandRepresentativeness,
        qualitySuitability,
        heroSuitability,
        activityRelevance,
        diversityValue,
        productOnly,
        utility,
        utilityReason,
        status: 'derived',
        requiresOwnerReview: true,
        evidenceIds: [evidenceIdFor(image, index, evidence)],
        rationale: [
          `Classified as ${categories.join(', ')} from source context, markup, page location, and asset metadata.`,
          `Brand representativeness ${brandRepresentativeness}; quality ${qualitySuitability}; hero suitability ${heroSuitability}; activity relevance ${activityRelevance}.`,
          productOnly ? 'Product-only imagery is preserved in the catalog but penalized for non-commerce experience previews.' : 'Retained as a storytelling or brand-context candidate.',
          utility ? utilityReason : null
        ].filter(Boolean),
        alt: image.alt || '',
        parentRegion: image.parentRegion || 'unknown',
        width: image.width ?? null,
        height: image.height ?? null,
        orientation: image.width && image.height ? (image.width > image.height ? 'landscape' : image.width < image.height ? 'portrait' : 'square') : 'unknown',
        people: { presentLikely: peopleLikely, minorsLikely, identifiableLikely },
        peopleLikely,
        rightsStatus: 'unknown',
        selectionStatus: utility ? 'excluded' : 'supporting',
        approvalStatus: 'unreviewed',
        safeguards
      };
    })
    .filter((candidate) => candidate.utility || candidate.score >= 0.18)
    .sort((a, b) => Number(a.utility) - Number(b.utility) || b.score - a.score || a.location.localeCompare(b.location));
}
