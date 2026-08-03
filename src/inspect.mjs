import { extractCssEvidence, extractHtmlEvidence } from './extract.mjs';

const DEFAULT_TIMEOUT_MS = 12000;
const USER_AGENT = 'BrandImporter/0.1 (+https://github.com/quenaF/brand-importer)';
const ALLOWED_AUTHORIZATION = new Set(['owner-provided', 'owner-authorized', 'public-reference']);
const MAX_PAGES = 6;
const PAGE_KEYWORDS = ['camp', 'lesson', 'surf', 'about', 'community', 'program', 'experience', 'school', 'team', 'story'];

async function fetchText(url, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: 'follow', signal: controller.signal,
      headers: { 'user-agent': USER_AGENT, accept: 'text/html,text/css;q=0.9,*/*;q=0.1' }
    });
    const text = await response.text();
    return { ok: response.ok, status: response.status, finalUrl: response.url || url, contentType: response.headers.get('content-type') ?? '', text };
  } finally { clearTimeout(timer); }
}

function now() { return new Date().toISOString(); }
function evidenceRecord(id, subjectPath, summary, sourceType, locator, method) {
  return { id, subjectPath, status: 'observed_live', summary, sources: [{ sourceType, locator, capturedAt: now() }], method };
}
function slug(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'page'; }
function pageScore(link) {
  const haystack = `${link.url} ${link.text}`.toLowerCase();
  return PAGE_KEYWORDS.reduce((score, keyword) => score + (haystack.includes(keyword) ? 1 : 0), 0);
}
function selectCrawlUrls(homeUrl, links) {
  const home = new URL(homeUrl); home.hash = '';
  const unique = new Map();
  for (const link of links) {
    const url = new URL(link.url); url.hash = '';
    if (url.origin !== home.origin || url.href === home.href) continue;
    if (/\.(?:jpg|jpeg|png|gif|svg|webp|pdf|zip)(?:\?|$)/i.test(url.pathname)) continue;
    const score = pageScore(link);
    if (score < 1) continue;
    const current = unique.get(url.href);
    if (!current || score > current.score) unique.set(url.href, { ...link, url: url.href, score });
  }
  return [home.href, ...[...unique.values()].sort((a, b) => b.score - a.score || a.url.localeCompare(b.url)).slice(0, MAX_PAGES - 1).map((item) => item.url)];
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
  return { source, sourceUrl: url.toString() };
}

