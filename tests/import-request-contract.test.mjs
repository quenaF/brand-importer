import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveWebsiteSource } from '../src/inspect.mjs';

const canonicalRequest = {
  schemaVersion: '0.1.0',
  requestId: 'wrv-003',
  sources: [
    {
      id: 'src.website',
      type: 'website',
      location: 'https://www.waveridingvehicles.com/'
    }
  ],
  authorization: {
    status: 'owner-authorized',
    assertedBy: 'prototype owner',
    note: 'Authorized white-label prototype test.'
  },
  requestedOutputs: ['source-inventory', 'observations', 'evidence']
};

test('canonical request resolves the website source used by the runtime', () => {
  const resolved = resolveWebsiteSource(canonicalRequest);
  assert.equal(resolved.source.id, 'src.website');
  assert.equal(resolved.sourceUrl, 'https://www.waveridingvehicles.com/');
  assert.equal(resolved.authorizationStatus, 'owner-authorized');
});

test('legacy flat request is rejected instead of silently becoming a second contract', () => {
  assert.throws(
    () => resolveWebsiteSource({ requestId: 'legacy', sourceUrl: 'https://example.com', authorization: 'owner-authorized' }),
    /schemaVersion must be 0\.1\.0/
  );
});

test('v0.1 requires exactly one website source', () => {
  assert.throws(
    () => resolveWebsiteSource({ ...canonicalRequest, sources: [] }),
    /Exactly one website source is required/
  );
});
