import fs from "node:fs";
import path from "node:path";

import { parseFaqMarkdown } from "../lib/asktpp-faq.mjs";

const CHUNKS_PATH = path.join(process.cwd(), "corpus", "generated", "chunks.json");
const OUTPUT_DIR = path.join(process.cwd(), "corpus", "generated");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "corpus.json");
const PARTIAL_PATH = path.join(OUTPUT_DIR, "corpus.partial.json");
const FAQ_SOURCE_PATH = path.join(process.cwd(), "corpus", "AskTPP_FAQ.md");
const FAQ_RECORDS_PATH = path.join(OUTPUT_DIR, "faq-records.json");
const FAQ_OUTPUT_PATH = path.join(OUTPUT_DIR, "faq.json");

const EMBEDDING_MODEL =
  process.env.OPENROUTER_EMBEDDING_MODEL || "openai/text-embedding-3-small";
const BATCH_SIZE = Number.parseInt(process.env.EMBEDDING_BATCH_SIZE || "64", 10);
const DOCUMENT_INPUT_TYPE = process.env.OPENROUTER_DOCUMENT_INPUT_TYPE || "";
const MAX_ATTEMPTS = 4;

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function getEmbeddings(texts) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const body = {
      model: EMBEDDING_MODEL,
      input: texts,
      encoding_format: "float",
    };
    if (DOCUMENT_INPUT_TYPE) body.input_type = DOCUMENT_INPUT_TYPE;

    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-OpenRouter-Title": "AskTPP Corpus Builder",
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const data = await response.json();
      return [...data.data]
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);
    }

    const errorText = await response.text();
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === MAX_ATTEMPTS) {
      throw new Error(`Embedding error ${response.status}: ${errorText}`);
    }

    await sleep(500 * 2 ** (attempt - 1));
  }

  throw new Error("Embedding request exhausted all attempts");
}

function loadReusableEmbeddings() {
  const candidates = [PARTIAL_PATH, OUTPUT_PATH];
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    try {
      const entries = JSON.parse(fs.readFileSync(candidate, "utf8"));
      if (!Array.isArray(entries)) continue;
      return new Map(
        entries
          .filter(
            (entry) =>
              entry.embedding_model === EMBEDDING_MODEL &&
              entry.content_hash &&
              Array.isArray(entry.embedding)
          )
          .map((entry) => [entry.content_hash, entry.embedding])
      );
    } catch {
      // Ignore an incomplete or incompatible prior artifact.
    }
  }
  return new Map();
}

function loadReusableFaqEmbeddings() {
  if (!fs.existsSync(FAQ_OUTPUT_PATH)) return new Map();
  try {
    const faq = JSON.parse(fs.readFileSync(FAQ_OUTPUT_PATH, "utf8"));
    return new Map(
      (faq.entries || [])
        .filter(
          (entry) =>
            entry.embedding_model === EMBEDDING_MODEL &&
            entry.content_hash &&
            Array.isArray(entry.embedding)
        )
        .map((entry) => [entry.content_hash, entry.embedding])
    );
  } catch {
    return new Map();
  }
}

async function buildEmbeddedFaq() {
  if (!fs.existsSync(FAQ_SOURCE_PATH)) {
    throw new Error(`Missing FAQ source: ${FAQ_SOURCE_PATH}`);
  }

  const faq = parseFaqMarkdown(fs.readFileSync(FAQ_SOURCE_PATH, "utf8"));
  if (faq.entries.length !== 44) {
    throw new Error(`Expected 44 FAQ entries, found ${faq.entries.length}`);
  }
  fs.writeFileSync(FAQ_RECORDS_PATH, `${JSON.stringify(faq, null, 2)}\n`, "utf8");

  const reusable = loadReusableFaqEmbeddings();
  const entries = faq.entries.map((entry) => ({
    ...entry,
    embedding_model: entry.active ? EMBEDDING_MODEL : null,
    embedding: entry.active ? reusable.get(entry.content_hash) || null : null,
  }));
  const pendingIndexes = entries
    .map((entry, index) => (entry.active && !entry.embedding ? index : null))
    .filter((index) => index !== null);

  console.log(
    `Embedding ${pendingIndexes.length} of ${entries.filter((entry) => entry.active).length} active FAQ records with ${EMBEDDING_MODEL}`
  );

  for (let start = 0; start < pendingIndexes.length; start += BATCH_SIZE) {
    const indexes = pendingIndexes.slice(start, start + BATCH_SIZE);
    const embeddings = await getEmbeddings(
      indexes.map((index) => entries[index].retrieval_text)
    );
    indexes.forEach((entryIndex, batchIndex) => {
      entries[entryIndex].embedding = embeddings[batchIndex];
    });
  }

  fs.writeFileSync(
    FAQ_OUTPUT_PATH,
    `${JSON.stringify({ ...faq, embedding_model: EMBEDDING_MODEL, entries })}\n`,
    "utf8"
  );
  console.log(`Wrote embedded FAQ to ${FAQ_OUTPUT_PATH}`);
}

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }
  if (!Number.isInteger(BATCH_SIZE) || BATCH_SIZE < 1) {
    throw new Error("EMBEDDING_BATCH_SIZE must be a positive integer");
  }
  if (!fs.existsSync(CHUNKS_PATH)) {
    throw new Error(`Missing chunks file: ${CHUNKS_PATH}`);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const chunks = JSON.parse(fs.readFileSync(CHUNKS_PATH, "utf8"));
  if (!Array.isArray(chunks) || chunks.length === 0) {
    throw new Error("chunks.json is empty or invalid");
  }

  const reusable = loadReusableEmbeddings();
  const corpus = chunks.map((chunk) => ({
    ...chunk,
    embedding_model: EMBEDDING_MODEL,
    embedding: reusable.get(chunk.content_hash) || null,
  }));
  const pendingIndexes = corpus
    .map((entry, index) => (entry.embedding ? null : index))
    .filter((index) => index !== null);

  console.log(
    `Embedding ${pendingIndexes.length} of ${corpus.length} chunks with ${EMBEDDING_MODEL}`
  );

  for (let start = 0; start < pendingIndexes.length; start += BATCH_SIZE) {
    const indexes = pendingIndexes.slice(start, start + BATCH_SIZE);
    const texts = indexes.map(
      (index) => corpus[index].retrieval_text || corpus[index].content
    );
    const embeddings = await getEmbeddings(texts);
    if (embeddings.length !== indexes.length) {
      throw new Error("Embedding count does not match batch size");
    }

    indexes.forEach((corpusIndex, batchIndex) => {
      corpus[corpusIndex].embedding = embeddings[batchIndex];
    });
    fs.writeFileSync(PARTIAL_PATH, `${JSON.stringify(corpus)}\n`, "utf8");
    console.log(
      `Embedded ${Math.min(start + indexes.length, pendingIndexes.length)}/${pendingIndexes.length}`
    );
  }

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(corpus)}\n`, "utf8");
  if (fs.existsSync(PARTIAL_PATH)) fs.unlinkSync(PARTIAL_PATH);
  console.log(`Wrote embedded corpus to ${OUTPUT_PATH}`);
  await buildEmbeddedFaq();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
