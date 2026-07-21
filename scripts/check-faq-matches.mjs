import fs from "node:fs";
import path from "node:path";

import { findFaqMatch } from "../lib/asktpp-faq.mjs";

const FAQ_PATH = path.join(process.cwd(), "corpus", "generated", "faq.json");
const MODEL =
  process.env.OPENROUTER_EMBEDDING_MODEL || "openai/text-embedding-3-small";
const questions = process.argv.slice(2);
const probes =
  questions.length > 0
    ? questions
    : [
        "What is CSP?",
        "What is Total Portfolio Project?",
        "What is the goals-based investing and philanthropy guide about?",
        "What is The Impact Frontier paper about?",
        "How does the 'goals'-guide relate to the rest of CSP's work?",
        "How does The Impact Frontier paper relate to CSP's work?",
        "What themes recur across the CSP guides?",
        "What CSP guides are in the corpus?",
        "How does Shifting the Frontier relate to The Impact Frontier?",
        "What color is the website?",
      ];

if (!process.env.OPENROUTER_API_KEY) throw new Error("Missing OPENROUTER_API_KEY");
const faq = JSON.parse(fs.readFileSync(FAQ_PATH, "utf8"));
const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "X-OpenRouter-Title": "AskTPP FAQ Check",
  },
  body: JSON.stringify({ model: MODEL, input: probes, encoding_format: "float" }),
});
if (!response.ok) throw new Error(await response.text());

const data = await response.json();
const embeddings = [...data.data].sort((a, b) => a.index - b.index);
console.table(
  probes.map((question, index) => {
    const match = findFaqMatch(question, faq, embeddings[index].embedding);
    const nearest = findFaqMatch(question, faq, embeddings[index].embedding, 0);
    return {
      question,
      faq_id: match?.faq_id || "—",
      match: match?.match_type || "—",
      score: match ? match.match_score.toFixed(3) : "—",
      nearest: nearest?.faq_id || "—",
      nearest_score: nearest ? nearest.match_score.toFixed(3) : "—",
    };
  })
);
