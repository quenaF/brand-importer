import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { inspectUrl } from '../src/inspect.mjs';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function main() {
  const [requestPath, outputDirArg] = process.argv.slice(2);
  if (!requestPath) {
    console.error('Usage: node scripts/import.mjs <import-request.json> [output-directory]');
    process.exitCode = 1;
    return;
  }

  const absoluteRequestPath = path.resolve(process.cwd(), requestPath);
  const request = readJson(absoluteRequestPath);
  const outputDir = path.resolve(process.cwd(), outputDirArg ?? `imports/${request.requestId}`);
  fs.mkdirSync(outputDir, { recursive: true });

  const result = await inspectUrl(request);
  writeJson(path.join(outputDir, 'import-request.json'), request);
  writeJson(path.join(outputDir, 'source-inventory.json'), result.sourceInventory);
  writeJson(path.join(outputDir, 'observations.json'), result.observations);
  writeJson(path.join(outputDir, 'evidence.json'), result.evidence);

  console.log(`Import inspection complete: ${outputDir}`);
  console.log(`Pages/assets inventoried: ${result.sourceInventory.items.length}`);
  console.log(`Colors observed: ${result.observations.colors.length}`);
  console.log(`Fonts observed: ${result.observations.fonts.length}`);
  console.log(`Logo candidates: ${result.observations.likelyLogos.length}`);
  console.log('Status: observed extraction only; no Brand Pack interpretation has been performed.');
}

main().catch((error) => {
  console.error(`Import failed: ${error.message}`);
  process.exitCode = 1;
});
