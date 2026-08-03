import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { generateOwnerReviewSession } from '../src/review/questions.mjs';
import { generateProvisionalBrandPack } from '../src/brand-pack/provisional.mjs';
import { generateExperienceDna } from '../src/experience-dna/index.mjs';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function main() {
  const [runDirArg, outputDirArg] = process.argv.slice(2);
  if (!runDirArg) {
    console.error('Usage: node scripts/generate-provisional.mjs <run-directory> [output-directory]');
    process.exitCode = 1;
    return;
  }

  const runDir = path.resolve(process.cwd(), runDirArg);
  const normalizedDir = path.join(runDir, 'normalized');
  const outputDir = path.resolve(process.cwd(), outputDirArg ?? path.join(runDir, 'provisional'));
  const request = readJson(path.join(runDir, 'import-request.json'));
  const observations = readJson(path.join(runDir, 'output', 'observations.json'));
  const evidence = readJson(path.join(runDir, 'output', 'evidence.json'));
  const normalized = readJson(path.join(normalizedDir, 'normalized-candidates.json'));

  const experienceDna = generateExperienceDna({ request, observations, normalized, evidence });
  const review = generateOwnerReviewSession({ request, normalized, experienceDna });
  const pack = generateProvisionalBrandPack({ request, observations, normalized });
  fs.mkdirSync(outputDir, { recursive: true });
  writeJson(path.join(outputDir, 'experience-dna.json'), experienceDna);
  writeJson(path.join(outputDir, 'owner-review-session.json'), review);
  writeJson(path.join(outputDir, 'provisional-brand-pack.json'), pack);

  const hypothesisCount = Object.values(experienceDna.dimensions).reduce((sum, values) => sum + values.length, 0);
  console.log(`Provisional Brand Pack generated: ${outputDir}`);
  console.log(`Experience DNA hypotheses: ${hypothesisCount}; tensions: ${experienceDna.tensions.length}`);
  console.log(`Owner review questions: ${review.questions.length}`);
  console.log(`Color candidates: ${pack.identity.colorCandidates.length}`);
  console.log(`Typography candidates: ${pack.identity.typographyCandidates.length}`);
  console.log(`Logo candidates: ${pack.assets.logoCandidates.length}`);
  console.log(`Imagery candidates: ${pack.assets.imageryCandidates.length}`);
  console.log('Status: provisional and inferred; owner review has not started.');
}

main().catch((error) => {
  console.error(`Provisional generation failed: ${error.message}`);
  process.exitCode = 1;
});
