// Validate internal links against the BUILT site (dist/), not the markdown source.
//
// Why this exists: the markdown/AST link checker (starlight-links-validator)
// has structural blind spots because it runs before partials are rendered:
//   - relative links (../foo) can't be resolved (depends on the importing page)
//   - anchors whose heading comes from an imported partial look "missing"
// Checking the rendered HTML removes both: relative links are already absolute
// hrefs, and partial-sourced anchors are real `id=`s in the output. It also
// catches links the AST checker misses (e.g. legacy short-links that only work
// via an edge redirect).
//
// Usage: pnpm build (or build:local) first, then `node scripts/check-built-links.mjs`.
// Exits non-zero if any broken internal link or anchor is found.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";

const DIST = process.env.DIST_DIR || "dist";
const BASE = (process.env.BASE_PATH || "/").replace(/\/$/, ""); // "" when base is "/"
// The base path the production edge (vercel.json) is written against. Vercel
// redirect sources are authored with this prefix; strip it to compare against
// base-relative link targets.
const PROD_BASE = (process.env.PROD_BASE || "/docs").replace(/\/$/, "");

// Sections that are auto-generated only in a full (Stainless) build and are
// absent from local/keyless builds. Links to them are treated as valid so the
// checker passes whether or not Stainless ran (mirrors the old validator's
// exclude of the Tiger Cloud REST reference).
const ALWAYS_VALID_PREFIXES = ["/reference/tiger-cloud-rest"];

// Reduce any path to a base-relative, lowercased, no-trailing-slash route so
// links and routes are compared in one coordinate system regardless of base.
function stripBase(p, base) {
  if (base && (p === base || p.startsWith(base + "/"))) return p.slice(base.length) || "/";
  return p;
}

// --- collect every built route and its anchor ids -------------------------

const routes = new Map(); // route (lowercased, no trailing slash) -> Set(anchor id)

if (!existsSync(DIST)) {
  console.error(
    `No build output found at "${DIST}/". Run a build first, e.g.\n` +
      `  pnpm build && node scripts/check-built-links.mjs\n` +
      `  (or use the combined "pnpm lint:links:built" script).`,
  );
  process.exit(2);
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (name === "index.html") indexPage(full);
  }
}

function routeFromFile(file) {
  let r = "/" + path.relative(DIST, path.dirname(file)).split(path.sep).join("/");
  if (r === "/.") r = "/";
  return stripBase(r, BASE).toLowerCase(); // defensive: some adapters nest under base
}

function indexPage(file) {
  const html = readFileSync(file, "utf8");
  const ids = new Set();
  for (const m of html.matchAll(/\bid="([^"]+)"/g)) ids.add(m[1]);
  routes.set(routeFromFile(file), ids);
}

walk(DIST);

// --- redirect sources from astro.config.ts (keys are valid link targets) ---

const redirectSources = new Set();
{
  const cfg = readFileSync("astro.config.ts", "utf8");
  // Redirect entries are the only `"/path": "/path"` string pairs in the config
  // (sidebar/nav use `link:` props, not quoted key/value path pairs).
  for (const m of cfg.matchAll(/"(\/[^"]*)"\s*:\s*"(\/[^"]*)"/g)) {
    redirectSources.add(m[1].replace(/\/$/, "").toLowerCase() || "/");
  }
}

// --- redirect sources from vercel.json (edge layer, incl. param patterns) --

const vercelMatchers = []; // RegExp[] over base-relative targets
try {
  const vercel = JSON.parse(readFileSync("vercel.json", "utf8"));
  for (const r of vercel.redirects || []) {
    let src = stripBase(r.source, PROD_BASE).replace(/\/$/, "").toLowerCase() || "/";
    const re = src
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&") // escape regex specials (keep * and :)
      .replace(/:[a-z0-9_]+\*/gi, ".*") // :path*  -> zero+ segments
      .replace(/:[a-z0-9_]+\+/gi, ".+") // :path+  -> one+ segments
      .replace(/:[a-z0-9_]+/gi, "[^/]+") // :slug   -> one segment
      .replace(/\*/g, ".*"); // bare *
    vercelMatchers.push(new RegExp("^" + re + "$"));
  }
} catch {
  /* no vercel.json: skip edge redirects */
}

function isRedirectSource(target) {
  if (redirectSources.has(target)) return true;
  return vercelMatchers.some((re) => re.test(target));
}

// --- validate links in every page -----------------------------------------

const SKIP_EXT = /\.(md|xml|ico|css|js|mjs|json|txt|png|jpe?g|svg|gif|webp|woff2?|ttf|pdf|csv|zip)$/i;

function normalize(href) {
  let h = stripBase(href.trim(), BASE);
  const hashIdx = h.indexOf("#");
  const anchor = hashIdx >= 0 ? h.slice(hashIdx + 1) : "";
  if (hashIdx >= 0) h = h.slice(0, hashIdx);
  const qIdx = h.indexOf("?"); // drop query string (e.g. faceted /integrate/?industry=...)
  if (qIdx >= 0) h = h.slice(0, qIdx);
  const route = (h.replace(/\/$/, "") || "/").toLowerCase();
  return { route, anchor };
}

const problems = []; // {page, href, kind}

for (const [route] of routes) {
  const file = path.join(DIST, route === "/" ? "" : route, "index.html");
  if (!existsSync(file)) continue;
  const html = readFileSync(file, "utf8");
  const seen = new Set();
  for (const m of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
    const raw = m[1];
    if (seen.has(raw)) continue;
    seen.add(raw);
    // skip external, protocol-relative, assets, pure JS
    if (/^(https?:|mailto:|tel:|\/\/)/.test(raw)) continue;
    let href = raw, anchorOnly = false;
    if (href.startsWith("#")) { anchorOnly = true; href = route + href; }
    if (!href.startsWith("/")) continue; // unresolved relative (shouldn't happen in output)
    const { route: target, anchor } = normalize(href);
    if (SKIP_EXT.test(target)) continue;

    const exists = routes.has(target);
    if (!exists) {
      if (isRedirectSource(target)) continue; // resolves via an Astro or Vercel redirect
      if (ALWAYS_VALID_PREFIXES.some((p) => target === p || target.startsWith(p + "/"))) {
        continue; // auto-generated section, absent from this build
      }
      problems.push({ page: route, href: raw, kind: "missing page" });
      continue;
    }
    if (anchor && anchor !== "_top" && !routes.get(target).has(anchor)) {
      problems.push({ page: route, href: raw, kind: "missing anchor" });
    }
  }
}

// --- report ---------------------------------------------------------------

console.log(
  `Scanned ${routes.size} built pages; ${redirectSources.size} Astro + ${vercelMatchers.length} Vercel redirect sources.`,
);
if (problems.length === 0) {
  console.log("✓ No broken internal links or anchors.");
  process.exit(0);
}
const byPage = new Map();
for (const p of problems) {
  if (!byPage.has(p.page)) byPage.set(p.page, []);
  byPage.get(p.page).push(p);
}
console.error(`\n✗ Found ${problems.length} broken link(s) in ${byPage.size} page(s):\n`);
for (const [page, list] of [...byPage].sort()) {
  console.error(`▶ ${page}`);
  for (const p of list) console.error(`   [${p.kind}] ${p.href}`);
}
process.exit(1);