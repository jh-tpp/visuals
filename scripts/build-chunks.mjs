import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";

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

async function extractPagesFromPdf(fullPath) {
  const dataBuffer = fs.readFileSync(fullPath);
  const parser = new PDFParse({ data: dataBuffer });

  try {
    const info = await parser.getInfo();
    const totalPages = info?.total ?? info?.numpages ?? info?.numPages ?? 1;

    const pages = [];

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      const result = await parser.getText({ partial: [pageNumber] });
      const text = (result?.text || "").trim();
      if (text) {
        pages.push({ pageNumber, text });
      }
    }

    if (pages.length > 0) {
      return pages;
    }

    const fallback = await parser.getText();
    const text = (fallback?.text || "").trim();
    return text ? [{ pageNumber: null, text }] : [];
  } finally {
    await parser.destroy();
  }
}

async function main() {
  const files = fs
    .readdirSync(PDF_DIR)
    .filter((name) => name.toLowerCase().endsWith(".pdf"))
    .sort();

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
