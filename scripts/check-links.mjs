#!/usr/bin/env node
/**
 * Check every internal link and anchor on a deployed copy of the docs.
 *
 * Pages come from the deployment's sitemap plus the REST reference nav, which
 * the sitemap omits. Each page is fetched once, its <script> blocks are
 * stripped (lychee's HTML parser stops at an inline script in our <head>),
 * and every internal href is collected. lychee then checks each unique link
 * exactly once, with settings from lychee.toml.
 *
 * Usage:
 *   node scripts/check-links.mjs [--base https://host] [--out dir] [--fail-on-redirects] [--external]
 *
 * --external also checks every link that leaves the site. Those are checked
 * with looser rules (see EXTERNAL_ACCEPT below): hosts that block bots answer
 * 403 or 429 to a checker and are not broken.
 *
 * Environment:
 *   LINKCHECK_BASE_URL   default base (falls back to https://www.tigerdata.com/docs)
 *   VERCEL_BYPASS_SECRET sent as x-vercel-protection-bypass on every request
 *
 * Exit codes: 0 clean, 1 broken links (or redirects with --fail-on-redirects),
 * 2 could not run (sitemap unreachable, lychee missing).
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const BASE = (opt("--base", process.env.LINKCHECK_BASE_URL) ?? "https://www.tigerdata.com/docs").replace(/\/$/, "");
const OUT = resolve(opt("--out", ".linkcheck"));
const FAIL_ON_REDIRECTS = args.includes("--fail-on-redirects");
const EXTERNAL = args.includes("--external");
// Status codes that do not mean an external link is dead: bot blocks and rate limits.
const EXTERNAL_ACCEPT = "200..=299,403,429,999";
// External hosts that cannot be checked from CI: login walls, bot walls, placeholders.
const EXTERNAL_EXCLUDE = [
  "^https?://(localhost|127\\.0\\.0\\.1)",
  "^https?://([a-z0-9-]+\\.)?example\\.(com|org|net)",
  "^https?://([a-z0-9-]+\\.)?(linkedin|twitter|x)\\.com/",
  "^https?://console\\.cloud\\.(tigerdata|timescale)\\.com/",
  // Negotiates TLS in a way the checker's client cannot; the site works in a browser.
  "^https?://(www\\.)?inductiveautomation\\.com/",
  "^https?://github\\.com/.*/(edit|blob)/.*\\.mdx?$",
];
const BYPASS = process.env.VERCEL_BYPASS_SECRET ?? "";
const origin = new URL(BASE).origin;
// The sitemap and canonical links name the production host and base path; map them onto the deployment.
const onDeployment = (u) => u.replace(/^https?:\/\/[^/]+\/docs/, BASE).replace(/^https?:\/\/[^/]+/, origin);
const basePath = new URL(BASE).pathname.replace(/\/$/, ""); // "" or "/docs"

// Previews cannot serve the vercel.json redirects (their keys carry the /docs prefix), so a
// link that production redirects answers 404 on a preview. The rules are applied here, so
// such a link is reported as stale with its destination, exactly as it would be on production.
const rulesFile = resolve(dirname(fileURLToPath(import.meta.url)), "../vercel.json");
const redirectRules = existsSync(rulesFile)
  ? (JSON.parse(await readFile(rulesFile, "utf8")).redirects ?? []).map((r) => {
      const names = [];
      let re = "^";
      for (const seg of r.source.replace(/^\/docs/, "").split("/").slice(1)) {
        if (seg.startsWith(":") && seg.endsWith("*")) { names.push(seg.slice(1, -1)); re += "(?:/(.*))?"; }
        else if (seg.startsWith(":")) { names.push(seg.slice(1)); re += "/([^/]+)"; }
        else re += "/" + seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }
      return { re: new RegExp(re + "$"), names, destination: r.destination.replace(/^\/docs/, "") };
    })
  : [];
function productionRedirect(path) {
  for (const { re, names, destination } of redirectRules) {
    const m = path.match(re);
    if (!m) continue;
    let dest = destination;
    names.forEach((n, i) => { dest = dest.replace(new RegExp(`:${n}\\*?`, "g"), m[i + 1] ?? ""); });
    return dest.replace(/\/$/, "") || "/";
  }
  return null;
}

// Hosts that once served the docs. A link to them is internal and stale, so it is
// rewritten onto the deployment under test and then reported as a redirect.
const OLD_HOSTS = ["https://docs.timescale.com", "https://docs.tigerdata.com"];
const CANONICAL = "https://www.tigerdata.com/docs";

const headers = { "user-agent": "Mozilla/5.0 (Tiger-Data-Docs link check)" };
if (BYPASS) headers["x-vercel-protection-bypass"] = BYPASS;

async function fetchText(url, attempts = 5) {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(url, { headers, redirect: "follow" });
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 10000 * (i + 1)));
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.text();
  }
  throw new Error(`429 after ${attempts} attempts: ${url}`);
}

function locs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

