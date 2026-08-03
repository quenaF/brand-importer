import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { generateExperienceDna } from '../src/experience-dna/index.mjs';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');

async function main() {
  const [runDirArg, outputDirArg] = process.argv.slice(2);
  if (!runDirArg) throw new Error('Usage: node scripts/generate-experience-dna.mjs <run-directory> [output-directory]');
  const runDir = path.resolve(process.cwd(), runDirArg);
  const outputDir = path.resolve(process.cwd(), outputDirArg ?? path.join(runDir, 'experience-dna'));
  const request = readJson(path.join(runDir, 'import-request.json'));
  const observations = readJson(path.join(runDir, 'output', 'observations.json'));
  const evidence = readJson(path.join(runDir, 'output', 'evidence.json'));
  const normalized = readJson(path.join(runDir, 'normalized', 'normalized-candidates.json'));
  const dna = generateExperienceDna({ request, observations, normalized, evidence });
  fs.mkdirSync(outputDir, { recursive: true });
  writeJson(path.join(outputDir, 'experience-dna.json'), dna);
  const count = Object.values(dna.dimensions).reduce((sum, values) => sum + values.length, 0);
  console.log(`Experience DNA generated: ${outputDir}`);
  console.log(`Hypotheses: ${count}; tensions: ${dna.tensions.length}; unknowns: ${dna.unknowns.length}`);
  console.log('Status: inferred; owner review required.');
}
main().catch((error) => { console.error(`Experience DNA generation failed: ${error.message}`); process.exitCode = 1; });
