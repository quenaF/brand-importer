import * as cheerio from 'cheerio';

const HEX = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const RGB = /rgba?\([^)]*\)/g;
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

export function extractCssEvidence(cssText, sourceUrl) {
  const colors = uniq([...(cssText.match(HEX) ?? []), ...(cssText.match(RGB) ?? [])]);
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
      contextText
    };
  }).get().filter((item) => item.src);
  const likelyLogos = images.filter((item) => /logo|wordmark|brand/i.test(`${item.src} ${item.alt} ${item.className} ${item.elementId}`));
  const inlineCss = uniq([
    ...$('style').map((_, el) => $(el).html() ?? '').get(),
    ...$('[style]').map((_, el) => $(el).attr('style') ?? '').get()
  ]).join('\n');
  const headings = $('h1,h2,h3').map((_, el) => ({ level: el.tagName.toLowerCase(), text: clean($(el).text()) })).get().filter((item) => item.text);
  const callsToAction = $('a,button,input[type="submit"]').map((_, el) => clean($(el).text() || $(el).attr('value') || $(el).attr('aria-label'))).get().filter(Boolean);
  const navigation = $('nav a, header a').map((_, el) => clean($(el).text())).get().filter(Boolean);

  return {
    page: { url: pageUrl, title, description },
    stylesheets,
    icons,
    images,
    likelyLogos,
    inlineCss: extractCssEvidence(inlineCss, `${pageUrl}#inline-styles`),
    themeColor: themeColor || null,
    headings,
    callsToAction: uniq(callsToAction),
    navigation: uniq(navigation)
  };
}
