import crypto from "node:crypto";

const ENTRY_HEADING = /^## ((?:ID|REL|APP|SCOPE|ENG)-\d+) — (.+)$/gm;

export function normalizeFaqText(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) throw new Error("FAQ Markdown is missing YAML-style frontmatter");

  return Object.fromEntries(
    match[1]
      .split("\n")
      .map((line) => line.match(/^([^:]+):\s*(.*)$/))
      .filter(Boolean)
      .map((parts) => [parts[1].trim(), parts[2].trim()])
  );
}

function inlineField(section, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    section.match(new RegExp(`^\\*\\*${escaped}:\\*\\*\\s*(.+)$`, "m"))?.[1]?.trim() ||
    null
  );
}

function block(section, startLabel, endLabel) {
  const start = `**${startLabel}**`;
  const startIndex = section.indexOf(start);
  if (startIndex === -1) return "";

  const contentStart = startIndex + start.length;
  const endIndex = endLabel
    ? section.indexOf(`**${endLabel}**`, contentStart)
    : section.length;

  return section
    .slice(contentStart, endIndex === -1 ? section.length : endIndex)
    .trim();
}

function bulletBlock(section, startLabel, endLabel) {
  return block(section, startLabel, endLabel)
    .split("\n")
    .map((line) => line.match(/^\s*-\s+(.+)$/)?.[1]?.trim())
    .filter(Boolean);
}

function cleanAnswer(text) {
  return text
    .replace(/\n(?=\S)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitEntries(markdown) {
  const matches = [...markdown.matchAll(ENTRY_HEADING)];
  return matches.map((match, index) => ({
    faq_id: match[1],
    heading_question: match[2].trim(),
    section: markdown.slice(
      match.index,
      matches[index + 1]?.index ?? markdown.indexOf("\n# 10.", match.index) ?? markdown.length
    ),
  }));
}

export function parseFaqMarkdown(markdown) {
  const metadata = parseFrontmatter(markdown);
  const entries = splitEntries(markdown).map(({ faq_id, heading_question, section }) => {
    const canonicalQuestion = inlineField(section, "Canonical question");
    const alternatePhrasings = bulletBlock(section, "Alternate phrasings", "Audience:");
    const shortAnswer = cleanAnswer(
      block(section, "Suggested short answer", "Suggested fuller answer")
    );
    const fullAnswer = block(section, "Suggested fuller answer", "Evidence map").trim();
    const reviewStatus = inlineField(section, "Review status");
    const runtimeStatus = inlineField(section, "Runtime status") || "Active";

    if (!canonicalQuestion || !shortAnswer || !fullAnswer) {
      throw new Error(`${faq_id} is missing a canonical question or answer`);
    }

    const active =
      /provisionally approved|approved/i.test(reviewStatus || "") &&
      !/^inactive\b/i.test(runtimeStatus);
    const retrievalText = [canonicalQuestion, ...alternatePhrasings].join("\n");

    return {
      faq_id,
      heading_question,
      canonical_question: canonicalQuestion,
      alternate_phrasings: alternatePhrasings,
      audience: inlineField(section, "Audience"),
      match_priority: inlineField(section, "Match priority"),
      answer_mode: inlineField(section, "Answer mode"),
      clarifying_question: inlineField(section, "Clarifying question, if needed"),
      short_answer: shortAnswer,
      full_answer: fullAnswer,
      cautions_and_prohibited_claims: cleanAnswer(
        block(
          section,
          "Important cautions or prohibited claims",
          "Specific questions requiring Jonathan’s review"
        )
      ),
      supporting_sources: cleanAnswer(
        block(section, "Supporting sources and passages", "Unresolved uncertainties")
      ),
      review_status: reviewStatus,
      approved_by: inlineField(section, "Approved by"),
      last_reviewed_date: inlineField(section, "Last reviewed date"),
      runtime_status: runtimeStatus,
      active,
      retrieval_text: retrievalText,
      content_hash: crypto.createHash("sha256").update(retrievalText).digest("hex"),
    };
  });

  const ids = entries.map((entry) => entry.faq_id);
  if (new Set(ids).size !== ids.length) throw new Error("FAQ IDs must be unique");

  return {
    schema_version: 1,
    source_file: "corpus/AskTPP_FAQ.md",
    source_version: metadata.version,
    source_status: metadata.status,
    last_reviewed: metadata.last_reviewed,
    entries,
  };
}

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return -1;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator > 0 ? dot / denominator : -1;
}

export function findFaqMatch(question, faqData, queryEmbedding, minimumScore = 0.74) {
  const normalizedQuestion = normalizeFaqText(question);
  const allEntries = faqData?.entries || [];
  const inactiveExactMatch = allEntries
    .filter((entry) => !entry.active)
    .some((entry) =>
      [entry.canonical_question, ...(entry.alternate_phrasings || [])]
        .map(normalizeFaqText)
        .includes(normalizedQuestion)
    );
  if (inactiveExactMatch) return null;

  const activeEntries = allEntries.filter((entry) => entry.active);

  for (const entry of activeEntries) {
    const approvedQuestions = [
      entry.canonical_question,
      ...(entry.alternate_phrasings || []),
    ].map(normalizeFaqText);
    if (approvedQuestions.includes(normalizedQuestion)) {
      return { ...entry, match_type: "exact", match_score: 1 };
    }
  }

  const ranked = activeEntries
    .filter((entry) => Array.isArray(entry.embedding))
    .map((entry) => ({
      ...entry,
      match_type: "semantic",
      match_score: cosineSimilarity(queryEmbedding, entry.embedding),
    }))
    .sort((a, b) => b.match_score - a.match_score);

  return ranked[0]?.match_score >= minimumScore ? ranked[0] : null;
}

export function buildFaqGuidance(match) {
  if (!match) return "";
  return [
    `Provisionally approved FAQ guidance (${match.faq_id}; ${match.match_type} match ${match.match_score.toFixed(3)}):`,
    `Canonical question: ${match.canonical_question}`,
    `Approved short answer: ${match.short_answer}`,
    `Approved fuller answer:\n${match.full_answer}`,
    match.clarifying_question
      ? `Clarifying-question policy: ${match.clarifying_question}`
      : null,
    match.cautions_and_prohibited_claims
      ? `Mandatory cautions: ${match.cautions_and_prohibited_claims}`
      : null,
    "Use this approved answer as the backbone when it fits the user's actual question. Preserve its substantive claims and cautions, but tailor length and wording. Support the answer with the separately retrieved publication excerpts. Do not cite the FAQ itself as a publication.",
  ]
    .filter(Boolean)
    .join("\n\n");
}
