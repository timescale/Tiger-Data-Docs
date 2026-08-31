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
 *   node scripts/testplan-coverage.mjs --lint         check every plan the repo contains
 *
 * --lint is the gate that makes a plan maintainable by someone who has never read
 * the tool's parser. It catches the three ways a plan goes wrong silently:
 *
 *   1. A step no verb matches. The tool reports it as `unparsed` at run time, which
 *      means a documented instruction sat there untested until somebody read the
 *      report closely.
 *   2. An angle-bracket placeholder outside backticks. A plan is parsed as MDX, so
 *      `<database-name>` reads as an unclosed JSX tag and fails the site build with
 *      a message that names neither the plan nor the step.
 *   3. Numbering that isn't 1..n. The parser ignores the numbers, so a plan can be
 *      misnumbered and only the report's own indices are right — which is how a
 *      reviewer ends up looking at the wrong step, and screenshots off by one cost
 *      real time before.
 *
 * Check 1 needs the tool's own parser: point DOC_TESTING_TOOL at the checkout (it
 * defaults to ../doc-testing-tool-poc). Reimplementing the grammar here is exactly
 * the second-copy mistake that let a mutation gate drift; without the parser, --lint
 * runs the container checks and says which check it skipped.
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
  lint: argv.includes("--lint"),
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


if (opt.lint) {
  // Explicit paths lint just those files: what CI wants for a changed-files run, and the only way to
  // exercise the checks against a fixture without putting a broken page in the content tree.
  const only = argv.filter((a) => !a.startsWith("--"));
  const planned = (only.length ? only : pages).filter((f) => read(f).includes("<TestPlan"));
  const BLOCK = /<TestPlan\b[^>]*>([\s\S]*?)<\/TestPlan>/;
  const STEP = /^\s*(\d+)[.)]\s+(.*\S)\s*$/;

  // The tool's parser, if the checkout is there. Never a local reimplementation.
  let parsePlan = null;
  const toolDir = process.env.DOC_TESTING_TOOL || join("..", "doc-testing-tool-poc");
  try { ({ parsePlan } = await import(new URL(`file://${join(process.cwd(), toolDir, "lib", "plan.mjs")}`))); }
  catch { /* reported below, once */ }

  let errors = 0;
  for (const f of planned) {
    const src = read(f);
    const block = src.match(BLOCK);
    const problems = [];
    if (!block) { problems.push("a <TestPlan> tag with no closing </TestPlan>"); }
    else {
      const lines = block[1].split("\n");
      let expected = 0;
      for (const raw of lines) {
        const m = raw.match(STEP);
        if (!m) continue;
        expected += 1;
        if (Number(m[1]) !== expected) problems.push(`step numbered ${m[1]} where ${expected} was expected: ${m[2].slice(0, 60)}`);
        // Angle brackets are only safe inside backticks, which MDX treats as code.
        const outsideCode = m[2].replace(/`[^`]*`/g, "");
        const angle = outsideCode.match(/<[^\s>][^>]*>/);
        if (angle) problems.push(`\`${angle[0]}\` outside backticks will fail the MDX build: ${m[2].slice(0, 60)}`);
      }
      if (expected === 0) problems.push("a plan with no numbered steps (deliberate? absence of steps is the skip)");
      if (parsePlan) {
        const parsed = parsePlan(src);
        for (const u of parsed.unparsed) problems.push(`no verb matches: ${u.slice(0, 80)}`);
      }
    }
    if (problems.length) {
      errors += problems.length;
      console.log(`\n  ${slug(f)}`);
      for (const p of problems) console.log(`    \u2717 ${p}`);
    }
  }

  console.log(`\n  linted ${planned.length} plan(s): ${errors ? `${errors} problem(s)` : "clean"}`);
  if (!parsePlan) {
    console.log(`  \u26a0\ufe0f  the tool's parser was not importable from ${toolDir}, so "no verb matches" was NOT checked.`);
    console.log(`     set DOC_TESTING_TOOL to the doc-testing-tool checkout to run that check too.`);
  }
  console.log();
  process.exit(errors ? 1 : 0);
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