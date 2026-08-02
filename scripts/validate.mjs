import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ROOT = process.cwd();
const SCHEMA_DIR = path.join(ROOT, 'schemas');

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read JSON ${filePath}: ${error.message}`);
  }
}

function createValidator() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  for (const name of fs.readdirSync(SCHEMA_DIR).filter((file) => file.endsWith('.json'))) {
    ajv.addSchema(readJson(path.join(SCHEMA_DIR, name)));
  }
  return ajv;
}

function schemaIdFor(filePath) {
  const name = path.basename(filePath);
  const mapping = {
    'brand-pack.json': 'https://brand-importer.dev/schemas/brand-pack.schema.json',
    'evidence.json': 'https://brand-importer.dev/schemas/evidence.schema.json',
    'import-request.json': 'https://brand-importer.dev/schemas/import-request.schema.json',
    'source-inventory.json': 'https://brand-importer.dev/schemas/source-inventory.schema.json',
    'owner-review.json': 'https://brand-importer.dev/schemas/owner-review.schema.json',
    'import-report.json': 'https://brand-importer.dev/schemas/import-report.schema.json'
  };
  return mapping[name];
}

function collectEvidenceIds(evidence) {
  return new Set((evidence?.records ?? []).map((record) => record.id));
}

function walkEvidenceRefs(value, pointer = '', found = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkEvidenceRefs(item, `${pointer}/${index}`, found));
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      const next = `${pointer}/${key}`;
      if (key === 'evidenceIds' && Array.isArray(child)) {
        child.forEach((id) => found.push({ id, pointer: next }));
      } else {
        walkEvidenceRefs(child, next, found);
      }
    }
  }
  return found;
}

export function validateBundle(bundleDir) {
  const ajv = createValidator();
  const errors = [];
  const documents = {};

  for (const filename of ['import-request.json', 'source-inventory.json', 'evidence.json', 'owner-review.json', 'import-report.json', 'brand-pack.json']) {
    const filePath = path.join(bundleDir, filename);
    if (!fs.existsSync(filePath)) continue;
    const document = readJson(filePath);
    documents[filename] = document;
    const schemaId = schemaIdFor(filePath);
    const validate = ajv.getSchema(schemaId);
    if (!validate) {
      errors.push(`${filename}: schema not registered (${schemaId})`);
      continue;
    }
    if (!validate(document)) {
      for (const error of validate.errors ?? []) {
        errors.push(`${filename}${error.instancePath || '/'}: ${error.message}`);
      }
    }
  }

  const evidenceIds = collectEvidenceIds(documents['evidence.json']);
  for (const filename of ['brand-pack.json', 'import-report.json', 'owner-review.json']) {
    const document = documents[filename];
    if (!document) continue;
    for (const ref of walkEvidenceRefs(document)) {
      if (!evidenceIds.has(ref.id)) errors.push(`${filename}${ref.pointer}: missing evidence record '${ref.id}'`);
    }
  }

  const report = documents['import-report.json'];
  const review = documents['owner-review.json'];
  const brandPack = documents['brand-pack.json'];

  const blockingUnknowns = (report?.unknowns ?? []).filter((item) => item.impact === 'blocking');
  if (report?.status === 'production-ready' && blockingUnknowns.length > 0) {
    errors.push('import-report.json: production-ready status is invalid while blocking unknowns remain');
  }
  if (report?.status === 'production-ready' && !['confirmed', 'confirmed-with-corrections'].includes(review?.status)) {
    errors.push('import-report.json: production-ready status requires completed owner review');
  }
  if (brandPack?.ownerReview?.status === 'confirmed' && review?.status === 'confirmed-with-corrections') {
    errors.push('brand-pack.json: owner review status does not preserve recorded corrections');
  }

  return { valid: errors.length === 0, errors };
}

function main() {
  const targets = process.argv.slice(2);
  const bundleDirs = targets.length > 0 ? targets : ['examples/01-synthetic-camp'];
  let failed = false;

  for (const target of bundleDirs) {
    const bundleDir = path.resolve(ROOT, target);
    const result = validateBundle(bundleDir);
    if (result.valid) {
      console.log(`✓ ${target}`);
    } else {
      failed = true;
      console.error(`✗ ${target}`);
      result.errors.forEach((error) => console.error(`  - ${error}`));
    }
  }

  if (failed) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) main();
