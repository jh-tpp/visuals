import fs from "fs";
import path from "path";
import pdf from "pdf-parse";

const PDF_DIR = path.join(process.cwd(), "corpus", "pdfs");
const OUTPUT_PATH = path.join(process.cwd(), "corpus", "generated", "chunks.json");

function chunkText(text, chunkSize = 1400, overlap = 250) {
  const cleaned = text.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const chunks = [];

  let start = 0;
  while (start < cleaned.length) {
    const end = Math.min(start + chunkSize, cleaned.length);
    const content = cleaned.slice(start, end).trim();
    if (content) chunks.push(content);
    if (end === cleaned.length) break;
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}

async function main() {
  const files = fs
    .readdirSync(PDF_DIR)
    .filter((name) => name.toLowerCase().endsWith(".pdf"))
    .sort();

  const allChunks = [];

  for (const file of files) {
    const fullPath = path.join(PDF_DIR, file);
    const dataBuffer = fs.readFileSync(fullPath);
    const parsed = await pdf(dataBuffer);

    const pages = parsed.text
      .split(/\f/g)
      .map((pageText) => pageText.trim())
      .filter(Boolean);

    if (pages.length === 0) {
      const fallbackChunks = chunkText(parsed.text);
      fallbackChunks.forEach((content, index) => {
        allChunks.push({
          id: `${file}-chunk-${index + 1}`,
          source: file,
          page: null,
          content,
        });
      });
      continue;
    }

    pages.forEach((pageText, pageIndex) => {
      const pageChunks = chunkText(pageText);
      pageChunks.forEach((content, chunkIndex) => {
        allChunks.push({
          id: `${file}-p${pageIndex + 1}-c${chunkIndex + 1}`,
          source: file,
          page: pageIndex + 1,
          content,
        });
      });
    });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allChunks, null, 2), "utf8");
  console.log(`Wrote ${allChunks.length} chunks to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});