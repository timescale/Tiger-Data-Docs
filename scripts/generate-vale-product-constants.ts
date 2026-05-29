#!/usr/bin/env npx tsx
/**
 * Generate the TigerData.ProductConstants Vale rule from src/constants.ts.
 *
 * Every string constant becomes a swap entry mapping its literal value to the
 * {C.X} constant authors should use instead. Regenerate whenever constants.ts
 * changes:
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

// Longest values first so compound names win over their substrings
// ("Tiger Cloud service" before "Tiger Cloud" before "service").
const entries = [...byValue.entries()]
  .map(([value, keys]) => ({ value, key: canonicalKey(keys) }))
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