export async function inspectUrl(request) {
  const { source, sourceUrl } = resolveWebsiteSource(request);
  const firstResult = await fetchText(sourceUrl);
  const firstHtml = extractHtmlEvidence(firstResult.text, firstResult.finalUrl);
  const crawlUrls = selectCrawlUrls(firstResult.finalUrl, firstHtml.internalLinks);
  const pageResults = [{ result: firstResult, html: firstHtml }];
  for (const url of crawlUrls.slice(1)) {
    try {
      const result = await fetchText(url);
      pageResults.push({ result, html: extractHtmlEvidence(result.text, result.finalUrl) });
    } catch (error) {
      pageResults.push({ result: { ok: false, status: 0, finalUrl: url, contentType: '', text: '', error: error.message }, html: extractHtmlEvidence('', url) });
    }
  }

  const items = [];
  const evidence = [];
  const stylesheetUrls = new Set();
  const iconUrls = new Set();
  const imageMap = new Map();
  const logoMap = new Map();
  const headings = [];
  const callsToAction = new Set();
  const navigation = new Set();
  const cssObservations = [];
  const pages = [];

  pageResults.forEach(({ result, html }, pageIndex) => {
    const pageId = pageIndex === 0 ? 'home' : slug(new URL(result.finalUrl).pathname);
    pages.push(html.page);
    items.push({ id: `page.${pageId}`, sourceId: source.id, type: 'page', location: result.finalUrl, status: result.ok ? 'inspected' : 'failed', ...(result.status ? { httpStatus: result.status } : {}), mediaType: result.contentType, title: html.page.title, ...(result.ok ? {} : { error: result.error || 'Page could not be fetched successfully.' }) });
    evidence.push(evidenceRecord(`ev.page.${pageId}.title`, `/observations/pages/${pageIndex}/title`, `Observed page title: ${html.page.title || '(empty)'}`, 'website', result.finalUrl, 'HTML title extraction'));
    if (html.page.description) evidence.push(evidenceRecord(`ev.page.${pageId}.description`, `/observations/pages/${pageIndex}/description`, 'Observed meta description.', 'website', result.finalUrl, 'HTML meta extraction'));
    if (html.themeColor) evidence.push(evidenceRecord(`ev.page.${pageId}.theme-color`, `/observations/pages/${pageIndex}/themeColor`, `Observed theme-color ${html.themeColor}.`, 'website', result.finalUrl, 'HTML meta extraction'));
    cssObservations.push(html.inlineCss);
    html.stylesheets.forEach((url) => stylesheetUrls.add(url));
    html.icons.forEach((url) => iconUrls.add(url));
    html.headings.forEach((heading) => headings.push(heading));
    html.callsToAction.forEach((value) => callsToAction.add(value));
    html.navigation.forEach((value) => navigation.add(value));
    const logos = new Set(html.likelyLogos.map((item) => item.src));
    html.images.forEach((image) => {
      const existing = imageMap.get(image.src);
      if (!existing || (!existing.alt && image.alt)) imageMap.set(image.src, image);
      if (logos.has(image.src)) logoMap.set(image.src, image);
    });
  });

  [...imageMap.values()].forEach((image, index) => {
    const isLogo = logoMap.has(image.src);
    const id = isLogo ? `asset.logo.${[...logoMap.keys()].indexOf(image.src) + 1}` : `asset.image.${index + 1}`;
    items.push({ id, sourceId: source.id, type: isLogo ? 'logo' : 'image', location: image.src, status: 'discovered-not-inspected', selectors: [image.alt, image.className, image.elementId, image.parentRegion].filter(Boolean), notes: [isLogo ? 'Likely logo candidate.' : `Brand imagery candidate discovered on ${image.sourcePage}.`] });
    evidence.push(evidenceRecord(isLogo ? `ev.logo.${[...logoMap.keys()].indexOf(image.src) + 1}` : `ev.image.${index + 1}`, `/observations/images/${index}`, `Observed ${isLogo ? 'likely logo' : 'image'} candidate ${image.src}.`, 'asset', image.src, isLogo ? 'Logo heuristic' : 'HTML image discovery with page context'));
  });
  [...iconUrls].forEach((url, index) => items.push({ id: `asset.icon.${index + 1}`, sourceId: source.id, type: 'image', location: url, status: 'discovered-not-inspected', notes: ['Referenced as a page icon.'] }));

  for (const [index, stylesheetUrl] of [...stylesheetUrls].entries()) {
    try {
      const cssResult = await fetchText(stylesheetUrl);
      items.push({ id: `asset.stylesheet.${index + 1}`, sourceId: source.id, type: 'stylesheet', location: cssResult.finalUrl, status: cssResult.ok ? 'inspected' : 'failed', httpStatus: cssResult.status, mediaType: cssResult.contentType, ...(cssResult.ok ? {} : { error: 'Stylesheet could not be fetched successfully.' }) });
      if (cssResult.ok) cssObservations.push(extractCssEvidence(cssResult.text, cssResult.finalUrl));
    } catch (error) {
      items.push({ id: `asset.stylesheet.${index + 1}`, sourceId: source.id, type: 'stylesheet', location: stylesheetUrl, status: 'failed', error: error.message });
    }
  }

  const colorMap = new Map(), fontMap = new Map(), variableMap = new Map();
  for (const observation of cssObservations) {
    for (const color of observation.colors) { const current = colorMap.get(color) ?? { value: color, count: 0, sources: [] }; current.count += 1; current.sources.push(observation.sourceUrl); colorMap.set(color, current); }
    for (const font of observation.fontFamilies) { const current = fontMap.get(font) ?? { value: font, count: 0, sources: [] }; current.count += 1; current.sources.push(observation.sourceUrl); fontMap.set(font, current); }
    for (const variable of observation.variables) variableMap.set(variable.name, variable.value);
  }
  const colors = [...colorMap.values()].sort((a, b) => b.count - a.count);
  const fonts = [...fontMap.values()].sort((a, b) => b.count - a.count);
  colors.forEach((color, index) => evidence.push(evidenceRecord(`ev.color.raw.${index + 1}`, `/observations/colors/${index}`, `Observed color ${color.value} in ${color.count} inspected CSS source(s).`, 'stylesheet', color.sources[0], 'CSS token scan')));
  fonts.forEach((font, index) => evidence.push(evidenceRecord(`ev.font.raw.${index + 1}`, `/observations/fonts/${index}`, `Observed font family ${font.value}.`, 'stylesheet', font.sources[0], 'CSS font-family scan')));

  return {
    sourceInventory: { schemaVersion: '0.1.0', requestId: request.requestId, capturedAt: now(), items },
    observations: { page: pages[0], pages, crawl: { strategy: 'same-origin-keyword', maxPages: MAX_PAGES, inspectedUrls: pages.map((page) => page.url) }, colors, fonts, cssVariables: Object.fromEntries(variableMap), images: [...imageMap.values()], likelyLogos: [...logoMap.values()], icons: [...iconUrls], headings, callsToAction: [...callsToAction], navigation: [...navigation] },
    evidence: { schemaVersion: '0.1.0', generatedAt: now(), records: evidence }
  };
}
