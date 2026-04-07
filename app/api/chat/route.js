import { auth } from "@/auth";
import fs from "fs";
import path from "path";

const CORPUS_PATH = path.join(process.cwd(), "corpus", "generated", "corpus.json");

const SOURCE_ALIAS_MAP = {
  "guide-1-IGGv3.pdf": [
    "guide",
    "the guide",
    "investor's guide",
    "investors guide",
    "investor’s guide",
    "goals-based investing and philanthropy",
    "investor's guide to goals-based investing and philanthropy",
    "investor’s guide to goals-based investing and philanthropy",
  ],
  "paper-1-IFfeb26.pdf": [
    "paper",
    "the paper",
    "impact frontier",
    "the impact frontier",
    "impact frontier paper",
    "the impact frontier paper",
    "jonathan harris paper",
  ],
};

function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .replace(/\.pdf$/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function collectRecentUserTurns(messages, limit = 4) {
  return messages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .slice(-limit);
}

function buildRetrievalQuery(messages) {
  const userTurns = collectRecentUserTurns(messages, 4);
  if (userTurns.length === 0) return "";

  const latest = userTurns[userTurns.length - 1];
  const previous = userTurns.slice(0, -1);

  if (previous.length === 0) {
    return latest;
  }

  return [
    `Current question: ${latest}`,
    "",
    "Recent user context:",
    ...previous.map((turn) => `- ${turn}`),
  ].join("\n");
}

function classifyQuestion(question) {
  const q = (question || "").toLowerCase();

  const isListQuery =
    /\b(list|enumerate|outline|all|every|complete)\b/.test(q) ||
    /\bwhat are the (insights|sections|steps|claims|principles|themes|points)\b/.test(q) ||
    /\bkey points\b/.test(q);

  const isCrossDocQuery =
    /\b(compare|comparison|connections|relationship|relate|between|overlaps)\b/.test(q) ||
    (/\bguide\b/.test(q) && /\bpaper\b/.test(q));

  const isNameQuery =
    /\b(name|names|people|person|story|stories|mentioned|mention|real people)\b/.test(q) ||
    /\bstarts with\b/.test(q);

  return { isListQuery, isCrossDocQuery, isNameQuery };
}

function getSourceInfos(corpus) {
  const uniqueSources = [...new Set(corpus.map((item) => item.source))];

  return uniqueSources.map((source) => ({
    source,
    normSource: normalizeText(source),
    normBase: normalizeText(source.replace(/\.pdf$/i, "")),
    aliases: (SOURCE_ALIAS_MAP[source] || []).map(normalizeText),
    isGuide:
      source === "guide-1-IGGv3.pdf" || /\bguide\b/i.test(source),
    isPaper:
      source === "paper-1-IFfeb26.pdf" || /\bpaper\b/i.test(source),
  }));
}

function detectSourceControls(messages, sourceInfos) {
  const recentUserTurns = collectRecentUserTurns(messages, 8);

  const controls = {
    onlyGuide: false,
    onlyPaper: false,
    excludeGuide: false,
    excludePaper: false,
    exactSourceMentions: [],
  };

  for (const turn of recentUserTurns) {
    const lower = turn.toLowerCase();
    const lowerNorm = normalizeText(turn);

    // Reset broad restrictions
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

    // Re-allow guide / paper
    if (
      /\bguide\b.*\b(allowed|ok|okay)\b.*\bagain\b/.test(lower) ||
      /\b(use|include|allow|cite|reference|talk about)\b.*\bguide\b.*\bagain\b/.test(lower)
    ) {
      controls.excludeGuide = false;
      if (controls.onlyPaper) controls.onlyPaper = false;
    }

    if (
      /\bpaper\b.*\b(allowed|ok|okay)\b.*\bagain\b/.test(lower) ||
      /\b(use|include|allow|cite|reference|talk about)\b.*\bpaper\b.*\bagain\b/.test(lower)
    ) {
      controls.excludePaper = false;
      if (controls.onlyGuide) controls.onlyGuide = false;
    }

    // Only-guide / only-paper modes
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

    // Exclusions
    if (
      /\bignore (the )?guide\b|\bexclude (the )?guide\b|\bstop citing (the )?guide\b/.test(lower)
    ) {
      controls.excludeGuide = true;
      if (controls.onlyGuide) controls.onlyGuide = false;
    }

    if (
      /\bignore (the )?paper\b|\bexclude (the )?paper\b|\bstop citing (the )?paper\b/.test(lower)
    ) {
      controls.excludePaper = true;
      if (controls.onlyPaper) controls.onlyPaper = false;
    }

    // Alias-based exact source mentions
    for (const info of sourceInfos) {
      const aliasMatched =
        info.aliases.some((alias) => lowerNorm.includes(alias)) ||
        lowerNorm.includes(info.normSource) ||
        lowerNorm.includes(info.normBase);

      if (aliasMatched) {
        controls.exactSourceMentions.push(info.source);
      }
    }
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

function scoreSourceBias(item, latestUserMessage, controls, sourceInfos) {
  const qNorm = normalizeText(latestUserMessage);
  const sourceInfo = sourceInfos.find((info) => info.source === item.source);

  if (!sourceInfo) return 0;

  let boost = 0;

  if (
    sourceInfo.aliases.some((alias) => qNorm.includes(alias)) ||
    qNorm.includes(sourceInfo.normSource) ||
    qNorm.includes(sourceInfo.normBase)
  ) {
    boost += 0.14;
  }

  if (controls.exactSourceMentions.includes(item.source)) {
    boost += 0.10;
  }

  if (/\bguide\b/i.test(latestUserMessage) && sourceInfo.isGuide) {
    boost += 0.03;
  }

  if (/\bpaper\b/i.test(latestUserMessage) && sourceInfo.isPaper) {
    boost += 0.03;
  }

  return boost;
}

function chunkPenalty(item) {
  const text = item.content || "";
  const lower = text.toLowerCase();

  let penalty = 0;

  if (/\breferences?\b|\bbibliography\b/.test(lower)) {
    penalty += 0.45;
  }

  if (/\backnowledg(e)?ments?\b|\breviewers?\b|\bauthors?\b/.test(lower)) {
    penalty += 0.20;
  }

  if (
    /publication, either in whole or in part|stored in a data retrieval system|transmitted or redistributed/.test(
      lower
    )
  ) {
    penalty += 0.25;
  }

  const yearMatches = text.match(/\b(19|20)\d{2}[a-z]?\b/g) || [];
  const journalish =
    /\breview\b|\bjournal\b|\bproceedings\b|\bworking paper\b|\buniversity press\b/.test(
      lower
    );

  if (yearMatches.length >= 6 && journalish) {
    penalty += 0.30;
  }

  if (
    /\blead author\b|\bsenior fellow\b|\bresearch affiliation\b/.test(lower) &&
    /\bauthors?\b/.test(lower)
  ) {
    penalty += 0.12;
  }

  return penalty;
}

function extractCandidateNames(text) {
  const candidates = new Set();
  const input = text || "";

  const quoted = [...input.matchAll(/"([^"]+)"/g)];
  for (const match of quoted) {
    const value = (match[1] || "").trim();
    if (value.split(/\s+/).length >= 2) {
      candidates.add(value);
    }
  }

  const titleCaseMatches =
    input.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-zA-Z'’.-]+)+\b/g) || [];

  for (const value of titleCaseMatches) {
    if (value.split(/\s+/).length >= 2) {
      candidates.add(value.trim());
    }
  }

  return [...candidates];
}

function findExactNameHits(corpus, candidateNames, allowedSources) {
  if (candidateNames.length === 0) return [];

  return corpus.filter((item) => {
    if (!allowedSources.has(item.source)) return false;

    const itemNorm = normalizeText(item.content);

    return candidateNames.some((name) =>
      itemNorm.includes(normalizeText(name))
    );
  });
}

function selectFinalHits(candidates, finalK = 12) {
  const remaining = [...candidates];
  const selected = [];
  const sourceCounts = {};

  while (selected.length < finalK && remaining.length > 0) {
    let bestIndex = 0;
    let bestAdjustedScore = -Infinity;

    for (let i = 0; i < remaining.length; i += 1) {
      const hit = remaining[i];
      const repeats = sourceCounts[hit.source] || 0;

      // No penalty for the first two chunks from a source.
      // After that, apply a small diminishing-return penalty.
      const penalty = repeats <= 1 ? 0 : (repeats - 1) * 0.035;
      const adjustedScore = hit.score - penalty;

      if (adjustedScore > bestAdjustedScore) {
        bestAdjustedScore = adjustedScore;
        bestIndex = i;
      }
    }

    const [chosen] = remaining.splice(bestIndex, 1);
    selected.push(chosen);
    sourceCounts[chosen.source] = (sourceCounts[chosen.source] || 0) + 1;
  }

  return selected;
}

function searchCorpus(
  queryEmbedding,
  corpus,
  latestUserMessage,
  messages,
  candidatePoolSize = 30,
  finalK = 12
) {
  const sourceInfos = getSourceInfos(corpus);
  const controls = detectSourceControls(messages, sourceInfos);
  const { isCrossDocQuery } = classifyQuestion(latestUserMessage);

  const allowedSources = getAllowedSources(sourceInfos, controls);

  let filteredCorpus = corpus.filter((item) => allowedSources.has(item.source));

  // If the user clearly means exactly one source and is not asking for a comparison,
  // force retrieval to stay inside that source.
  if (!isCrossDocQuery && controls.exactSourceMentions.length === 1) {
    const targetSource = controls.exactSourceMentions[0];
    filteredCorpus = filteredCorpus.filter((item) => item.source === targetSource);
  }

  const scored = filteredCorpus.map((item) => {
    const semanticScore = cosineSimilarity(queryEmbedding, item.embedding);
    const sourceBias = scoreSourceBias(
      item,
      latestUserMessage,
      controls,
      sourceInfos
    );
    const penalty = chunkPenalty(item);

    return {
      ...item,
      score: semanticScore + sourceBias - penalty,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  const candidateNames = extractCandidateNames(latestUserMessage);
  const exactNameHits = findExactNameHits(filteredCorpus, candidateNames, allowedSources);

  const exactIds = new Set(exactNameHits.map((hit) => hit.id));
  const merged = [
    ...exactNameHits,
    ...scored.filter((hit) => !exactIds.has(hit.id)),
  ];

  const candidatePool = merged.slice(0, candidatePoolSize);
  const finalHits = selectFinalHits(candidatePool, finalK);

  return {
    hits: finalHits,
    controls,
    candidateNames,
  };
}

function buildContext(hits) {
  return hits
    .map((hit) => {
      const parts = [
        "BEGIN EXCERPT",
        `Source file: ${hit.source}`,
      ];

      if (hit.page) {
        parts.push(`Page: ${hit.page}`);
      }

      parts.push("Excerpt:");
      parts.push(hit.content);
      parts.push("END EXCERPT");

      return parts.join("\n");
    })
    .join("\n\n");
}

function cleanSnippet(text, maxLength = 220) {
  const cleaned = (text || "").replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength).trim()}…`;
}

function buildCitationData(hits) {
  const seen = new Set();
  const citations = [];

  for (const hit of hits) {
    const key = `${hit.source}::${hit.page ?? "na"}`;
    if (seen.has(key)) continue;
    seen.add(key);

    citations.push({
      source: hit.source,
      page: hit.page,
      snippet: cleanSnippet(hit.content),
    });
  }

  return citations;
}

function stripTrailingSourcesSection(text) {
  if (!text) return text;

  return text
    .replace(/\n{1,}(?:Sources?|Citations?)\s*:\s*(?:\n|$)[\s\S]*$/i, "")
    .trim();
}

async function embedText(text) {
  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model:
        process.env.OPENROUTER_EMBEDDING_MODEL || "openai/text-embedding-3-small",
      input: text,
      encoding_format: "float",
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding error: ${await response.text()}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

export const POST = auth(async function POST(request) {
  if (!request.auth) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return Response.json(
        { error: "Missing OPENROUTER_API_KEY" },
        { status: 500 }
      );
    }

    if (!fs.existsSync(CORPUS_PATH)) {
      return Response.json(
        { error: "Corpus file not found. Build corpus first." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const corpus = JSON.parse(fs.readFileSync(CORPUS_PATH, "utf8"));

    const recentUserTurns = collectRecentUserTurns(messages, 4);
    const latestUserMessage = recentUserTurns[recentUserTurns.length - 1];

    if (!latestUserMessage) {
      return Response.json(
        { error: "No user message found." },
        { status: 400 }
      );
    }

    const retrievalQuery = buildRetrievalQuery(messages);
    const queryEmbedding = await embedText(retrievalQuery);

    const { hits, controls, candidateNames } = searchCorpus(
      queryEmbedding,
      corpus,
      latestUserMessage,
      messages,
      30,
      12
    );

    const { isListQuery, isCrossDocQuery, isNameQuery } =
      classifyQuestion(latestUserMessage);

    const context = buildContext(hits);
    const citations = buildCitationData(hits);

    const priorUserContext = recentUserTurns.slice(0, -1);

    const strictModeInstruction = [
    "You are a strict, risk-averse assistant for Jon's research site.",
    "Use only the retrieved excerpts and the recent user-side context provided below.",
    "Do not use outside knowledge.",
    "Do not rely on prior assistant answers, because they may have been wrong.",
    "If support in the retrieved excerpts is partial, weak, or ambiguous, say so plainly.",
    "Do not complete patterns or infer a full list from partial evidence.",
    "For list questions, only list items explicitly supported in the retrieved excerpts.",
    "If you cannot confidently provide a complete list from the retrieved excerpts, say that clearly.",
    "If asked about comparisons or overlaps, separate direct textual support from inference.",
    "Label inferred synthesis explicitly as 'Inference'.",
    "Treat user-supplied names as hypotheses, not facts.",
    "Do not confirm that a person is mentioned unless the exact name appears in the retrieved excerpts.",
    "Source constraints are enforced by the system. Do not claim that citation control is outside your control.",
    "If a source has been excluded by the user, behave as if it is unavailable.",
    "Do not mention internal source ids, source numbers, or retrieval labels.",
    "Do not append your own 'Sources:' or 'Citations:' section.",
    "The UI will display citations separately.",
    "Return plain markdown only.",
    "Use short paragraphs and bullet lists when helpful.",
    "Do not use tables unless they clearly help.",
    "Do not use code fences unless you are actually giving code.",
    "Prefer saying 'I can't confidently answer that from the retrieved excerpts' over guessing.",
  ].join(" ");

    const taskHints = [];

    if (isListQuery) {
      taskHints.push(
        "This is a high-risk list/outline question. Be especially strict."
      );
    }

    if (isCrossDocQuery) {
      taskHints.push(
        "This is a cross-document question. Only compare documents when the retrieved excerpts support the comparison."
      );
    }

    if (isNameQuery) {
      taskHints.push(
        "This is a name/person question. Only confirm names that appear verbatim in the retrieved excerpts."
      );
    }

    if (controls.excludePaper) {
      taskHints.push(
        "The paper is currently excluded by user instruction. Do not retrieve from it, discuss it, or cite it unless the user explicitly re-allows it."
      );
    }
    
    if (controls.excludeGuide) {
      taskHints.push(
        "The guide is currently excluded by user instruction. Do not retrieve from it, discuss it, or cite it unless the user explicitly re-allows it."
      );
    }
    
    if (controls.onlyPaper) {
      taskHints.push("Use only the paper.");
    }
    
    if (controls.onlyGuide) {
      taskHints.push("Use only the guide.");
    }

    if (candidateNames.length > 0) {
      taskHints.push(
        `Candidate names mentioned by the user: ${candidateNames.join(", ")}`
      );
    }

    const systemMessage = {
      role: "system",
      content: `${strictModeInstruction}\n\n${taskHints.join("\n")}`.trim(),
    };

    const userContextMessage =
      priorUserContext.length > 0
        ? {
            role: "system",
            content: `Recent user-side context:\n${priorUserContext
              .map((turn) => `- ${turn}`)
              .join("\n")}`,
          }
        : null;

    const contextMessage = {
      role: "system",
      content: `Retrieved source excerpts:\n\n${context}`,
    };

    const chatMessages = [
      systemMessage,
      ...(userContextMessage ? [userContextMessage] : []),
      contextMessage,
      { role: "user", content: latestUserMessage },
    ];

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "X-OpenRouter-Title": "Jon Research Site",
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL || "openai/gpt-4.1-mini",
          messages: chatMessages,
          temperature: 0.05,
        }),
      }
    );

    if (!response.ok) {
      return Response.json(
        { error: `OpenRouter error: ${await response.text()}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    let content =
      data?.choices?.[0]?.message?.content || "No response content returned.";
    
    content = stripTrailingSourcesSection(content);

    return Response.json({
      content,
      citations,
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
});