function externalHrefs(html, pageUrl) {
  const out = new Set();
  for (const m of html.matchAll(/<a\b[^>]*?\shref="([^"]+)"/g)) {
    const raw = decodeEntities(m[1]).trim();
    if (!/^https?:\/\//i.test(raw)) continue;
    let u;
    try {
      u = new URL(raw, pageUrl);
    } catch {
      continue;
    }
    if (u.origin === origin) continue;
    if (OLD_HOSTS.some((h) => u.origin === h) || raw.startsWith(CANONICAL)) continue;
    u.hash = "";
    out.add(u.toString());
  }
  return out;
}

// Attributes are HTML-escaped; an apostrophe arrives as &#39; and must not be cut at its #.
function decodeEntities(v) {
  return v
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
function internalHrefs(html, pageUrl) {
  const out = new Set();
  for (const m of html.matchAll(/<a\b[^>]*?\shref="([^"]+)"/g)) {
    const raw = decodeEntities(m[1]).trim();
    if (!raw || raw.startsWith("mailto:") || raw.startsWith("tel:") || raw.startsWith("javascript:")) continue;
    let u;
    try {
      let href = raw;
      for (const h of OLD_HOSTS) if (href.startsWith(h + "/")) href = BASE + href.slice(h.length);
      if (href.startsWith(CANONICAL + "/") || href === CANONICAL) href = BASE + href.slice(CANONICAL.length);
      u = new URL(href, pageUrl);
    } catch {
      continue;
    }
    if (u.origin !== origin) continue;
    if (basePath && !u.pathname.startsWith(basePath + "/") && u.pathname !== basePath) continue;
    u.searchParams.delete("x-vercel-protection-bypass");
    u.searchParams.delete("x-vercel-set-bypass-cookie");
    out.add(u.toString());
  }
  return out;
}

async function pool(items, limit, fn) {
  const results = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (i < items.length) {
        const idx = i++;
        results[idx] = await fn(items[idx]);
      }
    }),
  );
  return results;
}

// 1. Page list: sitemap(s) + REST reference nav.
let pages = new Set();
try {
  const index = await fetchText(`${BASE}/sitemap-index.xml`);
  for (const sm of locs(index)) for (const p of locs(await fetchText(onDeployment(sm)))) pages.add(p);
} catch (e) {
  console.error(`Could not read the sitemap: ${e.message}`);
  process.exit(2);
}
try {
  const rest = await fetchText(`${BASE}/reference/tiger-cloud-rest`);
  for (const h of internalHrefs(rest, `${BASE}/reference/tiger-cloud-rest`)) {
    if (h.includes("/reference/tiger-cloud-rest/") && !h.includes("#")) pages.add(h);
  }
} catch (e) {
  console.warn(`REST reference nav not read: ${e.message}`);
}
// The sitemap may name the canonical host; check against the deployment we were given.
pages = new Set([...pages].map(onDeployment));
console.log(`${pages.size} pages to scan on ${BASE}`);

// 2. Fetch, strip scripts, collect links.
const links = new Set();
const externals = new Set();
const linkSources = new Map(); // href -> first page that links to it
const failedPages = [];
await pool([...pages], 3, async (page) => {
  try {
    const html = (await fetchText(page)).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
    for (const h of internalHrefs(html, page)) {
      links.add(h);
      if (!linkSources.has(h)) linkSources.set(h, page);
    }
    if (EXTERNAL) {
      for (const h of externalHrefs(html, page)) {
        externals.add(h);
        if (!linkSources.has(h)) linkSources.set(h, page);
      }
    }
  } catch (e) {
    failedPages.push(`${page} (${e.message})`);
  }
});
console.log(`${links.size} unique internal links${EXTERNAL ? ` and ${externals.size} external links` : ""} collected from ${pages.size - failedPages.length} pages`);
if (failedPages.length) console.warn(`Pages that could not be fetched:\n  ${failedPages.join("\n  ")}`);

await mkdir(OUT, { recursive: true });
const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
await writeFile(
  `${OUT}/links.html`,
  `<!doctype html><html><body>\n${[...links].sort().map((u) => `<a href="${esc(u)}">link</a>`).join("\n")}\n</body></html>\n`,
);

// 3. lychee.
const lycheeArgs = [
  "--config", "lychee.toml", "--no-progress", "--format", "json", "--output", `${OUT}/lychee.json`,
];
if (BYPASS) lycheeArgs.push("--header", `x-vercel-protection-bypass: ${BYPASS}`);
lycheeArgs.push(`${OUT}/links.html`);
const run = spawnSync("lychee", lycheeArgs, { stdio: ["ignore", "inherit", "inherit"] });
if (run.error) {
  console.error(`lychee could not be started: ${run.error.message}. Install it with \`brew install lychee\`.`);
  process.exit(2);
}
// lychee exits 2 when it found broken links, which is a result, not a failure.
if (![0, 2].includes(run.status)) {
  console.error(`lychee failed (exit ${run.status}).`);
  process.exit(2);
}

