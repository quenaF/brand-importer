function slug(value){return value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
export function normalizeAssets(observations,evidence){
 const records=(evidence?.records??[]).filter(r=>r.id.startsWith('ev.logo.'));
 return (observations?.likelyLogos??[]).map((logo,index)=>{
  const text=`${logo.alt??''} ${logo.className??''} ${logo.id??''} ${logo.src??''}`;
  const primaryHint=/(header|main|primary)/i.test(text);
  const wordmarkHint=/(wordmark|logo)/i.test(text);
  const score=Number(Math.min(.96,.58+(primaryHint?.18:0)+(logo.alt?.08:0)+(wordmarkHint?.06:0)-(index*.04)).toFixed(3));
  return {id:`asset.logo.${slug(logo.src??String(index+1)).slice(-48)||index+1}`,location:logo.src,candidateRoles:primaryHint?['primary-logo',wordmarkHint?'wordmark':'unknown']:[index===0?'primary-logo':'secondary-logo'],score,status:'derived',requiresOwnerReview:true,evidenceIds:[records[index]?.id??`ev.logo.${index+1}`],rationale:[primaryHint?'Header/main placement hint increases primary-logo likelihood.':'No authoritative placement metadata proves the official role.',logo.alt?'Descriptive alt text supports identification as a brand asset.':'Missing alt text lowers confidence.','Asset was discovered but not visually adjudicated or owner-confirmed.'],alt:logo.alt??''};
 }).sort((a,b)=>b.score-a.score);
}
