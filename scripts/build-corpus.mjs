import fs from "fs";
import path from "path";

const CHUNKS_PATH = path.join(process.cwd(), "corpus", "generated", "chunks.json");
const OUTPUT_DIR = path.join(process.cwd(), "corpus", "generated");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "corpus.json");

const EMBEDDING_MODEL =
  process.env.OPENROUTER_EMBEDDING_MODEL || "openai/text-embedding-3-small";

async function getEmbeddings(texts) {
  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
      encoding_format: "float",
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding error: ${await response.text()}`);
  }

  const data = await response.json();
  return data.data.map((item) => item.embedding);
}

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }

  if (!fs.existsSync(CHUNKS_PATH)) {
    throw new Error(`Missing chunks file: ${CHUNKS_PATH}`);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const chunks = JSON.parse(fs.readFileSync(CHUNKS_PATH, "utf8"));

  if (!Array.isArray(chunks) || chunks.length === 0) {
    throw new Error("chunks.json is empty or invalid");
  }

  const texts = chunks.map((chunk) => chunk.content);
  const embeddings = await getEmbeddings(texts);

  if (embeddings.length !== chunks.length) {
    throw new Error("Embedding count does not match chunk count");
  }

  const corpus = chunks.map((chunk, index) => ({
    ...chunk,
    embedding: embeddings[index],
  }));

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(corpus, null, 2), "utf8");
  console.log(`Wrote embedded corpus to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
