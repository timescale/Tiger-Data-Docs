// Map a list of changed MDX files to the URLs of the docs pages they affect.
// Used by .github/workflows/affected-pages.yml.
//
// Inputs (env):
//   CHANGED_FILES   Whitespace-separated list of changed file paths.
//   PREVIEW_URL     Optional URL prefix (a Vercel preview origin, no trailing slash).
//                   When set, every emitted URL becomes a clickable markdown link
//                   pointing at "<PREVIEW_URL><path>".
//   BYPASS_SECRET   Optional Vercel deployment-protection bypass token. Combined
//                   with PREVIEW_URL, the link becomes
//                   "<PREVIEW_URL><path>?x-vercel-protection-bypass=<secret>&x-vercel-set-bypass-cookie=true".
//
// Output:
//   pages-comment.md  Markdown bullet list (created only when there are URLs).
//
// Logic:
//   - src/content/docs/<...>.mdx  → "/<...>"  (lowercased; "index" stripped)
//   - src/partials/_*.mdx         → recursively resolve consumer files via grep,
//                                   then map the consumer paths to URLs.

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";

const changed = (process.env.CHANGED_FILES || "")
  .split(/\s+/)
  .map((s) => s.trim())
  .filter(Boolean);

const previewBase = (process.env.PREVIEW_URL || "").replace(/\/$/, "");
const bypassSecret = process.env.BYPASS_SECRET || "";

function fileToUrl(file) {
  const m = file.match(/^src\/content\/docs\/(.+)\.mdx$/);
  if (!m) return null;
  let urlPath = m[1].toLowerCase().replace(/\/index$/, "");
  return "/" + urlPath;
}

function findConsumers(partialPath, visited = new Set()) {
  if (visited.has(partialPath)) return [];
  visited.add(partialPath);

  const name = path.basename(partialPath, ".mdx");
  let lines = [];
  try {
    const out = execSync(
      `grep -rln "from .*${name}\\b" src/content src/partials --include="*.mdx"`,
      { encoding: "utf8" },
    );
    lines = out.split("\n").filter(Boolean);
  } catch {
    return [];
  }

  const urls = new Set();
  for (const consumer of lines) {
    if (consumer === partialPath) continue;
    if (consumer.startsWith("src/content/docs/")) {
      const url = fileToUrl(consumer);
      if (url) urls.add(url);
    } else if (consumer.startsWith("src/partials/")) {
      for (const u of findConsumers(consumer, visited)) urls.add(u);
    }
  }
  return [...urls];
}

const allUrls = new Set();
for (const file of changed) {
  if (file.startsWith("src/content/docs/") && file.endsWith(".mdx")) {
    const url = fileToUrl(file);
    if (url) allUrls.add(url);
  } else if (file.startsWith("src/partials/") && file.endsWith(".mdx")) {
    for (const u of findConsumers(file)) allUrls.add(u);
  }
}

const sorted = [...allUrls].sort();

if (sorted.length === 0) {
  console.log("No content pages affected by this PR — nothing to write.");
  process.exit(0);
}

function buildLine(urlPath) {
  if (!previewBase) return `- ${urlPath}`;
  let target = `${previewBase}${urlPath}`;
  if (bypassSecret) {
    target += `?x-vercel-protection-bypass=${encodeURIComponent(
      bypassSecret,
    )}&x-vercel-set-bypass-cookie=true`;
  }
  return `- [${urlPath}](${target})`;
}

const lines = sorted.map(buildLine);
writeFileSync("pages-comment.md", lines.join("\n") + "\n");
console.log(`Wrote pages-comment.md with ${sorted.length} URL(s).`);