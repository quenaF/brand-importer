import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const skillDir = path.join(root, 'skills', 'import-brand');
const skillPath = path.join(skillDir, 'SKILL.md');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function frontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, 'SKILL.md must begin with YAML frontmatter');
  return match[1];
}

test('Replit skill package follows Agent Skills directory contract', () => {
  assert.equal(fs.existsSync(skillPath), true);
  assert.equal(path.basename(skillDir), 'import-brand');
  assert.equal(fs.existsSync(path.join(skillDir, 'references', 'HOST_AGENT.md')), true);
  assert.equal(fs.existsSync(path.join(skillDir, 'references', 'REPLIT.md')), true);
});

test('SKILL.md publishes required and portable metadata', () => {
  const markdown = read('skills/import-brand/SKILL.md');
  const yaml = frontmatter(markdown);
  assert.match(yaml, /^name: import-brand$/m);
  assert.match(yaml, /^description: .+/m);
  assert.match(yaml, /^license: Apache-2\.0$/m);
  assert.match(yaml, /^compatibility: .+/m);
  assert.match(yaml, /^  repository: quenaF\/brand-importer$/m);
  assert.match(yaml, /^  version: 0\.1\.0-rc1$/m);
});

test('installed skill references only packaged host guidance', () => {
  const markdown = read('skills/import-brand/SKILL.md');
  assert.match(markdown, /references\/HOST_AGENT\.md/);
  assert.equal(markdown.includes('../../HOST_AGENT.md'), false);
  assert.equal(markdown.includes('/docs/'), false);
});

test('Replit install guide contains the canonical CLI target', () => {
  const guide = read('skills/import-brand/references/REPLIT.md');
  assert.match(guide, /npx skills add quenaF\/brand-importer --skill import-brand -a replit/);
  assert.match(guide, /\.agents\/skills\/import-brand/);
});
