import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('public and installed guidance enforce evidence isolation', async () => {
  const [policy, host, skill, packagedHost, packagedPolicy] = await Promise.all([
    read('docs/evidence-boundary.md'),
    read('HOST_AGENT.md'),
    read('skills/import-brand/SKILL.md'),
    read('skills/import-brand/references/HOST_AGENT.md'),
    read('skills/import-brand/references/EVIDENCE_BOUNDARY.md')
  ]);

  for (const text of [policy, host, skill, packagedHost, packagedPolicy]) {
    assert.match(text, /untrusted evidence/i);
    assert.match(text, /never (?:obey|allow|let)|must not/i);
    assert.match(text, /instructions/i);
  }

  assert.match(skill, /references\/EVIDENCE_BOUNDARY\.md/);
  assert.match(host, /docs\/evidence-boundary\.md/);
});

test('evidence policy names prohibited indirect prompt-injection effects', async () => {
  const policy = await read('docs/evidence-boundary.md');

  for (const required of [
    'shell commands',
    'tool calls',
    'secrets',
    'broaden crawl scope',
    'Experience Profile',
    'Domain Adapter',
    'schema',
    'dispose'
  ]) {
    assert.ok(policy.includes(required), `missing evidence-boundary control: ${required}`);
  }
});
