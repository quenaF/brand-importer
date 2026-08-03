import test from 'node:test';
import assert from 'node:assert/strict';
import { isContractCompatible, validateAdapterCompatibility } from '../src/contracts/compatibility.mjs';

test('same major contract versions are compatible', () => {
  assert.equal(isContractCompatible('1.4.2', '^1.0.0'), true);
  assert.equal(isContractCompatible('2.0.0', '^1.0.0'), false);
});

test('adapter compatibility rejects example tenant fallback and major mismatch', () => {
  const result = validateAdapterCompatibility({
    runtimeBrand: { contractVersion: '2.0.0' },
    experienceProfile: { profileVersion: '1.0.0', brandInfluence: ['colors', 'approved-imagery'] },
    adapterManifest: {
      accepts: { runtimeBrand: '^1.0.0', experienceProfile: '^1.0.0' },
      capabilities: ['colors'],
      fallbackPolicy: { exampleTenantFallback: 'forbidden' }
    }
  });
  assert.equal(result.compatible, false);
  assert.ok(result.errors.some((error) => error.includes('Runtime Brand')));
  assert.deepEqual(result.unsupportedRequestedCapabilities, ['approved-imagery']);
});

test('compatible adapter reports unsupported optional capabilities without identity leakage', () => {
  const result = validateAdapterCompatibility({
    runtimeBrand: { contractVersion: '1.0.0' },
    experienceProfile: { profileVersion: '1.0.0', brandInfluence: ['colors', 'motion-guidance'] },
    adapterManifest: {
      accepts: { runtimeBrand: '^1.0.0', experienceProfile: '^1.0.0' },
      capabilities: ['colors'],
      fallbackPolicy: { exampleTenantFallback: 'forbidden' }
    }
  });
  assert.equal(result.compatible, true);
  assert.deepEqual(result.unsupportedRequestedCapabilities, ['motion-guidance']);
});
