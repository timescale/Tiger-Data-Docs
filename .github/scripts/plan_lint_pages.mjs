// Which pages a PR's changed files can affect, for the doc-testing tool's plan lint.
//
//   node .github/scripts/plan_lint_pages.mjs <changed-file> [...]
//
// Prints one page slug per line (`/build/how-to/basic-compression`), the form `lint-plan.mjs`
// takes. A changed page is its own slug. A changed partial maps to every page that imports it,
// because a partial's statements are inlined into the page's plan contract. Files that no longer
// exist (deleted or renamed away) are skipped. Pages without a `<TestPlan>` are listed too: the lint
// reports "nothing to lint" for them, which keeps this script free of any plan-parsing logic.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, basename, sep } from "node:path";

const ROOT = process.cwd();
const DOCS = join(ROOT, "src", "content", "docs");
const PARTIALS = join(ROOT, "src", "partials");

const slugOf = (file) => {
  const rel = relative(DOCS, file).split(sep).join("/").replace(/\.mdx?$/, "");
  return "/" + rel.replace(/\/index$/, "");
};

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : /\.mdx?$/.test(name) ? [p] : [];
  });

// Pages importing a partial, matched on the file name: imports use relative paths of varying
// depth or the `@partials/` alias, and the underscore-prefixed name is unique within src/partials.
const importers = (partialFile) => {
  const name = basename(partialFile);
  const re = new RegExp(`from\\s+["'][^"']*/${name.replace(/\./g, "\\.")}["']`);
  return walk(DOCS).filter((page) => re.test(readFileSync(page, "utf8")));
};

const changed = process.argv.slice(2).map((f) => join(ROOT, f));
const pages = new Set();
for (const file of changed) {
  if (!existsSync(file)) continue;
  if (file.startsWith(DOCS + sep)) pages.add(slugOf(file));
  else if (file.startsWith(PARTIALS + sep)) for (const page of importers(file)) pages.add(slugOf(page));
}
for (const slug of [...pages].sort()) console.log(slug);
