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
const PATHSPECS = [
  "src/content/**/*.md",
  "src/content/**/*.mdx",
  "src/partials/**/*.md",
  "src/partials/**/*.mdx",
]
  .map((p) => `'${p}'`)
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

const res = spawnSync("vale", files, { stdio: "inherit" });
process.exit(res.status ?? 0);