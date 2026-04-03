import fs from "fs";
import path from "path";

const CORPUS_PATH = path.join(process.cwd(), "corpus", "generated", "corpus.json");

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
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding error: ${await response.text()}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

function searchCorpus(queryEmbedding, corpus, topK = 6) {
  const scored = corpus.map((item) => ({
    ...item,
    score: cosineSimilarity(queryEmbedding, item.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
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

function buildCitationList(hits) {
  const seen = new Set();
  const citations = [];

  for (const hit of hits) {
    const citation = hit.page
      ? `${hit.source}, page ${hit.page}`
      : `${hit.source}`;

    if (!seen.has(citation)) {
      seen.add(citation);
      citations.push(citation);
    }
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

    const queryEmbedding = await embedText(latestUserMessage);
    const hits = searchCorpus(queryEmbedding, corpus, 6);
    const context = buildContext(hits);
    const citations = buildCitationList(hits);

    const systemMessage = {
      role: "system",
      content:
        "You are a helpful assistant for Jon's research site. Answer clearly, concisely, and honestly. Use only the provided source context when making factual claims about the documents. If the answer is not supported by the provided context, say so plainly. Do not fabricate citations.",
    };

    const contextMessage = {
      role: "system",
      content: `Use the following source material:\n\n${context}`,
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
        temperature: 0.2,
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