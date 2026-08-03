import { normalizeColors } from './colors.mjs';
import { findUnresolvedFontReferences, normalizeTypography } from './typography.mjs';
import { normalizeAssets } from './assets.mjs';
import { normalizeImagery } from './imagery.mjs';

export function normalizeImport({ request, observations, evidence }) {
  if (!request?.requestId) throw new Error('Canonical import request with requestId is required.');
  const colors = normalizeColors(observations, evidence);
  const unresolvedFontReferences = findUnresolvedFontReferences(observations);
  const typography = normalizeTypography(observations, evidence);
  const assets = normalizeAssets(observations, evidence);
  const imagery = normalizeImagery(observations, evidence);
  const unknowns = [];
  if (colors.length === 0) unknowns.push({ id: 'unknown.colors', question: 'Which colors define the active brand palette?', impact: 'material', recommendedAction: 'Provide brand guidance or inspect additional authorized pages.' });
  if (!typography.some((font) => !font.excludedFromBrandTypography)) unknowns.push({ id: 'unknown.typography', question: 'Which type family represents the active brand?', impact: 'material', recommendedAction: 'Provide brand guidance or inspect rendered typography.' });
  if (unresolvedFontReferences.length > 0) unknowns.push({
    id: 'unknown.font-variables',
    question: 'Which concrete font families do the unresolved CSS font variables represent?',
    impact: 'material',
    recommendedAction: `Resolve these references from inspected CSS variables or owner guidance: ${[...new Set(unresolvedFontReferences)].join(', ')}`
  });
  if (assets.length === 0) unknowns.push({ id: 'unknown.logo', question: 'Which logo asset is approved for application use?', impact: 'material', recommendedAction: 'Provide an approved logo file or inspect additional authorized pages.' });
  if (imagery.filter((item) => !item.utility).length === 0) unknowns.push({ id: 'unknown.imagery', question: 'Which site imagery is approved and suitable for reuse in the white-label product?', impact: 'material', recommendedAction: 'Inspect additional authorized pages or provide an approved image library.' });
  return {
    schemaVersion: '1.0.0',
    requestId: request.requestId,
    status: 'provisional',
    generatedAt: new Date().toISOString(),
    colors,
    typography,
    assets,
    imagery,
    unknowns,
    summary: {
      rawColorCount: observations?.colors?.length ?? 0,
      normalizedColorCount: colors.length,
      rawFontCount: observations?.fonts?.length ?? 0,
      normalizedFontCount: typography.length,
      logoCandidateCount: assets.length,
      rawImageCount: observations?.images?.length ?? 0,
      imageryCandidateCount: imagery.filter((item) => !item.utility).length
    }
  };
}
