import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";

const PDF_DIR = path.join(process.cwd(), "corpus", "pdfs");
const OUTPUT_DIR = path.join(process.cwd(), "corpus", "generated");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "chunks.json");

function chunkText(text, chunkSize = 1400, overlap = 250) {
  const cleaned = text
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const chunks = [];
  let start = 0;

  while (start < cleaned.length) {
    const end = Math.min(start + chunkSize, cleaned.length);
    const content = cleaned.slice(start, end).trim();

    if (content) {
      chunks.push(content);
    }

    if (end === cleaned.length) break;
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}

async function extractPagesFromPdf(fullPath) {
  const dataBuffer = fs.readFileSync(fullPath);
  const parser = new PDFParse({ data: dataBuffer });

  try {
    const fullResult = await parser.getText();
    const rawText = (fullResult?.text || "").trim();

    if (!rawText) return [];

    // Try page split on form-feed first
    const splitPages = rawText
      .split(/\f/g)
      .map((text) => text.trim())
      .filter(Boolean);

    if (splitPages.length > 1) {
      return splitPages.map((text, index) => ({
        pageNumber: index + 1,
        text,
      }));
    }

    // Fallback: one whole-document "page" with null page number
    return [{ pageNumber: null, text: rawText }];
  } finally {
    await parser.destroy();
  }
}

async function main() {
  if (!fs.existsSync(PDF_DIR)) {
    throw new Error(`Missing folder: ${PDF_DIR}`);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = fs
    .readdirSync(PDF_DIR)
    .filter((name) => name.toLowerCase().endsWith(".pdf"))
    .sort();

  if (files.length === 0) {
    throw new Error(`No PDFs found in ${PDF_DIR}`);
  }

  const allChunks = [];

  for (const file of files) {
    const fullPath = path.join(PDF_DIR, file);
    const pages = await extractPagesFromPdf(fullPath);

    pages.forEach(({ pageNumber, text }) => {
      const pageChunks = chunkText(text);

      pageChunks.forEach((content, chunkIndex) => {
        allChunks.push({
          id: pageNumber
            ? `${file}-p${pageNumber}-c${chunkIndex + 1}`
            : `${file}-chunk-${chunkIndex + 1}`,
          source: file,
          page: pageNumber,
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
