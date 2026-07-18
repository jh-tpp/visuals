import { auth } from "@/auth";
import {
  buildCorpusCatalog,
  buildRetrievalQuery,
  classifyQuestion,
  collectRecentUserTurns,
  detectSourceControls,
  getCuratedResponse,
  getSourceInfos,
  normalizeText,
  searchCorpus,
} from "@/lib/asktpp-retrieval.mjs";
import fs from "fs";
import path from "path";

const CORPUS_PATH = path.join(process.cwd(), "corpus", "generated", "corpus.json");
const MANIFEST_PATH = path.join(process.cwd(), "corpus", "manifest.json");
const CURATED_CONTEXT_PATH = path.join(
  process.cwd(),
  "corpus",
  "curated-context.json"
);

const PRELIMINARY_IMPACT_FRONTIER_POLICY = {
  conceptual_use: "allowed",
  quantitative_reporting: "restricted",
  instruction:
    "Use this paper for conceptual and methodological discussion. Do not proactively report its numerical estimates, calibration results, coefficients, or quantitative findings. If a user asks for numbers from the paper, state that the quantitative results are preliminary, do not present them as final, and defer to a forthcoming final version.",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getAnswerPolicy(item) {
  if (item?.answer_policy) return item.answer_policy;

  const identity = normalizeText(`${item?.source || ""} ${item?.title || ""}`);
  if (
    identity.includes("paper 1 iffeb26") ||
    identity.includes("paper1") ||
    identity.includes("impact frontier")
  ) {
    return PRELIMINARY_IMPACT_FRONTIER_POLICY;
  }

  return null;
}

function getPolicySafeContent(item) {
  const content = item?.content || "";
  const policy = getAnswerPolicy(item);

  if (policy?.quantitative_reporting !== "restricted") return content;

  return content
    .replace(
      /(?<![\p{L}])(?:[$€£]\s*)?[+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?(?:\s*%|\s*(?:basis points?|bps|times|x))?/giu,
      "[preliminary figure omitted]"
    )
    .replace(
      /(?:\[preliminary figure omitted\]\s*){2,}/g,
      "[preliminary figures omitted] "
    )
    .replace(/\s+/g, " ")
    .trim();
}

function buildContext(hits) {
  return hits
    .map((hit) => {
      const parts = [
        "BEGIN EXCERPT",
        `Source title: ${hit.title || hit.source}`,
        `Source file: ${hit.source}`,
      ];

      if (Array.isArray(hit.authors) && hit.authors.length > 0) {
        parts.push(`Authors: ${hit.authors.join(", ")}`);
      }
      if (hit.publication_date) parts.push(`Publication date: ${hit.publication_date}`);
      if (hit.publication_status) {
        parts.push(`Publication status: ${hit.publication_status}`);
      }

      const answerPolicy = getAnswerPolicy(hit);
      if (answerPolicy?.instruction) {
        parts.push(`Source-use policy: ${answerPolicy.instruction}`);
      }
      if (hit.page) parts.push(`Page: ${hit.page}`);
      if (hit.canonical_url) parts.push(`Canonical URL: ${hit.canonical_url}`);

      parts.push("Excerpt:");
      parts.push(getPolicySafeContent(hit));
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
      source: hit.title || hit.source,
      page: hit.page,
      url: hit.canonical_url || null,
      snippet: cleanSnippet(getPolicySafeContent(hit)),
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

function curatedResponseAllowed(response, controls) {
  if (!response) return false;
  if (response.scope === "csp") {
    return !controls.onlyPaper && !controls.excludeGuide;
  }
  if (response.scope === "paper") {
    return !controls.onlyGuide && !controls.excludePaper;
  }
  return !(
    controls.onlyGuide ||
    controls.onlyPaper ||
    controls.excludeGuide ||
    controls.excludePaper
  );
}

async function embedText(text) {
  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "X-OpenRouter-Title": "AskTPP Retrieval",
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
      return Response.json({ error: "Missing OPENROUTER_API_KEY" }, { status: 500 });
    }

    const requiredFiles = [CORPUS_PATH, MANIFEST_PATH, CURATED_CONTEXT_PATH];
    const missingFile = requiredFiles.find((filePath) => !fs.existsSync(filePath));
    if (missingFile) {
      return Response.json(
        { error: `Required corpus file not found: ${path.basename(missingFile)}` },
        { status: 500 }
      );
    }

    const body = await request.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const recentUserTurns = collectRecentUserTurns(messages, 2);
    const latestUserMessage = recentUserTurns.at(-1);

    if (!latestUserMessage) {
      return Response.json({ error: "No user message found." }, { status: 400 });
    }

    const corpus = readJson(CORPUS_PATH);
    const manifest = readJson(MANIFEST_PATH);
    const curatedContext = readJson(CURATED_CONTEXT_PATH);
    const sourceControls = detectSourceControls(messages, getSourceInfos(corpus));
    const curatedResponse = getCuratedResponse(
      latestUserMessage,
      manifest,
      curatedContext
    );

    if (curatedResponseAllowed(curatedResponse, sourceControls)) {
      return Response.json({
        content: curatedResponse.content,
        citations: curatedResponse.citations,
      });
    }

    const retrievalQuery = buildRetrievalQuery(messages);
    const queryEmbedding = await embedText(retrievalQuery);
    const { hits, controls, candidateNames } = searchCorpus(
      queryEmbedding,
      corpus,
      latestUserMessage,
      messages,
      36,
      12
    );
    const { isListQuery, isCrossDocQuery, isNameQuery } =
      classifyQuestion(latestUserMessage);
    const citations = buildCitationData(hits);
    const priorUserContext = recentUserTurns.slice(0, -1);

    const strictModeInstruction = [
      "You are AskTPP, a strict, risk-averse research assistant from Total Portfolio Project.",
      "Use only the curated organization reference, complete corpus catalog, retrieved excerpts, and recent user-side context provided below.",
      "Do not use outside knowledge or rely on prior assistant answers.",
      "CSP means the Center for Sustainable Finance and Private Wealth unless the user explicitly defines another meaning.",
      "Never reinterpret CSP as Corporate Sustainability Performance in this project.",
      "Describe files as indexed in or retrieved from the corpus, not as training data.",
      "Never tell the user to provide a guide or paper that the corpus catalog says is already indexed.",
      "If support is partial, weak, or ambiguous, say so plainly.",
      "Do not complete a pattern or infer a full list from partial excerpts; use the complete catalog for corpus-inventory questions.",
      "For comparisons, distinguish direct textual support from synthesis and label synthesis explicitly.",
      "Treat user-supplied names as hypotheses and confirm a person only when the exact name appears in the supplied materials.",
      "Source constraints are enforced by the system. If a source is excluded, behave as if it is unavailable.",
      "Do not mention internal source ids, source numbers, embeddings, or retrieval labels.",
      "Do not append a Sources or Citations section; the UI displays audit sources separately.",
      "Return plain markdown with short paragraphs and bullets when helpful.",
      "Prefer a clear statement of evidentiary limits over guessing.",
    ].join(" ");

    const taskHints = [];
    if (isListQuery) {
      taskHints.push("This is a high-risk list question. Be especially strict.");
    }
    if (isCrossDocQuery) {
      taskHints.push(
        "This is a cross-document question. Use evidence from every relevant source group represented in the excerpts; do not answer a CSP/paper relationship question from the paper alone."
      );
    }
    if (isNameQuery) {
      taskHints.push(
        "This is a person question. Confirm only names appearing verbatim in the supplied materials."
      );
    }
    if (controls.excludePaper) {
      taskHints.push("The paper is excluded by user instruction.");
    }
    if (controls.excludeGuide) {
      taskHints.push("The guides are excluded by user instruction.");
    }
    if (controls.onlyPaper) taskHints.push("Use only the paper.");
    if (controls.onlyGuide) taskHints.push("Use only the guides.");
    if (candidateNames.length > 0) {
      taskHints.push(`Candidate names from the user: ${candidateNames.join(", ")}`);
    }
    if (
      hits.some(
        (hit) => getAnswerPolicy(hit)?.quantitative_reporting === "restricted"
      )
    ) {
      taskHints.push(PRELIMINARY_IMPACT_FRONTIER_POLICY.instruction);
    }

    const chatMessages = [
      {
        role: "system",
        content: `${strictModeInstruction}\n\n${taskHints.join("\n")}`.trim(),
      },
      {
        role: "system",
        content: buildCorpusCatalog(manifest, curatedContext),
      },
      ...(priorUserContext.length > 0
        ? [
            {
              role: "system",
              content: `Immediately preceding user question:\n${priorUserContext[0]}`,
            },
          ]
        : []),
      {
        role: "system",
        content: `Retrieved source excerpts:\n\n${buildContext(hits)}`,
      },
      { role: "user", content: latestUserMessage },
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-OpenRouter-Title": "AskTPP",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openai/gpt-4.1-mini",
        messages: chatMessages,
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
    const content = stripTrailingSourcesSection(
      data?.choices?.[0]?.message?.content || "No response content returned."
    );
    return Response.json({ content, citations });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown server error" },
      { status: 500 }
    );
  }
});
