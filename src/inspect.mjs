import { extractCssEvidence, extractHtmlEvidence } from './extract.mjs';

const DEFAULT_TIMEOUT_MS = 12000;
const USER_AGENT = 'BrandImporter/0.1 (+https://github.com/quenaF/brand-importer)';

async function fetchText(url, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': USER_AGENT, accept: 'text/html,text/css;q=0.9,*/*;q=0.1' }
    });
    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url || url,
      contentType: response.headers.get('content-type') ?? '',
      text: await response.text()
    };
  } finally {
    clearTimeout(timer);
  }
}

function now() {
  return new Date().toISOString();
}

function evidenceRecord(id, subjectPath, summary, sourceType, locator, method) {
  return {
    id,
    subjectPath,
    status: 'observed_live',
    summary,
    sources: [{ sourceType, locator, capturedAt: now() }],
    method
  };
}

function inventoryItem({ id, sourceId, type, location, status, httpStatus, mediaType, title, notes, error }) {
  return Object.fromEntries(Object.entries({ id, sourceId, type, location, status, httpStatus, mediaType, title, notes, error }).filter(([, value]) => value !== undefined));
}

export async function inspectUrl(request) {
  if (!request?.sourceUrl) throw new Error('sourceUrl is required');
  if (!['owner-provided', 'owner-authorized', 'public-reference'].includes(request.authorization)) {
    throw new Error('authorization must be owner-provided, owner-authorized, or public-reference');
  }

  const capturedAt = now();
  const items = [];
  const evidence = [];
  const pageResult = await fetchText(request.sourceUrl);
  const html = extractHtmlEvidence(pageResult.text, pageResult.finalUrl);

  items.push(inventoryItem({
    id: 'page.home',
    sourceId: request.primarySourceId ?? 'source.website',
    type: 'page',
    location: pageResult.finalUrl,
    status: pageResult.ok ? 'inspected' : 'failed',
    httpStatus: pageResult.status,
    mediaType: pageResult.contentType,
    title: html.page.title,
    error: pageResult.ok ? undefined : 'Homepage could not be fetched successfully.'
  }));

  evidence.push(evidenceRecord('ev.page.title', '/observations/page/title', `Observed page title: ${html.page.title || '(empty)'}`, 'website', pageResult.finalUrl, 'HTML title extraction'));
  if (html.page.description) evidence.push(evidenceRecord('ev.page.description', '/observations/page/description', 'Observed meta description.', 'website', pageResult.finalUrl, 'HTML meta extraction'));
  if (html.themeColor) evidence.push(evidenceRecord('ev.color.theme', '/observations/colors/themeColor', `Observed theme-color ${html.themeColor}.`, 'website', pageResult.finalUrl, 'HTML meta extraction'));

  for (const [index, logo] of html.likelyLogos.entries()) {
    const id = `asset.logo.${index + 1}`;
    items.push(inventoryItem({
      id,
      sourceId: request.primarySourceId ?? 'source.website',
      type: 'logo',
      location: logo.src,
      status: 'discovered-not-inspected',
      notes: [`alt=${logo.alt || '(empty)'}`, `class=${logo.className || '(empty)'}`, `elementId=${logo.id || '(empty)'}`]
    }));
    evidence.push(evidenceRecord(`ev.logo.${index + 1}`, `/observations/assets/${id}`, `Observed likely logo candidate ${logo.src}.`, 'asset', logo.src, 'Filename, alt text, class, or id matched logo/wordmark/brand'));
  }

  for (const [index, icon] of html.icons.entries()) {
    items.push(inventoryItem({
      id: `asset.icon.${index + 1}`,
      sourceId: request.primarySourceId ?? 'source.website',
      type: 'image',
      location: icon,
      status: 'discovered-not-inspected',
      notes: ['Referenced by an icon link relation.']
    }));
  }

  const cssObservations = [html.inlineCss];
  for (const [index, stylesheetUrl] of html.stylesheets.entries()) {
    try {
      const cssResult = await fetchText(stylesheetUrl);
      items.push(inventoryItem({
        id: `asset.stylesheet.${index + 1}`,
        sourceId: request.primarySourceId ?? 'source.website',
        type: 'stylesheet',
        location: cssResult.finalUrl,
        status: cssResult.ok ? 'inspected' : 'failed',
        httpStatus: cssResult.status,
        mediaType: cssResult.contentType,
        error: cssResult.ok ? undefined : 'Stylesheet could not be fetched successfully.'
      }));
      if (cssResult.ok) cssObservations.push(extractCssEvidence(cssResult.text, cssResult.finalUrl));
    } catch (error) {
      items.push(inventoryItem({
        id: `asset.stylesheet.${index + 1}`,
        sourceId: request.primarySourceId ?? 'source.website',
        type: 'stylesheet',
        location: stylesheetUrl,
        status: 'failed',
        error: error.message
      }));
    }
  }

  const colorMap = new Map();
  const fontMap = new Map();
  const variableMap = new Map();
  for (const observation of cssObservations) {
    for (const color of observation.colors) {
      const current = colorMap.get(color) ?? { value: color, count: 0, sources: [] };
      current.count += 1;
      current.sources.push(observation.sourceUrl);
      colorMap.set(color, current);
    }
    for (const font of observation.fontFamilies) {
      const current = fontMap.get(font) ?? { value: font, count: 0, sources: [] };
      current.count += 1;
      current.sources.push(observation.sourceUrl);
      fontMap.set(font, current);
    }
    for (const variable of observation.variables) variableMap.set(variable.name, variable.value);
  }

  const colors = [...colorMap.values()].sort((a, b) => b.count - a.count);
  const fonts = [...fontMap.values()].sort((a, b) => b.count - a.count);
  colors.forEach((color, index) => evidence.push(evidenceRecord(`ev.color.raw.${index + 1}`, `/observations/colors/${index}`, `Observed color ${color.value} in ${color.count} inspected CSS source(s).`, 'stylesheet', color.sources[0], 'CSS token scan')));
  fonts.forEach((font, index) => evidence.push(evidenceRecord(`ev.font.raw.${index + 1}`, `/observations/fonts/${index}`, `Observed font family ${font.value}.`, 'stylesheet', font.sources[0], 'CSS font-family scan')));

  return {
    sourceInventory: {
      schemaVersion: '0.1.0',
      requestId: request.requestId,
      capturedAt,
      items
    },
    observations: {
      page: html.page,
      colors,
      fonts,
      cssVariables: Object.fromEntries(variableMap),
      likelyLogos: html.likelyLogos,
      icons: html.icons,
      headings: html.headings,
      callsToAction: html.callsToAction,
      navigation: html.navigation
    },
    evidence: {
      schemaVersion: '0.1.0',
      generatedAt: now(),
      records: evidence
    }
  };
}
