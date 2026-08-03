function slug(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function logoFingerprint(logo) {
  return `${logo.src ?? ''}|${logo.discoveryMethod ?? ''}|${logo.alt ?? ''}|${logo.elementId ?? ''}`.toLowerCase();
}

function inferRoles(logo, index) {
  const text = `${logo.alt ?? ''} ${logo.className ?? ''} ${logo.elementId ?? ''} ${logo.src ?? ''} ${logo.parentRegion ?? ''}`;
  const roles = [];
  if (/wordmark|logotype|text-logo/i.test(text)) roles.push('wordmark');
  if (/icon|symbol|mark|emblem|monogram/i.test(text)) roles.push('mark');
  if (/header|navbar|site-header|primary|main-logo/i.test(text) || logo.parentRegion === 'header') roles.push('primary-logo');
  if (/footer|secondary|alternate|alt-logo/i.test(text) || logo.parentRegion === 'footer') roles.push('secondary-logo');
  if (logo.discoveryMethod === 'inline-svg' && !roles.includes('mark') && !roles.includes('wordmark')) roles.push('mark');
  if (!roles.length) roles.push(index === 0 ? 'primary-logo' : 'secondary-logo');
  return unique(roles);
}

function scoreLogo(logo, roles, index) {
  const text = `${logo.alt ?? ''} ${logo.className ?? ''} ${logo.elementId ?? ''} ${logo.src ?? ''}`;
  let score = 0.42;
  const rationale = [];
  if (roles.includes('primary-logo')) { score += 0.2; rationale.push('Header or primary placement supports primary-logo candidacy.'); }
  if (roles.includes('wordmark')) { score += 0.11; rationale.push('Markup or filename indicates a wordmark/logotype.'); }
  if (roles.includes('mark')) { score += 0.07; rationale.push('Markup or filename indicates a standalone brand mark.'); }
  if (logo.alt && /logo|brand|wordmark/i.test(logo.alt)) { score += 0.1; rationale.push('Accessible labeling identifies the asset as a brand logo.'); }
  if (logo.discoveryMethod === 'inline-svg') { score += 0.08; rationale.push('Inline SVG in branded page chrome is a high-value fallback candidate.'); }
  if (/\.svg(?:$|[?#])/i.test(logo.src ?? '')) { score += 0.06; rationale.push('Vector format is suitable for reusable interface placement.'); }
  if (logo.width && logo.height) {
    const ratio = logo.width / logo.height;
    if (ratio >= 2.2) { score += 0.05; rationale.push('Wide aspect ratio is consistent with a wordmark.'); }
    if (ratio <= 1.4) { score += 0.03; rationale.push('Compact aspect ratio is consistent with a brand mark.'); }
  }
  if (/favicon|icon-\d+|apple-touch|social-share|og-image/i.test(text)) {
    score -= 0.22;
    rationale.push('Icon/social metadata lowers confidence as the primary application logo.');
  }
  score -= Math.min(index * 0.015, 0.09);
  return { score: Number(Math.max(0.05, Math.min(0.99, score)).toFixed(3)), rationale };
}

export function normalizeAssets(observations, evidence) {
  const records = (evidence?.records ?? []).filter((record) => record.id.startsWith('ev.logo.'));
  const seen = new Set();
  return (observations?.likelyLogos ?? [])
    .filter((logo) => {
      const fingerprint = logoFingerprint(logo);
      if (seen.has(fingerprint)) return false;
      seen.add(fingerprint);
      return Boolean(logo.src);
    })
    .map((logo, index) => {
      const candidateRoles = inferRoles(logo, index);
      const { score, rationale } = scoreLogo(logo, candidateRoles, index);
      return {
        id: `asset.logo.${slug(logo.src ?? String(index + 1)).slice(-48) || index + 1}`,
        location: logo.src,
        candidateRoles,
        score,
        status: 'derived',
        requiresOwnerReview: true,
        evidenceIds: [records[index]?.id ?? `ev.logo.${index + 1}`],
        rationale: [
          ...rationale,
          'Ranking is provisional and does not establish trademark permission or owner approval.'
        ],
        alt: logo.alt ?? '',
        discoveryMethod: logo.discoveryMethod ?? 'img',
        sourcePage: logo.sourcePage ?? null,
        inlineSvg: Boolean(logo.inlineSvg),
        width: logo.width ?? null,
        height: logo.height ?? null
      };
    })
    .sort((a, b) => b.score - a.score || a.location.localeCompare(b.location));
}
