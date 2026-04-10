import { createRequire } from "node:module";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { defineConfig } from "astro/config";
import type { AstroIntegration } from "astro";
import { generateAPIReferenceItems, stainlessDocs } from "@stainless-api/docs";
import aiChat from "@stainless-api/docs-ai-chat/plugin";
import rehypeBasePath from "./src/plugins/rehype-base-path";
import remarkResolveConstantsInHeadings from "./src/plugins/remark-resolve-constants-in-headings";

import sentry from "@sentry/astro";

const require = createRequire(import.meta.url);

// Resolve package subpaths so aliasing the main "components" entry doesn't break ThemeSelect/SDKSelect.
const docsComponentsScriptsPath = require.resolve("@stainless-api/docs/components/scripts");

/**
 * Vite 7 compat:
 *
 * 1) Some plugins declare `transform`/`load`/`resolveId` as `{ filter }` without a
 *    `handler`, which crashes EnvironmentPluginContainer when it calls handler.call().
 *    We patch hooks in `config` + `configResolved` (below).
 *
 * 2) Plugins such as `@vitejs/plugin-react` may delete `transform` in `configResolved`
 *    after Vite has cached which plugins expose `transform`, so `getHookHandler` returns
 *    undefined and handler.call() throws (upstream: vitejs/vite#21162). We ship a pnpm
 *    patch for `vite@7.3.1` (`patches/vite@7.3.1.patch`) that skips when `!handler`.
 */
const HOOK_NAMES = ["transform", "load", "resolveId"] as const;
const noopHandlers: Record<(typeof HOOK_NAMES)[number], () => null> = {
  transform: () => null,
  load: () => null,
  resolveId: () => null,
};

function patchHook(hook: unknown, hookName: (typeof HOOK_NAMES)[number]): unknown {
  // Vite's getHookHandler(hook) returns hook.handler when hook is an object, else hook.
  // If a plugin has transform: { filter } with no handler, getHookHandler returns undefined and handler.call() throws.
  if (hook === undefined || hook === null) {
    return { handler: noopHandlers[hookName] };
  }
  if (
    typeof hook === "object" &&
    typeof (hook as { handler?: unknown }).handler !== "function"
  ) {
    return { ...(hook as object), handler: noopHandlers[hookName] };
  }
  if (typeof hook !== "function") {
    return { handler: noopHandlers[hookName] };
  }
  return hook;
}

function createPluginProxy(plugin: Record<string, unknown>): Record<string, unknown> {
  return new Proxy(plugin, {
    get(target, prop: string) {
      const value = target[prop];
      if (HOOK_NAMES.includes(prop as (typeof HOOK_NAMES)[number])) {
        return patchHook(value, prop as (typeof HOOK_NAMES)[number]);
      }
      return value;
    },
  });
}

function patchAllPlugins(plugins: unknown[]): void {
  if (!Array.isArray(plugins)) return;
  for (const plugin of plugins as Record<string, unknown>[]) {
    if (plugin && typeof plugin === "object") {
      for (const hookName of HOOK_NAMES) {
        const hook = plugin[hookName];
        if (
          hook &&
          typeof hook === "object" &&
          typeof (hook as { handler?: unknown }).handler !== "function" &&
          typeof hook !== "function"
        ) {
          (plugin as Record<string, unknown>)[hookName] = {
            ...(hook as object),
            handler: noopHandlers[hookName],
          };
        }
      }
    }
  }
}

function vite7CompatPlugin(): {
  name: string;
  enforce: "post";
  config: (config: { plugins?: unknown[] }) => { plugins?: unknown[] };
  configResolved: (config: { plugins: unknown[] }) => void;
} {
  return {
    name: "vite7-compat-patch-hooks",
    enforce: "post",
    config(config: { plugins?: unknown[] }) {
      patchAllPlugins(config.plugins ?? []);
      return {};
    },
    configResolved(config: { plugins: unknown[] }) {
      // In-place patch only. Replacing config.plugins with proxy-wrapped plugins can break
      // Astro virtual modules (e.g. astro:server-app). patchAllPlugins mutates hook objects
      // so transform/load/resolveId have a callable handler when they were missing one.
      patchAllPlugins(config.plugins ?? []);
    },
  };
}

/**
 * Post-build safety net: walks every generated .html file and prefixes
 * root-relative hrefs on <a>, <area>, and <link> elements with the base path.
 * No-op when BASE is "/".
 */
function basePathPostProcessor(base: string): AstroIntegration {
  const prefix = base.replace(/\/$/, "");
  return {
    name: "base-path-post-processor",
    hooks: prefix
      ? {
          "astro:build:done": async ({ dir }) => {
            const outDir = dir.pathname;
            const htmlFiles = await collectHtmlFiles(outDir);
            let totalReplaced = 0;
            for (const file of htmlFiles) {
              const html = await readFile(file, "utf-8");
              let count = 0;
              const updated = html.replace(
                /(<(?:a|area|link)\b[^>]*?\bhref=")(\/)([^"]*")/gi,
                (_match, before, _slash, rest) => {
                  const href = "/" + rest.slice(0, -1); // reconstruct full href (without trailing quote)
                  if (href.startsWith(prefix + "/") || href === prefix) {
                    return _match; // already prefixed
                  }
                  count++;
                  return before + prefix + "/" + rest;
                }
              );
              if (count > 0) {
                await writeFile(file, updated, "utf-8");
                totalReplaced += count;
              }
            }
            console.log(
              `[base-path-post-processor] Prefixed ${totalReplaced} href(s) across ${htmlFiles.length} HTML file(s).`
            );
          },
        }
      : {},
  };
}

async function collectHtmlFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await collectHtmlFiles(fullPath)));
    } else if (entry.name.endsWith(".html")) {
      results.push(fullPath);
    }
  }
  return results;
}

// Base path from env var (e.g. BASE_PATH="/docs"). Falls back to "/" (no subpath).
const BASE = process.env.BASE_PATH || "/";

/**
 * Set `DOCS_LOCAL_WITHOUT_STAINLESS=1` to run `pnpm dev` / `pnpm build` without a
 * Stainless API key or `stl auth login`. Tiger Cloud REST API pages are omitted;
 * use a stub page and redirects instead (see README).
 */
const DOCS_LOCAL_WITHOUT_STAINLESS =
  process.env.DOCS_LOCAL_WITHOUT_STAINLESS === "1" ||
  process.env.DOCS_LOCAL_WITHOUT_STAINLESS === "true";

/** Astro doesn't auto-prepend `base` to redirect destinations. This helper does. */
function withBase(redirects: Record<string, string>): Record<string, string> {
  if (BASE === "/") return redirects;
  return Object.fromEntries(
    Object.entries(redirects).map(([from, to]) => [from, BASE + to])
  );
}

// ESM dynamic import: starlight-links-validator ships TypeScript; `require()` fails on Node 22+
// ("Stripping types is currently unsupported for files under node_modules").
const starlightLinksValidator = process.env.CHECK_LINKS
  ? (await import("starlight-links-validator")).default
  : null;

