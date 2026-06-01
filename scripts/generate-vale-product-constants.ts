#!/usr/bin/env npx tsx
/**
 * Generate the TigerData.ProductConstants Vale rule from src/constants.ts.
 *
 * Only product/brand-name constants are enforced: those declared under the
 * `// General` and `// Products` section headers in constants.ts (General
 * contributes PostgreSQL and the company name; URLs and the bare `Tiger`
 * prefix are skipped). Feature, service, project, and pricing common-nouns
 * (hypertable, chunk, service, job, replica, time bucket, ...) are deliberately
 * left out — they read as ordinary prose and are accepted in the vocabulary
 * instead. Each enforced constant becomes a swap entry mapping its literal
 * value to the {C.X} constant authors should use. Regenerate whenever
 * constants.ts changes:
 *
 *   npx tsx scripts/generate-vale-product-constants.ts
 *
 * The output (.github/styles/TigerData/ProductConstants.yml) is committed and
 * read by Vale. Do not hand-edit it — edit constants.ts or this generator.
 *
 * IMPORTANT: any value emitted here must NOT also live in the Vale vocabulary
 * (.github/styles/config/vocabularies/TigerData/accept.txt), because the Vocab
 * globally suppresses all rules for a term and would silence the nudge.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as C from "../src/constants.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(
  __dirname,
  "../.github/styles/TigerData/ProductConstants.yml",
);

/**
 * Constants to skip:
 * - URLs and emails: not prose product references, and Vale ignores URLs anyway.
 * - PRODUCT_PREFIX ("Tiger"): a building block that is a substring of every
 *   Tiger product name; matching it bare would be misleading noise.
 */
const SKIP_KEYS = new Set(["PRODUCT_PREFIX"]);
const isUrlOrEmail = (v: string) =>
  /https?:\/\/|@|\bwww\.|\.com\b|\.org\b/.test(v);

// Map each exported constant to the `// Section` header it's declared under, so
// we can enforce only product/brand names. Section headers are full-line,
// single-word comments (`// Products`); inline and sentence comments are
// ignored. Enforce the General and Products sections only.
const SRC = path.resolve(__dirname, "../src/constants.ts");
const ENFORCE_SECTIONS = new Set(["General", "Products"]);
const keyToSection = new Map<string, string>();
{
  let section = "";
  for (const line of fs.readFileSync(SRC, "utf8").split("\n")) {
    const sec = line.match(/^\/\/\s*([A-Z][A-Za-z]+)\s*$/);
    if (sec) {
      section = sec[1];
      continue;
    }
    const decl = line.match(/^export const (\w+)\s*=/);
    if (decl) keyToSection.set(decl[1], section);
  }
}
const isEnforced = (key: string) =>
  ENFORCE_SECTIONS.has(keyToSection.get(key) ?? "");

/** Escape regex metacharacters so a literal value is matched literally. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Collect string constants, skipping URLs/emails and explicit excludes.
const byValue = new Map<string, string[]>();
for (const [key, value] of Object.entries(C)) {
  if (typeof value !== "string") continue;
  if (SKIP_KEYS.has(key)) continue;
  if (isUrlOrEmail(value)) continue;
  if (!value.trim()) continue;
  const keys = byValue.get(value) ?? [];
  keys.push(key);
  byValue.set(value, keys);
}

// Pick one canonical constant per value (shortest key name, then alphabetical),
// so duplicate values (PG/POSTGRESQL, CLOUD_LONG/TIGER_POSTGRES, ...) suggest one.
function canonicalKey(keys: string[]): string {
  return [...keys].sort((a, b) => a.length - b.length || a.localeCompare(b))[0];
}

// Keep only values that have at least one enforced (product/brand) key, and
// pick the canonical name from those keys. Longest values first so compound
// names win over their substrings ("Tiger Cloud service" before "Tiger Cloud").
const entries = [...byValue.entries()]
  .map(([value, keys]) => ({ value, keys: keys.filter(isEnforced) }))
  .filter(({ keys }) => keys.length > 0)
  .map(({ value, keys }) => ({ value, key: canonicalKey(keys) }))
  .sort((a, b) => b.value.length - a.value.length || a.value.localeCompare(b.value));

const header = `# GENERATED FILE — do not edit by hand.
# Regenerate with: npx tsx scripts/generate-vale-product-constants.ts
# Source of truth: src/constants.ts
#
# Nudges literal product/brand/feature names toward their {C.X} constant. Vale
# skips code spans, fenced blocks, and URLs, so literals in \`backticks\` and links
# are left alone. Case-sensitive: "Service" and "service" map to different
# constants. Enforced on changed content only (CI reports on changed lines).
extends: substitution
message: "Use the constant '%s' instead of the literal '%s' in prose."
link: https://github.com/timescale/Tiger-Data-Docs/blob/main/src/constants.ts
level: suggestion
ignorecase: false
swap:
`;

const lines = entries.map(
  ({ value, key }) => `  '${escapeRegex(value)}': 'C.${key}'`,
);

fs.writeFileSync(OUT, header + lines.join("\n") + "\n", "utf8");
console.log(
  `Wrote ${entries.length} product-constant swaps to ${path.relative(process.cwd(), OUT)}.`,
);

// Guard: warn if any enforced value also lives in the Vocab, where it would be
// globally suppressed (silencing the nudge we just generated).
const VOCAB = path.resolve(
  __dirname,
  "../.github/styles/config/vocabularies/TigerData/accept.txt",
);
if (fs.existsSync(VOCAB)) {
  const vocab = fs
    .readFileSync(VOCAB, "utf8")
    .split("\n")
    .map((l) => l.trim().toLowerCase())
    .filter((l) => l && !l.startsWith("#"));
  const vocabSet = new Set(vocab);
  const clashes = entries
    .map((e) => e.value)
    .filter((v) => vocabSet.has(v.toLowerCase()));
  if (clashes.length) {
    console.warn(
      `\n⚠️  These enforced values are also in the Vocab and will be suppressed:\n   ${[...new Set(clashes)].join(", ")}\n   Remove them from ${path.relative(process.cwd(), VOCAB)}.`,
    );
    process.exitCode = 1;
  }
}