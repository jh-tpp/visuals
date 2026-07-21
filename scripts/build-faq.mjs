import fs from "node:fs";
import path from "node:path";

import { parseFaqMarkdown } from "../lib/asktpp-faq.mjs";

const SOURCE_PATH = path.join(process.cwd(), "corpus", "AskTPP_FAQ.md");
const OUTPUT_PATH = path.join(
  process.cwd(),
  "corpus",
  "generated",
  "faq-records.json"
);

if (!fs.existsSync(SOURCE_PATH)) {
  throw new Error(`Missing FAQ source: ${SOURCE_PATH}`);
}

const faq = parseFaqMarkdown(fs.readFileSync(SOURCE_PATH, "utf8"));
if (faq.entries.length !== 44) {
  throw new Error(`Expected 44 FAQ entries, found ${faq.entries.length}`);
}

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(faq, null, 2)}\n`, "utf8");

const activeCount = faq.entries.filter((entry) => entry.active).length;
console.log(
  `Wrote ${faq.entries.length} FAQ records (${activeCount} active) to ${OUTPUT_PATH}`
);
