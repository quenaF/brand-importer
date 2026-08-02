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
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url || url,
      contentType: response.headers.get('content-type') ?? '',
      text
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

export async function inspectUrl(request) {
  if (!request?.sourceUrl) throw new Error('sourceUrl is required');
  if (!['owner-provided', 'owner-authorized', 'public-reference'].includes(request.authorization)) {
    throw new Error('authorization must be owner-provided, owner-authorized, or public-reference');
  }

  const startedAt = now();
  const pageResult = await fetchText(request.sourceUrl);
  const pages = [];
  const assets = [];
  const failures = [];
  const evidence = [];

  if (!pageResult.ok) {
    failures.push({ location: request.sourceUrl, stage: 'page-fetch', status: pageResult.status, message: 'Homepage could not be fetched successfully.' });
  }

  const html = extractHtmlEvidence(pageResult.text, pageResult.finalUrl);
  pages.push({
    id: 'page.home',
    location: pageResult.finalUrl,
    pageType: 'homepage',
    status: pageResult.ok ? 'inspected' : 'failed',
    httpStatus: pageResult.status,
    title: html.page.title,
    capturedAt: now()
  });

  evidence.push(evidenceRecord('ev.page.title', '/observations/page/title', `Observed page title: ${html.page.title || '(empty)'}`, 'website', pageResult.finalUrl, 'HTML title extraction'));
  if (html.page.description) evidence.push(evidenceRecord('ev.page.description', '/observations/page/description', 'Observed meta description.', 'website', pageResult.finalUrl, 'HTML meta extraction'));
  if (html.themeColor) evidence.push(evidenceRecord('ev.color.theme', '/observations/colors/themeColor', `Observed theme-color ${html.themeColor}.`, 'website', pageResult.finalUrl, 'HTML meta extraction'));

  for (const [index, logo] of html.likelyLogos.entries()) {
    const id = `asset.logo.${index + 1}`;
    assets.push({ id, type: 'logo-candidate', location: logo.src, status: 'referenced', context: { alt: logo.alt, className: logo.className, elementId: logo.id } });
    evidence.push(evidenceRecord(`ev.logo.${index + 1}`, `/observations/assets/${id}`, `Observed likely logo candidate ${logo.src}.`, 'asset', logo.src, 'Filename, alt text, class, or id matched logo/wordmark/brand'));
  }

  for (const [index, icon] of html.icons.entries()) {
    assets.push({ id: `asset.icon.${index + 1}`, type: 'icon', location: icon, status: 'referenced' });
  }

  const cssObservations = [html.inlineCss];
  for (const [index, stylesheetUrl] of html.stylesheets.entries()) {
    try {
      const cssResult = await fetchText(stylesheetUrl);
      assets.push({ id: `asset.stylesheet.${index + 1}`, type: 'stylesheet', location: cssResult.finalUrl, status: cssResult.ok ? 'inspected' : 'failed', httpStatus: cssResult.status });
      if (cssResult.ok) cssObservations.push(extractCssEvidence(cssResult.text, cssResult.finalUrl));
      else failures.push({ location: stylesheetUrl, stage: 'stylesheet-fetch', status: cssResult.status, message: 'Stylesheet could not be fetched successfully.' });
    } catch (error) {
      failures.push({ location: stylesheetUrl, stage: 'stylesheet-fetch', message: error.message });
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
      startedAt,
      completedAt: now(),
      pages,
      assets,
      failures
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