// 3b. External links, looser rules, no fragment checks, nothing private.
let external = { errors: [], checked: 0 };
if (EXTERNAL) {
  await writeFile(
    `${OUT}/external.html`,
    `<!doctype html><html><body>\n${[...externals].sort().map((u) => `<a href="${esc(u)}">link</a>`).join("\n")}\n</body></html>\n`,
  );
  const extArgs = [
    "--no-progress", "--format", "json", "--output", `${OUT}/lychee-external.json`,
    "--accept", EXTERNAL_ACCEPT, "--max-concurrency", "8", "--max-retries", "2", "--retry-wait-time", "5",
    "--timeout", "30", "--exclude-all-private",
    "--user-agent", "Mozilla/5.0 (Tiger-Data-Docs link check)",
  ];
  for (const re of EXTERNAL_EXCLUDE) extArgs.push("--exclude", re);
  extArgs.push(`${OUT}/external.html`);
  const extRun = spawnSync("lychee", extArgs, { stdio: ["ignore", "inherit", "inherit"] });
  if (extRun.error || ![0, 2].includes(extRun.status)) {
    console.error(`lychee failed on the external links (exit ${extRun.status ?? extRun.error?.message}).`);
    process.exit(2);
  }
  const extReport = JSON.parse(await readFile(`${OUT}/lychee-external.json`, "utf8"));
  const flatExt = (map) => Object.values(map ?? {}).flat();
  external = {
    errors: flatExt(extReport.error_map).concat(flatExt(extReport.fail_map)),
    checked: extReport.total ?? externals.size,
    excluded: extReport.excludes ?? 0,
  };
}

// 4. Report.
const report = JSON.parse(await readFile(`${OUT}/lychee.json`, "utf8"));
const flat = (map) => Object.values(map ?? {}).flat();
let errors = flat(report.error_map).concat(flat(report.fail_map));
const redirects = flat(report.redirect_map ?? {});
// 3c. A 404 that production would redirect is a stale link, provided the destination exists.
const destinations = new Map(); // destination path -> html or null
async function destinationHtml(dest) {
  if (!destinations.has(dest)) destinations.set(dest, await fetchText(`${BASE}${dest}`).catch(() => null));
  return destinations.get(dest);
}
const stillBroken = [];
for (const r of errors) {
  const u = new URL(r.url);
  const dest = productionRedirect(u.pathname.slice(basePath.length).replace(/\/$/, "") || "/");
  if (!dest) { stillBroken.push(r); continue; }
  const html = await destinationHtml(dest);
  const fragment = decodeURIComponent(u.hash.slice(1));
  if (html === null) { stillBroken.push({ ...r, status: { text: `redirects to ${dest}, which does not exist` } }); continue; }
  if (fragment && !new RegExp(`id="${fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`).test(html)) {
    stillBroken.push({ ...r, status: { text: `redirects to ${dest}, which has no #${fragment}` } });
    continue;
  }
  redirects.push({ ...r, status: { text: `Redirect to ${dest}${u.hash} (vercel.json)` } });
}
errors = stillBroken;
const line = (r) => {
  const url = r.url;
  const via = linkSources.get(url) ?? linkSources.get(url.replace(/\/$/, "")) ?? "";
  const where = via ? ` (linked from ${via.replace(BASE, "") || "/"})` : "";
  const shown = url.startsWith(BASE) ? url.replace(BASE, "") || "/" : url;
  return `- ${shown} : ${r.status?.text ?? r.status?.code ?? JSON.stringify(r.status)}${where}`;
};
const md = [];
md.push(`## Link check: ${BASE}`, "");
md.push(`${pages.size} pages scanned, ${links.size} unique internal links checked${EXTERNAL ? `, ${external.checked} external links checked` : ""}.`, "");
md.push(`| Result | Count |`, `|---|---|`, `| Working | ${report.successful ?? 0} |`, `| Broken | ${errors.length} |`, `| Redirected (stale) | ${redirects.length} |`);
if (EXTERNAL) md.push(`| Broken external | ${external.errors.length} |`, `| External excluded (edit links, Console, login walls) | ${external.excluded} |`);
md.push("");
if (errors.length) md.push(`### Broken links (${errors.length})`, "", ...errors.map(line), "");
if (EXTERNAL && external.errors.length) md.push(`### Broken external links (${external.errors.length})`, "", "Hosts that block bots are accepted and not listed here; what is listed answered 4xx or 5xx or did not answer.", "", ...external.errors.map(line), "");
if (redirects.length) md.push(`### Links that redirect (${redirects.length})`, "", "A link that redirects still works but points at an old URL. Update it to the destination.", "", ...redirects.map(line), "");
if (failedPages.length) md.push(`### Pages that could not be fetched (${failedPages.length})`, "", ...failedPages.map((p) => `- ${p}`), "");
await writeFile(`${OUT}/report.md`, md.join("\n"));
console.log(md.join("\n"));

const failed = errors.length > 0 || external.errors.length > 0 || (FAIL_ON_REDIRECTS && redirects.length > 0) || failedPages.length > 0;
process.exit(failed ? 1 : 0);
