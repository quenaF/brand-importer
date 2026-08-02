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

export function extractCssEvidence(cssText, sourceUrl) {
  const colors = uniq([...(cssText.match(HEX) ?? []), ...(cssText.match(RGB) ?? [])]);
  const variables = [];
  for (const match of cssText.matchAll(CSS_VAR)) {
    variables.push({ name: `--${match[1]}`, value: match[2].trim() });
  }
  const fontFamilies = [];
  for (const regex of [FONT_FAMILY, FONT_FACE]) {
    for (const match of cssText.matchAll(regex)) {
      fontFamilies.push(...match[1].split(',').map(clean));
    }
  }
  return {
    sourceUrl,
    colors,
    variables,
    fontFamilies: uniq(fontFamilies)
  };
}

export function extractHtmlEvidence(html, pageUrl) {
  const $ = cheerio.load(html);
  const title = clean($('title').first().text());
  const description = clean($('meta[name="description"]').attr('content'));
  const themeColor = clean($('meta[name="theme-color"]').attr('content'));
  const stylesheets = uniq($('link[rel~="stylesheet"]').map((_, el) => absolute(pageUrl, $(el).attr('href'))).get());
  const icons = uniq($('link[rel*="icon"]').map((_, el) => absolute(pageUrl, $(el).attr('href'))).get());
  const images = $('img').map((_, el) => ({
    src: absolute(pageUrl, $(el).attr('src')),
    alt: clean($(el).attr('alt')),
    className: clean($(el).attr('class')),
    id: clean($(el).attr('id'))
  })).get().filter((item) => item.src);
  const likelyLogos = images.filter((item) => /logo|wordmark|brand/i.test(`${item.src} ${item.alt} ${item.className} ${item.id}`));
  const inlineCss = uniq([
    ...$('style').map((_, el) => $(el).html() ?? '').get(),
    ...$('[style]').map((_, el) => $(el).attr('style') ?? '').get()
  ]).join('\n');
  const headings = $('h1,h2,h3').map((_, el) => ({
    level: el.tagName.toLowerCase(),
    text: clean($(el).text())
  })).get().filter((item) => item.text);
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
