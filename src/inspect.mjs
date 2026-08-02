import { extractCssEvidence, extractHtmlEvidence } from './extract.mjs';

const DEFAULT_TIMEOUT_MS = 12000;
const USER_AGENT = 'BrandImporter/0.1 (+https://github.com/quenaF/brand-importer)';
const ALLOWED_AUTHORIZATION = new Set(['owner-provided', 'owner-authorized', 'public-reference']);

async function fetchText(url, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': USER_AGENT, accept: 'text/html,text/css;q=0.9,*/*;q=0.1' }
    });
    const text = await response.text();
    return { ok: response.ok, status: response.status, finalUrl: response.url || url, contentType: response.headers.get('content-type') ?? '', text };
  } finally {
    clearTimeout(timer);
  }
}

function now() { return new Date().toISOString(); }

function evidenceRecord(id, subjectPath, summary, sourceType, locator, method) {
  return { id, subjectPath, status: 'observed_live', summary, sources: [{ sourceType, locator, capturedAt: now() }], method };
}

export function resolveWebsiteSource(request) {
  if (!request || typeof request !== 'object') throw new Error('A canonical import request object is required.');
  if (request.schemaVersion !== '0.1.0') throw new Error('schemaVersion must be 0.1.0');
  if (!request.requestId) throw new Error('requestId is required');
  const authorizationStatus = request.authorization?.status;
  if (!ALLOWED_AUTHORIZATION.has(authorizationStatus)) throw new Error('authorization.status must be owner-provided, owner-authorized, or public-reference');
  const websiteSources = (request.sources ?? []).filter((source) => source.type === 'website');
  if (websiteSources.length !== 1) throw new Error('Exactly one website source is required for v0.1 observed extraction.');
  const source = websiteSources[0];
  let url;
  try { url = new URL(source.location); } catch { throw new Error(`Website source '${source.id}' must contain a valid absolute URL.`); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error(`Website source '${source.id}' must use http or https.`);
  return { source, sourceUrl: url.toString(), authorizationStatus };
}

export async function inspectUrl(request) {
  const { source, sourceUrl } = resolveWebsiteSource(request);
  const pageResult = await fetchText(sourceUrl);
  const items = [];
  const evidence = [];
  const html = extractHtmlEvidence(pageResult.text, pageResult.finalUrl);

  items.push({ id: 'page.home', sourceId: source.id, type: 'page', location: pageResult.finalUrl, status: pageResult.ok ? 'inspected' : 'failed', httpStatus: pageResult.status, mediaType: pageResult.contentType, title: html.page.title, ...(pageResult.ok ? {} : { error: 'Homepage could not be fetched successfully.' }) });
  evidence.push(evidenceRecord('ev.page.title', '/observations/page/title', `Observed page title: ${html.page.title || '(empty)'}`, 'website', pageResult.finalUrl, 'HTML title extraction'));
  if (html.page.description) evidence.push(evidenceRecord('ev.page.description', '/observations/page/description', 'Observed meta description.', 'website', pageResult.finalUrl, 'HTML meta extraction'));
  if (html.themeColor) evidence.push(evidenceRecord('ev.color.theme', '/observations/colors/themeColor', `Observed theme-color ${html.themeColor}.`, 'website', pageResult.finalUrl, 'HTML meta extraction'));

  const logoLocations = new Set(html.likelyLogos.map((item) => item.src));
  for (const [index, image] of html.images.entries()) {
    const isLogo = logoLocations.has(image.src);
    const id = isLogo ? `asset.logo.${html.likelyLogos.findIndex((item) => item.src === image.src) + 1}` : `asset.image.${index + 1}`;
    items.push({
      id,
      sourceId: source.id,
      type: isLogo ? 'logo' : 'image',
      location: image.src,
      status: 'discovered-not-inspected',
      selectors: [image.alt, image.className, image.elementId, image.parentRegion].filter(Boolean),
      notes: [isLogo ? 'Likely logo candidate identified from filename, alt text, class, or element id.' : 'Brand imagery candidate discovered in page markup.']
    });
    const evidenceId = isLogo ? `ev.logo.${html.likelyLogos.findIndex((item) => item.src === image.src) + 1}` : `ev.image.${index + 1}`;
    evidence.push(evidenceRecord(evidenceId, `/observations/images/${index}`, `Observed ${isLogo ? 'likely logo' : 'image'} candidate ${image.src}.`, 'asset', image.src, isLogo ? 'Logo/wordmark/brand heuristic' : 'HTML image discovery with contextual metadata'));
  }

  for (const [index, icon] of html.icons.entries()) items.push({ id: `asset.icon.${index + 1}`, sourceId: source.id, type: 'image', location: icon, status: 'discovered-not-inspected', notes: ['Referenced as a page icon.'] });

  const cssObservations = [html.inlineCss];
  for (const [index, stylesheetUrl] of html.stylesheets.entries()) {
    try {
      const cssResult = await fetchText(stylesheetUrl);
      items.push({ id: `asset.stylesheet.${index + 1}`, sourceId: source.id, type: 'stylesheet', location: cssResult.finalUrl, status: cssResult.ok ? 'inspected' : 'failed', httpStatus: cssResult.status, mediaType: cssResult.contentType, ...(cssResult.ok ? {} : { error: 'Stylesheet could not be fetched successfully.' }) });
      if (cssResult.ok) cssObservations.push(extractCssEvidence(cssResult.text, cssResult.finalUrl));
    } catch (error) {
      items.push({ id: `asset.stylesheet.${index + 1}`, sourceId: source.id, type: 'stylesheet', location: stylesheetUrl, status: 'failed', error: error.message });
    }
  }

  const colorMap = new Map();
  const fontMap = new Map();
  const variableMap = new Map();
  for (const observation of cssObservations) {
    for (const color of observation.colors) {
      const current = colorMap.get(color) ?? { value: color, count: 0, sources: [] };
      current.count += 1; current.sources.push(observation.sourceUrl); colorMap.set(color, current);
    }
    for (const font of observation.fontFamilies) {
      const current = fontMap.get(font) ?? { value: font, count: 0, sources: [] };
      current.count += 1; current.sources.push(observation.sourceUrl); fontMap.set(font, current);
    }
    for (const variable of observation.variables) variableMap.set(variable.name, variable.value);
  }

  const colors = [...colorMap.values()].sort((a, b) => b.count - a.count);
  const fonts = [...fontMap.values()].sort((a, b) => b.count - a.count);
  colors.forEach((color, index) => evidence.push(evidenceRecord(`ev.color.raw.${index + 1}`, `/observations/colors/${index}`, `Observed color ${color.value} in ${color.count} inspected CSS source(s).`, 'stylesheet', color.sources[0], 'CSS token scan')));
  fonts.forEach((font, index) => evidence.push(evidenceRecord(`ev.font.raw.${index + 1}`, `/observations/fonts/${index}`, `Observed font family ${font.value}.`, 'stylesheet', font.sources[0], 'CSS font-family scan')));

  return {
    sourceInventory: { schemaVersion: '0.1.0', requestId: request.requestId, capturedAt: now(), items },
    observations: {
      page: html.page,
      colors,
      fonts,
      cssVariables: Object.fromEntries(variableMap),
      images: html.images,
      likelyLogos: html.likelyLogos,
      icons: html.icons,
      headings: html.headings,
      callsToAction: html.callsToAction,
      navigation: html.navigation
    },
    evidence: { schemaVersion: '0.1.0', generatedAt: now(), records: evidence }
  };
}
