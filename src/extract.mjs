import * as cheerio from 'cheerio';

const HEX = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const CSS_VAR = /--([a-zA-Z0-9-_]+)\s*:\s*([^;}{]+)/g;
const FONT_FAMILY = /font-family\s*:\s*([^;}{]+)/gi;
const FONT_FACE = /@font-face\s*{[^}]*font-family\s*:\s*([^;}{]+)/gi;

function uniq(items) {
  return [...new Set(items.filter(Boolean))];
}

function clean(value) {
  return value?.trim().replace(/^['"]|['"]$/g, '') ?? '';
}

function absolute(baseUrl, candidate) {
  if (!candidate) return null;
  try {
    return new URL(candidate, baseUrl).href;
  } catch {
    return null;
  }
}

function numberOrNull(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function extractResolvedRgbFunctions(cssText) {
  const values = [];
  const startPattern = /rgba?\(/gi;
  for (const match of cssText.matchAll(startPattern)) {
    let depth = 1;
    let index = match.index + match[0].length;
    while (index < cssText.length && depth > 0) {
      if (cssText[index] === '(') depth += 1;
      else if (cssText[index] === ')') depth -= 1;
      index += 1;
    }
    if (depth !== 0) continue;
    const value = cssText.slice(match.index, index).trim();
    if (/var\(/i.test(value)) continue;
    if (/^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)$/i.test(value)) values.push(value);
  }
  return values;
}

export function extractCssEvidence(cssText, sourceUrl) {
  const colors = uniq([...(cssText.match(HEX) ?? []), ...extractResolvedRgbFunctions(cssText)]);
  const variables = [];
  for (const match of cssText.matchAll(CSS_VAR)) variables.push({ name: `--${match[1]}`, value: match[2].trim() });
  const fontFamilies = [];
  for (const regex of [FONT_FAMILY, FONT_FACE]) {
    for (const match of cssText.matchAll(regex)) fontFamilies.push(...match[1].split(',').map(clean));
  }
  return { sourceUrl, colors, variables, fontFamilies: uniq(fontFamilies) };
}

export function extractHtmlEvidence(html, pageUrl) {
  const $ = cheerio.load(html);
  const title = clean($('title').first().text());
  const description = clean($('meta[name="description"]').attr('content'));
  const themeColor = clean($('meta[name="theme-color"]').attr('content'));
  const stylesheets = uniq($('link[rel~="stylesheet"]').map((_, el) => absolute(pageUrl, $(el).attr('href'))).get());
  const icons = uniq($('link[rel*="icon"]').map((_, el) => absolute(pageUrl, $(el).attr('href'))).get());
  const pageOrigin = new URL(pageUrl).origin;
  const internalLinks = uniq($('a[href]').map((_, el) => {
    const href = absolute(pageUrl, $(el).attr('href'));
    if (!href) return null;
    const url = new URL(href);
    if (url.origin !== pageOrigin || !['http:', 'https:'].includes(url.protocol)) return null;
    url.hash = '';
    return { url: url.href, text: clean($(el).text()), rel: clean($(el).attr('rel')) };
  }).get().filter(Boolean).map((item) => JSON.stringify(item))).map((item) => JSON.parse(item));
  const images = $('img').map((index, el) => {
    const node = $(el);
    const parent = node.closest('header,main,section,article,footer,nav').first();
    const parentTag = parent.length ? parent.get(0)?.tagName?.toLowerCase() : '';
    const className = clean(node.attr('class'));
    const id = clean(node.attr('id'));
    const alt = clean(node.attr('alt'));
    const src = absolute(pageUrl, node.attr('src') || node.attr('data-src'));
    const srcset = clean(node.attr('srcset') || node.attr('data-srcset'));
    const width = numberOrNull(node.attr('width'));
    const height = numberOrNull(node.attr('height'));
    const link = absolute(pageUrl, node.closest('a').attr('href'));
    const contextText = clean(parent.text()).slice(0, 240);
    return {
      id: `image.${index + 1}`,
      src,
      srcset,
      alt,
      className,
      elementId: id,
      width,
      height,
      loading: clean(node.attr('loading')),
      parentRegion: parentTag || 'unknown',
      link,
      contextText,
      sourcePage: pageUrl
    };
  }).get().filter((item) => item.src);
  const likelyLogos = images.filter((item) => /logo|wordmark|brand/i.test(`${item.src} ${item.alt} ${item.className} ${item.elementId}`));
  const inlineCss = uniq([
    ...$('style').map((_, el) => $(el).html() ?? '').get(),
    ...$('[style]').map((_, el) => $(el).attr('style') ?? '').get()
  ]).join('\n');
  const headings = $('h1,h2,h3').map((_, el) => ({ level: el.tagName.toLowerCase(), text: clean($(el).text()), sourcePage: pageUrl })).get().filter((item) => item.text);
  const callsToAction = $('a,button,input[type="submit"]').map((_, el) => clean($(el).text() || $(el).attr('value') || $(el).attr('aria-label'))).get().filter(Boolean);
  const navigation = $('nav a, header a').map((_, el) => clean($(el).text())).get().filter(Boolean);

  return {
    page: { url: pageUrl, title, description },
    stylesheets,
    icons,
    internalLinks,
    images,
    likelyLogos,
    inlineCss: extractCssEvidence(inlineCss, `${pageUrl}#inline-styles`),
    themeColor: themeColor || null,
    headings,
    callsToAction: uniq(callsToAction),
    navigation: uniq(navigation)
  };
}
