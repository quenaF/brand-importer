import test from 'node:test';
import assert from 'node:assert/strict';
import { extractCssEvidence, extractHtmlEvidence } from '../src/extract.mjs';

test('extractHtmlEvidence finds metadata, stylesheets, logos, CTAs, and navigation', () => {
  const html = `<!doctype html>
  <html><head>
    <title>Harborlight Camp</title>
    <meta name="description" content="Adventure families can trust.">
    <meta name="theme-color" content="#12324A">
    <link rel="stylesheet" href="/styles.css">
    <link rel="icon" href="/favicon.svg">
    <style>:root { --brand-primary: #12324A; } body { font-family: Inter, sans-serif; }</style>
  </head><body>
    <header><nav><a href="/programs">Programs</a></nav></header>
    <img src="/harborlight-logo.svg" alt="Harborlight logo">
    <h1>Adventure families can trust.</h1>
    <button>Review pickup details</button>
  </body></html>`;

  const result = extractHtmlEvidence(html, 'https://example.com/');
  assert.equal(result.page.title, 'Harborlight Camp');
  assert.equal(result.page.description, 'Adventure families can trust.');
  assert.deepEqual(result.stylesheets, ['https://example.com/styles.css']);
  assert.deepEqual(result.icons, ['https://example.com/favicon.svg']);
  assert.equal(result.likelyLogos[0].src, 'https://example.com/harborlight-logo.svg');
  assert.deepEqual(result.callsToAction, ['Programs', 'Review pickup details']);
  assert.deepEqual(result.navigation, ['Programs']);
  assert.ok(result.inlineCss.colors.includes('#12324A'));
  assert.ok(result.inlineCss.fontFamilies.includes('Inter'));
});

test('extractCssEvidence preserves raw observations without assigning brand roles', () => {
  const css = `
    :root { --primary: #112233; --accent: rgb(244, 122, 97); }
    @font-face { font-family: "Camp Display"; src: url(display.woff2); }
    body { color: #112233; font-family: Inter, sans-serif; }
  `;
  const result = extractCssEvidence(css, 'https://example.com/styles.css');
  assert.ok(result.colors.includes('#112233'));
  assert.ok(result.colors.includes('rgb(244, 122, 97)'));
  assert.deepEqual(result.variables, [
    { name: '--primary', value: '#112233' },
    { name: '--accent', value: 'rgb(244, 122, 97)' }
  ]);
  assert.ok(result.fontFamilies.includes('Inter'));
  assert.ok(result.fontFamilies.includes('Camp Display'));
  assert.equal(Object.hasOwn(result, 'primaryColor'), false);
});
