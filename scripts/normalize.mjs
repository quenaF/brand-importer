import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { normalizeImport } from '../src/normalize/index.mjs';

function readJson(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
function writeJson(file,value){fs.writeFileSync(file,`${JSON.stringify(value,null,2)}\n`,'utf8');}

const [inputDirArg,outputDirArg]=process.argv.slice(2);
if(!inputDirArg){console.error('Usage: node scripts/normalize.mjs <import-output-directory> [normalized-output-directory]');process.exit(1);}
const inputDir=path.resolve(process.cwd(),inputDirArg);
const outputDir=path.resolve(process.cwd(),outputDirArg??path.join(inputDir,'normalized'));
const requestPath=fs.existsSync(path.join(inputDir,'import-request.json'))?path.join(inputDir,'import-request.json'):path.join(path.dirname(inputDir),'import-request.json');
const result=normalizeImport({request:readJson(requestPath),observations:readJson(path.join(inputDir,'observations.json')),evidence:readJson(path.join(inputDir,'evidence.json'))});
fs.mkdirSync(outputDir,{recursive:true});
writeJson(path.join(outputDir,'normalized-candidates.json'),result);
console.log(`Normalization complete: ${outputDir}`);
console.log(`Colors: ${result.summary.rawColorCount} raw → ${result.summary.normalizedColorCount} normalized`);
console.log(`Fonts: ${result.summary.rawFontCount} raw → ${result.summary.normalizedFontCount} normalized`);
console.log(`Logo candidates: ${result.summary.logoCandidateCount}`);
console.log('Status: provisional; owner review is required before Brand Pack generation.');
