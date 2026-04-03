import fs from "fs";
import path from "path";

const CORPUS_PATH = path.join(process.cwd(), "corpus", "generated", "corpus.json");

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

function classifyQuestion(question) {
  const q = question.toLowerCase();

  const isListQuery =
    /\b(list|enumerate|outline|all|complete list|every)\b/.test(q) ||
    /\bwhat are the (insights|sections|steps|claims|principles|themes)\b/.test(q);

  const isCrossDocQuery =
    /\b(compare|comparison|connections|relationship|relate|between|both)\b/.test(q) ||
    (/\bguide\b/.test(q) && /\bpaper\b/.test(q));

  return { isListQuery, isCrossDocQuery };
}

function getSourceInfos(corpus) {
  const uniqueSources = [...new Set(corpus.map((item) => item.source))];

  return uniqueSources.map((source) => {
    const normSource = normalizeText(source);
    const normBase = normalizeText(source.replace(/\.pdf$/i, ""));
    return {
      source,
      normSource,
      normBase,
      isGuide: /\bguide\b/i.test(source),
      isPaper: /\bpaper\b/i.test(source),
    };
  });
}

function scoreSourceBias(item, latestUserMessage, sourceInfos) {
  const qNorm = normalizeText(latestUserMessage);
  const sourceInfo = sourceInfos.find((info) => info.source === item.source);

  if (!sourceInfo) return 0;

  let boost = 0;

  // Strong-ish soft bias for exact filename / basename mention
  if (
    sourceInfo.normSource &&
    (qNorm.includes(sourceInfo.normSource) || qNorm.includes(sourceInfo.normBase))
  ) {
    boost += 0.08;
  }

  // Gentle soft bias for vague guide / paper phrasing
  if (/\bguide\b/i.test(latestUserMessage) && sourceInfo.isGuide) {
    boost += 0.025;
  }

  if (/\bpaper\b/i.test(latestUserMessage) && sourceInfo.isPaper) {
    boost += 0.025;
  }

  return boost;
}

function pickHits(scored, latestUserMessage, sourceInfos, topK = 8) {
  const { isCrossDocQuery } = classifyQuestion(latestUserMessage);

  if (!isCrossDocQuery) {
    return scored.slice(0, topK);
  }

  const selected = [];
  const selectedIds = new Set();

  // For cross-doc questions, softly encourage coverage from both guide-like and paper-like sources.
  const wantsGuide = /\bguide\b/i.test(latestUserMessage);
  const wantsPaper = /\bpaper\b/i.test(latestUserMessage);

  if (wantsGuide) {
    const guideHits = scored.filter((hit) => {
      const info = sourceInfos.find((s) => s.source === hit.source);
      return info?.isGuide;
    });
    for (const hit of guideHits.slice(0, 3)) {
      selected.push(hit);
      selectedIds.add(hit.id);
    }
  }

  if (wantsPaper) {
    const paperHits = scored.filter((hit) => {
      const info = sourceInfos.find((s) => s.source === hit.source);
      return info?.isPaper;
    });
    for (const hit of paperHits.slice(0, 3)) {
      if (!selectedIds.has(hit.id)) {
        selected.push(hit);
        selectedIds.add(hit.id);
      }
    }
  }

  for (const hit of scored) {
    if (selected.length >= topK) break;
    if (!selectedIds.has(hit.id)) {
      selected.push(hit);
      selectedIds.add(hit.id);
    }
  }

  return selected.slice(0, topK);
}

function searchCorpus(queryEmbedding, corpus, latestUserMessage, topK = 8) {
  const sourceInfos = getSourceInfos(corpus);

  const scored = corpus.map((item) => {
    const semanticScore = cosineSimilarity(queryEmbedding, item.embedding);
    const sourceBias = scoreSourceBias(item, latestUserMessage, sourceInfos);

    return {
      ...item,
      score: semanticScore + sourceBias,
      semanticScore,
      sourceBias,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return pickHits(scored, latestUserMessage, sourceInfos, topK);
}

function buildContext(hits) {
  return hits
    .map((hit, index) => {
      const citation = hit.page
        ? `${hit.source}, page ${hit.page}`
        : `${hit.source}`;

      return `[Source ${index + 1}: ${citation}]\n${hit.content}`;
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

export async function POST(request) {
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

    const latestUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user")?.content;

    if (!latestUserMessage) {
      return Response.json({ error: "No user message found." }, { status: 400 });
    }

    const { isListQuery, isCrossDocQuery } = classifyQuestion(latestUserMessage);

    const queryEmbedding = await embedText(latestUserMessage);
    const hits = searchCorpus(queryEmbedding, corpus, latestUserMessage, 10);
    const context = buildContext(hits);
    const citations = buildCitationData(hits);

    const strictModeInstruction = [
      "You are a strict, risk-averse assistant for Jon's research site.",
      "Use only the retrieved excerpts and the visible conversation history.",
      "Do not use outside knowledge, even if you think you know the answer.",
      "If support in the retrieved excerpts is partial, weak, or ambiguous, say so plainly.",
      "Do not complete patterns or infer a full list from partial evidence.",
      "If asked for a list, outline, or 'all' items, only list items explicitly supported in the retrieved excerpts.",
      "If you cannot confidently provide a complete list from the retrieved excerpts, say that clearly.",
      "If asked about connections, comparisons, or relationships, separate direct textual support from inference.",
      "Label inferred synthesis explicitly as 'Inference' and keep it modest.",
      "Do not fabricate citations, page numbers, or document structure.",
      "Prefer saying 'I can't confidently answer that from the retrieved excerpts' over guessing.",
    ].join(" ");

    const taskHint = [
      isListQuery
        ? "This is a high-risk list/outline question. Be especially strict. If the retrieved excerpts may not be complete, say you cannot confidently provide a complete list."
        : null,
      isCrossDocQuery
        ? "This is a cross-document question. Only compare documents when the retrieved excerpts support the comparison. If support comes mainly from one document, say so."
        : null,
    ]
      .filter(Boolean)
      .join(" ");

    const systemMessage = {
      role: "system",
      content: `${strictModeInstruction} ${taskHint}`.trim(),
    };

    const contextMessage = {
      role: "system",
      content: `Retrieved source excerpts:\n\n${context}`,
    };

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-OpenRouter-Title": "Jon Research Site",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
        messages: [systemMessage, contextMessage, ...messages],
        temperature: 0.05,
      }),
    });

    if (!response.ok) {
      return Response.json(
        { error: `OpenRouter error: ${await response.text()}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content =
      data?.choices?.[0]?.message?.content || "No response content returned.";

    return Response.json({
      content,
      citations,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown server error" },
      { status: 500 }
    );
  }
}
