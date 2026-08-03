import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ROOT = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const schemaFiles = fs.readdirSync(path.join(ROOT, 'schemas')).filter((name) => name.endsWith('.schema.json'));
let failed = false;
for (const filename of schemaFiles) {
  try {
    const schema = readJson(`schemas/${filename}`);
    ajv.addSchema(schema);
    console.log(`✓ schema compiles: ${filename}`);
  } catch (error) {
    failed = true;
    console.error(`✗ schema failed: ${filename}: ${error.message}`);
  }
}

const examples = [
  ['schemas/experience-profile.schema.json', 'examples/02-youth-program-host/experience-profile.json'],
  ['schemas/domain-adapter-manifest.schema.json', 'examples/02-youth-program-host/domain-adapter-manifest.json']
];
for (const [schemaPath, examplePath] of examples) {
  const schema = readJson(schemaPath);
  const validate = ajv.getSchema(schema.$id) ?? ajv.compile(schema);
  const value = readJson(examplePath);
  if (validate(value)) {
    console.log(`✓ example validates: ${examplePath}`);
  } else {
    failed = true;
    console.error(`✗ example invalid: ${examplePath}`);
    for (const error of validate.errors ?? []) console.error(`  - ${error.instancePath || '/'} ${error.message}`);
  }
}

const requiredContracts = [
  'runtime-brand.schema.json',
  'experience-profile.schema.json',
  'domain-adapter-manifest.schema.json',
  'owner-decisions.schema.json',
  'imagery-review-plan.schema.json',
  'import-progress-event.schema.json',
  'import-report-v1.schema.json',
  'import-session.schema.json'
];
for (const filename of requiredContracts) {
  if (!schemaFiles.includes(filename)) {
    failed = true;
    console.error(`✗ required contract missing: ${filename}`);
  }
}

if (failed) process.exitCode = 1;
