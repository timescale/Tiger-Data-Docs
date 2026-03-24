import { createRequire } from "node:module";
import { defineConfig } from "astro/config";
import { generateAPIReferenceItems, stainlessDocs } from "@stainless-api/docs";
import aiChat from "@stainless-api/docs-ai-chat/plugin";
import rehypeBasePath from "./src/plugins/rehype-base-path";
import remarkResolveConstantsInHeadings from "./src/plugins/remark-resolve-constants-in-headings";

const require = createRequire(import.meta.url);

// Resolve package subpaths so aliasing the main "components" entry doesn't break ThemeSelect/SDKSelect.
const docsComponentsScriptsPath = require.resolve("@stainless-api/docs/components/scripts");

/**
 * Vite 7 compat: some plugins (e.g. from @stainless-api/docs built for Vite 6)
 * declare a `transform` (or other hook) as an object with a `filter` but no
 * `handler`, which crashes EnvironmentPluginContainer when it calls handler.call().
 *
 * We (1) mutate plugins in the sync `config` hook and (2) in `configResolved` replace
 * config.plugins with a new array of proxy-wrapped plugins. Any code that reads
 * plugin.transform/load/resolveId from that array gets a hook object with a
 * callable handler, even if the underlying config was cloned or used in a worker.
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

// Base path from env var (e.g. BASE_PATH="/docs"). Falls back to "/" (no subpath).
const BASE = process.env.BASE_PATH || "/";

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
    integrations: [
      stainlessDocs({
        apiReference: {
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
        customCss: ["./theme.css"],
        lastUpdated: true,
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
          aiChat: aiChat(),
          starlightCompat: {
            components: {
              Header: "./src/components/Header.astro",
              PageTitle: "./src/components/PageTitle.astro",
              Pagination: "./src/components/PageNavigation.astro",
              Callout: "./src/components/Callout.astro",
            } as Record<string, string>,
            plugins: starlightLinksValidator ? [starlightLinksValidator()] : [],
          },
        },
        tabs: [
          // Get Started tab
          {
            label: "Get Started",
            link: "/get-started",
            sidebar: [
              "get-started", // Welcome/index page
              {
                label: "Start here",
                collapsed: false,
                items: [
                  { label: "1. 5-minute quickstart", link: "/get-started/quickstart/quickstart-5-minutes" },
                  { label: "2. Connect your app", link: "/get-started/quickstart/connect-your-app" },
                  { label: "3. Your first hypertable", link: "/build/how-to/your-first-hypertable" },
                ],
              },
              {
                label: "Setup",
                collapsed: true,
                items: [
                  { label: "Choose your setup", link: "/get-started/feature-comparison" },
                  { label: "Tiger Cloud (recommended)", link: "/get-started/quickstart/create-service" },
                  { label: "Install self-hosted TimescaleDB", link: "/get-started/choose-your-path/install-timescaledb" },
                  { label: "Supported platforms", link: "/get-started/choose-your-path/supported-platforms" },
                  { label: "Compare TimescaleDB editions", link: "/get-started/choose-your-path/timescaledb-editions" },
                ],
              },
              {
                label: "Quickstart",
                collapsed: true,
                items: [
                  { label: "5-minute quickstart", link: "/get-started/quickstart/quickstart-5-minutes" },
                  { label: "Create a Tiger Cloud service", link: "/get-started/quickstart/create-service" },
                  { label: "Connect your app", link: "/get-started/quickstart/connect-your-app" },
                  { label: "Get started with the command line", link: "/get-started/quickstart/cli-rest-api" },
                  { label: "Integrate Tiger Cloud with your AI assistant", link: "/get-started/quickstart/mcp-cli" },
                ],
              },
              {
                label: "Hands-on",
                collapsed: true,
                items: [
                  { label: "Your first hypertable", link: "/build/how-to/your-first-hypertable" },
                  { label: "Basic compression", link: "/build/how-to/basic-compression" },
                ],
              },
              {
                label: "News & updates",
                collapsed: true,
                autogenerate: { directory: "get-started/news" },
              },
              {
                label: "Contribute to the docs",
                collapsed: true,
                items: [{ label: "How to contribute", link: "/get-started/contributing" }],
              },
            ],
          },
          // Learn tab — topic groups link to Learn + Build pages (most how-tos live under Build).
          // Learn sidebar: groups follow dependency order; within each group, items go surface → in-depth (overview/concept → setup → tuning → advanced/platform guides).
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
                label: "Capabilities and comparison",
                collapsed: true,
                items: [
                  { label: "Understand capabilities", link: "/learn/capabilities-and-comparison/understand-capabilities" },
                  { label: "Compare the features in Tiger Data products", link: "/learn/capabilities-and-comparison/tiger-cloud-feature-comparison" },
                ],
              },
              {
                label: "Data model",
                collapsed: true,
                items: [
                  { label: "Wide, narrow, and medium tables", link: "/learn/data-model/wide-narrow-medium-tables" },
                  {
                    label: "Primary keys, time columns, and uniqueness",
                    link: "/learn/data-model/primary-keys-time-and-uniqueness",
                  },
                  { label: "Design your data model", link: "/learn/hypertables/design-your-data-model" },
                ],
              },
              {
                label: "Hypertables",
                collapsed: true,
                items: [
                  { label: "Understand hypertables", link: "/learn/hypertables/understand-hypertables" },
                  { label: "Creating and configuring hypertables", link: "/learn/hypertables/creating-and-configuring-hypertables" },
                  { label: "Partitioning hypertables", link: "/learn/hypertables/partitioning-hypertables" },
                  { label: "Sizing hypertable chunks", link: "/learn/hypertables/sizing-hypertable-chunks" },
                  { label: "Hypertable indexes", link: "/learn/hypertables/hypertable-indexes" },
                  { label: "Querying time-series data", link: "/learn/hypertables/querying-time-series-data" },
                  { label: "Optimize time-series data in hypertables", link: "/learn/hypertables/optimize-data-in-hypertables" },
                  { label: "Hypertable operations", link: "/learn/hypertables/hypertable-operations" },
                  { label: "Improve hypertable performance", link: "/build/performance-optimization/improve-hypertable-performance" },
                  { label: "Hypertables and unique indexes", link: "/build/performance-optimization/hypertables-and-unique-indexes" },
                ],
              },
              {
                label: "Chunks",
                collapsed: true,
                items: [
                  { label: "Understanding chunks", link: "/learn/chunks/understanding-chunks" },
                  { label: "About time buckets", link: "/build/data-management/time-buckets/about-time-buckets" },
                  { label: "Use time buckets", link: "/build/data-management/time-buckets/use-time-buckets" },
                  { label: "Manually drop chunks", link: "/build/data-management/data-retention/manually-drop-chunks" },
                ],
              },
              {
                label: "Hypercore",
                collapsed: true,
                items: [
                  { label: "Columnar storage overview", link: "/build/columnar-storage" },
                  { label: "Understand Hypercore", link: "/build/columnar-storage/understand-hypercore" },
                  { label: "Compression methods", link: "/build/columnar-storage/compression-methods" },
                  { label: "Basic compression", link: "/build/how-to/basic-compression" },
                  { label: "Set up Hypercore", link: "/build/columnar-storage/setup-hypercore" },
                  { label: "Compression overview (Tiger Cloud)", link: "/learn/compression/overview" },
                  { label: "Compression configuration and testing (Tiger Cloud)", link: "/learn/compression/configuration-and-testing" },
                ],
              },
              {
                label: "CAGGs",
                collapsed: true,
                items: [
                  { label: "Continuous aggregates overview", link: "/build/continuous-aggregates" },
                  { label: "About continuous aggregates", link: "/build/continuous-aggregates/about-continuous-aggregates" },
                  { label: "Create a continuous aggregate", link: "/build/continuous-aggregates/create-a-continuous-aggregate" },
                  { label: "Refresh policies", link: "/build/continuous-aggregates/refresh-policies" },
                  { label: "Real-time aggregates", link: "/build/continuous-aggregates/real-time-aggregates" },
                  { label: "Time and continuous aggregates", link: "/build/continuous-aggregates/time-and-continuous-aggregates" },
                  { label: "Hierarchical continuous aggregates", link: "/build/continuous-aggregates/hierarchical-continuous-aggregates" },
                  { label: "Materialized hypertables", link: "/build/continuous-aggregates/materialized-hypertables" },
                  { label: "Continuous aggregates on Tiger Cloud", link: "/learn/continuous-aggregates/tiger-cloud-caggs" },
                  { label: "Compression with CAGGs and backfill (Tiger Cloud)", link: "/learn/compression/caggs-and-backfill" },
                ],
              },
              {
                label: "Backfills",
                collapsed: true,
                items: [
                  { label: "Refresh policies and backfill behavior", link: "/build/continuous-aggregates/refresh-policies" },
                  { label: "Real-time aggregates and historical refresh", link: "/build/continuous-aggregates/real-time-aggregates" },
                  { label: "TimescaleDB backfill migration tool", link: "/migrate/dual-write-and-backfill/timescaledb-backfill" },
                ],
              },
              {
                label: "Data retention",
                collapsed: true,
                items: [
                  { label: "Data retention overview", link: "/build/data-management/data-retention" },
                  { label: "About data retention", link: "/build/data-management/data-retention/about-data-retention" },
                  { label: "Data retention on Tiger Cloud", link: "/learn/data-lifecycle/data-retention-policies" },
                  { label: "Create a retention policy", link: "/build/data-management/data-retention/create-a-retention-policy" },
                  { label: "Data retention with continuous aggregates", link: "/build/data-management/data-retention/data-retention-with-continuous-aggregates" },
                ],
              },
              {
                label: "Data tiering",
                collapsed: true,
                items: [
                  { label: "Tiered storage overview", link: "/build/data-management/storage" },
                  { label: "About storage tiers", link: "/build/data-management/storage/about-storage-tiers" },
                  { label: "Tiered storage on Tiger Cloud", link: "/learn/data-lifecycle/tiered-storage" },
                  { label: "Manage storage", link: "/build/data-management/storage/manage-storage" },
                  { label: "Query tiered data", link: "/build/data-management/storage/query-tiered-data" },
                ],
              },
              {
                label: "Glossary",
                collapsed: true,
                items: [{ label: "Browse terms", link: "/learn/glossary" }],
              },
            ],
          },
          // Build tab — sidebar group labels match Build overview cards (“I want to…”)
          {
            label: "Build",
            link: "/build",
            sidebar: [
              {
                label: "Overview",
                collapsed: true,
                items: [{ label: "Overview", link: "/build" }],
              },
              {
                label: "Tutorials",
                collapsed: true,
                items: [
                  { label: "Aggregate organizational data with AI agents", link: "/build/examples/aggregate-organizational-data-with-ai/" },
                  { label: "Create Tiger Cloud services with Terraform", link: "/build/examples/create-services-with-terraform" },
                  { label: "Template tutorial (preview)", link: "/build/examples/00-template-tutorial-render" },
                ],
              },
              {
                label: "How-to guides",
                collapsed: true,
                items: [
                  { label: "Your first hypertable", link: "/build/how-to/your-first-hypertable" },
                  { label: "Basic compression", link: "/build/how-to/basic-compression" },
                ],
              },
              {
                label: "Examples",
                collapsed: true,
                items: [
                  { label: "Examples overview", link: "/build/examples" },
                  { label: "Tiger Data cookbook", link: "/build/examples/cookbook" },
                  { label: "Simulate an IoT sensor dataset", link: "/build/examples/simulate-iot-sensor-data" },
                  { label: "Analyze financial tick data", link: "/build/examples/analyze-financial-tick-data" },
                  { label: "Ingest real-time financial data", link: "/build/examples/ingest-real-time-financial-data" },
                  { label: "Analyze transport and geospatial data", link: "/build/examples/analyze-transport-data" },
                  { label: "Analyze Bitcoin blockchain", link: "/build/examples/analyze-blockchain" },
                  { label: "Analyze energy consumption", link: "/build/examples/analyze-energy-consumption" },
                ],
              },
              {
                label: "Production patterns",
                collapsed: true,
                items: [{ label: "Production patterns overview", link: "/build/production-patterns" }],
              },
              {
                label: "Manage my time-series data",
                collapsed: true,
                items: [
                  { label: "Overview", link: "/build/data-management" },
                  { label: "Understand hypertables", link: "/build/data-management/understand-hypertables" },
                  {
                    label: "Time Buckets",
                    collapsed: true,
                    items: [
                      { label: "About time buckets", link: "/build/data-management/time-buckets/about-time-buckets" },
                      { label: "Use time buckets", link: "/build/data-management/time-buckets/use-time-buckets" },
                    ],
                  },
                  {
                    label: "Write Data",
                    collapsed: true,
                    items: [
                      { label: "About writing data", link: "/build/data-management/write-data/about-writing-data" },
                      { label: "Insert data", link: "/build/data-management/write-data/insert" },
                      { label: "Update data", link: "/build/data-management/write-data/update" },
                      { label: "Upsert data", link: "/build/data-management/write-data/upsert" },
                      { label: "Delete data", link: "/build/data-management/write-data/delete" },
                    ],
                  },
                  { label: "Run your queries from Tiger Console", link: "/build/data-management/run-queries-from-tiger-console" },
                  {
                    label: "Query data",
                    collapsed: true,
                    items: [
                      { label: "About querying data", link: "/build/data-management/query-data/about-query-data" },
                      { label: "SELECT data", link: "/build/data-management/query-data/select" },
                      { label: "SkipScan for DISTINCT queries", link: "/build/data-management/query-data/skipscan" },
                      { label: "Advanced analytic queries", link: "/build/data-management/query-data/advanced-analytic-queries" },
                    ],
                  },
                  {
                    label: "Data Retention",
                    collapsed: true,
                    items: [
                      { label: "Overview", link: "/build/data-management/data-retention" },
                      { label: "About data retention", link: "/build/data-management/data-retention/about-data-retention" },
                      { label: "Create a retention policy", link: "/build/data-management/data-retention/create-a-retention-policy" },
                      { label: "Data retention with continuous aggregates", link: "/build/data-management/data-retention/data-retention-with-continuous-aggregates" },
                      { label: "Manually drop chunks", link: "/build/data-management/data-retention/manually-drop-chunks" },
                    ],
                  },
                  {
                    label: "Storage and Tiering",
                    collapsed: true,
                    items: [
                      { label: "Overview", link: "/build/data-management/storage" },
                      { label: "About storage tiers", link: "/build/data-management/storage/about-storage-tiers" },
                      { label: "Manage storage and tiering", link: "/build/data-management/storage/manage-storage" },
                      { label: "Query tiered data", link: "/build/data-management/storage/query-tiered-data" },
                      { label: "Replicas and forks with tiered data", link: "/build/data-management/storage/tiered-data-replicas-forks" },
                    ],
                  },
                  {
                    label: "Jobs",
                    collapsed: true,
                    items: [
                      { label: "Overview", link: "/build/data-management/jobs" },
                      { label: "Create and manage jobs", link: "/build/data-management/jobs/create-and-manage-jobs" },
                      { label: "Downsample and compress chunks", link: "/build/data-management/jobs/example-downsample-and-compress" },
                      { label: "Generic retention policy", link: "/build/data-management/jobs/example-generic-retention" },
                      { label: "Automatic tablespace management", link: "/build/data-management/jobs/example-tiered-storage" },
                    ],
                  },
                  {
                    label: "Hyperfunctions",
                    collapsed: true,
                    items: [
                      { label: "Overview", link: "/build/data-management/hyperfunctions" },
                      { label: "About hyperfunctions", link: "/build/data-management/hyperfunctions/about-hyperfunctions" },
                      { label: "Counter aggregation", link: "/build/data-management/hyperfunctions/counter-aggregation" },
                      { label: "Function pipelines", link: "/build/data-management/hyperfunctions/function-pipelines" },
                      {
                        label: "Gapfilling and interpolation",
                        collapsed: true,
                        items: [
                          { label: "Overview", link: "/build/data-management/hyperfunctions/gapfilling-interpolation" },
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
                          { label: "Overview", link: "/build/data-management/hyperfunctions/percentile-approx" },
                          { label: "Approximate percentiles", link: "/build/data-management/hyperfunctions/percentile-approx/approximate-percentile" },
                          { label: "Advanced aggregation methods", link: "/build/data-management/hyperfunctions/percentile-approx/advanced-agg" },
                        ],
                      },
                      { label: "Statistical aggregation", link: "/build/data-management/hyperfunctions/stats-aggs" },
                      { label: "Time-weighted averages", link: "/build/data-management/hyperfunctions/time-weighted-averages" },
                    ],
                  },
                ],
              },
              {
                label: "Keep pre-computed aggregations up to date",
                collapsed: true,
                items: [
                  { label: "Overview", link: "/build/continuous-aggregates" },
                  { label: "About continuous aggregates", link: "/build/continuous-aggregates/about-continuous-aggregates" },
                  { label: "Create a continuous aggregate", link: "/build/continuous-aggregates/create-a-continuous-aggregate" },
                  { label: "Real-time aggregates", link: "/build/continuous-aggregates/real-time-aggregates" },
                  { label: "Hierarchical continuous aggregates", link: "/build/continuous-aggregates/hierarchical-continuous-aggregates" },
                  { label: "Refresh continuous aggregates", link: "/build/continuous-aggregates/refresh-policies" },
                  { label: "Time and continuous aggregates", link: "/build/continuous-aggregates/time-and-continuous-aggregates" },
                  { label: "Create an index on a continuous aggregate", link: "/build/continuous-aggregates/create-index" },
                  { label: "Convert continuous aggregates to the columnstore", link: "/build/continuous-aggregates/compression-on-continuous-aggregates" },
                  { label: "Materialized hypertables", link: "/build/continuous-aggregates/materialized-hypertables" },
                  { label: "Drop data from continuous aggregates", link: "/build/continuous-aggregates/drop-data" },
                  { label: "Migrate a continuous aggregate to the new form", link: "/build/continuous-aggregates/migrate-to-new-form" },
                ],
              },
              {
                label: "Optimize storage and query speed",
                collapsed: true,
                items: [
                  { label: "Overview", link: "/build/columnar-storage" },
                  { label: "Understand hypercore", link: "/build/columnar-storage/understand-hypercore" },
                  { label: "Setup hypercore", link: "/build/columnar-storage/setup-hypercore" },
                  { label: "Compression methods in hypercore", link: "/build/columnar-storage/compression-methods" },
                ],
              },
              {
                label: "Make queries and schemas faster",
                collapsed: true,
                items: [
                  { label: "Overview", link: "/build/performance-optimization" },
                  { label: "Understand database schemas", link: "/build/performance-optimization/understand-database-schemas" },
                  { label: "Accelerate queries using indexes", link: "/build/performance-optimization/indexing" },
                  { label: "Alter and update table schemas", link: "/build/performance-optimization/alter-update-table-schema" },
                  { label: "Improve storage performance using tablespaces", link: "/build/performance-optimization/manage-tablespaces" },
                  { label: "Ensure data integrity with constraints", link: "/build/performance-optimization/ensure-data-integrity-with-constraints" },
                  { label: "Handle semi-structured data with JSON", link: "/build/performance-optimization/handle-semi-structured-data-with-json" },
                  { label: "Automate tasks with triggers", link: "/build/performance-optimization/automate-tasks-with-triggers" },
                  { label: "Improve hypertable and query performance", link: "/build/performance-optimization/improve-hypertable-performance" },
                  { label: "Enforce constraints with unique indexes", link: "/build/performance-optimization/hypertables-and-unique-indexes" },
                  { label: "Query external data sources with FDW", link: "/build/performance-optimization/query-external-data-sources-with-fdw" },
                  { label: "Improve query and upsert performance", link: "/build/performance-optimization/secondary-indexes" },
                ],
              },
              {
                label: "Lower storage and compute costs",
                collapsed: true,
                items: [
                  { label: "Overview", link: "/build/cost-optimization" },
                ],
              },
              {
                label: "Fix issues or follow recipes",
                collapsed: true,
                items: [
                  { label: "Overview", link: "/build/tips-and-tricks" },
                  { label: "Troubleshoot continuous aggregates", link: "/build/tips-and-tricks/troubleshoot-continuous-aggregates" },
                  { label: "Troubleshoot hypertables", link: "/build/tips-and-tricks/troubleshoot-hypertables" },
                  { label: "Troubleshoot import and ingest", link: "/build/tips-and-tricks/troubleshoot-import-ingest" },
                  { label: "Troubleshoot hypercore", link: "/build/tips-and-tricks/troubleshoot-hypercore" },
                  { label: "Troubleshoot schema management", link: "/build/tips-and-tricks/troubleshoot-schema-management" },
                  { label: "Troubleshoot query data", link: "/build/tips-and-tricks/troubleshoot-query-data" },
                  { label: "Troubleshoot time buckets", link: "/build/tips-and-tricks/troubleshoot-time-buckets" },
                ],
              },
            ],
          },
          // Migrate tab — logical order: overview → how to import/migrate → source-specific guides
          {
            label: "Migrate",
            link: "/migrate",
            sidebar: [
              {
                label: "Overview",
                collapsed: true,
                items: [{ label: "Overview", link: "/migrate" }],
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
                      { label: "Overview", link: "/migrate/dual-write-and-backfill" },
                      { label: "From TimescaleDB", link: "/migrate/dual-write-and-backfill/dual-write-from-timescaledb" },
                      { label: "From PostgreSQL", link: "/migrate/dual-write-and-backfill/dual-write-from-postgres" },
                      { label: "From other databases", link: "/migrate/dual-write-and-backfill/dual-write-from-other" },
                      { label: "timescaledb-backfill tool", link: "/migrate/dual-write-and-backfill/timescaledb-backfill" },
                    ],
                  },
                  { label: "FAQ and troubleshooting", link: "/migrate/troubleshooting" },
                ],
              },
              {
                label: "Migrate from a specific database",
                collapsed: true,
                items: [
                  { label: "Overview", link: "/migrate/migrate-from" },
                  { label: "From Postgres", link: "/migrate/migrate-from/postgres" },
                  { label: "From MongoDB", link: "/migrate/migrate-from/mongodb" },
                  { label: "From ClickHouse", link: "/migrate/migrate-from/clickhouse" },
                ],
              },
            ],
          },
          // Integrate tab — mirrors the 5 filter dimensions in IntegrateOverview
          {
            label: "Integrate",
            link: "/integrate",
            sidebar: [
              {
                label: "Overview",
                collapsed: true,
                items: [{ label: "Overview", link: "/integrate" }],
              },
              {
                label: "Find connection details",
                collapsed: true,
                items: [{ label: "Find connection details", link: "/integrate/find-connection-details" }],
              },
              // --- Type of Tool (matches integrationCategory) ---
              {
                label: "Type of Tool",
                collapsed: false,
                items: [
                  {
                    label: "Data Engineering & ETL",
                    collapsed: true,
                    autogenerate: { directory: "integrate/data-engineering-etl" },
                  },
                  {
                    label: "Data Ingestion & Streaming",
                    collapsed: true,
                    autogenerate: { directory: "integrate/data-ingestion-streaming" },
                  },
                  {
                    label: "BI & Visualization",
                    collapsed: true,
                    autogenerate: { directory: "integrate/bi-vizualization" },
                  },
                  {
                    label: "Connectors",
                    collapsed: true,
                    autogenerate: { directory: "integrate/connectors" },
                  },
                  {
                    label: "Code & Libraries",
                    collapsed: true,
                    autogenerate: { directory: "integrate/code" },
                  },
                  {
                    label: "Query & Administration",
                    collapsed: true,
                    autogenerate: { directory: "integrate/query-administration" },
                  },
                  {
                    label: "Secure Connectivity",
                    collapsed: true,
                    autogenerate: { directory: "integrate/secure-connectivity" },
                  },
                  {
                    label: "Observability & Alerting",
                    collapsed: true,
                    autogenerate: { directory: "integrate/observability-alerting" },
                  },
                  {
                    label: "Configuration & Deployment",
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
                  { label: "Oil and Gas", link: "/integrate/?industry=oil-and-gas" },
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
                label: "First Party/Third Party",
                collapsed: true,
                items: [
                  { label: "First Party", link: "/integrate/?party=first-party" },
                  { label: "Third Party", link: "/integrate/?party=third-party" },
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
                label: "Overview",
                collapsed: true,
                items: [{ label: "Overview", link: "/deploy" }],
              },
              {
                label: "Tiger Cloud",
                collapsed: true,
                items: [
                  {
                    label: "Tiger Cloud",
                    collapsed: true,
                    autogenerate: { directory: "deploy/tiger-cloud" },
                  },
                  {
                    label: "Tiger Cloud on AWS",
                    collapsed: true,
                    autogenerate: { directory: "deploy/tiger-cloud-AWS" },
                  },
                  {
                    label: "Tiger Cloud on Azure",
                    collapsed: true,
                    autogenerate: { directory: "deploy/tiger-cloud-azure" },
                  },
                ],
              },
              {
                label: "Self-Hosted",
                collapsed: true,
                items: [
                  { label: "Overview", link: "/deploy/self-hosted" },
                  {
                    label: "Configuration",
                    collapsed: true,
                    items: [
                      { label: "Overview", link: "/deploy/self-hosted/configuration" },
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
                      { label: "Overview", link: "/deploy/self-hosted/backup-and-restore" },
                      { label: "Logical backup", link: "/deploy/self-hosted/backup-and-restore/logical-backup" },
                      { label: "Physical backups", link: "/deploy/self-hosted/backup-and-restore/physical" },
                    ],
                  },
                  {
                    label: "Migrate to self-hosted TimescaleDB",
                    collapsed: true,
                    items: [
                      { label: "Overview", link: "/deploy/self-hosted/migration" },
                      { label: "Migrate entire database", link: "/deploy/self-hosted/migration/entire-database" },
                      { label: "Migrate schema then data", link: "/deploy/self-hosted/migration/schema-then-data" },
                      { label: "Migrate tables from the same database", link: "/deploy/self-hosted/migration/same-db" },
                      { label: "Migrate data from InfluxDB", link: "/deploy/self-hosted/migration/migrate-influxdb" },
                    ],
                  },
                  { label: "Manage storage using tablespaces", link: "/deploy/self-hosted/manage-storage" },
                  {
                    label: "Replication and High Availability",
                    collapsed: true,
                    items: [
                      { label: "Overview", link: "/deploy/self-hosted/replication-and-ha" },
                      { label: "About high availability", link: "/deploy/self-hosted/replication-and-ha/about-ha" },
                      { label: "Configure replication", link: "/deploy/self-hosted/replication-and-ha/configure-replication" },
                    ],
                  },
                  {
                    label: "Additional tooling",
                    collapsed: true,
                    items: [
                      { label: "Overview", link: "/deploy/self-hosted/tooling" },
                      { label: "TimescaleDB Tune", link: "/deploy/self-hosted/tooling/about-timescaledb-tune" },
                      { label: "Install and update TimescaleDB Toolkit", link: "/deploy/self-hosted/tooling/install-toolkit" },
                    ],
                  },
                  {
                    label: "Upgrade self-hosted TimescaleDB",
                    collapsed: true,
                    items: [
                      { label: "Overview", link: "/deploy/self-hosted/upgrades" },
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
                label: "Managed Service (MST)",
                collapsed: true,
                items: [
                  { label: "Overview", link: "/deploy/mst" },
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
                      { label: "Overview", link: "/deploy/mst/vpc-peering" },
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
                      { label: "Overview", link: "/deploy/mst/integrations" },
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
                  { label: "Aiven Client", link: "/deploy/mst/aiven-client" },
                  { label: "Migrate to MST", link: "/deploy/mst/migrate-to-mst" },
                  { label: "REST API", link: "/deploy/mst/restapi" },
                  { label: "Index issues", link: "/deploy/mst/identify-index-issues" },
                  { label: "Troubleshooting", link: "/deploy/mst/troubleshooting" },
                ],
              },
            ],
          },
          // Reference tab
          {
            label: "Reference",
            link: "/reference",
            sidebar: [
              {
                label: "Overview",
                collapsed: true,
                items: [{ label: "Overview", link: "/reference" }],
              },
              {
                label: "TimescaleDB",
                collapsed: true,
                items: [
                  { label: "Overview", link: "/reference/timescaledb" },
                  {
                    label: "Hypertables and chunks",
                    collapsed: true,
                    items: [
                      { slug: "reference/timescaledb/hypertables" },
                      {
                        label: "Table creation",
                        items: [
                          "reference/timescaledb/hypertables/create_table",
                          "reference/timescaledb/hypertables/create_hypertable",
                          "reference/timescaledb/hypertables/create_index",
                          "reference/timescaledb/hypertables/create_hypertable_old",
                        ],
                      },
                      {
                        label: "Chunk management",
                        items: [
                          "reference/timescaledb/hypertables/create_chunk",
                          "reference/timescaledb/hypertables/show_chunks",
                          "reference/timescaledb/hypertables/drop_chunk",
                          "reference/timescaledb/hypertables/drop_chunks",
                          "reference/timescaledb/hypertables/move_chunk",
                          "reference/timescaledb/hypertables/reorder_chunk",
                          "reference/timescaledb/hypertables/merge_chunks",
                          "reference/timescaledb/hypertables/merge_chunks_concurrently",
                          "reference/timescaledb/hypertables/split_chunk",
                          "reference/timescaledb/hypertables/chunk_rewrite_cleanup",
                          "reference/timescaledb/hypertables/attach_chunk",
                          "reference/timescaledb/hypertables/detach_chunk",
                          "reference/timescaledb/hypertables/set_chunk_time_interval",
                          "reference/timescaledb/hypertables/set_integer_now_func",
                          "reference/timescaledb/hypertables/add_dimension",
                          "reference/timescaledb/hypertables/add_dimension_old",
                        ],
                      },
                      {
                        label: "Size and statistics",
                        items: [
                          "reference/timescaledb/hypertables/hypertable_size",
                          "reference/timescaledb/hypertables/hypertable_detailed_size",
                          "reference/timescaledb/hypertables/hypertable_index_size",
                          "reference/timescaledb/hypertables/hypertable_approximate_size",
                          "reference/timescaledb/hypertables/hypertable_approximate_detailed_size",
                          "reference/timescaledb/hypertables/chunks_detailed_size",
                        ],
                      },
                      {
                        label: "Tablespace management",
                        items: [
                          "reference/timescaledb/hypertables/attach_tablespace",
                          "reference/timescaledb/hypertables/detach_tablespace",
                          "reference/timescaledb/hypertables/detach_tablespaces",
                          "reference/timescaledb/hypertables/show_tablespaces",
                        ],
                      },
                      {
                        label: "Reordering and policies",
                        items: [
                          "reference/timescaledb/hypertables/add_reorder_policy",
                          "reference/timescaledb/hypertables/remove_reorder_policy",
                        ],
                      },
                      {
                        label: "Query optimization",
                        items: [
                          "reference/timescaledb/hypertables/enable_chunk_skipping",
                          "reference/timescaledb/hypertables/disable_chunk_skipping",
                        ],
                      },
                    ],
                  },
                  {
                    label: "Hypercore",
                    collapsed: true,
                    items: [
                      { slug: "reference/timescaledb/hypercore" },
                      {
                        label: "Policies",
                        items: [
                          "reference/timescaledb/hypercore/add_columnstore_policy",
                          "reference/timescaledb/hypercore/remove_columnstore_policy",
                        ],
                      },
                      {
                        label: "Manual conversion",
                        items: [
                          "reference/timescaledb/hypercore/alter_table",
                          "reference/timescaledb/hypercore/convert_to_columnstore",
                          "reference/timescaledb/hypercore/convert_to_rowstore",
                        ],
                      },
                      {
                        label: "Statistics and information",
                        items: [
                          "reference/timescaledb/hypercore/chunk_columnstore_stats",
                          "reference/timescaledb/hypercore/hypertable_columnstore_stats",
                          "reference/timescaledb/hypercore/chunk_columnstore_settings",
                          "reference/timescaledb/hypercore/hypertable_columnstore_settings",
                        ],
                      },
                    ],
                  },
                  {
                    label: "Continuous aggregates",
                    collapsed: true,
                    items: [
                      { slug: "reference/timescaledb/continuous-aggregates" },
                      {
                        label: "Create and modify CAGGs",
                        items: [
                          "reference/timescaledb/continuous-aggregates/create_materialized_view",
                          "reference/timescaledb/continuous-aggregates/alter_materialized_view",
                          "reference/timescaledb/continuous-aggregates/drop_materialized_view",
                          "reference/timescaledb/continuous-aggregates/cagg_migrate",
                          "reference/timescaledb/continuous-aggregates/refresh_continuous_aggregate",
                        ],
                      },
                      {
                        label: "Manage policies",
                        items: [
                          "reference/timescaledb/continuous-aggregates/add_continuous_aggregate_policy",
                          "reference/timescaledb/continuous-aggregates/remove_continuous_aggregate_policy",
                        ],
                      },
                      {
                        label: "Experimental policy management",
                        items: [
                          "reference/timescaledb/continuous-aggregates/add_policies",
                          "reference/timescaledb/continuous-aggregates/alter_policies",
                          "reference/timescaledb/continuous-aggregates/remove_policies",
                          "reference/timescaledb/continuous-aggregates/remove_all_policies",
                          "reference/timescaledb/continuous-aggregates/show_policies",
                        ],
                      },
                    ],
                  },
                  {
                    label: "Hyperfunctions",
                    collapsed: true,
                    items: [
                      { slug: "reference/timescaledb/hyperfunctions" },
                      {
                        label: "Time series utilities",
                        autogenerate: { directory: "reference/timescaledb/hyperfunctions/time-series-utilities" },
                      },
                      {
                        label: "Distribution analysis",
                        autogenerate: { directory: "reference/timescaledb/hyperfunctions/distribution-analysis" },
                      },
                      {
                        label: "Gapfilling",
                        autogenerate: { directory: "reference/timescaledb/hyperfunctions/time_bucket_gapfill" },
                      },
                    ],
                  },
                  {
                    label: "Data retention",
                    collapsed: true,
                    autogenerate: { directory: "reference/timescaledb/data-retention" },
                  },
                  {
                    label: "Jobs and automation",
                    collapsed: true,
                    autogenerate: { directory: "reference/timescaledb/jobs-automation" },
                  },
                  {
                    label: "UUIDv7 functions",
                    collapsed: true,
                    autogenerate: { directory: "reference/timescaledb/uuid-functions" },
                  },
                  {
                    label: "Informational views",
                    collapsed: true,
                    items: [
                      { slug: "reference/timescaledb/informational-views" },
                      {
                        label: "Hypertable and chunk information",
                        items: [
                          "reference/timescaledb/informational-views/chunks",
                          "reference/timescaledb/informational-views/dimensions",
                          "reference/timescaledb/informational-views/hypertables",
                          "reference/timescaledb/informational-views/continuous_aggregates",
                        ],
                      },
                      {
                        label: "Compression information",
                        items: [
                          "reference/timescaledb/informational-views/chunk_compression_settings",
                          "reference/timescaledb/informational-views/compression_settings",
                          "reference/timescaledb/informational-views/hypertable_compression_settings",
                        ],
                      },
                      {
                        label: "Jobs and policies",
                        items: [
                          "reference/timescaledb/informational-views/job_errors",
                          "reference/timescaledb/informational-views/job_history",
                          "reference/timescaledb/informational-views/job_stats",
                          "reference/timescaledb/informational-views/jobs",
                          "reference/timescaledb/informational-views/policies",
                        ],
                      },
                    ],
                  },
                  {
                    label: "Configuration",
                    collapsed: true,
                    autogenerate: { directory: "reference/timescaledb/configuration" },
                  },
                  {
                    label: "Administration",
                    collapsed: true,
                    autogenerate: { directory: "reference/timescaledb/administration" },
                  },
                  "reference/timescaledb/tag-overview",
                ],
              },
              {
                label: "TimescaleDB Toolkit",
                collapsed: true,
                items: [
                  { label: "Overview", link: "/reference/toolkit" },
                  {
                    label: "Approximate count distinct",
                    collapsed: true,
                    autogenerate: { directory: "reference/toolkit/approximate-count-distinct" },
                  },
                  {
                    label: "Statistical and regression analysis",
                    collapsed: true,
                    items: [
                      { slug: "reference/toolkit/statistical-and-regression-analysis" },
                      {
                        label: "One variable",
                        autogenerate: { directory: "reference/toolkit/statistical-and-regression-analysis/stats_agg-one-variable" },
                      },
                      {
                        label: "Two variables",
                        autogenerate: { directory: "reference/toolkit/statistical-and-regression-analysis/stats_agg-two-variables" },
                      },
                    ],
                  },
                  {
                    label: "Minimum and maximum",
                    collapsed: true,
                    items: [
                      { slug: "reference/toolkit/minimum-and-maximum" },
                      {
                        label: "Minimum values",
                        autogenerate: { directory: "reference/toolkit/minimum-and-maximum/min_n" },
                      },
                      {
                        label: "Maximum values",
                        autogenerate: { directory: "reference/toolkit/minimum-and-maximum/max_n" },
                      },
                      {
                        label: "Minimum values by",
                        autogenerate: { directory: "reference/toolkit/minimum-and-maximum/min_n_by" },
                      },
                      {
                        label: "Maximum values by",
                        autogenerate: { directory: "reference/toolkit/minimum-and-maximum/max_n_by" },
                      },
                    ],
                  },
                  {
                    label: "Financial analysis",
                    collapsed: true,
                    autogenerate: { directory: "reference/toolkit/candlestick_agg" },
                  },
                  {
                    label: "Percentile approximation",
                    collapsed: true,
                    items: [
                      { slug: "reference/toolkit/percentile-approximation" },
                      {
                        label: "UddSketch",
                        autogenerate: { directory: "reference/toolkit/percentile-approximation/uddsketch" },
                      },
                      {
                        label: "t-digest",
                        autogenerate: { directory: "reference/toolkit/percentile-approximation/tdigest" },
                      },
                    ],
                  },
                  {
                    label: "Counters and gauges",
                    collapsed: true,
                    items: [
                      { slug: "reference/toolkit/counters-and-gauges" },
                      {
                        label: "Counter aggregation",
                        autogenerate: { directory: "reference/toolkit/counters-and-gauges/counter_agg" },
                      },
                      {
                        label: "Gauge aggregation",
                        autogenerate: { directory: "reference/toolkit/counters-and-gauges/gauge_agg" },
                      },
                    ],
                  },
                  {
                    label: "Time-weighted calculations",
                    collapsed: true,
                    autogenerate: { directory: "reference/toolkit/time_weight" },
                  },
                  {
                    label: "Downsampling",
                    collapsed: true,
                    autogenerate: { directory: "reference/toolkit/downsampling" },
                  },
                  {
                    label: "Timevector",
                    collapsed: true,
                    autogenerate: { directory: "reference/toolkit/timevector" },
                  },
                  {
                    label: "Frequency analysis",
                    collapsed: true,
                    items: [
                      { slug: "reference/toolkit/frequency-analysis" },
                      {
                        label: "Frequency aggregation",
                        autogenerate: { directory: "reference/toolkit/frequency-analysis/freq_agg" },
                      },
                      {
                        label: "Count-min sketch",
                        autogenerate: { directory: "reference/toolkit/frequency-analysis/count_min_sketch" },
                      },
                    ],
                  },
                  {
                    label: "State tracking",
                    collapsed: true,
                    items: [
                      { slug: "reference/toolkit/state-tracking" },
                      {
                        label: "Compact state aggregation",
                        autogenerate: { directory: "reference/toolkit/state-tracking/compact_state_agg" },
                      },
                      {
                        label: "State aggregation",
                        autogenerate: { directory: "reference/toolkit/state-tracking/state_agg" },
                      },
                      {
                        label: "Heartbeat aggregation",
                        autogenerate: { directory: "reference/toolkit/state-tracking/heartbeat_agg" },
                      },
                    ],
                  },
                  {
                    label: "Saturating math",
                    collapsed: true,
                    autogenerate: { directory: "reference/toolkit/saturating-math" },
                  },
                ],
              },
              {
                label: "Tiger Cloud REST API",
                collapsed: true,
                items: generateAPIReferenceItems({
                  excludeResourceOverviewPages: true,
                }),
              },
            ],
          },
        ],
      }),
    ],

    redirects: withBase({
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
      "/get-started/create-mst-service": "/get-started/choose-your-path/create-mst-service",
      "/get-started/install-timescaledb": "/get-started/choose-your-path/install-timescaledb",
      "/get-started/supported-platforms": "/get-started/choose-your-path/supported-platforms",
      "/get-started/timescaledb-editions": "/get-started/choose-your-path/timescaledb-editions",
      "/get-started/cli-rest-api": "/get-started/quickstart/cli-rest-api",
      "/get-started/tools/cli-rest-api": "/get-started/quickstart/cli-rest-api",
      "/get-started/mcp-cli": "/get-started/quickstart/mcp-cli",
      "/get-started/tools/mcp-cli": "/get-started/quickstart/mcp-cli",
      "/get-started/key-features-timescale": "/get-started/tools/key-features-timescale",
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
      "/learn/examples/00-template-tutorial-render": "/build/examples/00-template-tutorial-render",
      "/learn/examples/aggregate-organizational-data-with-ai-2": "/build/examples/aggregate-organizational-data-with-ai-2",
      "/learn/production-patterns": "/build/production-patterns",
      "/learn/production-patterns/": "/build/production-patterns/",
      "/learn/fundamentals/your-first-hypertable": "/build/how-to/your-first-hypertable",
      "/learn/fundamentals/basic-compression": "/build/how-to/basic-compression",
      // Learn IA: /learn/hypertables/*, /learn/chunks/*, /learn/capabilities-and-comparison/* — keep legacy URLs working
      "/learn/fundamentals": "/learn/",
      "/learn/fundamentals/": "/learn/",
      "/learn/fundamentals/understand-hypertables": "/learn/hypertables/understand-hypertables",
      "/learn/fundamentals/understanding-chunks": "/learn/chunks/understanding-chunks",
      "/learn/fundamentals/understand-capabilities":
        "/learn/capabilities-and-comparison/understand-capabilities",
      "/learn/fundamentals/optimize-data-in-hypertables": "/learn/hypertables/optimize-data-in-hypertables",
      "/learn/fundamentals/design-your-data-model": "/learn/hypertables/design-your-data-model",
      "/learn/fundamentals/querying-time-series-data": "/learn/hypertables/querying-time-series-data",
      "/learn/fundamentals/tiger-cloud-feature-comparison":
        "/learn/capabilities-and-comparison/tiger-cloud-feature-comparison",
      "/learn/concepts": "/learn",
      "/learn/concepts/": "/learn/",
      "/learn/topics": "/learn",
      "/learn/topics/": "/learn/",
      "/learn/concepts/understand-hypertables": "/learn/hypertables/understand-hypertables",
      "/learn/concepts/optimize-data-in-hypertables": "/learn/hypertables/optimize-data-in-hypertables",
      "/learn/concepts/design-your-data-model": "/learn/hypertables/design-your-data-model",
      "/learn/concepts/querying-time-series-data": "/learn/hypertables/querying-time-series-data",
      "/learn/concepts/understanding-chunks": "/learn/chunks/understanding-chunks",
      "/learn/concepts/understand-capabilities":
        "/learn/capabilities-and-comparison/understand-capabilities",
      "/learn/concepts/tiger-cloud-feature-comparison":
        "/learn/capabilities-and-comparison/tiger-cloud-feature-comparison",
      "/learn/overview/understand-capabilities":
        "/learn/capabilities-and-comparison/understand-capabilities",
      "/learn/overview/understand-capabilities/":
        "/learn/capabilities-and-comparison/understand-capabilities/",
      "/learn/overview/tiger-cloud-feature-comparison":
        "/learn/capabilities-and-comparison/tiger-cloud-feature-comparison",
      "/learn/overview/tiger-cloud-feature-comparison/":
        "/learn/capabilities-and-comparison/tiger-cloud-feature-comparison/",
      "/learn/about-tiger-data/understand-capabilities":
        "/learn/capabilities-and-comparison/understand-capabilities",
      "/learn/about-tiger-data/understand-capabilities/":
        "/learn/capabilities-and-comparison/understand-capabilities/",
      "/learn/about-tiger-data/tiger-cloud-feature-comparison":
        "/learn/capabilities-and-comparison/tiger-cloud-feature-comparison",
      "/learn/about-tiger-data/tiger-cloud-feature-comparison/":
        "/learn/capabilities-and-comparison/tiger-cloud-feature-comparison/",
    }),
});
