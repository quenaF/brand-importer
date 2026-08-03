import test from 'node:test';
import assert from 'node:assert/strict';
import { generateExperienceDna } from '../src/experience-dna/index.mjs';

const request={requestId:'dna-001'};
const observations={
 pages:[
  {url:'https://example.com/',title:'Wave Riding Vehicles',description:'Surf shop and community'},
  {url:'https://example.com/camps',title:'Surf Camps & Lessons',description:'Kids and families learn to surf'}
 ],
 headings:[{text:'Surf Camps & Lessons'},{text:'Learn with our team'}],
 callsToAction:['Book a lesson','Join camp'],navigation:['Surf Camps','Community'],
 images:[{alt:'Children learning to surf with instructors',contextText:'Family surf camp community'}]
};
const evidence={records:[
 {id:'ev.page.home.title',summary:'Observed page title: Wave Riding Vehicles',sources:[{sourceType:'website',locator:'https://example.com/'}]},
 {id:'ev.page.camps.title',summary:'Observed page title: Surf Camps & Lessons',sources:[{sourceType:'website',locator:'https://example.com/camps'}]},
 {id:'ev.image.1',summary:'Observed image candidate children learning to surf',sources:[{sourceType:'website',locator:'https://example.com/camps'}]}
]};
const normalized={requestId:'dna-001',imagery:[{id:'imagery.1',score:.8,orientation:'landscape',peopleLikely:true,evidenceIds:['ev.image.1'],sourcePages:['https://example.com/camps']} ]};

test('Experience DNA emits evidence-backed inferred hypotheses and tensions',()=>{
 const dna=generateExperienceDna({request,observations,normalized,evidence});
 assert.equal(dna.status,'inferred');
 assert.equal(dna.ownerReview.required,true);
 assert.ok(dna.dimensions.environment.length>0);
 assert.ok(dna.dimensions.humanEnergy.length>0);
 assert.ok(dna.dimensions.visualRhythm.length>0);
 for(const item of Object.values(dna.dimensions).flat()){
  assert.equal(item.status,'inferred');
  assert.equal(item.requiresOwnerReview,true);
  assert.ok(item.evidenceIds.length>0);
  assert.ok(item.sourcePages.length>0);
 }
 assert.ok(dna.tensions.some(item=>item.id==='dna.tension.retail-program'));
 assert.ok(dna.tensions.some(item=>item.id==='dna.tension.authenticity-consent'));
});

test('Experience DNA surfaces unknown dimensions instead of fabricating them',()=>{
 const dna=generateExperienceDna({request:{requestId:'empty'},observations:{pages:[{url:'https://example.com',title:'Example'}]},normalized:{requestId:'empty',imagery:[]},evidence:{records:[]}});
 assert.ok(dna.unknowns.length>=4);
 assert.equal(Object.values(dna.dimensions).flat().length,0);
});
