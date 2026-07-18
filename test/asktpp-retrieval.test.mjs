import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  buildRetrievalQuery,
  classifyQuestion,
  detectSourceControls,
  getCuratedResponse,
  getSourceInfos,
  searchCorpus,
} from "../lib/asktpp-retrieval.mjs";

const manifest = JSON.parse(fs.readFileSync("corpus/manifest.json", "utf8"));
const curated = JSON.parse(
  fs.readFileSync("corpus/curated-context.json", "utf8")
);
const corpus = JSON.parse(fs.readFileSync("corpus/generated/corpus.json", "utf8"));
const sourceInfos = getSourceInfos(corpus);

test("an earlier paper mention does not become a sticky exact-source filter", () => {
  const messages = [
    { role: "user", content: "How is The Impact Frontier relevant to CSP?" },
    { role: "assistant", content: "Prior answer" },
    { role: "user", content: "So despite all your data, what is CSP?" },
  ];
  const controls = detectSourceControls(messages, sourceInfos);
  assert.deepEqual(controls.exactSourceMentions, []);
  assert.equal(controls.onlyPaper, false);
});

test("an explicit only-paper instruction remains active", () => {
  const messages = [
    { role: "user", content: "Use only the paper." },
    { role: "assistant", content: "Okay" },
    { role: "user", content: "Explain the supply schedule." },
  ];
  const controls = detectSourceControls(messages, sourceInfos);
  assert.equal(controls.onlyPaper, true);
  assert.equal(controls.excludeGuide, true);
});

test("relevance between The Impact Frontier and CSP is cross-document", () => {
  const result = classifyQuestion(
    "How is The Impact Frontier paper relevant at all to CSP?"
  );
  assert.equal(result.isCrossDocQuery, true);
});

test("self-contained retrieval queries do not accumulate old topics", () => {
  const messages = [
    { role: "user", content: "Tell me about The Impact Frontier." },
    { role: "assistant", content: "Prior answer" },
    { role: "user", content: "What CSP guides are in the corpus?" },
  ];
  assert.equal(buildRetrievalQuery(messages), "What CSP guides are in the corpus?");
});

test("curated CSP identity cannot drift to Corporate Sustainability Performance", () => {
  const response = getCuratedResponse("What is CSP?", manifest, curated);
  assert.match(response.content, /Center for Sustainable Finance and Private Wealth/);
  assert.match(response.content, /not “Corporate Sustainability Performance\.”/);
});

test("curated inventory sees seven CSP publications and one TPP paper", () => {
  const cspResponse = getCuratedResponse(
    "What CSP guides are you trained on?",
    manifest,
    curated
  );
  const tppResponse = getCuratedResponse(
    "And what Total Portfolio Project papers?",
    manifest,
    curated
  );
  assert.match(cspResponse.content, /7 CSP publications/);
  assert.equal(cspResponse.citations.length, 7);
  assert.match(tppResponse.content, /1 matching working paper/);
  assert.match(tppResponse.content, /The Impact Frontier/);
});

test("a CSP / Impact Frontier relationship query retrieves both source groups", () => {
  const question = "How is The Impact Frontier paper relevant to CSP?";
  const messages = [{ role: "user", content: question }];
  const zeroEmbedding = Array(corpus[0].embedding.length).fill(0);
  const { hits } = searchCorpus(
    zeroEmbedding,
    corpus,
    question,
    messages,
    36,
    12
  );
  assert.ok(hits.some((hit) => hit.source_type === "working-paper"));
  assert.ok(hits.some((hit) => hit.organizations?.includes("CSP")));
});

test("the assistant never asks the user to re-provide indexed guides", () => {
  const response = getCuratedResponse(
    "Are you being forced to only look at the paper? How about the guides?",
    manifest,
    curated
  );
  assert.match(response.content, /full AskTPP corpus/);
  assert.match(response.content, /You do not need to provide those documents again/);
});
