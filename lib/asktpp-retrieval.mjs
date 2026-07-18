const LEGACY_SOURCE_ALIASES = {
  "guide-1-IGGv3.pdf": [
    "guide",
    "the guide",
    "investor's guide",
    "goals-based investing and philanthropy",
  ],
  "paper-1-IFfeb26.pdf": [
    "paper",
    "the paper",
    "impact frontier",
    "the impact frontier",
    "jonathan harris paper",
  ],
};

const STOP_WORDS = new Set([
  "about",
  "after",
  "also",
  "and",
  "are",
  "but",
  "can",
  "does",
  "for",
  "from",
  "have",
  "how",
  "into",
  "like",
  "not",
  "only",
  "paper",
  "research",
  "that",
  "the",
  "their",
  "them",
  "then",
  "this",
  "what",
  "when",
  "where",
  "which",
  "with",
  "work",
  "you",
  "your",
]);

export function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .replace(/\.pdf$/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function collectRecentUserTurns(messages, limit = 4) {
  return messages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .filter((content) => typeof content === "string" && content.trim())
    .slice(-limit);
}

function needsPreviousQuestion(latest) {
  const q = normalizeText(latest);
  const wordCount = q.split(/\s+/).filter(Boolean).length;

  return (
    /^(and|but|so|also|then|how about|what about|why|whoa|lol)\b/.test(q) ||
    /\b(it|its|that|this|those|these|they|them|the guide|the paper|your answer|your guess|this context)\b/.test(
      q
    ) ||
    wordCount <= 5
  );
}

export function buildRetrievalQuery(messages) {
  const userTurns = collectRecentUserTurns(messages, 2);
  if (userTurns.length === 0) return "";

  const latest = userTurns.at(-1);
  const previous = userTurns.at(-2);

  if (!previous || !needsPreviousQuestion(latest)) {
    return latest;
  }

  return `Current question: ${latest}\nPrevious user question for reference: ${previous}`;
}

export function classifyQuestion(question) {
  const q = normalizeText(question);
  const mentionsCsp =
    /\bcsp\b/.test(q) || q.includes("center for sustainable finance and private wealth");
  const mentionsPaper =
    /\bimpact frontier\b|\bpaper\b|\bjonathan harris\b/.test(q);

  const isListQuery =
    /\b(list|enumerate|outline|all|every|complete|inventory)\b/.test(q) ||
    /\bwhat are the (insights|sections|steps|claims|principles|themes|points|guides|publications|papers)\b/.test(
      q
    ) ||
    /\bkey points\b/.test(q);

  const isCrossDocQuery =
    /\b(compare|comparison|connect|connections|relationship|relate|related|relevant|relevance|between|overlap|overlaps|differ|difference)\b/.test(
      q
    ) ||
    (mentionsCsp && mentionsPaper) ||
    (/\bguides?\b/.test(q) && mentionsPaper);

  const isNameQuery =
    /\b(name|names|people|person|story|stories|mentioned|mention|real people)\b/.test(
      q
    ) || /\bstarts with\b/.test(q);

  return { isListQuery, isCrossDocQuery, isNameQuery };
}

export function getSourceInfos(corpus) {
  const bySource = new Map();
  for (const item of corpus) {
    if (!bySource.has(item.source)) bySource.set(item.source, item);
  }

  return [...bySource.entries()].map(([source, sample]) => {
    const aliases = Array.isArray(sample.aliases)
      ? sample.aliases
      : LEGACY_SOURCE_ALIASES[source] || [];
    const organizations = Array.isArray(sample.organizations)
      ? sample.organizations
      : [];

    return {
      source,
      title: sample.title || source,
      organizations,
      normSource: normalizeText(source),
      normBase: normalizeText(source.replace(/\.pdf$/i, "")),
      normTitle: normalizeText(sample.title || ""),
      aliases: aliases.map(normalizeText),
      isGuide:
        sample.source_type === "applied-research-guide" ||
        source === "guide-1-IGGv3.pdf" ||
        /\bguide\b/i.test(source),
      isPaper:
        sample.source_type === "working-paper" ||
        source === "paper-1-IFfeb26.pdf" ||
        source === "paper1.pdf" ||
        /\bpaper\b/i.test(source),
      isCsp:
        organizations.some((organization) => normalizeText(organization) === "csp") ||
        /cspglobal\.org/i.test(sample.canonical_url || ""),
      isTpp: organizations.some(
        (organization) => normalizeText(organization) === "total portfolio project"
      ),
    };
  });
}

function updatePersistentSourceControls(turn, controls) {
  const lower = turn.toLowerCase();

  if (
    /\b(use|include|allow|cite|reference|talk about)\s+both\b/.test(lower) ||
    /\b(use|include|allow)\s+all sources\b/.test(lower) ||
    /\ball sources are allowed again\b/.test(lower)
  ) {
    controls.onlyGuide = false;
    controls.onlyPaper = false;
    controls.excludeGuide = false;
    controls.excludePaper = false;
  }

  if (
    /\bguide\b.*\b(allowed|ok|okay)\b.*\bagain\b/.test(lower) ||
    /\b(use|include|allow|cite|reference|talk about)\b.*\bguide\b.*\bagain\b/.test(
      lower
    )
  ) {
    controls.excludeGuide = false;
    controls.onlyPaper = false;
  }

  if (
    /\bpaper\b.*\b(allowed|ok|okay)\b.*\bagain\b/.test(lower) ||
    /\b(use|include|allow|cite|reference|talk about)\b.*\bpaper\b.*\bagain\b/.test(
      lower
    )
  ) {
    controls.excludePaper = false;
    controls.onlyGuide = false;
  }

  if (/\bguide only\b|\bonly the guide\b|\buse only the guide\b/.test(lower)) {
    controls.onlyGuide = true;
    controls.onlyPaper = false;
    controls.excludePaper = true;
  }

  if (/\bpaper only\b|\bonly the paper\b|\buse only the paper\b/.test(lower)) {
    controls.onlyPaper = true;
    controls.onlyGuide = false;
    controls.excludeGuide = true;
  }

  if (
    /\bignore (the )?guide\b|\bexclude (the )?guide\b|\bstop citing (the )?guide\b/.test(
      lower
    )
  ) {
    controls.excludeGuide = true;
    controls.onlyGuide = false;
  }

  if (
    /\bignore (the )?paper\b|\bexclude (the )?paper\b|\bstop citing (the )?paper\b/.test(
      lower
    )
  ) {
    controls.excludePaper = true;
    controls.onlyPaper = false;
  }
}

export function detectSourceControls(messages, sourceInfos) {
  const recentUserTurns = collectRecentUserTurns(messages, 8);
  const latest = recentUserTurns.at(-1) || "";
  const latestNorm = normalizeText(latest);

  const controls = {
    onlyGuide: false,
    onlyPaper: false,
    excludeGuide: false,
    excludePaper: false,
    exactSourceMentions: [],
    mentions: {
      csp:
        /\bcsp\b/.test(latestNorm) ||
        latestNorm.includes("center for sustainable finance and private wealth"),
      tpp:
        /\btpp\b/.test(latestNorm) || latestNorm.includes("total portfolio project"),
      guides: /\bguides?\b/.test(latestNorm),
      paper: /\bpaper\b|\bimpact frontier\b|\bjonathan harris\b/.test(latestNorm),
    },
  };

  for (const turn of recentUserTurns) {
    updatePersistentSourceControls(turn, controls);
  }

  // A source mention narrows retrieval only when it appears in the current
  // question. Earlier mentions are conversational context, not sticky filters.
  for (const info of sourceInfos) {
    const aliasMatched =
      info.aliases.some((alias) => alias && latestNorm.includes(alias)) ||
      (info.normSource && latestNorm.includes(info.normSource)) ||
      (info.normBase && latestNorm.includes(info.normBase)) ||
      (info.normTitle && latestNorm.includes(info.normTitle));

    if (aliasMatched) controls.exactSourceMentions.push(info.source);
  }

  controls.exactSourceMentions = [...new Set(controls.exactSourceMentions)];
  return controls;
}

function getAllowedSources(sourceInfos, controls) {
  let allowed = sourceInfos.map((info) => info.source);

  if (controls.onlyGuide) {
    allowed = sourceInfos.filter((info) => info.isGuide).map((info) => info.source);
  } else if (controls.onlyPaper) {
    allowed = sourceInfos.filter((info) => info.isPaper).map((info) => info.source);
  }

  if (controls.excludeGuide) {
    const excluded = new Set(
      sourceInfos.filter((info) => info.isGuide).map((info) => info.source)
    );
    allowed = allowed.filter((source) => !excluded.has(source));
  }

  if (controls.excludePaper) {
    const excluded = new Set(
      sourceInfos.filter((info) => info.isPaper).map((info) => info.source)
    );
    allowed = allowed.filter((source) => !excluded.has(source));
  }

  return new Set(allowed);
}

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator > 0 ? dot / denominator : 0;
}

