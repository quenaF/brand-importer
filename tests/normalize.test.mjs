import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalizeColor, normalizeColors } from '../src/normalize/colors.mjs';
import { normalizeTypography } from '../src/normalize/typography.mjs';
import { normalizeAssets } from '../src/normalize/assets.mjs';
import { normalizeImagery } from '../src/normalize/imagery.mjs';
import { normalizeImport } from '../src/normalize/index.mjs';

test('canonicalizeColor merges equivalent hex and rgb values',()=>{
 assert.equal(canonicalizeColor('#fff'),'#ffffff');
 assert.equal(canonicalizeColor('rgb(255, 79, 79)'),'#ff4f4f');
});

test('normalizers preserve provisional owner-review boundary',()=>{
 const observations={colors:[{value:'#fff',count:2,sources:['a.css']},{value:'#ffffff',count:3,sources:['b.css']}],fonts:[{value:'Poppins',count:4},{value:'sans-serif',count:8},{value:'Icon Font',count:1}],likelyLogos:[{src:'https://example.com/header-logo.png',alt:'Example logo',className:'header-logo'}]};
 const evidence={records:[{id:'ev.color.raw.1',summary:'Observed color #fff in 2 inspected CSS source(s).'},{id:'ev.color.raw.2',summary:'Observed color #ffffff in 3 inspected CSS source(s).'},{id:'ev.font.raw.1',summary:'Observed font family Poppins.'},{id:'ev.font.raw.2',summary:'Observed font family sans-serif.'},{id:'ev.font.raw.3',summary:'Observed font family Icon Font.'},{id:'ev.logo.1',summary:'Observed logo.',sources:[{locator:'https://example.com/header-logo.png'}]}]};
 const colors=normalizeColors(observations,evidence); assert.equal(colors.length,1); assert.equal(colors[0].occurrences,5); assert.equal(colors[0].status,'derived'); assert.equal(colors[0].requiresOwnerReview,true);
 const fonts=normalizeTypography(observations,evidence); assert.equal(fonts.find(f=>f.family==='Icon Font').excludedFromBrandTypography,true); assert.equal(fonts.find(f=>f.family==='sans-serif').candidateRoles[0],'fallback');
 const assets=normalizeAssets(observations,evidence); assert.ok(assets[0].candidateRoles.includes('primary-logo')); assert.equal(assets[0].requiresOwnerReview,true);
});

test('imagery normalization ranks useful images and protects people and rights',()=>{
 const observations={
  likelyLogos:[{src:'https://example.com/logo.png'}],
  images:[
   {src:'https://example.com/logo.png',alt:'Example logo',parentRegion:'header',width:400,height:120,contextText:''},
   {src:'https://example.com/surf-camp-family.jpg',alt:'Family and children at surf camp',parentRegion:'section',width:1600,height:900,contextText:'Surf camp community'}
  ]
 };
 const evidence={records:[{id:'ev.image.2',sources:[{locator:'https://example.com/surf-camp-family.jpg'}]}]};
 const imagery=normalizeImagery(observations,evidence);
 assert.equal(imagery.length,1);
 assert.ok(imagery[0].candidateRoles.includes('hero'));
 assert.ok(imagery[0].candidateRoles.includes('brand-atmosphere'));
 assert.equal(imagery[0].peopleLikely,true);
 assert.equal(imagery[0].rightsStatus,'unknown');
 assert.equal(imagery[0].requiresOwnerReview,true);
 assert.ok(imagery[0].safeguards.some(item=>item.includes('minors')));
});

test('normalizeImport emits provisional candidates and summary',()=>{
 const result=normalizeImport({request:{requestId:'test-001'},observations:{colors:[{value:'#000',count:1,sources:['x.css']}],fonts:[{value:'Poppins',count:1}],likelyLogos:[],images:[]},evidence:{records:[{id:'ev.color.raw.1',summary:'Observed color #000 in 1 inspected CSS source(s).'},{id:'ev.font.raw.1',summary:'Observed font family Poppins.'}]}});
 assert.equal(result.status,'provisional'); assert.equal(result.summary.normalizedColorCount,1); assert.equal(result.unknowns.some(u=>u.id==='unknown.logo'),true); assert.equal(result.unknowns.some(u=>u.id==='unknown.imagery'),true);
});
