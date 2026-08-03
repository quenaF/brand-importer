const SIGNALS = {
  environment: [
    ['coastal and outdoors-oriented', /\b(ocean|wave|surf|beach|water|coast|outdoor)\b/i],
    ['program and learning-centered', /\b(camp|lesson|learn|school|program|instruction)\b/i],
    ['community-rooted', /\b(community|team|family|local|together)\b/i]
  ],
  humanEnergy: [
    ['active and participatory', /\b(ride|surf|join|book|learn|camp|lesson|experience)\b/i],
    ['welcoming and accessible', /\b(beginner|all levels|family|kids|youth|welcome)\b/i],
    ['confident and adventurous', /\b(adventure|progress|performance|explore|confidence)\b/i]
  ],
  interactionStyle: [
    ['direct and action-oriented', /\b(book|shop|join|learn|view|register|explore|get started)\b/i],
    ['participation before promotion', /\b(camp|lesson|experience|register|book)\b/i]
  ],
  trustSignals: [
    ['instruction and expertise matter', /\b(instructor|lesson|school|learn|experience|team)\b/i],
    ['family and youth reassurance matter', /\b(parent|family|child|children|kid|kids|youth|safe|safety)\b/i],
    ['community belonging matters', /\b(community|local|family|team|together)\b/i]
  ]
};

function textCorpus(observations) {
  const parts = [];
  for (const page of observations?.pages ?? [observations?.page].filter(Boolean)) parts.push(page.title, page.description);
  for (const heading of observations?.headings ?? []) parts.push(heading.text);
  parts.push(...(observations?.callsToAction ?? []), ...(observations?.navigation ?? []));
  for (const image of observations?.images ?? []) parts.push(image.alt, image.contextText);
  return parts.filter(Boolean).join(' \n ');
}

function pageEvidence(observations, evidence, pattern) {
  const records = evidence?.records ?? [];
  const matchedPages = new Set();
  const matchedIds = [];
  for (const record of records) {
    if (!pattern.test(record.summary ?? '')) continue;
    matchedIds.push(record.id);
    for (const source of record.sources ?? []) if (source.sourceType === 'website') matchedPages.add(source.locator);
  }
  if (!matchedIds.length) {
    for (const page of observations?.pages ?? []) {
      const haystack = `${page.title ?? ''} ${page.description ?? ''}`;
      if (pattern.test(haystack)) {
        matchedPages.add(page.url);
        const slug = page.url === observations.pages?.[0]?.url ? 'home' : new URL(page.url).pathname.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'page';
        matchedIds.push(`ev.page.${slug}.title`);
      }
    }
  }
  return { evidenceIds: [...new Set(matchedIds)].slice(0, 8), sourcePages: [...matchedPages] };
}

function hypothesis(id, value, confidence, support, rationale) {
  return {
    id, value, status: 'inferred', confidence: Number(confidence.toFixed(2)),
    evidenceIds: support.evidenceIds,
    sourcePages: support.sourcePages,
    rationale,
    requiresOwnerReview: true
  };
}

function inferDimension(name, observations, evidence, corpus) {
  const results = [];
  for (const [index, [value, pattern]] of (SIGNALS[name] ?? []).entries()) {
    const matches = corpus.match(new RegExp(pattern.source, 'gi'))?.length ?? 0;
    if (!matches) continue;
    const support = pageEvidence(observations, evidence, pattern);
    if (!support.evidenceIds.length || !support.sourcePages.length) continue;
    const pageCount = support.sourcePages.length;
    const confidence = Math.min(0.88, 0.42 + Math.log2(matches + 1) * 0.08 + Math.min(0.18, pageCount * 0.04));
    results.push(hypothesis(`dna.${name}.${index + 1}`, value, confidence, support, [
      `Detected ${matches} relevant language or imagery signal(s) across ${pageCount} source page(s).`,
      'This is a cross-source pattern hypothesis, not an official brand statement.'
    ]));
  }
  return results;
}