function tokenize(text) {
  return normalizeText(text)
    .split(/\s+/)
    .filter((term) => term.length >= 3 && !STOP_WORDS.has(term));
}

function lexicalScore(item, question) {
  const queryTerms = [...new Set(tokenize(question))];
  if (queryTerms.length === 0) return 0;

  const metadata = [
    item.title,
    ...(item.aliases || []),
    ...(item.organizations || []),
  ].join(" ");
  const metadataNorm = normalizeText(metadata);
  const contentNorm = normalizeText(item.content || "");
  let matched = 0;
  let metadataMatched = 0;

  for (const term of queryTerms) {
    if (contentNorm.includes(term) || metadataNorm.includes(term)) matched += 1;
    if (metadataNorm.includes(term)) metadataMatched += 1;
  }

  return 0.12 * (matched / queryTerms.length) + 0.08 * (metadataMatched / queryTerms.length);
}

function scoreSourceBias(item, latestUserMessage, controls, sourceInfos) {
  const qNorm = normalizeText(latestUserMessage);
  const sourceInfo = sourceInfos.find((info) => info.source === item.source);
  if (!sourceInfo) return 0;

  let boost = 0;
  if (
    sourceInfo.aliases.some((alias) => alias && qNorm.includes(alias)) ||
    (sourceInfo.normSource && qNorm.includes(sourceInfo.normSource)) ||
    (sourceInfo.normBase && qNorm.includes(sourceInfo.normBase)) ||
    (sourceInfo.normTitle && qNorm.includes(sourceInfo.normTitle))
  ) {
    boost += 0.14;
  }
  if (controls.exactSourceMentions.includes(item.source)) boost += 0.1;
  if (controls.mentions.guides && sourceInfo.isGuide) boost += 0.04;
  if (controls.mentions.paper && sourceInfo.isPaper) boost += 0.04;
  if (controls.mentions.csp && sourceInfo.isCsp) boost += 0.04;
  if (controls.mentions.tpp && sourceInfo.isTpp) boost += 0.04;
  return boost;
}

