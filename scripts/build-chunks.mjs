import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PDF_DIR = path.join(ROOT, "corpus", "pdfs");
const MANIFEST_PATH = path.join(ROOT, "corpus", "manifest.json");
const OUTPUT_DIR = path.join(ROOT, "corpus", "generated");
const PAGES_PATH = path.join(OUTPUT_DIR, "pages.json");
const CHUNKS_PATH = path.join(OUTPUT_DIR, "chunks.json");
const AUDIT_PATH = path.join(OUTPUT_DIR, "audit.json");

const TARGET_WORDS = 320;
const MAX_WORDS = 450;
const OVERLAP_WORDS = 45;
const MIN_CHUNK_WORDS = 35;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sha256(filePath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

function hashText(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function countWords(text) {
  return (text.match(/[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*/gu) || []).length;
}

function normalizeBlock(block) {
  return block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePageText(text) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/\u00ad/g, "")
    .replace(/(\p{L})-\s*\n+\s*(?=\p{Ll})/gu, "$1-")
    .split(/\n{2,}/)
    .map(normalizeBlock)
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function splitIntoUnits(text) {
  const sentenceSegmenter = new Intl.Segmenter("en", {
    granularity: "sentence",
  });
  const units = [];

  for (const paragraph of text.split(/\n{2,}/).filter(Boolean)) {
    if (countWords(paragraph) <= MAX_WORDS) {
      units.push(paragraph);
      continue;
    }

    const sentences = [...sentenceSegmenter.segment(paragraph)]
      .map(({ segment }) => segment.trim())
      .filter(Boolean);
    let current = [];
    let currentWords = 0;

    for (const sentence of sentences) {
      const sentenceWords = countWords(sentence);
      if (current.length > 0 && currentWords + sentenceWords > MAX_WORDS) {
        units.push(current.join(" "));
        current = [];
        currentWords = 0;
      }
      current.push(sentence);
      currentWords += sentenceWords;
    }

    if (current.length > 0) units.push(current.join(" "));
  }

  return units;
}

function tailForOverlap(units) {
  const words = units.join(" ").split(/\s+/).filter(Boolean);
  if (words.length <= OVERLAP_WORDS) return [...units];
  return [words.slice(-OVERLAP_WORDS).join(" ")];
}

function chunkPage(text) {
  const units = splitIntoUnits(text);
  const chunks = [];
  let current = [];
  let currentWords = 0;

  function flush() {
    if (current.length === 0) return;
    const content = current.join("\n\n").trim();
    if (countWords(content) >= MIN_CHUNK_WORDS) chunks.push(content);
    current = tailForOverlap(current);
    currentWords = current.reduce((sum, unit) => sum + countWords(unit), 0);
  }

  for (const unit of units) {
    const unitWords = countWords(unit);
    if (
      current.length > 0 &&
      (currentWords + unitWords > MAX_WORDS || currentWords >= TARGET_WORDS)
    ) {
      flush();
    }
    current.push(unit);
    currentWords += unitWords;
  }

  if (current.length > 0) {
    const content = current.join("\n\n").trim();
    if (countWords(content) >= MIN_CHUNK_WORDS) chunks.push(content);
  }

  return [...new Set(chunks)];
}

function findHeadingHint(text) {
  return (
    text
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .find(
        (block) =>
          block.length >= 3 &&
          block.length <= 140 &&
          !/^\d+$/.test(block) &&
          countWords(block) <= 18
      ) || null
  );
}

function removeRepeatedFurniture(pages) {
  const counts = new Map();

  for (const page of pages) {
    const uniqueBlocks = new Set(
      page.text
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter((block) => block.length > 0 && block.length <= 120)
    );
    for (const block of uniqueBlocks) {
      counts.set(block, (counts.get(block) || 0) + 1);
    }
  }

  const repetitionThreshold = Math.max(4, Math.ceil(pages.length * 0.3));
  const repeated = new Set(
    [...counts.entries()]
      .filter(([, count]) => count >= repetitionThreshold)
      .map(([block]) => block)
  );

  return pages.map((page) => ({
    ...page,
    text: page.text
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter((block) => !/^\d{1,3}$/.test(block) && !repeated.has(block))
      .join("\n\n")
      .trim(),
  }));
}

function extractPages(fullPath) {
  let output;
  try {
    output = execFileSync("pdftotext", ["-enc", "UTF-8", fullPath, "-"], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(
        "Missing pdftotext. Install Poppler before building the corpus."
      );
    }
    throw error;
  }

  const rawPages = output.split("\f");
  if (rawPages.at(-1)?.trim() === "") rawPages.pop();

  return removeRepeatedFurniture(
    rawPages.map((text, index) => ({
      pdf_page: index + 1,
      printed_page: index + 1,
      text: normalizePageText(text),
    }))
  );
}

function validateManifest(manifest) {
  if (manifest?.schema_version !== 1 || !Array.isArray(manifest.documents)) {
    throw new Error("corpus/manifest.json has an unsupported schema");
  }

  const manifestFiles = manifest.documents.map((document) => document.filename);
  const duplicateFiles = manifestFiles.filter(
    (filename, index) => manifestFiles.indexOf(filename) !== index
  );
  if (duplicateFiles.length > 0) {
    throw new Error(`Duplicate manifest filenames: ${duplicateFiles.join(", ")}`);
  }

  const diskFiles = fs
    .readdirSync(PDF_DIR)
    .filter((filename) => filename.toLowerCase().endsWith(".pdf"))
    .sort();
  const unregistered = diskFiles.filter((filename) => !manifestFiles.includes(filename));
  const missing = manifestFiles.filter((filename) => !diskFiles.includes(filename));

  if (unregistered.length > 0 || missing.length > 0) {
    throw new Error(
      [
        unregistered.length > 0
          ? `Unregistered PDFs: ${unregistered.join(", ")}`
          : null,
        missing.length > 0 ? `Missing PDFs: ${missing.join(", ")}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    );
  }
}

function retrievalPrefix(document, page) {
  return [
    `Document: ${document.title}`,
    `Authors: ${document.authors.join(", ")}`,
    `Organizations: ${document.organizations.join(", ")}`,
    `Publication date: ${document.publication_date}`,
    `Publication status: ${document.publication_status}`,
    `Page: ${page}`,
  ].join("\n");
}

function main() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`Missing manifest: ${MANIFEST_PATH}`);
  }
  if (!fs.existsSync(PDF_DIR)) {
    throw new Error(`Missing PDF directory: ${PDF_DIR}`);
  }

  const manifest = readJson(MANIFEST_PATH);
  validateManifest(manifest);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const allPages = [];
  const allChunks = [];
  const audit = [];

  for (const document of manifest.documents) {
    const fullPath = path.join(PDF_DIR, document.filename);
    const actualHash = sha256(fullPath);
    if (actualHash !== document.sha256) {
      throw new Error(
        `Hash mismatch for ${document.filename}\nExpected: ${document.sha256}\nActual:   ${actualHash}`
      );
    }

    const pages = extractPages(fullPath);
    let documentChunkCount = 0;
    let nearEmptyPageCount = 0;
    const nearEmptyPages = [];
    let extractedWordCount = 0;

    for (const page of pages) {
      const pageId = `${document.id}-p${String(page.pdf_page).padStart(3, "0")}`;
      const wordCount = countWords(page.text);
      extractedWordCount += wordCount;
      if (wordCount < MIN_CHUNK_WORDS) {
        nearEmptyPageCount += 1;
        nearEmptyPages.push(page.pdf_page);
      }

      allPages.push({
        id: pageId,
        document_id: document.id,
        source: document.filename,
        title: document.title,
        pdf_page: page.pdf_page,
        printed_page: page.printed_page,
        heading_hint: findHeadingHint(page.text),
        word_count: wordCount,
        content_hash: hashText(page.text),
        content: page.text,
      });

      const pageChunks = chunkPage(page.text);
      pageChunks.forEach((content, index) => {
        const id = `${pageId}-c${String(index + 1).padStart(2, "0")}`;
        const retrievalText = `${retrievalPrefix(document, page.printed_page)}\n\n${content}`;
        allChunks.push({
          id,
          document_id: document.id,
          source: document.filename,
          title: document.title,
          authors: document.authors,
          organizations: document.organizations,
          publication_date: document.publication_date,
          publication_status: document.publication_status,
          source_type: document.source_type,
          canonical_url: document.canonical_url,
          aliases: document.aliases,
          answer_policy: document.answer_policy,
          page: page.printed_page,
          pdf_page: page.pdf_page,
          heading_hint: findHeadingHint(content),
          word_count: countWords(content),
          content_hash: hashText(retrievalText),
          retrieval_text: retrievalText,
          content,
        });
      });
      documentChunkCount += pageChunks.length;
    }

    audit.push({
      document_id: document.id,
      filename: document.filename,
      publication_status: document.publication_status,
      pages: pages.length,
      near_empty_pages: nearEmptyPageCount,
      near_empty_page_numbers: nearEmptyPages,
      extracted_words: extractedWordCount,
      chunks: documentChunkCount,
    });
  }

  fs.writeFileSync(PAGES_PATH, `${JSON.stringify(allPages, null, 2)}\n`, "utf8");
  fs.writeFileSync(CHUNKS_PATH, `${JSON.stringify(allChunks, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    AUDIT_PATH,
    `${JSON.stringify(
      {
        schema_version: 1,
        document_count: audit.length,
        page_count: allPages.length,
        chunk_count: allChunks.length,
        documents: audit,
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  console.table(audit);
  console.log(`Wrote ${allPages.length} pages to ${PAGES_PATH}`);
  console.log(`Wrote ${allChunks.length} chunks to ${CHUNKS_PATH}`);
  console.log(`Wrote corpus audit to ${AUDIT_PATH}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