// https://astro.build/config
export default defineConfig({
  site: 'https://www.tigerdata.com',
  base: BASE,
  trailingSlash: "ignore",
  markdown: {
    remarkPlugins: [remarkResolveConstantsInHeadings],
    rehypePlugins: [[rehypeBasePath, { base: BASE }]],
  },
    vite: {
      plugins: [vite7CompatPlugin()] as any,
      resolve: {
        alias: [
          { find: "@components", replacement: new URL("./src/components", import.meta.url).pathname },
          { find: "@constants", replacement: new URL("./src/constants.ts", import.meta.url).pathname },
          // Resolve scripts subpath to the package so ThemeSelect.astro / SDKSelect.astro keep working.
          {
            find: "@stainless-api/docs/components/scripts",
            replacement: docsComponentsScriptsPath,
          },
          // Override Callout with our Figma-styled Tip (lightbulb icon). Exact match only.
          {
            find: /^@stainless-api\/docs\/components$/,
            replacement: new URL("./src/lib/docs-components.ts", import.meta.url).pathname,
          },
        ],
      },
    },
    integrations: [basePathPostProcessor(BASE), stainlessDocs({
      apiReference: DOCS_LOCAL_WITHOUT_STAINLESS
        ? null
        : {
            stainlessProject: "tiger-cloud",
            basePath: "/reference/tiger-cloud-rest",
            propertySettings: {
              collapseDescription: false,
              expandDepth: 2,
            },
          },
      title: "Tiger Data Docs",
      logo: {
        light: "./src/assets/logo-light.svg",
        dark: "./src/assets/logo-dark.svg",
        alt: "Tiger Data",
        replacesTitle: true,
      },
      favicon: "favicon.ico",
      customCss: ["./theme.css", "./osano.css", "./src/styles/layout-root.css"],
      lastUpdated: true,
      head: [
        {
          tag: "meta",
          attrs: { name: "robots", content: "noindex" },
        },
        {
          // Segment
          tag: "script",
          content: `!function(){function isBot(){if(typeof navigator==='undefined'||!navigator.userAgent)return true;var ua=navigator.userAgent.toLowerCase();var botPatterns=['bot','crawler','spider','crawling','slurp','bingpreview','facebookexternalhit','facebot','twitterbot','rogerbot','linkedinbot','embedly','quora link preview','showyoubot','outbrain','pinterest','developers.google.com/+/web/snippet','slackbot','vkshare','w3c_validator','redditbot','applebot','whatsapp','flipboard','tumblr','bitlybot','skypeuripreview','nuzzel','discordbot','google page speed','qwantify','pinterestbot','bitrix link preview','xing-contenttabreceiver','chrome-lighthouse','telegrambot','headlesschrome','phantom','baiduspider','baiduspider-render','yandexbot','duckduckbot','ahrefsbot','semrushbot','dotbot','mj12bot','petalbot','gptbot','chatgpt','claudebot','claude-web','anthropic-ai','google-extended','cohere-ai','omgilibot','omgili','facebookbot','meta-externalagent','diffbot','bytespider','perplexitybot','youbot','ai2bot','ccbot','dataforseobotd'];return botPatterns.some(function(pattern){return ua.indexOf(pattern)!==-1})}if(isBot()){console.debug('Bot detected, skipping Segment analytics');return}var i="analytics",analytics=window[i]=window[i]||[];if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Segment snippet included twice.");else{analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","debug","page","screen","once","off","on","addSourceMiddleware","addIntegrationMiddleware","setAnonymousId","addDestinationMiddleware","register"];analytics.factory=function(e){return function(){if(window[i].initialized)return window[i][e].apply(window[i],arguments);var n=Array.prototype.slice.call(arguments);if(["track","screen","alias","group","page","identify"].indexOf(e)>-1){var c=document.querySelector("link[rel='canonical']");n.push({__t:"bpc",c:c&&c.getAttribute("href")||void 0,p:location.pathname,u:location.href,s:location.search,t:document.title,r:document.referrer})}n.unshift(e);analytics.push(n);return analytics}};for(var n=0;n<analytics.methods.length;n++){var key=analytics.methods[n];analytics[key]=analytics.factory(key)}analytics.load=function(key,n){var t=document.createElement("script");t.type="text/javascript";t.async=!0;t.setAttribute("data-global-segment-analytics-key",i);t.src="https://cdn.segment.com/analytics.js/v1/"+key+"/analytics.min.js";var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r);analytics._loadOptions=n};analytics._writeKey="CF77jkjlE82B4PhIHbbMDiSmOJsDYMqF";analytics.SNIPPET_VERSION="5.2.0";analytics.load("CF77jkjlE82B4PhIHbbMDiSmOJsDYMqF");analytics.page()}}();`,
        },
        {
          // GTM
          tag: "script",
          content: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-PFLX3HP');
          `,
        },
        {
          // Twitter/X ads pixel
          tag: "script",
          content: `!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='//static.ads-twitter.com/uwt.js',a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');twq('init','o8fs3');twq('track','PageView');`,
        },
        {
          // Statsig: set sticky cookie + log exposure for gradual docs rollout
          tag: "script",
          content: `!function(){try{document.cookie="td_new_docs=1;domain=.tigerdata.com;path=/;max-age=2592000;SameSite=Lax";var e=document.cookie.match(/ajs_anonymous_id=([^;]+)/);if(e&&e[1]){var t=document.createElement("script");t.async=!0;t.src="https://cdn.jsdelivr.net/npm/@statsig/js-client@3/build/statsig-js-client+session-replay+web-analytics.min.js";t.onload=function(){try{var s=new window.__STATSIG__.StatsigClient("${import.meta.env.PUBLIC_STATSIG_CLIENT_KEY}",{userID:decodeURIComponent(e[1])});s.initializeAsync().then(function(){s.checkGate("new_docs_site_rollout")})}catch(err){console.debug("Statsig init error:",err)}};document.head.appendChild(t)}}catch(err){console.debug("Statsig setup error:",err)}}();`,
        },
      ],
      header: {
        layout: "stacked",
        links: [
          {
            label: "Get started",
            link: "/get-started",
          },
        ],
      },
      // social: [
      //   { icon: "github", label: "GitHub", href: "https://github.com/timescale/timescaledb" },
      // ],
      experimental: {
        ...(DOCS_LOCAL_WITHOUT_STAINLESS ? { disableStainlessProseIndexing: true } : {}),
        aiChat: aiChat(),
          starlightCompat: {
          components: {
            Head: "./src/components/Head.astro",
            Header: "./src/components/Header.astro",
            MobileMenuToggle: "./src/components/MobileMenuToggle.astro",
            PageTitle: "./src/components/PageTitle.astro",
            Pagination: "./src/components/PageNavigation.astro",
            Callout: "./src/components/Callout.astro",
            Footer: "./src/components/Footer.astro",
          } as Record<string, string>,
          /** Single-link sidebar groups become one clickable row (see `src/starlight-route-middleware.ts`). */
          routeMiddleware: ["./src/starlight-route-middleware.ts"],
          plugins: starlightLinksValidator
            ? [
                starlightLinksValidator({
                  // The Tiger Cloud REST API reference is auto-generated by the
                  // Stainless docs integration and only exists when STAINLESS_API_KEY
                  // is set. Exclude its paths so lint:links passes without the key.
                  exclude: ["/reference/tiger-cloud-rest/**"],
                }),
              ]
            : [],
        },
      },
      tabs: [
        // Get Started tab
        {
          label: "Get started",
          link: "/get-started",
          sidebar: [
            "get-started", // Welcome/index page
            {
              label: "Choose your setup",
              collapsed: true,
              items: [
                { label: "Compare Tiger Data products", link: "/get-started/feature-comparison" },
                { label: "Cloud-exclusive features", link: "/get-started/cloud-exclusive-features" },
                { label: "Compare TimescaleDB editions", link: "/get-started/choose-your-path/timescaledb-editions" },
                { label: "Supported platforms", link: "/get-started/choose-your-path/supported-platforms" },
              ],
            },
            {
              label: "Tiger Cloud",
              collapsed: true,
              items: [
                { label: "5-minute quickstart", link: "/get-started/quickstart/quickstart-5-minutes" },
                { label: "Create a Tiger Cloud service", link: "/get-started/quickstart/create-service" },
                { label: "Get started with the command line", link: "/get-started/quickstart/cli-rest-api" },
                { label: "Integrate Tiger Cloud with your AI assistant", link: "/get-started/quickstart/mcp-cli" },
              ],
            },
            {
              label: "Self-hosted TimescaleDB",
              collapsed: true,
              items: [
                { label: "Install self-hosted TimescaleDB", link: "/get-started/choose-your-path/install-timescaledb" },
                { label: "Connect your app", link: "/get-started/quickstart/connect-your-app" },
              ],
            },
            {
              label: "News and updates",
              collapsed: true,
              autogenerate: { directory: "get-started/news" },
            },
            {
              label: "Contribute to docs",
              collapsed: true,
              items: [{ label: "How to contribute", link: "/get-started/contributing" }],
            },
          ],
        },
        // Learn tab: conceptual and overview content lives under /learn/. Hands-on how-tos link to /build/.
        // Learn sidebar: groups follow dependency order. Retention + tiering: one "Data lifecycle" group. Chunks + time buckets: one "Chunks and time buckets" group (not nested under Hypertables). CAGGs: one "Continuous aggregates (CAGGs)" group (Tiger Cloud nested; backfill migration tool at end; "About CAGGs" omitted from nav, linked from overview).
        {
          label: "Learn",
          link: "/learn",
          sidebar: [
            {
              label: "Overview",
              collapsed: true,
              items: [
                { label: "What is Tiger Data", link: "/learn" },
                { label: "Tiger Data architecture for real-time analytics", link: "/learn/deep-dive/whitepaper" },
              ],
            },
            {
              label: "Tiger Cloud",
              collapsed: true,
              items: [
                { label: "Tiger Cloud", link: "/learn/tiger-cloud" },
                { label: "Cloud-exclusive features", link: "/learn/tiger-cloud/cloud-exclusive-features" },
                { label: "Supported regions", link: "/learn/tiger-cloud/regions" },
                { label: "Tiger Cloud essentials", link: "/learn/tiger-cloud/tiger-cloud-essentials" },
              ],
            },
            {
              label: "Capabilities and comparison",
              collapsed: true,
              items: [
                { label: "Understand capabilities", link: "/learn/capabilities-and-comparison/understand-capabilities" },
                { label: "Compare the features in Tiger Data products", link: "/learn/capabilities-and-comparison/feature-comparison" },
              ],
            },
            {
              label: "Data model",
              collapsed: true,
              items: [
                { label: "Design your data model", link: "/learn/data-model/design-your-data-model" },
                { label: "Wide, narrow, and medium tables", link: "/learn/data-model/wide-narrow-medium-tables" },
                {
                  label: "Primary keys, time columns, and uniqueness",
                  link: "/learn/data-model/primary-keys-time-and-uniqueness",
                },
                { label: "Schema optimization", link: "/learn/data-model/understand-database-schemas" },
              ],
            },
            {
              label: "Hypertables",
              collapsed: true,
              items: [
                { label: "Understand hypertables", link: "/learn/hypertables/understand-hypertables" },
                { label: "Create and configure a hypertable", link: "/learn/hypertables/creating-and-configuring-hypertables" },
                { label: "Partition a hypertable", link: "/learn/hypertables/partitioning-hypertables" },
                { label: "Hypertable indexes", link: "/learn/hypertables/hypertable-indexes" },
                { label: "Hypertable operations", link: "/learn/hypertables/optimize-data-in-hypertables" },
              ],
            },
            {
              label: "Hyperfunctions",
              collapsed: true,
              items: [
                { label: "About hyperfunctions", link: "/learn/hyperfunctions/about-hyperfunctions" },
              ],
            },
            {
              label: "Chunks and time buckets",
              collapsed: true,
              items: [
                { label: "Understand chunks", link: "/learn/chunks/understanding-chunks" },
                { label: "Size hypertable chunks", link: "/learn/hypertables/sizing-hypertable-chunks" },
                { label: "Understand time buckets", link: "/learn/data-management/time-buckets/about-time-buckets" },
                { label: "Use time buckets", link: "/learn/data-management/time-buckets/use-time-buckets" },
                { label: "Manually drop chunks", link: "/learn/data-management/data-retention/manually-drop-chunks" },
              ],
            },
            {
              label: "Hypercore",
              collapsed: true,
              items: [
                { label: "Understand hypercore", link: "/learn/columnar-storage/understand-hypercore" },
                { label: "Compression methods", link: "/learn/columnar-storage/compression-methods" },
              ],
            },
            {
              label: "Continuous aggregates (CAGGs)",
              collapsed: true,
              items: [
                { label: "Understand continuous aggregates", link: "/learn/continuous-aggregates" },
                { label: "Time and continuous aggregates", link: "/learn/continuous-aggregates/time-and-continuous-aggregates" },
                { label: "Hierarchical continuous aggregates", link: "/learn/continuous-aggregates/hierarchical-continuous-aggregates" },
                { label: "Real-time aggregates", link: "/learn/continuous-aggregates/real-time-aggregates" },
                { label: "Materialized hypertables", link: "/learn/continuous-aggregates/materialized-hypertables" },
              ],
            },
            {
              label: "Data lifecycle",
              collapsed: true,
              items: [
                { label: "Understand data retention", link: "/learn/data-management/data-retention/about-data-retention" },
                { label: "Data retention with continuous aggregates", link: "/learn/data-management/data-retention/data-retention-with-continuous-aggregates" },
                { label: "Understand tiered storage", link: "/learn/data-management/storage/about-storage-tiers" },
              ],
            },
            {
              label: "Search",
              collapsed: true,
              items: [
                { label: "Key vector concepts for pgvector", link: "/learn/search/key-vector-database-concepts-for-understanding-pgvector" },
                { label: "Understand pg_textsearch and BM25 search", link: "/learn/search/using-pg-textsearch" },
                { label: "Understand pgvector and pgvectorscale", link: "/learn/search/pgvector-pgvectorsearch" },
              ],
            },
            {
              label: "Glossary",
              collapsed: true,
              items: [{ label: "Browse terms", link: "/learn/glossary" }],
            },
          ],
        },
        // Build tab — organized by Diataxis: hands-on learning first, then
        // job-scoped how-to groups, then optimization, then troubleshooting.
        {
          label: "Build",
          link: "/build",
          sidebar: [
            {
              label: "Build with Tiger Data",
              collapsed: true,
              items: [{ label: "Build with Tiger Data", link: "/build" }],
            },
            // --- Get hands on: merged Tutorials + How-to + Examples ---
            {
              label: "Get hands on",
              collapsed: true,
              items: [
                {
                  label: "Quickstarts",
                  collapsed: true,
                  items: [
                    { label: "Your first hypertable", link: "/build/how-to/your-first-hypertable" },
                    { label: "Basic compression with hypercore", link: "/build/how-to/basic-compression" },
                  ],
                },
                {
                  label: "Tutorials",
                  collapsed: true,
                  items: [
                    { label: "Aggregate organizational data with AI agents", link: "/build/examples/aggregate-organizational-data-with-ai/" },
                    { label: "Create Tiger Cloud services with Terraform", link: "/build/examples/create-services-with-terraform" },
                  ],
                },
                {
                  label: "Guided projects",
                  collapsed: true,
                  items: [
                    { label: "All guided projects", link: "/build/examples" },
                    { label: "Simulate an IoT sensor dataset", link: "/build/examples/simulate-iot-sensor-data" },
                    { label: "Analyze financial tick data", link: "/build/examples/analyze-financial-tick-data" },
                    { label: "Ingest real-time financial data", link: "/build/examples/ingest-real-time-financial-data" },
                    { label: "Analyze transport and geospatial data", link: "/build/examples/analyze-transport-data" },
                    { label: "Analyze Bitcoin blockchain", link: "/build/examples/analyze-blockchain" },
                    { label: "Analyze energy consumption", link: "/build/examples/analyze-energy-consumption" },
                  ],
                },
                { label: "Tiger Data cookbook", link: "/build/examples/cookbook" },
              ],
            },
            // --- Write and query data (split from "Manage my time-series data") ---
            {
              label: "Write and query data",
              collapsed: true,
              items: [
                { label: "Write and query data", link: "/build/data-management" },
                {
                  label: "Write data",
                  collapsed: true,
                  items: [
                    { label: "Insert data", link: "/build/data-management/write-data/insert" },
                    { label: "Update data", link: "/build/data-management/write-data/update" },
                    { label: "Upsert data", link: "/build/data-management/write-data/upsert" },
                    { label: "Delete data", link: "/build/data-management/write-data/delete" },
                  ],
                },
                {
                  label: "Query data",
                  collapsed: true,
                  items: [
                    { label: "SELECT data", link: "/build/data-management/query-data/select" },
                    { label: "SkipScan for DISTINCT queries", link: "/build/data-management/query-data/skipscan" },
                    { label: "Advanced analytic queries", link: "/build/data-management/query-data/advanced-analytic-queries" },
                    { label: "Query external data sources with FDW", link: "/build/performance-optimization/query-external-data-sources-with-fdw" },
                  ],
                },
                { label: "Run queries from Tiger Console", link: "/build/data-management/run-queries-from-tiger-console" },
              ],
            },
            // --- Automate with jobs and policies (split from "Manage my time-series data") ---
            {
              label: "Automate with jobs and policies",
              collapsed: true,
              items: [
                { label: "About automation", link: "/build/data-management/about-automation" },
                { label: "Add a data retention policy", link: "/build/data-management/data-retention/create-a-retention-policy" },
                { label: "Create and manage custom jobs", link: "/build/data-management/create-and-manage-jobs" },
                { label: "Create a custom retention job", link: "/build/data-management/example-generic-retention" },
                { label: "Custom job to downsample and compress chunks", link: "/build/data-management/example-downsample-and-compress" },
                { label: "Custom job for automatic tablespace management", link: "/build/data-management/example-tiered-storage" },
              ],
            },
            // --- Spread data across storage tiers (split from "Manage my time-series data") ---
            {
              label: "Spread data across storage tiers",
              collapsed: true,
              items: [
                { label: "Manage storage and tiering", link: "/build/data-management/storage/manage-storage" },
                { label: "Query tiered data", link: "/build/data-management/storage/query-tiered-data" },
                { label: "Replicas and forks with tiered data", link: "/build/data-management/storage/tiered-data-replicas-forks" },
              ],
            },
            // --- Use hyperfunctions for analytics (split from "Manage my time-series data") ---
            {
              label: "Use hyperfunctions for analytics",
              collapsed: true,
              items: [
                { label: "Hyperfunctions overview", link: "/build/data-management/hyperfunctions" },
                { label: "Counter aggregation", link: "/build/data-management/hyperfunctions/counter-aggregation" },
                { label: "Function pipelines", link: "/build/data-management/hyperfunctions/function-pipelines" },
                {
                  label: "Gapfilling and interpolation",
                  collapsed: true,
                  items: [
                    { label: "Gapfilling and interpolation", link: "/build/data-management/hyperfunctions/gapfilling-interpolation" },
                    { label: "Time bucket gapfill", link: "/build/data-management/hyperfunctions/gapfilling-interpolation/time-bucket-gapfill" },
                    { label: "Last observation carried forward", link: "/build/data-management/hyperfunctions/gapfilling-interpolation/locf" },
                  ],
                },
                { label: "Heartbeat aggregation", link: "/build/data-management/hyperfunctions/heartbeat-agg" },
                { label: "Hyperloglog", link: "/build/data-management/hyperfunctions/hyperloglog" },
                {
                  label: "Percentile approximation",
                  collapsed: true,
                  items: [
                    { label: "Percentile approximation", link: "/build/data-management/hyperfunctions/percentile-approx" },
                    { label: "Approximate percentiles", link: "/build/data-management/hyperfunctions/percentile-approx/approximate-percentile" },
                    { label: "Advanced aggregation methods", link: "/build/data-management/hyperfunctions/percentile-approx/advanced-agg" },
                  ],
                },
                { label: "Statistical aggregation", link: "/build/data-management/hyperfunctions/stats-aggs" },
                { label: "Time-weighted averages", link: "/build/data-management/hyperfunctions/time-weighted-averages" },
              ],
            },
            // --- Keep pre-computed aggregations up to date (CAGGs — unchanged) ---
            {
              label: "Keep pre-computed aggregations up to date",
              collapsed: true,
              items: [
                { label: "Create a continuous aggregate", link: "/build/continuous-aggregates/create-a-continuous-aggregate" },
                { label: "Refresh continuous aggregates", link: "/build/continuous-aggregates/refresh-policies" },
                { label: "Create an index on a continuous aggregate", link: "/build/continuous-aggregates/create-index" },
                { label: "Convert continuous aggregates to the columnstore", link: "/build/continuous-aggregates/compression-on-continuous-aggregates" },
                { label: "Drop data from continuous aggregates", link: "/build/continuous-aggregates/drop-data" },
                { label: "Migrate a continuous aggregate to the new form", link: "/build/continuous-aggregates/migrate-to-new-form" },
              ],
            },
            // --- Optimize storage and query speed (columnar storage) ---
            {
              label: "Optimize storage and query speed",
              collapsed: true,
              items: [
                { label: "Setup hypercore", link: "/build/columnar-storage/setup-hypercore" },
              ],
            },
            // --- Make queries and schemas faster (performance optimization) ---
            {
              label: "Make queries and schemas faster",
              collapsed: true,
              items: [
                { label: "Performance optimization", link: "/build/performance-optimization" },
                { label: "Accelerate queries using indexes", link: "/build/performance-optimization/indexing" },
                { label: "Ensure data integrity with constraints", link: "/build/performance-optimization/ensure-data-integrity-with-constraints" },
                { label: "Alter and update table schemas", link: "/build/performance-optimization/alter-update-table-schema" },
                { label: "Handle semi-structured data with JSON", link: "/build/performance-optimization/handle-semi-structured-data-with-json" },
                { label: "Enforce constraints with unique indexes", link: "/build/performance-optimization/hypertables-and-unique-indexes" },
                { label: "Improve query and upsert performance", link: "/build/performance-optimization/secondary-indexes" },
                { label: "Improve hypertable performance", link: "/build/performance-optimization/improve-hypertable-performance" },
                { label: "Improve storage performance using tablespaces", link: "/build/performance-optimization/manage-tablespaces" },
                { label: "Automate tasks with triggers", link: "/build/performance-optimization/automate-tasks-with-triggers" },
              ],
            },
            // --- Troubleshooting (renamed from "Tips and tricks") ---
            {
              label: "Troubleshooting",
              collapsed: true,
              items: [
                { label: "Common issues", link: "/build/tips-and-tricks" },
                { label: "Troubleshoot continuous aggregates", link: "/build/tips-and-tricks/troubleshoot-continuous-aggregates" },
                { label: "Troubleshoot hypertables", link: "/build/tips-and-tricks/troubleshoot-hypertables" },
                { label: "Troubleshoot hypercore", link: "/build/tips-and-tricks/troubleshoot-hypercore" },
                { label: "Troubleshoot import and ingest", link: "/build/tips-and-tricks/troubleshoot-import-ingest" },
                { label: "Troubleshoot queries", link: "/build/tips-and-tricks/troubleshoot-query-data" },
                { label: "Troubleshoot schema management", link: "/build/tips-and-tricks/troubleshoot-schema-management" },
                { label: "Troubleshoot time buckets", link: "/build/tips-and-tricks/troubleshoot-time-buckets" },
                { label: "Troubleshoot data retention", link: "/build/tips-and-tricks/troubleshoot-data-retention" },
                { label: "Troubleshoot data tiering", link: "/build/tips-and-tricks/troubleshoot-data-tiering" },
                { label: "Troubleshoot jobs", link: "/build/tips-and-tricks/troubleshoot-jobs" },
                { label: "Troubleshoot hyperfunctions", link: "/build/tips-and-tricks/troubleshoot-hyperfunctions" },
              ],
            },
          ],
        },
        // Migrate tab, logical order: overview → how to import/migrate → source-specific guides
        {
          label: "Migrate",
          link: "/migrate",
          sidebar: [
            {
              label: "Migrate to Tiger Data",
              collapsed: true,
              items: [{ label: "Migrate to Tiger Data", link: "/migrate" }],
            },
            {
              label: "Import & migration methods",
              collapsed: false,
              items: [
                { label: "Sync from Postgres", link: "/migrate/livesync-for-postgresql" },
                { label: "Sync from S3", link: "/migrate/livesync-for-s3" },
                { label: "Stream from Kafka", link: "/migrate/livesync-for-kafka" },
                { label: "Upload a file (Console)", link: "/migrate/import-console" },
                { label: "Upload a file (terminal)", link: "/migrate/import-terminal" },
                { label: "Live migration", link: "/migrate/live-migration" },
                { label: "Migrate with downtime", link: "/migrate/migrate-with-downtime" },
                {
                  label: "Dual-write and backfill",
                  collapsed: true,
                  items: [
                    { label: "Dual-write and backfill", link: "/migrate/dual-write-and-backfill" },
                    { label: "From TimescaleDB", link: "/migrate/dual-write-and-backfill/dual-write-from-timescaledb" },
                    { label: "From PostgreSQL", link: "/migrate/dual-write-and-backfill/dual-write-from-postgres" },
                    { label: "From other databases", link: "/migrate/dual-write-and-backfill/dual-write-from-other" },
                    { label: "timescaledb-backfill tool", link: "/migrate/dual-write-and-backfill/timescaledb-backfill" },
                  ],
                },
                { label: "FAQ and troubleshooting", link: "/migrate/troubleshooting" },
              ],
            },
          ],
        },
        // Integrate tab, mirrors the 5 filter dimensions in IntegrateOverview
        {
          label: "Integrate",
          link: "/integrate",
          sidebar: [
            {
              label: "Integrations",
              collapsed: true,
              items: [{ label: "Integrations", link: "/integrate" }],
            },
            {
              label: "Find connection details",
              collapsed: true,
              items: [{ label: "Find connection details", link: "/integrate/find-connection-details" }],
            },
            // --- Type of Tool (matches integrationCategory) ---
            {
              label: "Type of tool",
              collapsed: false,
              items: [
                {
                  label: "Data engineering & ETL",
                  collapsed: true,
                  autogenerate: { directory: "integrate/data-engineering-etl" },
                },
                {
                  label: "Data ingestion & streaming",
                  collapsed: true,
                  autogenerate: { directory: "integrate/data-ingestion-streaming" },
                },
                {
                  label: "BI & visualization",
                  collapsed: true,
                  autogenerate: { directory: "integrate/bi-vizualization" },
                },
                {
                  label: "Connectors",
                  collapsed: true,
                  autogenerate: { directory: "integrate/connectors" },
                },
                {
                  label: "Code & libraries",
                  collapsed: true,
                  autogenerate: { directory: "integrate/code" },
                },
                {
                  label: "Query & administration",
                  collapsed: true,
                  autogenerate: { directory: "integrate/query-administration" },
                },
                {
                  label: "Secure connectivity",
                  collapsed: true,
                  autogenerate: { directory: "integrate/secure-connectivity" },
                },
                {
                  label: "Observability & alerting",
                  collapsed: true,
                  items: [
                    { label: "Overview", link: "/integrate/observability-alerting" },
                    { label: "Amazon CloudWatch", link: "/integrate/observability-alerting/cloudwatch" },
                    { label: "Azure Monitor", link: "/integrate/observability-alerting/azure-monitor" },
                    { label: "Datadog", link: "/integrate/observability-alerting/datadog" },
                    { label: "Grafana", link: "/integrate/observability-alerting/grafana" },
                    { label: "Prometheus", link: "/integrate/observability-alerting/prometheus" },
                    { label: "Telegraf", link: "/integrate/observability-alerting/telegraf" },
                    { label: "Exported metrics", link: "/integrate/observability-alerting/exported-metrics" },
                  ],
                },
                {
                  label: "Configuration & deployment",
                  collapsed: true,
                  autogenerate: { directory: "integrate/configuration-deployment" },
                },
              ],
            },
            // --- Industry (matches integrationIndustry) ---
            {
              label: "Industry",
              collapsed: true,
              items: [
                { label: "Oil and gas", link: "/integrate/?industry=oil-and-gas" },
                { label: "IoT", link: "/integrate/?industry=iot" },
                { label: "Energy", link: "/integrate/?industry=energy" },
                { label: "Crypto", link: "/integrate/?industry=crypto" },
                { label: "Healthcare", link: "/integrate/?industry=healthcare" },
                { label: "Manufacturing", link: "/integrate/?industry=manufacturing" },
              ],
            },
            // --- Platform (matches integrationPlatforms) ---
            {
              label: "Platform",
              collapsed: true,
              items: [
                { label: "Tiger Cloud on AWS", link: "/integrate/?platform=aws" },
                { label: "Tiger Cloud on Azure", link: "/integrate/?platform=azure" },
                { label: "Self-Hosted", link: "/integrate/?platform=self-hosted" },
              ],
            },
            // --- First Party / Third Party ---
            {
              label: "First party/third party",
              collapsed: true,
              items: [
                { label: "First party", link: "/integrate/?party=first-party" },
                { label: "Third party", link: "/integrate/?party=third-party" },
              ],
            },
            // --- Technology ---
            {
              label: "Technology",
              collapsed: true,
              items: [
                { label: "PostgreSQL", link: "/integrate/?technology=PostgreSQL" },
                { label: "Python", link: "/integrate/?technology=Python" },
                { label: "SQL", link: "/integrate/?technology=SQL" },
                { label: "Kafka", link: "/integrate/?technology=Kafka" },
                { label: "AWS", link: "/integrate/?technology=AWS" },
                { label: "Azure", link: "/integrate/?technology=Azure" },
                { label: "GCP", link: "/integrate/?technology=GCP" },
                { label: "Terraform", link: "/integrate/?technology=Terraform" },
                { label: "Kubernetes", link: "/integrate/?technology=Kubernetes" },
                { label: "Grafana", link: "/integrate/?technology=Grafana" },
                { label: "Prometheus", link: "/integrate/?technology=Prometheus" },
                { label: "REST API", link: "/integrate/?technology=REST+API" },
              ],
            },
            {
              label: "Troubleshooting",
              collapsed: true,
              items: [{ label: "Troubleshooting", link: "/integrate/troubleshooting" }],
            },
          ],
        },
        // Deploy tab
        {
          label: "Deploy",
          link: "/deploy",
          sidebar: [
            {
              label: "Deploy Tiger Data",
              collapsed: true,
              items: [{ label: "Deploy Tiger Data", link: "/deploy" }],
            },
            {
              label: "Tiger Cloud on AWS",
              collapsed: true,
              items: [
                    {
                      label: "Configuration",
                      collapsed: true,
                      items: [
                        { label: "About configuration", link: "/deploy/tiger-cloud/tiger-cloud-aws/configuration/about-configuration" },
                        { label: "Configure database parameters", link: "/deploy/tiger-cloud/tiger-cloud-aws/configuration/customize-configuration" },
                        { label: "Advanced parameters", link: "/deploy/tiger-cloud/tiger-cloud-aws/configuration/advanced-parameters" },
                      ],
                    },
                    {
                      label: "Service management",
                      collapsed: true,
                      items: [
                        { label: "About Tiger Cloud services", link: "/deploy/tiger-cloud/tiger-cloud-aws/service-management" },
                        { label: "Tiger Console overview", link: "/deploy/tiger-cloud/tiger-cloud-aws/service-management/service-overview" },
                        { label: "Service explorer", link: "/deploy/tiger-cloud/tiger-cloud-aws/service-management/service-explorer" },
                        { label: "Service management", link: "/deploy/tiger-cloud/tiger-cloud-aws/service-management/service-management" },
                        { label: "Manually change compute resources", link: "/deploy/tiger-cloud/tiger-cloud-aws/service-management/change-resources" },
                        { label: "Connection pooling", link: "/deploy/tiger-cloud/tiger-cloud-aws/service-management/connection-pooling" },
                        { label: "Fork services", link: "/deploy/tiger-cloud/tiger-cloud-aws/service-management/fork-services" },
                      ],
                    },
                    {
                      label: "High availability",
                      collapsed: true,
                      items: [
                        { label: "Overview", link: "/deploy/tiger-cloud/tiger-cloud-aws/high-availability/overview" },
                        { label: "Manage high availability", link: "/deploy/tiger-cloud/tiger-cloud-aws/high-availability/high-availability" },
                        { label: "Read scaling", link: "/deploy/tiger-cloud/tiger-cloud-aws/high-availability/read-scaling" },
                        { label: "Back up and recover services", link: "/deploy/tiger-cloud/tiger-cloud-aws/high-availability/backup-restore" },
                      ],
                    },
                    { label: "Monitor your services", link: "/deploy/tiger-cloud/tiger-cloud-aws/monitoring" },
                    {
                      label: "Security",
                      collapsed: true,
                      items: [
                        { label: "Overview", link: "/deploy/tiger-cloud/tiger-cloud-aws/security/overview" },
                        { label: "Client credentials", link: "/deploy/tiger-cloud/tiger-cloud-aws/security/client-credentials" },
                        { label: "IP allow list", link: "/deploy/tiger-cloud/tiger-cloud-aws/security/ip-allow-list" },
                        { label: "Control user access to projects", link: "/deploy/tiger-cloud/tiger-cloud-aws/security/members" },
                        { label: "Multi-factor authentication", link: "/deploy/tiger-cloud/tiger-cloud-aws/security/multi-factor-authentication" },
                        { label: "Manage data security in your service", link: "/deploy/tiger-cloud/tiger-cloud-aws/security/read-only-role" },
                        { label: "SAML authentication", link: "/deploy/tiger-cloud/tiger-cloud-aws/security/saml" },
                        { label: "Connect with a stricter SSL mode", link: "/deploy/tiger-cloud/tiger-cloud-aws/security/strict-ssl" },
                        { label: "VPC Peering and AWS PrivateLink", link: "/deploy/tiger-cloud/tiger-cloud-aws/security/vpc" },
                        { label: "AWS Transit Gateway", link: "/deploy/tiger-cloud/tiger-cloud-aws/security/transit-gateway" },
                      ],
                    },
                    {
                      label: "Extensions",
                      collapsed: true,
                      items: [
                        { label: "PostgreSQL extensions", link: "/deploy/tiger-cloud/tiger-cloud-aws/tiger-cloud-extensions" },
                        { label: "Optimize full text search with BM25", link: "/deploy/tiger-cloud/tiger-cloud-aws/tiger-cloud-extensions/pg-textsearch" },
                        { label: "Encrypt data using pgcrypto", link: "/deploy/tiger-cloud/tiger-cloud-aws/tiger-cloud-extensions/pgcrypto" },
                        { label: "Create a chatbot using pgvector", link: "/deploy/tiger-cloud/tiger-cloud-aws/tiger-cloud-extensions/pgvector" },
                        { label: "Analyse geospatial data with PostGIS", link: "/deploy/tiger-cloud/tiger-cloud-aws/tiger-cloud-extensions/postgis" },
                      ],
                    },
                    { label: "Maintenance and upgrades", link: "/deploy/tiger-cloud/tiger-cloud-aws/upgrades" },
                    { label: "Billing and account management", link: "/deploy/tiger-cloud/tiger-cloud-aws/pricing-and-account-management" },
              ],
            },
            {
              label: "Tiger Cloud on Azure",
              collapsed: true,
              items: [
                    {
                      label: "Configuration",
                      collapsed: true,
                      items: [
                        { label: "About configuration", link: "/deploy/tiger-cloud/tiger-cloud-azure/configuration/about-configuration" },
                        { label: "Configure database parameters", link: "/deploy/tiger-cloud/tiger-cloud-azure/configuration/customize-configuration" },
                        { label: "Advanced parameters", link: "/deploy/tiger-cloud/tiger-cloud-azure/configuration/advanced-parameters" },
                      ],
                    },
                    {
                      label: "Service management",
                      collapsed: true,
                      items: [
                        { label: "About Tiger Cloud services", link: "/deploy/tiger-cloud/tiger-cloud-azure/service-management" },
                        { label: "Tiger Console overview", link: "/deploy/tiger-cloud/tiger-cloud-azure/service-management/service-overview" },
                        { label: "Service explorer", link: "/deploy/tiger-cloud/tiger-cloud-azure/service-management/service-explorer" },
                        { label: "Service management", link: "/deploy/tiger-cloud/tiger-cloud-azure/service-management/service-management" },
                        { label: "Manually change compute resources", link: "/deploy/tiger-cloud/tiger-cloud-azure/service-management/change-resources" },
                        { label: "Connection pooling", link: "/deploy/tiger-cloud/tiger-cloud-azure/service-management/connection-pooling" },
                        { label: "Fork services", link: "/deploy/tiger-cloud/tiger-cloud-azure/service-management/fork-services" },
                      ],
                    },
                    {
                      label: "High availability",
                      collapsed: true,
                      items: [
                        { label: "Overview", link: "/deploy/tiger-cloud/tiger-cloud-azure/high-availability/overview" },
                        { label: "Manage high availability", link: "/deploy/tiger-cloud/tiger-cloud-azure/high-availability/high-availability" },
                        { label: "Read scaling", link: "/deploy/tiger-cloud/tiger-cloud-azure/high-availability/read-scaling" },
                        { label: "Back up and recover services", link: "/deploy/tiger-cloud/tiger-cloud-azure/high-availability/backup-restore" },
                      ],
                    },
                    { label: "Monitor your services", link: "/deploy/tiger-cloud/tiger-cloud-azure/monitoring" },
                    {
                      label: "Security",
                      collapsed: true,
                      items: [
                        { label: "Overview", link: "/deploy/tiger-cloud/tiger-cloud-azure/security/overview" },
                        { label: "Client credentials", link: "/deploy/tiger-cloud/tiger-cloud-azure/security/client-credentials" },
                        { label: "IP allow list", link: "/deploy/tiger-cloud/tiger-cloud-azure/security/ip-allow-list" },
                        { label: "Control user access to projects", link: "/deploy/tiger-cloud/tiger-cloud-azure/security/members" },
                        { label: "Multi-factor authentication", link: "/deploy/tiger-cloud/tiger-cloud-azure/security/multi-factor-authentication" },
                        { label: "Manage data security in your service", link: "/deploy/tiger-cloud/tiger-cloud-azure/security/read-only-role" },
                        { label: "SAML authentication", link: "/deploy/tiger-cloud/tiger-cloud-azure/security/saml" },
                        { label: "Connect with a stricter SSL mode", link: "/deploy/tiger-cloud/tiger-cloud-azure/security/strict-ssl" },
                        { label: "Azure Private Link", link: "/deploy/tiger-cloud/tiger-cloud-azure/security/azure-privatelink" },
                      ],
                    },
                    {
                      label: "Extensions",
                      collapsed: true,
                      items: [
                        { label: "PostgreSQL extensions", link: "/deploy/tiger-cloud/tiger-cloud-azure/tiger-cloud-extensions" },
                        { label: "Optimize full text search with BM25", link: "/deploy/tiger-cloud/tiger-cloud-azure/tiger-cloud-extensions/pg-textsearch" },
                        { label: "Encrypt data using pgcrypto", link: "/deploy/tiger-cloud/tiger-cloud-azure/tiger-cloud-extensions/pgcrypto" },
                        { label: "Create a chatbot using pgvector", link: "/deploy/tiger-cloud/tiger-cloud-azure/tiger-cloud-extensions/pgvector" },
                        { label: "Analyse geospatial data with PostGIS", link: "/deploy/tiger-cloud/tiger-cloud-azure/tiger-cloud-extensions/postgis" },
                      ],
                    },
                    { label: "Maintenance and upgrades", link: "/deploy/tiger-cloud/tiger-cloud-azure/upgrades" },
                    { label: "Billing and account management", link: "/deploy/tiger-cloud/tiger-cloud-azure/pricing-and-account-management" },
              ],
            },
            {
              label: "Tiger Cloud operations",
              collapsed: true,
              items: [
                { label: "Troubleshoot", link: "/deploy/tiger-cloud/troubleshoot" },
                { label: "Vectorizer and LLM calls migration guide", link: "/deploy/tiger-cloud/vectorizer-deprecation" },
              ],
            },
            {
              label: "Self-Hosted",
              collapsed: true,
              items: [
                { label: "Self-hosted TimescaleDB", link: "/deploy/self-hosted" },
                {
                  label: "Configuration",
                  collapsed: true,
                  items: [
                    { label: "Configuration guide", link: "/deploy/self-hosted/configuration" },
                    { label: "About configuration", link: "/deploy/self-hosted/configuration/about-configuration" },
                    { label: "Using timescaledb-tune", link: "/deploy/self-hosted/configuration/timescaledb-tune" },
                    { label: "Manual PostgreSQL configuration", link: "/deploy/self-hosted/configuration/postgres-config" },
                    { label: "TimescaleDB configuration", link: "/deploy/self-hosted/configuration/timescaledb-config" },
                    { label: "Docker configuration", link: "/deploy/self-hosted/configuration/docker-config" },
                    { label: "Telemetry", link: "/deploy/self-hosted/configuration/telemetry" },
                  ],
                },
                {
                  label: "Backup and restore",
                  collapsed: true,
                  items: [
                    { label: "Backup and restore", link: "/deploy/self-hosted/backup-and-restore" },
                    { label: "Logical backup", link: "/deploy/self-hosted/backup-and-restore/logical-backup" },
                    { label: "Physical backups", link: "/deploy/self-hosted/backup-and-restore/physical" },
                  ],
                },
                {
                  label: "Migrate to self-hosted TimescaleDB",
                  collapsed: true,
                  items: [
                    { label: "Migration guide", link: "/deploy/self-hosted/migration" },
                    { label: "Migrate entire database", link: "/deploy/self-hosted/migration/entire-database" },
                    { label: "Migrate schema then data", link: "/deploy/self-hosted/migration/schema-then-data" },
                    { label: "Migrate tables from the same database", link: "/deploy/self-hosted/migration/same-db" },
                    { label: "Migrate data from InfluxDB", link: "/deploy/self-hosted/migration/migrate-influxdb" },
                  ],
                },
                { label: "Manage storage using tablespaces", link: "/deploy/self-hosted/manage-storage" },
                {
                  label: "Replication and high availability",
                  collapsed: true,
                  items: [
                    { label: "Replication and HA", link: "/deploy/self-hosted/replication-and-ha" },
                    { label: "About high availability", link: "/deploy/self-hosted/replication-and-ha/about-ha" },
                    { label: "Configure replication", link: "/deploy/self-hosted/replication-and-ha/configure-replication" },
                  ],
                },
                {
                  label: "Additional tooling",
                  collapsed: true,
                  items: [
                    { label: "Available tools", link: "/deploy/self-hosted/tooling" },
                    { label: "TimescaleDB Tune", link: "/deploy/self-hosted/tooling/about-timescaledb-tune" },
                    { label: "Install and update TimescaleDB Toolkit", link: "/deploy/self-hosted/tooling/install-toolkit" },
                  ],
                },
                {
                  label: "Upgrade self-hosted TimescaleDB",
                  collapsed: true,
                  items: [
                    { label: "Upgrade guide", link: "/deploy/self-hosted/upgrades" },
                    { label: "Upgrade to a minor version", link: "/deploy/self-hosted/upgrades/minor-upgrade" },
                    { label: "Upgrade to a major version", link: "/deploy/self-hosted/upgrades/major-upgrade" },
                    { label: "Upgrade TimescaleDB in Docker", link: "/deploy/self-hosted/upgrades/upgrade-docker" },
                    { label: "Upgrade PostgreSQL", link: "/deploy/self-hosted/upgrades/upgrade-pg" },
                    { label: "Downgrade to a minor version", link: "/deploy/self-hosted/upgrades/downgrade" },
                  ],
                },
                { label: "Uninstall self-hosted TimescaleDB", link: "/deploy/self-hosted/uninstall" },
                { label: "Troubleshooting", link: "/deploy/self-hosted/troubleshooting" },
              ],
            },
            {
              label: "Managed service (MST)",
              collapsed: true,
              items: [
                { label: "Managed Service for TimescaleDB", link: "/deploy/mst" },
                { label: "Create an MST service", link: "/deploy/mst/create-mst-service" },
                { label: "About MST", link: "/deploy/mst/about-mst" },
                { label: "Ingest data", link: "/deploy/mst/ingest-data" },
                { label: "User management", link: "/deploy/mst/user-management" },
                { label: "Billing", link: "/deploy/mst/billing" },
                { label: "Connection pools", link: "/deploy/mst/connection-pools" },
                { label: "Viewing service logs", link: "/deploy/mst/viewing-service-logs" },
                {
                  label: "VPC peering",
                  collapsed: true,
                  items: [
                    { label: "VPC peering", link: "/deploy/mst/vpc-peering" },
                    { label: "Configure VPC peering", link: "/deploy/mst/vpc-peering/vpc-peering" },
                    { label: "VPC peering on AWS", link: "/deploy/mst/vpc-peering/vpc-peering-aws" },
                    { label: "VPC peering on GCP", link: "/deploy/mst/vpc-peering/vpc-peering-gcp" },
                    { label: "VPC peering on Azure", link: "/deploy/mst/vpc-peering/vpc-peering-azure" },
                    { label: "AWS Transit Gateway", link: "/deploy/mst/vpc-peering/vpc-peering-aws-transit" },
                  ],
                },
                {
                  label: "Integrations",
                  collapsed: true,
                  items: [
                    { label: "MST integrations", link: "/deploy/mst/integrations" },
                    { label: "Google Data Studio", link: "/deploy/mst/integrations/google-data-studio-mst" },
                    { label: "Grafana", link: "/deploy/mst/integrations/grafana-mst" },
                    { label: "Logging", link: "/deploy/mst/integrations/logging" },
                    { label: "Datadog", link: "/deploy/mst/integrations/metrics-datadog" },
                    { label: "Prometheus", link: "/deploy/mst/integrations/prometheus-mst" },
                  ],
                },
                { label: "Supported extensions", link: "/deploy/mst/extensions" },
                { label: "Postgres dblink extension", link: "/deploy/mst/dblink-extension" },
                { label: "Security", link: "/deploy/mst/security" },
                { label: "PostgreSQL read replica", link: "/deploy/mst/postgresql-read-replica" },
                { label: "Maintenance", link: "/deploy/mst/maintenance" },
                { label: "Failover", link: "/deploy/mst/failover" },
                { label: "Backups", link: "/deploy/mst/manage-backups" },
                { label: "Aiven client", link: "/deploy/mst/aiven-client" },
                { label: "Migrate to MST", link: "/deploy/mst/migrate-to-mst" },
                { label: "REST API", link: "/deploy/mst/restapi" },
                { label: "Index issues", link: "/deploy/mst/identify-index-issues" },
                { label: "Troubleshooting", link: "/deploy/mst/troubleshooting" },
              ],
            },
            {
              label: "Limitations",
              collapsed: true,
              items: [{ label: "Limitations", link: "/deploy/limitations" }],
            },
          ],
        },
        // Reference tab
        {
          label: "Reference",
          link: "/reference",
          sidebar: [
            {
              label: "API and CLI reference",
              collapsed: false,
              items: [{ label: "API and CLI reference", link: "/reference" }],
            },
            {
              label: "TimescaleDB",
              collapsed: false,
              items: [
                { label: "TimescaleDB reference", link: "/reference/timescaledb" },
                {
                  label: "Hypertables and chunks",
                  collapsed: true,
                  items: [
                    { label: "Overview", link: "/reference/timescaledb/hypertables" },
                    {
                      label: "Table creation",
                      items: [
                        { label: "CREATE TABLE", link: "/reference/timescaledb/hypertables/create_table" },
                        { label: "create_hypertable()", link: "/reference/timescaledb/hypertables/create_hypertable" },
                        { label: "CREATE INDEX (Transaction Per Chunk)", link: "/reference/timescaledb/hypertables/create_index" },
                        { label: "create_hypertable() (old interface)", link: "/reference/timescaledb/hypertables/create_hypertable_old" },
                      ],
                    },
                    {
                      label: "Chunk management",
                      items: [
                        { label: "create_chunk()", link: "/reference/timescaledb/hypertables/create_chunk" },
                        { label: "show_chunks()", link: "/reference/timescaledb/hypertables/show_chunks" },
                        { label: "drop_chunk()", link: "/reference/timescaledb/hypertables/drop_chunk" },
                        { label: "drop_chunks()", link: "/reference/timescaledb/hypertables/drop_chunks" },
                        { label: "move_chunk()", link: "/reference/timescaledb/hypertables/move_chunk" },
                        { label: "reorder_chunk()", link: "/reference/timescaledb/hypertables/reorder_chunk" },
                        { label: "merge_chunks()", link: "/reference/timescaledb/hypertables/merge_chunks" },
                        { label: "merge_chunks_concurrently()", link: "/reference/timescaledb/hypertables/merge_chunks_concurrently" },
                        { label: "split_chunk()", link: "/reference/timescaledb/hypertables/split_chunk" },
                        { label: "chunk_rewrite_cleanup()", link: "/reference/timescaledb/hypertables/chunk_rewrite_cleanup" },
                        { label: "attach_chunk()", link: "/reference/timescaledb/hypertables/attach_chunk" },
                        { label: "detach_chunk()", link: "/reference/timescaledb/hypertables/detach_chunk" },
                        { label: "set_chunk_time_interval()", link: "/reference/timescaledb/hypertables/set_chunk_time_interval" },
                        { label: "set_integer_now_func()", link: "/reference/timescaledb/hypertables/set_integer_now_func" },
                        { label: "add_dimension()", link: "/reference/timescaledb/hypertables/add_dimension" },
                        { label: "add_dimension() (deprecated)", link: "/reference/timescaledb/hypertables/add_dimension_old" },
                      ],
                    },
                    {
                      label: "Size and statistics",
                      items: [
                        { label: "hypertable_size()", link: "/reference/timescaledb/hypertables/hypertable_size" },
                        { label: "hypertable_detailed_size()", link: "/reference/timescaledb/hypertables/hypertable_detailed_size" },
                        { label: "hypertable_index_size()", link: "/reference/timescaledb/hypertables/hypertable_index_size" },
                        { label: "hypertable_approximate_size()", link: "/reference/timescaledb/hypertables/hypertable_approximate_size" },
                        { label: "hypertable_approximate_detailed_size()", link: "/reference/timescaledb/hypertables/hypertable_approximate_detailed_size" },
                        { label: "chunks_detailed_size()", link: "/reference/timescaledb/hypertables/chunks_detailed_size" },
                      ],
                    },
                    {
                      label: "Tablespace management",
                      items: [
                        { label: "attach_tablespace()", link: "/reference/timescaledb/hypertables/attach_tablespace" },
                        { label: "detach_tablespace()", link: "/reference/timescaledb/hypertables/detach_tablespace" },
                        { label: "detach_tablespaces()", link: "/reference/timescaledb/hypertables/detach_tablespaces" },
                        { label: "show_tablespaces()", link: "/reference/timescaledb/hypertables/show_tablespaces" },
                      ],
                    },
                    {
                      label: "Reordering and policies",
                      items: [
                        { label: "add_reorder_policy()", link: "/reference/timescaledb/hypertables/add_reorder_policy" },
                        { label: "remove_reorder_policy()", link: "/reference/timescaledb/hypertables/remove_reorder_policy" },
                      ],
                    },
                    {
                      label: "Query optimization",
                      items: [
                        { label: "enable_chunk_skipping()", link: "/reference/timescaledb/hypertables/enable_chunk_skipping" },
                        { label: "disable_chunk_skipping()", link: "/reference/timescaledb/hypertables/disable_chunk_skipping" },
                      ],
                    },
                  ],
                },
                {
                  label: "Hypercore",
                  collapsed: true,
                  items: [
                    { label: "Overview", link: "/reference/timescaledb/hypercore" },
                    {
                      label: "Policies",
                      items: [
                        { label: "add_columnstore_policy()", link: "/reference/timescaledb/hypercore/add_columnstore_policy" },
                        { label: "remove_columnstore_policy()", link: "/reference/timescaledb/hypercore/remove_columnstore_policy" },
                      ],
                    },
                    {
                      label: "Manual conversion",
                      items: [
                        { label: "ALTER TABLE (hypercore)", link: "/reference/timescaledb/hypercore/alter_table" },
                        { label: "convert_to_columnstore()", link: "/reference/timescaledb/hypercore/convert_to_columnstore" },
                        { label: "convert_to_rowstore()", link: "/reference/timescaledb/hypercore/convert_to_rowstore" },
                      ],
                    },
                    {
                      label: "Statistics and information",
                      items: [
                        { label: "chunk_columnstore_stats()", link: "/reference/timescaledb/hypercore/chunk_columnstore_stats" },
                        { label: "hypertable_columnstore_stats()", link: "/reference/timescaledb/hypercore/hypertable_columnstore_stats" },
                        { label: "chunk_columnstore_settings", link: "/reference/timescaledb/hypercore/chunk_columnstore_settings" },
                        { label: "hypertable_columnstore_settings", link: "/reference/timescaledb/hypercore/hypertable_columnstore_settings" },
                      ],
                    },
                  ],
                },
                {
                  label: "Continuous aggregates",
                  collapsed: true,
                  items: [
                    { label: "Overview", link: "/reference/timescaledb/continuous-aggregates" },
                    {
                      label: "Create and modify CAGGs",
                      items: [
                        { label: "CREATE MATERIALIZED VIEW", link: "/reference/timescaledb/continuous-aggregates/create_materialized_view" },
                        { label: "ALTER MATERIALIZED VIEW", link: "/reference/timescaledb/continuous-aggregates/alter_materialized_view" },
                        { label: "DROP MATERIALIZED VIEW", link: "/reference/timescaledb/continuous-aggregates/drop_materialized_view" },
                        { label: "cagg_migrate()", link: "/reference/timescaledb/continuous-aggregates/cagg_migrate" },
                        { label: "refresh_continuous_aggregate()", link: "/reference/timescaledb/continuous-aggregates/refresh_continuous_aggregate" },
                      ],
                    },
                    {
                      label: "Manage policies",
                      items: [
                        { label: "add_continuous_aggregate_policy()", link: "/reference/timescaledb/continuous-aggregates/add_continuous_aggregate_policy" },
                        { label: "remove_continuous_aggregate_policy()", link: "/reference/timescaledb/continuous-aggregates/remove_continuous_aggregate_policy" },
                      ],
                    },
                    {
                      label: "Experimental policy management",
                      items: [
                        { label: "add_policies()", link: "/reference/timescaledb/continuous-aggregates/add_policies" },
                        { label: "alter_policies()", link: "/reference/timescaledb/continuous-aggregates/alter_policies" },
                        { label: "remove_policies()", link: "/reference/timescaledb/continuous-aggregates/remove_policies" },
                        { label: "remove_all_policies()", link: "/reference/timescaledb/continuous-aggregates/remove_all_policies" },
                        { label: "show_policies()", link: "/reference/timescaledb/continuous-aggregates/show_policies" },
                      ],
                    },
                  ],
                },
                {
                  label: "Hyperfunctions",
                  collapsed: true,
                  items: [
                    { label: "Overview", link: "/reference/timescaledb/hyperfunctions" },
                    {
                      label: "Time series utilities",
                      items: [
                        { label: "days_in_month()", link: "/reference/timescaledb/hyperfunctions/time-series-utilities/days_in_month" },
                        { label: "first()", link: "/reference/timescaledb/hyperfunctions/time-series-utilities/first" },
                        { label: "last()", link: "/reference/timescaledb/hyperfunctions/time-series-utilities/last" },
                        { label: "month_normalize()", link: "/reference/timescaledb/hyperfunctions/time-series-utilities/month_normalize" },
                        { label: "time_bucket()", link: "/reference/timescaledb/hyperfunctions/time-series-utilities/time_bucket" },
                        { label: "to_epoch()", link: "/reference/timescaledb/hyperfunctions/time-series-utilities/to_epoch" },
                      ],
                    },
                    {
                      label: "Distribution analysis",
                      items: [
                        { label: "approximate_row_count()", link: "/reference/timescaledb/hyperfunctions/distribution-analysis/approximate_row_count" },
                        { label: "histogram()", link: "/reference/timescaledb/hyperfunctions/distribution-analysis/histogram" },
                      ],
                    },
                    {
                      label: "Gapfilling",
                      items: [
                        { label: "interpolate()", link: "/reference/timescaledb/hyperfunctions/time_bucket_gapfill/interpolate" },
                        { label: "locf()", link: "/reference/timescaledb/hyperfunctions/time_bucket_gapfill/locf" },
                        { label: "time_bucket_gapfill()", link: "/reference/timescaledb/hyperfunctions/time_bucket_gapfill/time_bucket_gapfill" },
                      ],
                    },
                  ],
                },
                {
                  label: "Data retention",
                  collapsed: true,
                  items: [
                    { label: "Overview", link: "/reference/timescaledb/data-retention" },
                    { label: "add_retention_policy()", link: "/reference/timescaledb/data-retention/add_retention_policy" },
                    { label: "remove_retention_policy()", link: "/reference/timescaledb/data-retention/remove_retention_policy" },
                  ],
                },
                {
                  label: "Jobs and automation",
                  collapsed: true,
                  items: [
                    { label: "Overview", link: "/reference/timescaledb/jobs-automation" },
                    { label: "add_job()", link: "/reference/timescaledb/jobs-automation/add_job" },
                    { label: "alter_job()", link: "/reference/timescaledb/jobs-automation/alter_job" },
                    { label: "delete_job()", link: "/reference/timescaledb/jobs-automation/delete_job" },
                    { label: "run_job()", link: "/reference/timescaledb/jobs-automation/run_job" },
                  ],
                },
                {
                  label: "UUIDv7 functions",
                  collapsed: true,
                  items: [
                    { label: "Overview", link: "/reference/timescaledb/uuid-functions" },
                    { label: "generate_uuidv7()", link: "/reference/timescaledb/uuid-functions/generate_uuidv7" },
                    { label: "to_uuidv7()", link: "/reference/timescaledb/uuid-functions/to_uuidv7" },
                    { label: "to_uuidv7_boundary()", link: "/reference/timescaledb/uuid-functions/to_uuidv7_boundary" },
                    { label: "uuid_timestamp()", link: "/reference/timescaledb/uuid-functions/uuid_timestamp" },
                    { label: "uuid_timestamp_micros()", link: "/reference/timescaledb/uuid-functions/uuid_timestamp_micros" },
                    { label: "uuid_version()", link: "/reference/timescaledb/uuid-functions/uuid_version" },
                  ],
                },
                {
                  label: "Informational views",
                  collapsed: true,
                  items: [
                    { label: "Overview", link: "/reference/timescaledb/informational-views" },
                    {
                      label: "Hypertable and chunk information",
                      items: [
                        { label: "timescaledb_information.chunks", link: "/reference/timescaledb/informational-views/chunks" },
                        { label: "timescaledb_information.dimensions", link: "/reference/timescaledb/informational-views/dimensions" },
                        { label: "timescaledb_information.hypertables", link: "/reference/timescaledb/informational-views/hypertables" },
                        { label: "timescaledb_information.continuous_aggregates", link: "/reference/timescaledb/informational-views/continuous_aggregates" },
                      ],
                    },
                    {
                      label: "Columnstore information",
                      items: [
                        { label: "chunk_columnstore_settings", link: "/reference/timescaledb/informational-views/chunk_columnstore_settings" },
                        { label: "hypertable_columnstore_settings", link: "/reference/timescaledb/informational-views/hypertable_columnstore_settings" },
                      ],
                    },
                    {
                      label: "Jobs and policies",
                      items: [
                        { label: "timescaledb_information.job_errors", link: "/reference/timescaledb/informational-views/job_errors" },
                        { label: "timescaledb_information.job_history", link: "/reference/timescaledb/informational-views/job_history" },
                        { label: "timescaledb_information.job_stats", link: "/reference/timescaledb/informational-views/job_stats" },
                        { label: "timescaledb_information.jobs", link: "/reference/timescaledb/informational-views/jobs" },
                        { label: "timescaledb_experimental.policies", link: "/reference/timescaledb/informational-views/policies" },
                      ],
                    },
                  ],
                },
                {
                  label: "Configuration",
                  collapsed: true,
                  items: [
                    { label: "Overview", link: "/reference/timescaledb/configuration" },
                    { label: "GUC parameters", link: "/reference/timescaledb/configuration/gucs" },
                    { label: "Configuration parameters", link: "/reference/timescaledb/configuration/tiger-postgres" },
                  ],
                },
                {
                  label: "Administration",
                  collapsed: true,
                  items: [
                    { label: "Overview", link: "/reference/timescaledb/administration" },
                    { label: "get_telemetry_report()", link: "/reference/timescaledb/administration/get_telemetry_report" },
                    { label: "timescaledb_post_restore()", link: "/reference/timescaledb/administration/timescaledb_post_restore" },
                    { label: "timescaledb_pre_restore()", link: "/reference/timescaledb/administration/timescaledb_pre_restore" },
                  ],
                },
                { label: "API reference tag overview", link: "/reference/timescaledb/tag-overview" },
              ],
            },
            {
              label: "TimescaleDB Toolkit",
              collapsed: false,
              items: [
                { label: "Toolkit reference", link: "/reference/toolkit" },
                {
                  label: "Approximate count distinct",
                  collapsed: true,
                  items: [
                    { label: "approx_count_distinct()", link: "/reference/toolkit/approximate-count-distinct/approx_count_distinct" },
                    { label: "distinct_count()", link: "/reference/toolkit/approximate-count-distinct/distinct_count" },
                    { label: "hyperloglog()", link: "/reference/toolkit/approximate-count-distinct/hyperloglog" },
                    { label: "rollup()", link: "/reference/toolkit/approximate-count-distinct/rollup" },
                    { label: "stderror()", link: "/reference/toolkit/approximate-count-distinct/stderror" },
                  ],
                },
                {
                  label: "Statistical and regression analysis",
                  collapsed: true,
                  items: [
                    { label: "Overview", link: "/reference/toolkit/statistical-and-regression-analysis" },
                    {
                      label: "One variable",
                      items: [
                        { label: "average()", link: "/reference/toolkit/statistical-and-regression-analysis/stats_agg-one-variable/average" },
                        { label: "kurtosis()", link: "/reference/toolkit/statistical-and-regression-analysis/stats_agg-one-variable/kurtosis" },
                        { label: "num_vals()", link: "/reference/toolkit/statistical-and-regression-analysis/stats_agg-one-variable/num_vals" },
                        { label: "rolling()", link: "/reference/toolkit/statistical-and-regression-analysis/stats_agg-one-variable/rolling" },
                        { label: "rollup()", link: "/reference/toolkit/statistical-and-regression-analysis/stats_agg-one-variable/rollup" },
                        { label: "skewness()", link: "/reference/toolkit/statistical-and-regression-analysis/stats_agg-one-variable/skewness" },
                        { label: "stats_agg() (one variable)", link: "/reference/toolkit/statistical-and-regression-analysis/stats_agg-one-variable/stats_agg" },
                        { label: "stddev()", link: "/reference/toolkit/statistical-and-regression-analysis/stats_agg-one-variable/stddev" },
                        { label: "sum()", link: "/reference/toolkit/statistical-and-regression-analysis/stats_agg-one-variable/sum" },
                        { label: "variance()", link: "/reference/toolkit/statistical-and-regression-analysis/stats_agg-one-variable/variance" },
                      ],
                    },
                    {
                      label: "Two variables",
                      items: [
                        { label: "average_y() | average_x()", link: "/reference/toolkit/statistical-and-regression-analysis/stats_agg-two-variables/average_y_x" },
                        { label: "corr()", link: "/reference/toolkit/statistical-and-regression-analysis/stats_agg-two-variables/corr" },
                        { label: "covariance()", link: "/reference/toolkit/statistical-and-regression-analysis/stats_agg-two-variables/covariance" },
                        { label: "determination_coeff()", link: "/reference/toolkit/statistical-and-regression-analysis/stats_agg-two-variables/determination_coeff" },
                        { label: "intercept()", link: "/reference/toolkit/statistical-and-regression-analysis/stats_agg-two-variables/intercept" },
                        { label: "kurtosis_y() | kurtosis_x()", link: "/reference/toolkit/statistical-and-regression-analysis/stats_agg-two-variables/kurtosis_y_x" },
                        { label: "num_vals()", link: "/reference/toolkit/statistical-and-regression-analysis/stats_agg-two-variables/num_vals" },
                        { label: "rolling()", link: "/reference/toolkit/statistical-and-regression-analysis/stats_agg-two-variables/rolling" },
                        { label: "rollup()", link: "/reference/toolkit/statistical-and-regression-analysis/stats_agg-two-variables/rollup" },
                        { label: "skewness_y() | skewness_x()", link: "/reference/toolkit/statistical-and-regression-analysis/stats_agg-two-variables/skewness_y_x" },
                        { label: "slope()", link: "/reference/toolkit/statistical-and-regression-analysis/stats_agg-two-variables/slope" },
                        { label: "stats_agg() (two variables)", link: "/reference/toolkit/statistical-and-regression-analysis/stats_agg-two-variables/stats_agg" },
                        { label: "stddev_y() | stddev_x()", link: "/reference/toolkit/statistical-and-regression-analysis/stats_agg-two-variables/stddev_y_x" },
                        { label: "sum_y() | sum_x()", link: "/reference/toolkit/statistical-and-regression-analysis/stats_agg-two-variables/sum_y_x" },
                        { label: "variance_y() | variance_x()", link: "/reference/toolkit/statistical-and-regression-analysis/stats_agg-two-variables/variance_y_x" },
                        { label: "x_intercept()", link: "/reference/toolkit/statistical-and-regression-analysis/stats_agg-two-variables/x_intercept" },
                      ],
                    },
                  ],
                },
                {
                  label: "Minimum and maximum",
                  collapsed: true,
                  items: [
                    { label: "Overview", link: "/reference/toolkit/minimum-and-maximum" },
                    {
                      label: "Minimum values",
                      items: [
                        { label: "into_array()", link: "/reference/toolkit/minimum-and-maximum/min_n/into_array" },
                        { label: "into_values()", link: "/reference/toolkit/minimum-and-maximum/min_n/into_values" },
                        { label: "min_n()", link: "/reference/toolkit/minimum-and-maximum/min_n/min_n" },
                        { label: "rollup()", link: "/reference/toolkit/minimum-and-maximum/min_n/rollup" },
                      ],
                    },
                    {
                      label: "Maximum values",
                      items: [
                        { label: "into_array()", link: "/reference/toolkit/minimum-and-maximum/max_n/into_array" },
                        { label: "into_values()", link: "/reference/toolkit/minimum-and-maximum/max_n/into_values" },
                        { label: "max_n()", link: "/reference/toolkit/minimum-and-maximum/max_n/max_n" },
                        { label: "rollup()", link: "/reference/toolkit/minimum-and-maximum/max_n/rollup" },
                      ],
                    },
                    {
                      label: "Minimum values by",
                      items: [
                        { label: "into_values()", link: "/reference/toolkit/minimum-and-maximum/min_n_by/into_values" },
                        { label: "min_n_by()", link: "/reference/toolkit/minimum-and-maximum/min_n_by/min_n_by" },
                        { label: "rollup()", link: "/reference/toolkit/minimum-and-maximum/min_n_by/rollup" },
                      ],
                    },
                    {
                      label: "Maximum values by",
                      items: [
                        { label: "into_values()", link: "/reference/toolkit/minimum-and-maximum/max_n_by/into_values" },
                        { label: "max_n_by()", link: "/reference/toolkit/minimum-and-maximum/max_n_by/max_n_by" },
                        { label: "rollup()", link: "/reference/toolkit/minimum-and-maximum/max_n_by/rollup" },
                      ],
                    },
                  ],
                },
                {
                  label: "Financial analysis",
                  collapsed: true,
                  items: [
                    { label: "candlestick()", link: "/reference/toolkit/candlestick_agg/candlestick" },
                    { label: "candlestick_agg()", link: "/reference/toolkit/candlestick_agg/candlestick_agg" },
                    { label: "close()", link: "/reference/toolkit/candlestick_agg/close" },
                    { label: "close_time()", link: "/reference/toolkit/candlestick_agg/close_time" },
                    { label: "high()", link: "/reference/toolkit/candlestick_agg/high" },
                    { label: "high_time()", link: "/reference/toolkit/candlestick_agg/high_time" },
                    { label: "low()", link: "/reference/toolkit/candlestick_agg/low" },
                    { label: "low_time()", link: "/reference/toolkit/candlestick_agg/low_time" },
                    { label: "open()", link: "/reference/toolkit/candlestick_agg/open" },
                    { label: "open_time()", link: "/reference/toolkit/candlestick_agg/open_time" },
                    { label: "rollup()", link: "/reference/toolkit/candlestick_agg/rollup" },
                    { label: "volume()", link: "/reference/toolkit/candlestick_agg/volume" },
                    { label: "vwap()", link: "/reference/toolkit/candlestick_agg/vwap" },
                  ],
                },
                {
                  label: "Percentile approximation",
                  collapsed: true,
                  items: [
                    { label: "Overview", link: "/reference/toolkit/percentile-approximation" },
                    {
                      label: "UddSketch",
                      items: [
                        { label: "approx_percentile()", link: "/reference/toolkit/percentile-approximation/uddsketch/approx_percentile" },
                        { label: "approx_percentile_array()", link: "/reference/toolkit/percentile-approximation/uddsketch/approx_percentile_array" },
                        { label: "approx_percentile_rank()", link: "/reference/toolkit/percentile-approximation/uddsketch/approx_percentile_rank" },
                        { label: "error()", link: "/reference/toolkit/percentile-approximation/uddsketch/error" },
                        { label: "mean()", link: "/reference/toolkit/percentile-approximation/uddsketch/mean" },
                        { label: "num_vals()", link: "/reference/toolkit/percentile-approximation/uddsketch/num_vals" },
                        { label: "percentile_agg()", link: "/reference/toolkit/percentile-approximation/uddsketch/percentile_agg" },
                        { label: "rollup()", link: "/reference/toolkit/percentile-approximation/uddsketch/rollup" },
                        { label: "uddsketch()", link: "/reference/toolkit/percentile-approximation/uddsketch/uddsketch" },
                      ],
                    },
                    {
                      label: "t-digest",
                      items: [
                        { label: "approx_percentile()", link: "/reference/toolkit/percentile-approximation/tdigest/approx_percentile" },
                        { label: "approx_percentile_rank()", link: "/reference/toolkit/percentile-approximation/tdigest/approx_percentile_rank" },
                        { label: "max_val()", link: "/reference/toolkit/percentile-approximation/tdigest/max_val" },
                        { label: "mean()", link: "/reference/toolkit/percentile-approximation/tdigest/mean" },
                        { label: "min_val()", link: "/reference/toolkit/percentile-approximation/tdigest/min_val" },
                        { label: "num_vals()", link: "/reference/toolkit/percentile-approximation/tdigest/num_vals" },
                        { label: "rollup()", link: "/reference/toolkit/percentile-approximation/tdigest/rollup" },
                        { label: "tdigest()", link: "/reference/toolkit/percentile-approximation/tdigest/tdigest" },
                      ],
                    },
                  ],
                },
                {
                  label: "Counters and gauges",
                  collapsed: true,
                  items: [
                    { label: "Overview", link: "/reference/toolkit/counters-and-gauges" },
                    {
                      label: "Counter aggregation",
                      items: [
                        { label: "corr()", link: "/reference/toolkit/counters-and-gauges/counter_agg/corr" },
                        { label: "counter_agg()", link: "/reference/toolkit/counters-and-gauges/counter_agg/counter_agg" },
                        { label: "counter_zero_time()", link: "/reference/toolkit/counters-and-gauges/counter_agg/counter_zero_time" },
                        { label: "delta()", link: "/reference/toolkit/counters-and-gauges/counter_agg/delta" },
                        { label: "extrapolated_delta()", link: "/reference/toolkit/counters-and-gauges/counter_agg/extrapolated_delta" },
                        { label: "extrapolated_rate()", link: "/reference/toolkit/counters-and-gauges/counter_agg/extrapolated_rate" },
                        { label: "first_time()", link: "/reference/toolkit/counters-and-gauges/counter_agg/first_time" },
                        { label: "first_val()", link: "/reference/toolkit/counters-and-gauges/counter_agg/first_val" },
                        { label: "idelta_left()", link: "/reference/toolkit/counters-and-gauges/counter_agg/idelta_left" },
                        { label: "idelta_right()", link: "/reference/toolkit/counters-and-gauges/counter_agg/idelta_right" },
                        { label: "intercept()", link: "/reference/toolkit/counters-and-gauges/counter_agg/intercept" },
                        { label: "interpolated_delta()", link: "/reference/toolkit/counters-and-gauges/counter_agg/interpolated_delta" },
                        { label: "interpolated_rate()", link: "/reference/toolkit/counters-and-gauges/counter_agg/interpolated_rate" },
                        { label: "irate_left()", link: "/reference/toolkit/counters-and-gauges/counter_agg/irate_left" },
                        { label: "irate_right()", link: "/reference/toolkit/counters-and-gauges/counter_agg/irate_right" },
                        { label: "last_time()", link: "/reference/toolkit/counters-and-gauges/counter_agg/last_time" },
                        { label: "last_val()", link: "/reference/toolkit/counters-and-gauges/counter_agg/last_val" },
                        { label: "num_changes()", link: "/reference/toolkit/counters-and-gauges/counter_agg/num_changes" },
                        { label: "num_elements()", link: "/reference/toolkit/counters-and-gauges/counter_agg/num_elements" },
                        { label: "num_resets()", link: "/reference/toolkit/counters-and-gauges/counter_agg/num_resets" },
                        { label: "rate()", link: "/reference/toolkit/counters-and-gauges/counter_agg/rate" },
                        { label: "rollup()", link: "/reference/toolkit/counters-and-gauges/counter_agg/rollup" },
                        { label: "slope()", link: "/reference/toolkit/counters-and-gauges/counter_agg/slope" },
                        { label: "time_delta()", link: "/reference/toolkit/counters-and-gauges/counter_agg/time_delta" },
                        { label: "with_bounds()", link: "/reference/toolkit/counters-and-gauges/counter_agg/with_bounds" },
                      ],
                    },
                    {
                      label: "Gauge aggregation",
                      items: [
                        { label: "corr()", link: "/reference/toolkit/counters-and-gauges/gauge_agg/corr" },
                        { label: "delta()", link: "/reference/toolkit/counters-and-gauges/gauge_agg/delta" },
                        { label: "extrapolated_delta()", link: "/reference/toolkit/counters-and-gauges/gauge_agg/extrapolated_delta" },
                        { label: "extrapolated_rate()", link: "/reference/toolkit/counters-and-gauges/gauge_agg/extrapolated_rate" },
                        { label: "gauge_agg()", link: "/reference/toolkit/counters-and-gauges/gauge_agg/gauge_agg" },
                        { label: "gauge_zero_time()", link: "/reference/toolkit/counters-and-gauges/gauge_agg/gauge_zero_time" },
                        { label: "idelta_left()", link: "/reference/toolkit/counters-and-gauges/gauge_agg/idelta_left" },
                        { label: "idelta_right()", link: "/reference/toolkit/counters-and-gauges/gauge_agg/idelta_right" },
                        { label: "intercept()", link: "/reference/toolkit/counters-and-gauges/gauge_agg/intercept" },
                        { label: "interpolated_delta()", link: "/reference/toolkit/counters-and-gauges/gauge_agg/interpolated_delta" },
                        { label: "interpolated_rate()", link: "/reference/toolkit/counters-and-gauges/gauge_agg/interpolated_rate" },
                        { label: "irate_left()", link: "/reference/toolkit/counters-and-gauges/gauge_agg/irate_left" },
                        { label: "irate_right()", link: "/reference/toolkit/counters-and-gauges/gauge_agg/irate_right" },
                        { label: "num_changes()", link: "/reference/toolkit/counters-and-gauges/gauge_agg/num_changes" },
                        { label: "num_elements()", link: "/reference/toolkit/counters-and-gauges/gauge_agg/num_elements" },
                        { label: "rate()", link: "/reference/toolkit/counters-and-gauges/gauge_agg/rate" },
                        { label: "rollup()", link: "/reference/toolkit/counters-and-gauges/gauge_agg/rollup" },
                        { label: "slope()", link: "/reference/toolkit/counters-and-gauges/gauge_agg/slope" },
                        { label: "time_delta()", link: "/reference/toolkit/counters-and-gauges/gauge_agg/time_delta" },
                        { label: "with_bounds()", link: "/reference/toolkit/counters-and-gauges/gauge_agg/with_bounds" },
                      ],
                    },
                  ],
                },
                {
                  label: "Time-weighted calculations",
                  collapsed: true,
                  items: [
                    { label: "average()", link: "/reference/toolkit/time_weight/average" },
                    { label: "first_time()", link: "/reference/toolkit/time_weight/first_time" },
                    { label: "first_val()", link: "/reference/toolkit/time_weight/first_val" },
                    { label: "integral()", link: "/reference/toolkit/time_weight/integral" },
                    { label: "interpolated_average()", link: "/reference/toolkit/time_weight/interpolated_average" },
                    { label: "interpolated_integral()", link: "/reference/toolkit/time_weight/interpolated_integral" },
                    { label: "last_time()", link: "/reference/toolkit/time_weight/last_time" },
                    { label: "last_val()", link: "/reference/toolkit/time_weight/last_val" },
                    { label: "rollup()", link: "/reference/toolkit/time_weight/rollup" },
                    { label: "time_weight()", link: "/reference/toolkit/time_weight/time_weight" },
                  ],
                },
                {
                  label: "Downsampling",
                  collapsed: true,
                  items: [
                    { label: "asap_smooth()", link: "/reference/toolkit/downsampling/asap_smooth" },
                    { label: "gp_lttb()", link: "/reference/toolkit/downsampling/gp_lttb" },
                    { label: "lttb()", link: "/reference/toolkit/downsampling/lttb" },
                  ],
                },
                {
                  label: "Timevector",
                  collapsed: true,
                  items: [
                    { label: "rollup()", link: "/reference/toolkit/timevector/rollup" },
                    { label: "timevector()", link: "/reference/toolkit/timevector/timevector" },
                    { label: "unnest()", link: "/reference/toolkit/timevector/unnest" },
                  ],
                },
                {
                  label: "Frequency analysis",
                  collapsed: true,
                  items: [
                    { label: "Overview", link: "/reference/toolkit/frequency-analysis" },
                    {
                      label: "Frequency aggregation",
                      items: [
                        { label: "freq_agg()", link: "/reference/toolkit/frequency-analysis/freq_agg/freq_agg" },
                        { label: "into_values()", link: "/reference/toolkit/frequency-analysis/freq_agg/into_values" },
                        { label: "max_frequency()", link: "/reference/toolkit/frequency-analysis/freq_agg/max_frequency" },
                        { label: "mcv_agg()", link: "/reference/toolkit/frequency-analysis/freq_agg/mcv_agg" },
                        { label: "min_frequency()", link: "/reference/toolkit/frequency-analysis/freq_agg/min_frequency" },
                        { label: "rollup()", link: "/reference/toolkit/frequency-analysis/freq_agg/rollup" },
                        { label: "topn()", link: "/reference/toolkit/frequency-analysis/freq_agg/topn" },
                      ],
                    },
                    {
                      label: "Count-min sketch",
                      items: [
                        { label: "approx_count()", link: "/reference/toolkit/frequency-analysis/count_min_sketch/approx_count" },
                        { label: "count_min_sketch()", link: "/reference/toolkit/frequency-analysis/count_min_sketch/count_min_sketch" },
                      ],
                    },
                  ],
                },
                {
                  label: "State tracking",
                  collapsed: true,
                  items: [
                    { label: "Overview", link: "/reference/toolkit/state-tracking" },
                    {
                      label: "Compact state aggregation",
                      items: [
                        { label: "compact_state_agg()", link: "/reference/toolkit/state-tracking/compact_state_agg/compact_state_agg" },
                        { label: "duration_in()", link: "/reference/toolkit/state-tracking/compact_state_agg/duration_in" },
                        { label: "interpolated_duration_in()", link: "/reference/toolkit/state-tracking/compact_state_agg/interpolated_duration_in" },
                        { label: "into_values()", link: "/reference/toolkit/state-tracking/compact_state_agg/into_values" },
                        { label: "rollup()", link: "/reference/toolkit/state-tracking/compact_state_agg/rollup" },
                      ],
                    },
                    {
                      label: "State aggregation",
                      items: [
                        { label: "duration_in()", link: "/reference/toolkit/state-tracking/state_agg/duration_in" },
                        { label: "interpolated_duration_in()", link: "/reference/toolkit/state-tracking/state_agg/interpolated_duration_in" },
                        { label: "interpolated_state_periods()", link: "/reference/toolkit/state-tracking/state_agg/interpolated_state_periods" },
                        { label: "interpolated_state_timeline()", link: "/reference/toolkit/state-tracking/state_agg/interpolated_state_timeline" },
                        { label: "into_values()", link: "/reference/toolkit/state-tracking/state_agg/into_values" },
                        { label: "rollup()", link: "/reference/toolkit/state-tracking/state_agg/rollup" },
                        { label: "state_agg()", link: "/reference/toolkit/state-tracking/state_agg/state_agg" },
                        { label: "state_at()", link: "/reference/toolkit/state-tracking/state_agg/state_at" },
                        { label: "state_periods()", link: "/reference/toolkit/state-tracking/state_agg/state_periods" },
                        { label: "state_timeline()", link: "/reference/toolkit/state-tracking/state_agg/state_timeline" },
                      ],
                    },
                    {
                      label: "Heartbeat aggregation",
                      items: [
                        { label: "dead_ranges()", link: "/reference/toolkit/state-tracking/heartbeat_agg/dead_ranges" },
                        { label: "downtime()", link: "/reference/toolkit/state-tracking/heartbeat_agg/downtime" },
                        { label: "heartbeat_agg()", link: "/reference/toolkit/state-tracking/heartbeat_agg/heartbeat_agg" },
                        { label: "interpolate()", link: "/reference/toolkit/state-tracking/heartbeat_agg/interpolate" },
                        { label: "interpolated_downtime()", link: "/reference/toolkit/state-tracking/heartbeat_agg/interpolated_downtime" },
                        { label: "interpolated_uptime()", link: "/reference/toolkit/state-tracking/heartbeat_agg/interpolated_uptime" },
                        { label: "live_at()", link: "/reference/toolkit/state-tracking/heartbeat_agg/live_at" },
                        { label: "live_ranges()", link: "/reference/toolkit/state-tracking/heartbeat_agg/live_ranges" },
                        { label: "num_gaps()", link: "/reference/toolkit/state-tracking/heartbeat_agg/num_gaps" },
                        { label: "num_live_ranges()", link: "/reference/toolkit/state-tracking/heartbeat_agg/num_live_ranges" },
                        { label: "rollup()", link: "/reference/toolkit/state-tracking/heartbeat_agg/rollup" },
                        { label: "trim_to()", link: "/reference/toolkit/state-tracking/heartbeat_agg/trim_to" },
                        { label: "uptime()", link: "/reference/toolkit/state-tracking/heartbeat_agg/uptime" },
                      ],
                    },
                  ],
                },
                {
                  label: "Saturating math",
                  collapsed: true,
                  items: [
                    { label: "saturating_add()", link: "/reference/toolkit/saturating-math/saturating_add" },
                    { label: "saturating_add_pos()", link: "/reference/toolkit/saturating-math/saturating_add_pos" },
                    { label: "saturating_mul()", link: "/reference/toolkit/saturating-math/saturating_mul" },
                    { label: "saturating_sub()", link: "/reference/toolkit/saturating-math/saturating_sub" },
                    { label: "saturating_sub_pos()", link: "/reference/toolkit/saturating-math/saturating_sub_pos" },
                  ],
                },
              ],
            },
            DOCS_LOCAL_WITHOUT_STAINLESS
              ? {
                  label: "Tiger Cloud REST API",
                  collapsed: false,
                  items: [
                    {
                      label: "Local preview (generated API disabled)",
                      link: "/reference/tiger-cloud-rest-local-preview",
                    },
                  ],
                }
              : {
                  label: "Tiger Cloud REST API",
                  collapsed: false,
                  items: generateAPIReferenceItems({
                    excludeResourceOverviewPages: true,
                  }),
                },
          ],
        },
      ],
    }), ...(process.env.SENTRY_DSN
      ? [sentry({
          dsn: process.env.SENTRY_DSN,
        })]
      : [])],

    redirects: withBase({
      ...(DOCS_LOCAL_WITHOUT_STAINLESS
        ? {
            "/reference/tiger-cloud-rest": "/reference/tiger-cloud-rest-local-preview",
            "/reference/tiger-cloud-rest/": "/reference/tiger-cloud-rest-local-preview",
          }
        : {}),
      "/api": "/reference/tiger-cloud-rest",
      "/api/api-reference": "/reference/tiger-cloud-rest",
      "/api-reference/timescaledb-toolkit": "/reference/toolkit",
      "/api-reference/timescaledb": "/reference/timescaledb",
      "/api-reference": "/reference",
      // Get-started reorganization (Solution 2): preserve old URLs
      "/get-started/quickstart-5-minutes": "/get-started/quickstart/quickstart-5-minutes",
      "/get-started/create-service": "/get-started/quickstart/create-service",
      "/get-started/connect-your-app": "/get-started/quickstart/connect-your-app",
      "/get-started/next-steps": "/get-started/quickstart/next-steps",
      "/get-started/create-mst-service": "/deploy/mst/create-mst-service",
      "/get-started/install-timescaledb": "/get-started/choose-your-path/install-timescaledb",
      "/get-started/supported-platforms": "/get-started/choose-your-path/supported-platforms",
      "/get-started/timescaledb-editions": "/get-started/choose-your-path/timescaledb-editions",
      "/get-started/cli-rest-api": "/get-started/quickstart/cli-rest-api",
      "/get-started/tools/cli-rest-api": "/get-started/quickstart/cli-rest-api",
      "/get-started/mcp-cli": "/get-started/quickstart/mcp-cli",
      "/get-started/tools/mcp-cli": "/get-started/quickstart/mcp-cli",
      "/get-started/key-features-timescale": "/learn/tiger-cloud/tiger-cloud-essentials",
      "/get-started/tools/key-features-timescale": "/learn/tiger-cloud/tiger-cloud-essentials",
      "/get-started/new": "/get-started/news/new",
      "/get-started/release-notes": "/get-started/news/release-notes",
      // Self-hosted install lived under deploy/ in older IA; content is under Get started now.
      "/deploy/self-hosted/install-and-update": "/get-started/choose-your-path/install-timescaledb",
      "/deploy/self-hosted/install-and-update/install-self-hosted":
        "/get-started/choose-your-path/install-timescaledb",
      // Content moved from Learn → Build (same pages; old URLs redirect)
      "/learn/examples": "/build/examples",
      "/learn/examples/": "/build/examples/",
      "/learn/examples/simulate-iot-sensor-data": "/build/examples/simulate-iot-sensor-data",
      "/learn/examples/analyze-financial-tick-data": "/build/examples/analyze-financial-tick-data",
      "/learn/examples/ingest-real-time-financial-data": "/build/examples/ingest-real-time-financial-data",
      "/learn/examples/analyze-blockchain": "/build/examples/analyze-blockchain",
      "/learn/examples/analyze-energy-consumption": "/build/examples/analyze-energy-consumption",
      "/learn/examples/analyze-transport-data": "/build/examples/analyze-transport-data",
      "/learn/examples/aggregate-organizational-data-with-ai": "/build/examples/aggregate-organizational-data-with-ai",
      "/learn/examples/aggregate-organizational-data-with-ai/": "/build/examples/aggregate-organizational-data-with-ai/",
      "/learn/examples/cookbook": "/build/examples/cookbook",
      "/learn/examples/create-services-with-terraform": "/build/examples/create-services-with-terraform",
      "/learn/examples/00-template-tutorial-render": "/build/examples/",
      "/learn/examples/aggregate-organizational-data-with-ai-2": "/build/examples/aggregate-organizational-data-with-ai",
      "/learn/production-patterns": "/build/",
      "/learn/production-patterns/": "/build/",
      "/build/production-patterns": "/build/",
      "/build/production-patterns/": "/build/",
      // Tiger Cloud operational guide (moved out of Learn → Search)
      "/learn/search/vectorizer-deprecation": "/deploy/tiger-cloud/vectorizer-deprecation",
      "/learn/search/vectorizer-deprecation/": "/deploy/tiger-cloud/vectorizer-deprecation/",
      "/learn/fundamentals/your-first-hypertable": "/build/how-to/your-first-hypertable",
      "/learn/fundamentals/basic-compression": "/build/how-to/basic-compression",
      // Learn IA: /learn/hypertables/*, /learn/chunks/*, /learn/capabilities-and-comparison/*. Keep legacy URLs working.
      "/learn/fundamentals": "/learn/",
      "/learn/fundamentals/": "/learn/",
      "/learn/fundamentals/understand-hypertables": "/learn/hypertables/understand-hypertables",
      "/learn/fundamentals/understanding-chunks": "/learn/chunks/understanding-chunks",
      "/learn/fundamentals/understand-capabilities":
        "/learn/capabilities-and-comparison/understand-capabilities",
      "/learn/fundamentals/optimize-data-in-hypertables": "/learn/hypertables/optimize-data-in-hypertables",
      "/learn/fundamentals/design-your-data-model": "/learn/data-model/design-your-data-model",
      "/learn/fundamentals/querying-time-series-data": "/learn/hypertables/understand-hypertables",
      "/learn/fundamentals/tiger-cloud-feature-comparison":
        "/get-started/feature-comparison",
      "/learn/concepts": "/learn",
      "/learn/concepts/": "/learn/",
      "/learn/topics": "/learn",
      "/learn/topics/": "/learn/",
      "/learn/concepts/understand-hypertables": "/learn/hypertables/understand-hypertables",
      "/learn/concepts/optimize-data-in-hypertables": "/learn/hypertables/optimize-data-in-hypertables",
      "/learn/hypertables/hypertable-operations": "/learn/hypertables/optimize-data-in-hypertables",
      "/learn/concepts/design-your-data-model": "/learn/data-model/design-your-data-model",
      "/learn/hypertables/design-your-data-model": "/learn/data-model/design-your-data-model",
      "/learn/concepts/querying-time-series-data": "/learn/hypertables/understand-hypertables",
      "/learn/hypertables/querying-time-series-data": "/learn/hypertables/understand-hypertables",
      "/learn/concepts/understanding-chunks": "/learn/chunks/understanding-chunks",
      "/learn/concepts/understand-capabilities":
        "/learn/capabilities-and-comparison/understand-capabilities",
      "/learn/concepts/tiger-cloud-feature-comparison":
        "/get-started/feature-comparison",
      "/learn/overview/understand-capabilities":
        "/learn/capabilities-and-comparison/understand-capabilities",
      "/learn/overview/understand-capabilities/":
        "/learn/capabilities-and-comparison/understand-capabilities/",
      "/learn/overview/tiger-cloud-feature-comparison":
        "/get-started/feature-comparison",
      "/learn/overview/tiger-cloud-feature-comparison/":
        "/learn/capabilities-and-comparison/tiger-cloud-feature-comparison/",
      "/learn/about-tiger-data/understand-capabilities":
        "/learn/capabilities-and-comparison/understand-capabilities",
      "/learn/about-tiger-data/understand-capabilities/":
        "/learn/capabilities-and-comparison/understand-capabilities/",
      "/learn/about-tiger-data/tiger-cloud-feature-comparison":
        "/get-started/feature-comparison",
      "/learn/about-tiger-data/tiger-cloud-feature-comparison/":
        "/learn/capabilities-and-comparison/tiger-cloud-feature-comparison/",
      // Conceptual docs canonical under /learn/; old /build/ URLs redirect (bookmarks, external links)
      "/build/data-management/time-buckets/about-time-buckets":
        "/learn/data-management/time-buckets/about-time-buckets",
      "/build/data-management/time-buckets/about-time-buckets/":
        "/learn/data-management/time-buckets/about-time-buckets/",
      "/build/data-management/time-buckets/use-time-buckets":
        "/learn/data-management/time-buckets/use-time-buckets",
      "/build/data-management/time-buckets/use-time-buckets/":
        "/learn/data-management/time-buckets/use-time-buckets/",
      "/build/data-management/about-jobs": "/build/data-management/about-automation",
      "/build/data-management/jobs": "/build/data-management/about-automation",
      "/build/data-management/jobs/": "/build/data-management/about-automation",
      "/build/data-management/jobs/create-and-manage-jobs": "/build/data-management/create-and-manage-jobs",
      "/build/data-management/jobs/example-downsample-and-compress": "/build/data-management/example-downsample-and-compress",
      "/build/data-management/jobs/example-generic-retention": "/build/data-management/example-generic-retention",
      "/build/data-management/jobs/example-tiered-storage": "/build/data-management/example-tiered-storage",
      "/build/data-management/data-retention": "/learn/data-management/data-retention/about-data-retention",
      "/learn/data-management/data-retention": "/learn/data-management/data-retention/about-data-retention",
      "/build/data-management/data-retention/": "/learn/data-management/data-retention/",
      "/build/data-management/data-retention/about-data-retention":
        "/learn/data-management/data-retention/about-data-retention",
      "/build/data-management/data-retention/about-data-retention/":
        "/learn/data-management/data-retention/about-data-retention/",
      "/build/data-management/data-retention/manually-drop-chunks":
        "/learn/data-management/data-retention/manually-drop-chunks",
      "/build/data-management/data-retention/manually-drop-chunks/":
        "/learn/data-management/data-retention/manually-drop-chunks/",
      "/build/data-management/data-retention/data-retention-with-continuous-aggregates":
        "/learn/data-management/data-retention/data-retention-with-continuous-aggregates",
      "/build/data-management/data-retention/data-retention-with-continuous-aggregates/":
        "/learn/data-management/data-retention/data-retention-with-continuous-aggregates/",
      "/build/data-management/storage": "/learn/data-management/storage/about-storage-tiers",
      "/learn/data-management/storage": "/learn/data-management/storage/about-storage-tiers",
      "/build/data-management/storage/": "/learn/data-management/storage/",
      "/build/data-management/storage/about-storage-tiers":
        "/learn/data-management/storage/about-storage-tiers",
      "/build/data-management/storage/about-storage-tiers/":
        "/learn/data-management/storage/about-storage-tiers/",
      "/build/columnar-storage": "/learn/columnar-storage/understand-hypercore",
      "/build/columnar-storage/": "/learn/columnar-storage/understand-hypercore/",
      "/build/columnar-storage/understand-hypercore": "/learn/columnar-storage/understand-hypercore",
      "/build/columnar-storage/understand-hypercore/": "/learn/columnar-storage/understand-hypercore/",
      "/build/columnar-storage/compression-methods": "/learn/columnar-storage/compression-methods",
      "/build/columnar-storage/compression-methods/": "/learn/columnar-storage/compression-methods/",
      "/build/continuous-aggregates": "/learn/continuous-aggregates",
      "/build/continuous-aggregates/": "/learn/continuous-aggregates/",
      "/build/continuous-aggregates/about-continuous-aggregates":
        "/learn/continuous-aggregates",
      "/build/continuous-aggregates/about-continuous-aggregates/":
        "/learn/continuous-aggregates/",
      "/learn/continuous-aggregates/about-continuous-aggregates":
        "/learn/continuous-aggregates",
      "/learn/continuous-aggregates/about-continuous-aggregates/":
        "/learn/continuous-aggregates/",
      "/build/continuous-aggregates/time-and-continuous-aggregates":
        "/learn/continuous-aggregates/time-and-continuous-aggregates",
      "/build/continuous-aggregates/time-and-continuous-aggregates/":
        "/learn/continuous-aggregates/time-and-continuous-aggregates/",
      "/build/continuous-aggregates/hierarchical-continuous-aggregates":
        "/learn/continuous-aggregates/hierarchical-continuous-aggregates",
      "/build/continuous-aggregates/hierarchical-continuous-aggregates/":
        "/learn/continuous-aggregates/hierarchical-continuous-aggregates/",
      "/build/continuous-aggregates/materialized-hypertables":
        "/learn/continuous-aggregates/materialized-hypertables",
      "/build/continuous-aggregates/materialized-hypertables/":
        "/learn/continuous-aggregates/materialized-hypertables/",
      "/learn/performance-optimization/improve-hypertable-performance":
        "/build/performance-optimization/improve-hypertable-performance",
      "/learn/performance-optimization/improve-hypertable-performance/":
        "/build/performance-optimization/improve-hypertable-performance/",
      "/learn/performance-optimization/hypertables-and-unique-indexes":
        "/build/performance-optimization/hypertables-and-unique-indexes",
      "/learn/performance-optimization/hypertables-and-unique-indexes/":
        "/build/performance-optimization/hypertables-and-unique-indexes/",
      // Old Timescale docs used /migrate/latest/* — redirect to current paths
      "/migrate/latest": "/migrate",
      "/migrate/latest/": "/migrate/",
      "/migrate/latest/pg-dump-and-restore": "/migrate/migrate-with-downtime",
      "/migrate/latest/pg-dump-and-restore/": "/migrate/migrate-with-downtime/",
      "/migrate/latest/troubleshooting": "/migrate/troubleshooting",
      "/migrate/latest/troubleshooting/": "/migrate/troubleshooting/",
      "/migrate/latest/live-migration": "/migrate/live-migration",
      "/migrate/latest/live-migration/": "/migrate/live-migration/",
      "/migrate/latest/livesync-for-postgresql": "/migrate/livesync-for-postgresql",
      "/migrate/latest/livesync-for-postgresql/": "/migrate/livesync-for-postgresql/",
      "/migrate/latest/livesync-for-s3": "/migrate/livesync-for-s3",
      "/migrate/latest/livesync-for-s3/": "/migrate/livesync-for-s3/",
      "/migrate/latest/livesync-for-kafka": "/migrate/livesync-for-kafka",
      "/migrate/latest/livesync-for-kafka/": "/migrate/livesync-for-kafka/",
      "/migrate/latest/dual-write-and-backfill": "/migrate/dual-write-and-backfill",
      "/migrate/latest/dual-write-and-backfill/": "/migrate/dual-write-and-backfill/",
      "/migrate/latest/timescaledb-backfill": "/migrate/dual-write-and-backfill/timescaledb-backfill",
      "/migrate/latest/timescaledb-backfill/": "/migrate/dual-write-and-backfill/timescaledb-backfill/",
      // Tiger Cloud overview removed; send old URL to AWS service management entry
      "/deploy/tiger-cloud": "/deploy/tiger-cloud/tiger-cloud-aws/service-management",
      "/deploy/tiger-cloud/": "/deploy/tiger-cloud/tiger-cloud-aws/service-management/",
    }),
});