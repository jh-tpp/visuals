import fs from "fs";
import path from "path";
import { OpenRouter } from "@openrouter/sdk";

const CHUNKS_PATH = path.join(process.cwd(), "corpus", "generated", "chunks.json");
const OUTPUT_PATH = path.join(process.cwd(), "corpus", "generated", "corpus.json");

const EMBEDDING_MODEL =
  process.env.OPENROUTER_EMBEDDING_MODEL || "openai/text-embedding-3-small";

const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }

  const chunks = JSON.parse(fs.readFileSync(CHUNKS_PATH, "utf8"));

  const texts = chunks.map((chunk) => chunk.content);

  const response = await openRouter.embeddings.generate({
    model: EMBEDDING_MODEL,
    input: texts,
  });

  const corpus = chunks.map((chunk, index) => ({
    ...chunk,
    embedding: response.data[index].embedding,
  }));

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(corpus, null, 2), "utf8");
  console.log(`Wrote embedded corpus to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});