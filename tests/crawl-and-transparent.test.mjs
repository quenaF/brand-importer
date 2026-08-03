import test from 'node:test';
import assert from 'node:assert/strict';
import { extractHtmlEvidence } from '../src/extract.mjs';
import { canonicalizeColor, normalizeColors } from '../src/normalize/colors.mjs';

test('extractHtmlEvidence discovers same-origin links with text context', () => {
  const html = `<!doctype html><html><body>
    <a href="/pages/surf-camp">Surf Camp</a>
    <a href="https://example.com/pages/about">About Us</a>
    <a href="https://other.example/community">External</a>
  </body></html>`;
  const result = extractHtmlEvidence(html, 'https://example.com/');
  assert.deepEqual(result.internalLinks.map((item) => item.url), [
    'https://example.com/pages/surf-camp',
    'https://example.com/pages/about'
  ]);
  assert.equal(result.internalLinks[0].text, 'Surf Camp');
});

test('fully transparent colors are excluded from normalization', () => {
  assert.equal(canonicalizeColor('#00000000'), null);
  assert.equal(canonicalizeColor('rgba(0,0,0,0)'), null);
  const result = normalizeColors({ colors: [
    { value: '#00000000', count: 3, sources: ['a.css'] },
    { value: 'rgba(0,0,0,0)', count: 2, sources: ['b.css'] },
    { value: '#ff4f4f', count: 1, sources: ['c.css'] }
  ] }, { records: [{ id: 'ev.color.raw.3', summary: 'Observed color #ff4f4f in 1 inspected CSS source(s).' }] });
  assert.deepEqual(result.map((item) => item.value), ['#ff4f4f']);
});
