const GENERIC = new Set(['serif','sans-serif','monospace','cursive','fantasy','system-ui','ui-sans-serif','ui-serif','inherit','initial']);
const ICON_PATTERN = /(icon|symbols?|fontawesome|material)/i;
function slug(value){return value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
export function normalizeTypography(observations,evidence){
 const records=(evidence?.records??[]).filter(r=>r.id.startsWith('ev.font.raw.'));
 return (observations?.fonts??[]).map((raw,index)=>{
  const family=String(raw.value??'').replace(/^['"]|['"]$/g,'').trim();
  const lower=family.toLowerCase();
  const isGeneric=GENERIC.has(lower); const isIcon=ICON_PATTERN.test(family);
  const roles=isIcon?['icon']:isGeneric?['fallback']:index===0?['heading','navigation','body']:['body','unknown'];
  const score=Number((isIcon?0.12:isGeneric?0.2:Math.min(.92,.48+Math.log2((raw.count??1)+1)*.1+(index===0?.12:0))).toFixed(3));
  const rec=records.find(r=>r.summary.includes(family));
  return {id:`font.${slug(family)||index+1}`,family,candidateRoles:roles,score,status:'derived',requiresOwnerReview:true,evidenceIds:[rec?.id??`ev.font.raw.${index+1}`],rationale:[isIcon?'Name indicates an icon/symbol font, so it is excluded from brand typography.':isGeneric?'Generic family is retained as fallback, not treated as a distinctive brand font.':`Observed family ranked by recurrence and source order; role assignment remains provisional.`],occurrences:Math.max(1,raw.count??1),excludedFromBrandTypography:isIcon||isGeneric};
 }).filter(x=>x.family).sort((a,b)=>b.score-a.score);
}