function chunkPenalty(item) {
  const text = item.content || "";
  const lower = text.toLowerCase();
  let penalty = 0;

  if (/\breferences?\b|\bbibliography\b/.test(lower)) penalty += 0.45;
  if (/\backnowledg(e)?ments?\b|\breviewers?\b|\bauthors?\b/.test(lower)) {
    penalty += 0.2;
  }
  if (
    /publication, either in whole or in part|stored in a data retrieval system|transmitted or redistributed/.test(
      lower
    )
  ) {
    penalty += 0.25;
  }

  const yearMatches = text.match(/\b(19|20)\d{2}[a-z]?\b/g) || [];
  if (
    yearMatches.length >= 6 &&
    /\breview\b|\bjournal\b|\bproceedings\b|\bworking paper\b|\buniversity press\b/.test(
      lower
    )
  ) {
    penalty += 0.3;
  }

  return penalty;
}

function extractCandidateNames(text) {
  const candidates = new Set();
  const input = text || "";

  for (const match of input.matchAll(/"([^"]+)"/g)) {
    const value = (match[1] || "").trim();
    if (value.split(/\s+/).length >= 2) candidates.add(value);
  }

  const titleCaseMatches =
    input.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-zA-Z'’.-]+)+\b/g) || [];
  for (const value of titleCaseMatches) {
    if (value.split(/\s+/).length >= 2) candidates.add(value.trim());
  }

  return [...candidates];
}

function nameMatchBonus(item, candidateNames) {
  if (candidateNames.length === 0) return 0;
  const itemNorm = normalizeText(`${item.title || ""} ${item.content || ""}`);
  return candidateNames.some((name) => itemNorm.includes(normalizeText(name)))
    ? 0.1
    : 0;
}

