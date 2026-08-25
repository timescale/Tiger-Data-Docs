#!/usr/bin/env node
/**
 * Test-plan coverage against the curated page inventory.
 *
 * The denominator is `.doc-testing/inventory.txt`, NOT a pattern match. Whether a
 * page documents a procedure is not reliably computable: steps appear as
 * <NumberedList>, as plain markdown "1." lists, and sometimes as prose. Measured
 * on this corpus, <NumberedList> alone finds 193 pages while a broader signal
 * finds 247 — and the broader one false-positives on conceptual pages that merely
 * mention clicking something. Either number used as a denominator would be wrong
 * in a different direction, so the inventory is maintained by hand.
 *
 * Detection survives only as a SEEDER: --candidates lists pages that look like
 * they document a procedure but aren't in the inventory, so the inventory can be
 * grown deliberately instead of drifting.
 *
 * A plan with no steps for an untestable route is still a plan, so absence of a
 * <TestPlan> block means exactly one thing: nobody has written it yet.
 *
 *   node scripts/testplan-coverage.mjs                summary + what's unwritten
 *   node scripts/testplan-coverage.mjs --quiet        summary only
 *   node scripts/testplan-coverage.mjs --candidates   pages that may belong in the inventory
 *   node scripts/testplan-coverage.mjs --changed      only inventory pages touched vs origin/main
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, basename } from "node:path";
import { execSync } from "node:child_process";

const DOCS = "src/content/docs";
const PARTIALS = "src/partials";
const INVENTORY = ".doc-testing/inventory.txt";

const argv = process.argv.slice(2);
const opt = {
  quiet: argv.includes("--quiet"),
  candidates: argv.includes("--candidates"),
  changed: argv.includes("--changed"),
};

const read = (p) => { try { return readFileSync(p, "utf8"); } catch { return ""; } };

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith(".mdx")) out.push(p);
  }
  return out;
}

// Steps usually live in partials, so a page is judged on itself plus everything
// it imports.
const partialSrc = new Map();
for (const f of readdirSync(PARTIALS).filter((f) => f.endsWith(".mdx"))) {
  partialSrc.set(f, read(join(PARTIALS, f)));
}
const resolved = (src) =>
  src + [...src.matchAll(/from\s+["'][^"']*partials\/(_[^"']+\.mdx)["']/g)]
    .map((m) => partialSrc.get(m[1]) || "").join("\n");

// Deliberately loose — this only proposes candidates for a human to accept.
const looksProcedural = (s) =>
  s.includes("<NumberedList") ||
  /^\s{0,6}\d+\.\s+\S/m.test(s) ||
  /\b(click|select|toggle|navigate to|choose|enter|open)\s+`/i.test(s);

const slug = (f) => relative(DOCS, f).replace(/\.mdx$/, "");

if (!existsSync(INVENTORY)) {
  console.error(`\n  no inventory at ${INVENTORY}`);
  console.error(`  create it (one page slug per line, # for comments), then re-run.`);
  console.error(`  to see what might belong in it:  node ${basename(process.argv[1])} --candidates\n`);
  if (!opt.candidates) process.exit(1);
}

const inventory = read(INVENTORY)
  .split("\n")
  .map((l) => l.replace(/#.*$/, "").trim())
  .filter(Boolean);

const pages = walk(DOCS);
const bySlug = new Map(pages.map((f) => [slug(f), f]));

if (opt.candidates) {
  const inInv = new Set(inventory);
  const cand = pages
    .filter((f) => !inInv.has(slug(f)))
    .filter((f) => /^products:.*\bcloud\b/m.test(read(f)))
    .filter((f) => looksProcedural(resolved(read(f))));
  console.log(`\n  ${cand.length} cloud page(s) look procedural but aren't in the inventory:\n`);
  for (const f of cand) console.log(`    ${slug(f)}`);
  console.log(`\n  These are guesses. Add the real ones to ${INVENTORY}; ignore the rest.\n`);
  process.exit(0);
}

let changed = null;
if (opt.changed) {
  try {
    changed = new Set(
      execSync("git diff --name-only origin/main...HEAD", { encoding: "utf8" })
        .split("\n").filter(Boolean),
    );
  } catch {
    console.error("  could not diff against origin/main; ignoring --changed");
  }
}

const rows = [];
const unknown = [];
for (const s of inventory) {
  const file = bySlug.get(s);
  if (!file) { unknown.push(s); continue; }
  if (changed && !changed.has(file)) continue;
  rows.push({ slug: s, plan: read(file).includes("<TestPlan") });
}

const have = rows.filter((r) => r.plan);
const missing = rows.filter((r) => !r.plan);
const pct = rows.length ? Math.round((have.length / rows.length) * 100) : 0;

console.log(`\n  test-plan coverage${opt.changed ? " (changed pages only)" : ""}`);
console.log(`  ${have.length} of ${rows.length} inventory pages have a plan  (${pct}%)`);
console.log(`  ${missing.length} unwritten\n`);

if (!opt.quiet && missing.length) {
  console.log("  no plan yet:");
  for (const r of missing) console.log(`    ${r.slug}`);
  console.log();
}

if (unknown.length) {
  console.log(`  ${unknown.length} inventory entr${unknown.length === 1 ? "y" : "ies"} match no page (renamed or deleted?):`);
  for (const s of unknown) console.log(`    ${s}`);
  console.log();
}

// Warning, never a failure: a hard gate would block every existing page at once.
if (opt.changed && missing.length) {
  console.log(`  ::warning::${missing.length} changed inventory page(s) have no <TestPlan>`);
}