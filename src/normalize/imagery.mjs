const PEOPLE_TERMS = /\b(person|people|man|woman|boy|girl|child|children|kid|kids|family|families|team|staff|surfer|rider)\b/i;
const LOGO_TERMS = /logo|wordmark|brand/i;
const PRODUCT_TERMS = /product|board|shirt|hat|merch|shop|catalog|collection/i;
const ATMOSPHERE_TERMS = /ocean|wave|surf|beach|coast|water|lifestyle|community|camp|event|team/i;

function evidenceIdFor(image, index, evidence) {
  const byLocator = (evidence?.records ?? []).find((record) => record.sources?.some((source) => source.locator === image.src));
  return byLocator?.id ?? `ev.image.${index + 1}`;
}

function scoreImage(image) {
  let score = 0.35;
  const rationale = [];
  const haystack = `${image.src} ${image.alt} ${image.className} ${image.elementId} ${image.contextText}`;
  if (image.parentRegion === 'main' || image.parentRegion === 'section') { score += 0.16; rationale.push('Appears in primary page content.'); }
  if (image.parentRegion === 'header') { score += 0.1; rationale.push('Appears in the page header.'); }
  if (image.alt) { score += 0.08; rationale.push('Includes descriptive alt text.'); }
  if (image.width && image.height) {
    const area = image.width * image.height;
    if (area >= 600000) { score += 0.18; rationale.push('Declared dimensions suggest suitability for prominent placement.'); }
    else if (area < 40000) { score -= 0.16; rationale.push('Declared dimensions suggest a small utility asset.'); }
  }
  if (/placeholder|spacer|pixel|tracking|badge|icon/i.test(haystack)) { score -= 0.35; rationale.push('Filename or context suggests utility imagery rather than brand storytelling.'); }
  if (LOGO_TERMS.test(haystack)) { score -= 0.2; rationale.push('Handled separately as a logo candidate.'); }
  return { score: Math.max(0, Math.min(1, Number(score.toFixed(2)))), rationale };
}

function candidateRoles(image) {
  const haystack = `${image.src} ${image.alt} ${image.className} ${image.contextText}`;
  const roles = [];
  if (image.width && image.height && image.width / image.height >= 1.5) roles.push('hero', 'section-banner');
  if (PRODUCT_TERMS.test(haystack)) roles.push('product-card');
  if (ATMOSPHERE_TERMS.test(haystack)) roles.push('brand-atmosphere', 'experience-card');
  if (image.parentRegion === 'section' || image.parentRegion === 'article') roles.push('content-support');
  if (roles.length === 0) roles.push('unknown');
  return [...new Set(roles)];
}

export function normalizeImagery(observations, evidence) {
  const logos = new Set((observations?.likelyLogos ?? []).map((item) => item.src));
  return (observations?.images ?? [])
    .map((image, index) => ({ image, index }))
    .filter(({ image }) => !logos.has(image.src))
    .map(({ image, index }) => {
      const { score, rationale } = scoreImage(image);
      const haystack = `${image.alt} ${image.contextText} ${image.src}`;
      const peopleLikely = PEOPLE_TERMS.test(haystack);
      const rightsStatus = 'unknown';
      const safeguards = ['Owner approval required before reuse outside the source website.'];
      if (peopleLikely) safeguards.push('Confirm consent and appropriate reuse rights for identifiable people, especially minors.');
      if (!image.alt) safeguards.push('Create contextual alt text before application use.');
      if (!image.width || !image.height) safeguards.push('Verify intrinsic dimensions and crop suitability before prominent placement.');
      return {
        id: `imagery.${String(index + 1).padStart(3, '0')}`,
        location: image.src,
        candidateRoles: candidateRoles(image),
        score,
        status: 'derived',
        requiresOwnerReview: true,
        evidenceIds: [evidenceIdFor(image, index, evidence)],
        rationale: rationale.length ? rationale : ['Discovered in authorized website markup.'],
        alt: image.alt || '',
        parentRegion: image.parentRegion || 'unknown',
        width: image.width,
        height: image.height,
        orientation: image.width && image.height ? (image.width > image.height ? 'landscape' : image.width < image.height ? 'portrait' : 'square') : 'unknown',
        peopleLikely,
        rightsStatus,
        safeguards
      };
    })
    .filter((candidate) => candidate.score >= 0.2)
    .sort((a, b) => b.score - a.score);
}