function selectFinalHits(candidates, finalK = 12, seeds = []) {
  const selected = [];
  const selectedIds = new Set();
  const sourceCounts = {};

  for (const seed of seeds) {
    if (!seed || selectedIds.has(seed.id) || selected.length >= finalK) continue;
    selected.push(seed);
    selectedIds.add(seed.id);
    sourceCounts[seed.source] = (sourceCounts[seed.source] || 0) + 1;
  }

  const remaining = candidates.filter((candidate) => !selectedIds.has(candidate.id));
  while (selected.length < finalK && remaining.length > 0) {
    let bestIndex = 0;
    let bestAdjustedScore = -Infinity;

    for (let index = 0; index < remaining.length; index += 1) {
      const hit = remaining[index];
      const repeats = sourceCounts[hit.source] || 0;
      const diversityPenalty = repeats <= 1 ? 0 : (repeats - 1) * 0.035;
      const adjustedScore = hit.score - diversityPenalty;

      if (adjustedScore > bestAdjustedScore) {
        bestAdjustedScore = adjustedScore;
        bestIndex = index;
      }
    }

    const [chosen] = remaining.splice(bestIndex, 1);
    selected.push(chosen);
    selectedIds.add(chosen.id);
    sourceCounts[chosen.source] = (sourceCounts[chosen.source] || 0) + 1;
  }

  return selected;
}

function crossDocumentSeeds(scored, sourceInfos, controls, isCrossDocQuery) {
  if (!isCrossDocQuery) return [];
  const seeds = [];

  if (controls.mentions.csp) {
    const cspSources = new Set(
      sourceInfos.filter((info) => info.isCsp).map((info) => info.source)
    );
    seeds.push(scored.find((hit) => cspSources.has(hit.source)));
  }

  if (controls.mentions.paper) {
    const paperSources = new Set(
      sourceInfos.filter((info) => info.isPaper).map((info) => info.source)
    );
    seeds.push(scored.find((hit) => paperSources.has(hit.source)));
  }

  return seeds.filter(Boolean);
}

export function searchCorpus(
  queryEmbedding,
  corpus,
  latestUserMessage,
  messages,
  candidatePoolSize = 36,
  finalK = 12
) {
  const sourceInfos = getSourceInfos(corpus);
  const controls = detectSourceControls(messages, sourceInfos);
  const { isCrossDocQuery } = classifyQuestion(latestUserMessage);
  const allowedSources = getAllowedSources(sourceInfos, controls);
  let filteredCorpus = corpus.filter((item) => allowedSources.has(item.source));

  if (!isCrossDocQuery && controls.exactSourceMentions.length === 1) {
    const targetSource = controls.exactSourceMentions[0];
    filteredCorpus = filteredCorpus.filter((item) => item.source === targetSource);
  } else if (!isCrossDocQuery && controls.mentions.guides) {
    const guideSources = new Set(
      sourceInfos.filter((info) => info.isGuide).map((info) => info.source)
    );
    filteredCorpus = filteredCorpus.filter((item) => guideSources.has(item.source));
  } else if (
    !isCrossDocQuery &&
    controls.mentions.csp &&
    !controls.mentions.paper
  ) {
    const cspSources = new Set(
      sourceInfos.filter((info) => info.isCsp).map((info) => info.source)
    );
    filteredCorpus = filteredCorpus.filter((item) => cspSources.has(item.source));
  }

  const candidateNames = extractCandidateNames(latestUserMessage);
  const scored = filteredCorpus
    .map((item) => ({
      ...item,
      score:
        cosineSimilarity(queryEmbedding, item.embedding) +
        lexicalScore(item, latestUserMessage) +
        scoreSourceBias(item, latestUserMessage, controls, sourceInfos) +
        nameMatchBonus(item, candidateNames) -
        chunkPenalty(item),
    }))
    .sort((a, b) => b.score - a.score);

  const candidatePool = scored.slice(0, candidatePoolSize);
  const seeds = crossDocumentSeeds(
    scored,
    sourceInfos,
    controls,
    isCrossDocQuery
  );
  const hits = selectFinalHits(candidatePool, finalK, seeds);

  return { hits, controls, candidateNames };
}

function documentCitation(document) {
  return {
    source: document.title,
    page: null,
    url: document.canonical_url || null,
    snippet: `${document.publication_status === "preliminary" ? "Preliminary " : ""}${
      document.source_type === "working-paper" ? "working paper" : "publication"
    } indexed in the AskTPP corpus.`,
  };
}

function organizationCitation(organization) {
  return {
    source: organization.name,
    page: null,
    url: organization.canonical_url || null,
    snippet: organization.description,
  };
}

