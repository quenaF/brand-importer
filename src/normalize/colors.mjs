const NAMED = new Map([
  ['black', '#000000'], ['white', '#ffffff'], ['red', '#ff0000'], ['transparent', 'transparent']
]);

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(Number(value))));
}

export function canonicalizeColor(input) {
  if (typeof input !== 'string') return null;
  const value = input.trim().toLowerCase();
  if (NAMED.has(value)) return NAMED.get(value);
  if (/^#[0-9a-f]{3}$/.test(value)) return `#${[...value.slice(1)].map((c) => c + c).join('')}`;
  if (/^#[0-9a-f]{6}$/.test(value)) return value;
  if (/^#[0-9a-f]{8}$/.test(value)) return value;
  const rgb = value.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/);
  if (rgb) {
    const hex = rgb.slice(1, 4).map((n) => clampByte(n).toString(16).padStart(2, '0')).join('');
    if (rgb[4] !== undefined && Number(rgb[4]) < 1) {
      return `#${hex}${clampByte(Number(rgb[4]) * 255).toString(16).padStart(2, '0')}`;
    }
    return `#${hex}`;
  }
  return value.startsWith('var(') ? null : value;
}

function luminance(hex) {
  if (!/^#[0-9a-f]{6}$/.test(hex)) return null;
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function saturation(hex) {
  if (!/^#[0-9a-f]{6}$/.test(hex)) return 0;
  const values = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return Math.max(...values) - Math.min(...values);
}

function rolesFor(value) {
  const lum = luminance(value);
  const sat = saturation(value);
  if (lum === null) return ['unknown'];
  const roles = [];
  if (lum < 0.18) roles.push('text', 'primary');
  if (lum > 0.9) roles.push('surface', 'background');
  if (lum >= 0.18 && lum <= 0.9 && sat < 0.12) roles.push('border', 'secondary');
  if (sat >= 0.35) roles.push('accent', 'primary');
  return [...new Set(roles.length ? roles : ['secondary'])];
}

function scoreColor({ count, value, sources }) {
  const sat = saturation(value);
  const lum = luminance(value);
  let score = Math.min(0.65, 0.2 + Math.log2(count + 1) * 0.09);
  if (sat >= 0.35) score += 0.12;
  if (lum !== null && (lum < 0.08 || lum > 0.95)) score += 0.05;
  if (sources.length > 1) score += 0.08;
  return Number(Math.min(0.95, score).toFixed(3));
}

export function normalizeColors(observations, evidence) {
  const evidenceBySummary = new Map((evidence?.records ?? [])
    .filter((record) => record.id.startsWith('ev.color.raw.'))
    .map((record) => [record.summary, record.id]));
  const groups = new Map();
  for (const raw of observations?.colors ?? []) {
    const value = canonicalizeColor(raw.value);
    if (!value || value === 'transparent') continue;
    const current = groups.get(value) ?? { value, count: 0, sources: new Set(), evidenceIds: new Set(), rawValues: new Set() };
    current.count += Math.max(1, raw.count ?? 1);
    for (const source of raw.sources ?? []) current.sources.add(source);
    current.rawValues.add(raw.value);
    const expected = `Observed color ${raw.value} in ${raw.count ?? 1} inspected CSS source(s).`;
    const evidenceId = evidenceBySummary.get(expected);
    if (evidenceId) current.evidenceIds.add(evidenceId);
    groups.set(value, current);
  }
  return [...groups.values()]
    .map((group) => {
      const sources = [...group.sources];
      const evidenceIds = [...group.evidenceIds];
      return {
        id: `color.${group.value.replace('#', '')}`,
        value: group.value,
        candidateRoles: rolesFor(group.value),
        score: scoreColor({ count: group.count, value: group.value, sources }),
        status: 'derived',
        requiresOwnerReview: true,
        evidenceIds: evidenceIds.length ? evidenceIds : ['ev.color.unresolved'],
        rationale: [
          `Merged ${group.rawValues.size} raw representation(s) into one canonical color.`,
          `Observed ${group.count} time(s) across ${Math.max(1, sources.length)} inspected source(s).`,
          'Candidate roles are provisional heuristics based on luminance, saturation, and recurrence.'
        ],
        occurrences: group.count,
        sources
      };
    })
    .sort((a, b) => b.score - a.score || b.occurrences - a.occurrences);
}
