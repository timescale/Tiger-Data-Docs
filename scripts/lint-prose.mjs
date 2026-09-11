#!/usr/bin/env node
/**
 * Run Vale (Google style guide + custom TigerData rules) on changed docs.
 *
 * Mirrors what CI does, but locally and only on the Markdown/MDX you've touched
 * so you can check before pushing. CI reports only on the lines you changed
 * (.github/scripts/vale_pr_lint.py); this lints the whole changed file, so you
 * may see findings here on lines your PR didn't touch.
 *
 * Usage:
 *   pnpm lint:prose          # changed *.md/*.mdx vs the main branch + working tree
 *   pnpm lint:prose -- --all # lint every *.md/*.mdx under src/
 *
 * Requires Vale: `brew install vale` (or see https://vale.sh/docs/install).
 */

import { execSync, spawnSync } from "node:child_process";

function have(cmd) {
  return spawnSync(cmd, ["--version"], { stdio: "ignore" }).status === 0;
}

if (!have("vale")) {
  console.error(
    "Vale is not installed. Install it with `brew install vale` " +
      "(or see https://vale.sh/docs/install), then re-run `pnpm lint:prose`.",
  );
  process.exit(1);
}

const all = process.argv.includes("--all");

function sh(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

// Vale only lints docs content (see the path-scoped section in .vale.ini), so
// limit the pathspecs to those dirs to match.
//
// The `:(glob)` prefix is required, not cosmetic. Without it git matches
// pathspecs with fnmatch and no FNM_PATHNAME, so `*` also matches `/` and
// `src/partials/**/*.mdx` needs a literal directory between the `**` and the
// filename. That silently skipped all 298 partials sitting directly in
// `src/partials/`, leaving only the 44 under `src/partials/troubleshooting/`.
// `:(glob)` switches git to wildmatch, where `**` matches zero or more path
// components and both flat and nested files are found.
const PATHSPECS = [
  "src/content/**/*.md",
  "src/content/**/*.mdx",
  "src/partials/**/*.md",
  "src/partials/**/*.mdx",
]
  .map((p) => `':(glob)${p}'`)
  .join(" ");

let files = [];
if (all) {
  files = sh(`git ls-files ${PATHSPECS}`).split("\n");
} else {
  // Prefer the merge-base with the upstream main; fall back to local main.
  const base =
    sh("git merge-base HEAD origin/main") || sh("git merge-base HEAD main");
  const ranged = base
    ? sh(`git diff --name-only --diff-filter=ACMR ${base} -- ${PATHSPECS}`)
    : "";
  // Also include staged + unstaged changes not yet committed.
  const working = sh(`git diff --name-only --diff-filter=ACMR HEAD -- ${PATHSPECS}`);
  files = [...new Set([...ranged.split("\n"), ...working.split("\n")])];
}

files = files.filter(Boolean);

if (files.length === 0) {
  console.log("No changed Markdown/MDX files to lint.");
  process.exit(0);
}

// Rules reported once per file per matched string instead of on every
// occurrence. TigerData.Acronyms is the case this exists for: "spell out 'WAL'"
// is advice about first use, so repeating it for all 92 occurrences of WAL
// buries every other finding. Vale has no per-rule occurrence limit, so the
// deduplication happens here, at report time. Keep this list short: for most
// rules every occurrence is a separate thing to fix.
const DEDUPE_ONCE_PER_FILE = new Set(["TigerData.Acronyms"]);

const COLOR = process.stdout.isTTY && !process.env["NO_COLOR"];
const paint = (code, s) => (COLOR ? `\x1b[${code}m${s}\x1b[0m` : s);
const SEVERITY_COLOR = { error: 31, warning: 33, suggestion: 34 };

const res = spawnSync("vale", ["--output=JSON", ...files], {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});

// Vale exits non-zero when it reports findings, so stdout is still valid JSON.
// A genuine failure (bad config, missing style) leaves stdout empty or unparsable.
let report;
try {
  report = JSON.parse(res.stdout);
} catch {
  process.stderr.write(res.stderr || res.stdout || "Vale produced no output.\n");
  process.exit(res.status ?? 1);
}

const counts = { error: 0, warning: 0, suggestion: 0 };
let filesWithAlerts = 0;
let hiddenRepeats = 0;

for (const [file, alerts] of Object.entries(report)) {
  const seen = new Set();
  const kept = alerts.filter((a) => {
    if (!DEDUPE_ONCE_PER_FILE.has(a.Check)) return true;
    const key = `${a.Check} ${a.Match}`;
    if (seen.has(key)) {
      hiddenRepeats++;
      return false;
    }
    seen.add(key);
    return true;
  });
  if (kept.length === 0) continue;

  filesWithAlerts++;
  console.log(`\n ${paint(4, file)}`);
  for (const a of kept) {
    counts[a.Severity] = (counts[a.Severity] ?? 0) + 1;
    const where = `${a.Line}:${a.Span[0]}`.padEnd(8);
    const sev = paint(SEVERITY_COLOR[a.Severity] ?? 0, a.Severity.padEnd(10));
    console.log(` ${where} ${sev} ${a.Message}  ${paint(2, a.Check)}`);
  }
}

const shown = counts.error + counts.warning + counts.suggestion;

if (shown === 0) {
  console.log(`\n${paint(32, "✔")} 0 errors, 0 warnings and 0 suggestions in ${files.length} file(s).`);
} else {
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const parts = [
    paint(31, plural(counts.error, "error")),
    paint(33, plural(counts.warning, "warning")),
    paint(34, plural(counts.suggestion, "suggestion")),
  ];
  console.log(`\n${paint(31, "✖")} ${parts.join(", ")} in ${filesWithAlerts} file(s).`);
}

// Say so when deduplication hid repeats, so the count is never mistaken for the
// total number of places a fix has to be applied.
if (hiddenRepeats > 0) {
  console.log(
    paint(2, `  (${hiddenRepeats} repeat occurrence(s) hidden: ${[...DEDUPE_ONCE_PER_FILE].join(", ")} reports once per file.)`),
  );
}

// Mirror CI: only errors fail. Warnings and suggestions are advisory.
process.exit(counts.error > 0 ? 1 : 0);