export function getCuratedResponse(question, manifest, curatedContext) {
  const q = normalizeText(question);
  const documents = Array.isArray(manifest?.documents) ? manifest.documents : [];
  const organizations = Array.isArray(curatedContext?.organizations)
    ? curatedContext.organizations
    : [];
  const csp = organizations.find((organization) => organization.id === "csp");

  const asksCspIdentity =
    /\bwhat is csp\b|\bwhat does csp stand for\b|\bwhat csp is\b|\bdon t know what csp is\b/.test(
      q
    );
  if (asksCspIdentity && csp) {
    return {
      scope: "csp",
      content: `${csp.name} (CSP) works at the intersection of scientific research, wealth holders, and investment professionals to help move private wealth toward sustainable development. It was initiated at the University of Zurich in 2017 after earlier program work at Harvard Kennedy School; its current academic home is the University of St.Gallen.\n\nIn AskTPP, **CSP means this organization—not “Corporate Sustainability Performance.”**`,
      citations: [organizationCitation(csp)],
    };
  }

  const cspDocuments = documents.filter((document) =>
    document.organizations?.includes("CSP")
  );
  const asksCspInventory =
    /\bcsp\b.*\b(guides|publications|documents|sources|corpus)\b/.test(q) ||
    /\bwhat csp guides\b/.test(q);
  if (asksCspInventory) {
    const list = cspDocuments.map((document) => `- ${document.title}`).join("\n");
    return {
      scope: "csp",
      content: `AskTPP is not trained on these documents; it retrieves from an indexed corpus. The current corpus contains these ${cspDocuments.length} CSP publications:\n\n${list}`,
      citations: cspDocuments.map(documentCitation),
    };
  }

  const paperDocuments = documents.filter(
    (document) => document.source_type === "working-paper"
  );
  const asksTppPapers =
    /\b(total portfolio project|tpp)\b.*\b(papers|publications|documents)\b/.test(q);
  const asksJonathanPapers =
    /\bjonathan harris\b.*\b(papers|publications|documents)\b/.test(q);
  if (asksTppPapers || asksJonathanPapers) {
    const matching = paperDocuments.filter(
      (document) =>
        document.organizations?.includes("Total Portfolio Project") ||
        document.authors?.includes("Jonathan Harris")
    );
    const list = matching
      .map(
        (document) =>
          `- *${document.title}* by ${document.authors.join(", ")} (${document.publication_status})`
      )
      .join("\n");
    const guideNote = documents.some(
      (document) =>
        document.source_type !== "working-paper" &&
        document.authors?.includes("Jonathan Harris")
    )
      ? "\n\nJonathan Harris also co-authored a CSP guide in the corpus, but that is classified as a guide rather than a TPP paper."
      : "";
    return {
      scope: "paper",
      content: `The current corpus contains ${matching.length} matching working paper:\n\n${list}${guideNote}`,
      citations: matching.map(documentCitation),
    };
  }

  const asksAboutAccess =
    /\b(forced|restricted|stuck|access|see|look at|training data|trained on|retrieve)\b.*\b(guides|sources|corpus|paper)\b/.test(
      q
    ) ||
    /\b(guides|sources|corpus|paper)\b.*\b(training data|trained on|access|see|retrieve)\b/.test(
      q
    );
  if (asksAboutAccess) {
    return {
      scope: "catalog",
      content: `I can retrieve from the full AskTPP corpus: ${cspDocuments.length} CSP publications and ${paperDocuments.length} Jonathan Harris / Total Portfolio Project working paper. You do not need to provide those documents again.\n\nI am not “trained on” the files; each question triggers retrieval from the indexed corpus. If an answer appears confined to one source when the question calls for several, that is a retrieval failure—not a limitation you need to work around.`,
      citations: documents.map(documentCitation),
    };
  }

  return null;
}

export function buildCorpusCatalog(manifest, curatedContext) {
  const organizationLines = (curatedContext?.organizations || []).map(
    (organization) =>
      `- ${organization.acronym}: ${organization.name}. ${organization.description}`
  );
  const documentLines = (manifest?.documents || []).map(
    (document) =>
      `- ${document.title} | authors: ${document.authors.join(", ")} | organizations: ${document.organizations.join(", ")} | type: ${document.source_type} | status: ${document.publication_status}`
  );
  const ruleLines = (curatedContext?.terminology_rules || []).map(
    (rule) => `- ${rule}`
  );

  return [
    "Curated organization reference:",
    ...organizationLines,
    "",
    "Complete current corpus catalog:",
    ...documentLines,
    "",
    "Curated terminology and scope rules:",
    ...ruleLines,
  ].join("\n");
}
