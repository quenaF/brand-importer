import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { runBrandImport } from '../src/api.mjs';

function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
function writeJson(filePath, value) { fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); }

function validateRequest(request) {
  const schema = readJson(path.resolve(process.cwd(), 'schemas/import-request.schema.json'));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (validate(request)) return;
  const details = (validate.errors ?? []).map((error) => `${error.instancePath || '/'} ${error.message}`).join('; ');
  throw new Error(`Import request does not match the canonical schema: ${details}`);
}

async function main() {
  const [requestPath, outputDirArg, experienceProfilePath, ownerDecisionsPath] = process.argv.slice(2);
  if (!requestPath) {
    console.error('Usage: node scripts/import.mjs <import-request.json> [output-directory] [experience-profile.json] [owner-decisions.json]');
    process.exitCode = 1;
    return;
  }

  const request = readJson(path.resolve(process.cwd(), requestPath));
  validateRequest(request);
  const experienceProfile = experienceProfilePath ? readJson(path.resolve(process.cwd(), experienceProfilePath)) : undefined;
  const ownerDecisions = ownerDecisionsPath ? readJson(path.resolve(process.cwd(), ownerDecisionsPath)) : undefined;
  const outputDir = path.resolve(process.cwd(), outputDirArg ?? `imports/${request.requestId}`);
  fs.mkdirSync(outputDir, { recursive: true });

  const progressPath = path.join(outputDir, 'progress-events.ndjson');
  fs.writeFileSync(progressPath, '', 'utf8');
  const session = await runBrandImport(request, {
    experienceProfile,
    ownerDecisions,
    onProgress(event) {
      fs.appendFileSync(progressPath, `${JSON.stringify(event)}\n`, 'utf8');
      console.log(`${event.state === 'completed' ? '✓' : event.state === 'failed' ? '✗' : '•'} ${event.stage}: ${event.message ?? event.state}`);
    }
  });

  try {
    const bundle = session.exportBundle();
    writeJson(path.join(outputDir, 'import-request.json'), request);
    writeJson(path.join(outputDir, 'source-inventory.json'), bundle.sourceInventory);
    writeJson(path.join(outputDir, 'observations.json'), bundle.observations);
    writeJson(path.join(outputDir, 'evidence.json'), bundle.evidence);
    writeJson(path.join(outputDir, 'normalized-candidates.json'), bundle.normalizedCandidates);
    writeJson(path.join(outputDir, 'imagery-catalog.json'), bundle.imageryCatalog);
    if (bundle.imageryReviewPlan) writeJson(path.join(outputDir, 'imagery-review-plan.json'), bundle.imageryReviewPlan);
    writeJson(path.join(outputDir, 'experience-signals.json'), bundle.experienceSignals);
    writeJson(path.join(outputDir, 'owner-review-session.json'), bundle.ownerReview);
    writeJson(path.join(outputDir, 'provisional-brand-pack.json'), bundle.provisionalBrandPack);
    writeJson(path.join(outputDir, 'runtime-brand.json'), bundle.runtimeBrand);
    writeJson(path.join(outputDir, 'import-report.json'), bundle.importReport);
    writeJson(path.join(outputDir, 'session-manifest.json'), bundle.sessionManifest);
    console.log(`Brand import ready for review: ${outputDir}`);
    console.log('The importer will now dispose its in-memory session. Exported files remain under caller control.');
  } finally {
    session.dispose();
  }
}

main().catch((error) => {
  console.error(`Import failed: ${error.message}`);
  process.exitCode = 1;
});