function inferVisualRhythm(normalized) {
  const imagery = normalized?.imagery ?? [];
  if (!imagery.length) return [];
  const counts = imagery.reduce((acc, item) => { acc[item.orientation] = (acc[item.orientation] ?? 0) + 1; return acc; }, {});
  const prominent = imagery.filter((item) => item.score >= 0.65);
  const pages = [...new Set(prominent.flatMap((item) => item.sourcePages ?? []))];
  const evidenceIds = [...new Set(prominent.flatMap((item) => item.evidenceIds ?? []))].slice(0, 12);
  if (!pages.length || !evidenceIds.length) return [];
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'mixed';
  return [hypothesis('dna.visualRhythm.1', `${dominant}-led imagery with active, high-presence visual storytelling`, Math.min(0.82, 0.48 + prominent.length * 0.015), { evidenceIds, sourcePages: pages }, [
    `${prominent.length} higher-ranked imagery candidate(s) support the pattern; dominant orientation is ${dominant}.`,
    'Layout implications require designer and owner confirmation.'
  ])];
}

function inferTensions(observations, normalized, evidence) {
  const tensions = [];
  const corpus = textCorpus(observations);
  const retail = /\b(shop|product|collection|gift card|apparel|tee|sweatshirt)\b/i.test(corpus);
  const program = /\b(camp|lesson|youth|kids|school|learn)\b/i.test(corpus);
  if (retail && program) {
    const support = pageEvidence(observations, evidence, /\b(shop|product|collection|gift card|apparel|camp|lesson|youth|kids|school|learn)\b/i);
    if (support.evidenceIds.length && support.sourcePages.length) tensions.push(hypothesis('dna.tension.retail-program', 'retail lifestyle expression versus youth-program clarity and trust', 0.76, support, [
      'The source spans storefront and program contexts, which may require different imagery, language, and trust emphasis.',
      'The white-label product should preserve brand culture without importing retail assumptions into safety-critical flows.'
    ]));
  }
  const people = (normalized?.imagery ?? []).filter((item) => item.peopleLikely);
  if (people.length) {
    const pages = [...new Set(people.flatMap((item) => item.sourcePages ?? []))];
    const ids = [...new Set(people.flatMap((item) => item.evidenceIds ?? []))];
    if (pages.length && ids.length) tensions.push(hypothesis('dna.tension.authenticity-consent', 'authentic people-centered storytelling versus consent and minor-safety obligations', 0.82, { evidenceIds: ids.slice(0, 10), sourcePages: pages }, [
      'People-centered imagery strengthens authenticity but creates reuse, consent, and contextual safety obligations.'
    ]));
  }
  return tensions;
}

export function generateExperienceDna({ request, observations, normalized, evidence }) {
  if (!request?.requestId || normalized?.requestId !== request.requestId) throw new Error('Matching request and normalized candidates are required.');
  const corpus = textCorpus(observations);
  const dimensions = {
    environment: inferDimension('environment', observations, evidence, corpus),
    humanEnergy: inferDimension('humanEnergy', observations, evidence, corpus),
    interactionStyle: inferDimension('interactionStyle', observations, evidence, corpus),
    visualRhythm: inferVisualRhythm(normalized),
    trustSignals: inferDimension('trustSignals', observations, evidence, corpus)
  };
  const unknowns = [];
  for (const [name, values] of Object.entries(dimensions)) if (!values.length) unknowns.push({ id: `unknown.dna.${name}`, question: `What should define the brand's ${name} in this product context?`, impact: 'material', recommendedAction: 'Ask the owner for examples and approved experience guidance.' });
  return {
    schemaVersion: '0.1.0', requestId: request.requestId, status: 'inferred', generatedAt: new Date().toISOString(),
    dimensions,
    tensions: inferTensions(observations, normalized, evidence),
    unknowns,
    ownerReview: { status: 'not-started', required: true, instructions: 'Confirm, correct, deprioritize, or add context to every Experience DNA hypothesis before production use.' }
  };
}
