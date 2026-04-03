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
    isGuide: /\bguide\b/i.test(source),
    isPaper: /\bpaper\b/i.test(source),
  }));
}

function detectSourceControls(messages, sourceInfos) {
  const recentUserText = collectRecentUserTurns(messages, 4).join("\n").toLowerCase();

  const controls = {
    onlyGuide: false,
    onlyPaper: false,
    excludeGuide: false,
    excludePaper: false,
    exactSourceMentions: [],
  };

  if (/\bonly (the )?guide\b|\bguide only\b/.test(recentUserText)) {
    controls.onlyGuide = true;
  }

  if (/\bonly (the )?paper\b|\bpaper only\b/.test(recentUserText)) {
    controls.onlyPaper = true;
  }

  if (/\bignore (the )?guide\b|\bexclude (the )?guide\b|\bstop citing (the )?guide\b/.test(recentUserText)) {
    controls.excludeGuide = true;
  }

  if (/\bignore (the )?paper\b|\bexclude (the )?paper\b|\bstop citing (the )?paper\b/.test(recentUserText)) {
    controls.excludePaper = true;
  }

  for (const info of sourceInfos) {
    if (
      info.normSource &&
      (recentUserText.includes(info.normSource) || recentUserText.includes(info.normBase))
    ) {
      controls.exactSourceMentions.push(info.source);
    }
  }

  return controls;
}

function getAllowedSources(sourceInfos, controls) {
  let allowed = sourceInfos.map((info) => info.source);

  if (controls.onlyGuide) {
    allowed = sourceInfos.filter((info) => info.isGuide).map((info) => info.source);
  }

  if (controls.onlyPaper) {
    allowed = sourceInfos.filter((info) => info.isPaper).map((info) => info.source);
  }

  if (controls.excludeGuide) {
    const guideSources = new Set(
      sourceInfos.filter((info) => info.isGuide).map((info) => info.source)
    );
    allowed = allowed.filter((source) => !guideSources.has(source));
  }

  if (controls.excludePaper) {
    const paperSources = new Set(
      sourceInfos.filter((info) => info.isPaper).map((info) => info.source)
    );
    allowed = allowed.filter((source) => !paperSources.has(source));
  }

  return new Set(allowed);
}

function scoreSourceBias(item, latestUserMessage, controls, sourceInfos) {
  const qNorm = normalizeText(latestUserMessage);
  const sourceInfo = sourceInfos.find((info) => info.source === item.source);

  if (!sourceInfo) return 0;

  let boost = 0;

  if (
    sourceInfo.normSource &&
    (qNorm.includes(sourceInfo.normSource) || qNorm.includes(sourceInfo.normBase))
  ) {
    boost += 0.1;
  }

  if (controls.exactSourceMentions.includes(item.source)) {
    boost += 0.08;
  }

  if (/\bguide\b/i.test(latestUserMessage) && sourceInfo.isGuide) {
    boost += 0.03;
  }

  if (/\bpaper\b/i.test(latestUserMessage) && sourceInfo.isPaper) {
    boost += 0.03;
  }

  return boost;
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

function searchCorpus(queryEmbedding, corpus, latestUserMessage, messages, topK = 10) {
  const sourceInfos = getSourceInfos(corpus);
  const controls = detectSourceControls(messages, sourceInfos);
  const allowedSources = getAllowedSources(sourceInfos, controls);

  const filteredCorpus = corpus.filter((item) => allowedSources.has(item.source));

  const scored = filteredCorpus.map((item) => {
    const semanticScore = cosineSimilarity(queryEmbedding, item.embedding);
    const sourceBias = scoreSourceBias(
      item,
      latestUserMessage,
      controls,
      sourceInfos
    );

    return {
      ...item,
      score: semanticScore + sourceBias,
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

  return {
    hits: merged.slice(0, topK),
    controls,
    candidateNames,
  };
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
      10
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
      "Obey hard source constraints from the user, such as ignoring the paper or using only the guide.",
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
        "The user has asked to ignore the paper. Do not discuss or cite the paper."
      );
    }

    if (controls.excludeGuide) {
      taskHints.push(
        "The user has asked to ignore the guide. Do not discuss or cite the guide."
      );
    }

    if (controls.onlyPaper) {
      taskHints.push(
        "The user has asked to use only the paper."
      );
    }

    if (controls.onlyGuide) {
      taskHints.push(
        "The user has asked to use only the guide."
      );
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
    const content =
      data?.choices?.[0]?.message?.content || "No response content returned.";

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
}
