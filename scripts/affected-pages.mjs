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

// The component kitchen sink is served at /kitchen-sink on the preview origin
// (Vercel previews serve the site at root, without the production /docs base).
const KITCHEN_SINK_PATH = "/kitchen-sink";

// Turn a site-relative path into a clickable preview URL, appending the Vercel
// deployment-protection bypass query when a secret is available. Returns null
// when there is no preview origin (local runs), so callers can fall back to
// plain text.
function withPreview(urlPath) {
  if (!previewBase) return null;
  let target = `${previewBase}${urlPath}`;
  if (bypassSecret) {
    target += `?x-vercel-protection-bypass=${encodeURIComponent(
      bypassSecret,
    )}&x-vercel-set-bypass-cookie=true`;
  }
  return target;
}

// A standing reminder line pointing at this PR's own kitchen-sink preview.
// Always emitted, since the changes it guards against (components, styles,
// dependencies) never show up in the affected-content list above.
function kitchenSinkLine() {
  const label = "🧪 Component kitchen sink";
  const note =
    "check for visual regressions if you changed components, styles, or dependencies";
  const link = withPreview(KITCHEN_SINK_PATH);
  return link
    ? `- [${label}](${link}) — ${note}.`
    : `- ${label}: available once the preview builds — ${note}.`;
}

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
  // Even with no MDX content changes, surface the preview root so reviewers
  // can confirm the build deployed successfully.
  let placeholder;
  const previewLink = withPreview("");
  if (previewLink) {
    placeholder = `_No content pages affected by this PR. [Open the preview](${previewLink}) to confirm the build deployed successfully._`;
  } else {
    placeholder =
      "_No content pages affected by this PR. Once you push changes that touch MDX content or partials, links will appear here automatically._";
  }
  writeFileSync("pages-comment.md", `${placeholder}\n\n${kitchenSinkLine()}\n`);
  console.log("No content pages affected; wrote placeholder with preview link.");
  process.exit(0);
}

function buildLine(urlPath) {
  const link = withPreview(urlPath);
  return link ? `- [${urlPath}](${link})` : `- ${urlPath}`;
}

const lines = sorted.map(buildLine);
writeFileSync(
  "pages-comment.md",
  `${lines.join("\n")}\n\n${kitchenSinkLine()}\n`,
);
console.log(`Wrote pages-comment.md with ${sorted.length} URL(s).`);