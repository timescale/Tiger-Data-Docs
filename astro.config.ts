import { createRequire } from "node:module";
import { defineConfig } from "astro/config";
import { generateAPIReferenceItems, stainlessDocs } from "@stainless-api/docs";
import aiChat from "@stainless-api/docs-ai-chat/plugin";

const require = createRequire(import.meta.url);

// Only load when running link checks (e.g. pnpm run lint:links); avoids requiring the package for dev/build.
const starlightLinksValidator = process.env.CHECK_LINKS
  ? require("starlight-links-validator").default
  : null;

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

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [vite7CompatPlugin()],
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
                { label: "3. Your first hypertable", link: "/learn/fundamentals/your-first-hypertable" },
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
                { label: "Your first hypertable", link: "/learn/fundamentals/your-first-hypertable" },
                { label: "Basic compression", link: "/learn/fundamentals/basic-compression" },
              ],
            },
            {
              label: "News & updates",
              collapsed: true,
              autogenerate: { directory: "get-started/news" },
            },
            {
              label: "Contribute to the docs",
              link: "/get-started/contributing",
            },
          ],
        },
        // Learn tab
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
                { label: "Understand capabilities", link: "/learn/fundamentals/understand-capabilities" },
                { label: "Compare Tiger Data product features", link: "/learn/fundamentals/tiger-cloud-feature-comparison" },
              ],
            },
            {
              label: "Concepts",
              collapsed: true,
              items: [
                { label: "Understanding chunks", link: "/learn/fundamentals/understanding-chunks" },
                { label: "Optimize time-series data in hypertables", link: "/learn/fundamentals/optimize-data-in-hypertables" },
                { label: "Querying time-series data", link: "/learn/fundamentals/querying-time-series-data" },
                { label: "Design your data model", link: "/learn/fundamentals/design-your-data-model" },
              ],
            },
            {
              label: "Hands-on",
              collapsed: true,
              items: [
                { label: "Your first hypertable", link: "/learn/fundamentals/your-first-hypertable" },
                { label: "Basic compression", link: "/learn/fundamentals/basic-compression" },
              ],
            },
            {
              label: "Tutorials",
              collapsed: true,
              items: [
                { label: "Aggregate organizational data with AI agents", link: "/learn/examples/aggregate-organizational-data-with-ai/" },
                { label: "Create Tiger Cloud services with Terraform", link: "/learn/examples/create-services-with-terraform" },
                { label: "Template tutorial (preview)", link: "/learn/examples/00-template-tutorial-render" },
              ],
            },
            {
              label: "Guided projects",
              collapsed: true,
              items: [
                { label: "Tiger Data cookbook", link: "/learn/examples/cookbook" },
                { label: "Simulate an IoT sensor dataset", link: "/learn/examples/simulate-iot-sensor-data" },
                { label: "Analyze financial tick data", link: "/learn/examples/analyze-financial-tick-data" },
                { label: "Ingest real-time financial data", link: "/learn/examples/ingest-real-time-financial-data" },
                { label: "Analyze transport and geospatial data", link: "/learn/examples/analyze-transport-data" },
                { label: "Analyze Bitcoin blockchain", link: "/learn/examples/analyze-blockchain" },
                { label: "Analyze energy consumption", link: "/learn/examples/analyze-energy-consumption" },
              ],
            },
            {
              label: "Production patterns",
              collapsed: true,
              items: [
                { label: "Production patterns overview", link: "/learn/production-patterns" },
              ],
            },
            {
              label: "Glossary",
              link: "/learn/glossary",
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
              link: "/build",
            },
            {
              label: "Manage my time-series data",
              collapsed: true,
              items: [
                { label: "Overview", link: "/build/data-management" },
                { label: "Understand hypertables", link: "/build/data-management/understand-hypertables" },
                { label: "Time-Series / Hypertables", link: "/build/data-management/time-series-hypertables" },
                { label: "Understand hyperfunctions", link: "/build/data-management/understand-hyperfunctions" },
                { label: "Aggregate data by time interval", link: "/build/data-management/time-buckets" },
                { label: "Create and manage jobs", link: "/build/data-management/create-and-manage-jobs" },
                { label: "Operations", link: "/build/data-management/operations" },
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
                { label: "About compression", link: "/build/columnar-storage/about-compression" },
                { label: "Setup hypercore", link: "/build/columnar-storage/setup-hypercore" },
                { label: "Compression methods in hypercore", link: "/build/columnar-storage/compression-methods" },
                { label: "Designing your database for compression", link: "/build/columnar-storage/compression-design" },
                { label: "Create a compression policy", link: "/build/columnar-storage/compression-policy" },
                { label: "Improve query and upsert performance", link: "/build/columnar-storage/secondary-indexes" },
                { label: "Manual compression", link: "/build/columnar-storage/manual-compression" },
                { label: "Decompression", link: "/build/columnar-storage/decompress-chunks" },
                { label: "Inserting or modifying data in the columnstore", link: "/build/columnar-storage/modify-compressed-data" },
                { label: "Schema modifications", link: "/build/columnar-storage/modify-a-schema" },
                { label: "Data retention", link: "/build/columnar-storage/data-retention" },
                { label: "Compress a continuous aggregate", link: "/build/columnar-storage/compression-on-continuous-aggregates" },
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
                { label: "Troubleshoot TimescaleDB", link: "/build/tips-and-tricks/troubleshooting" },
                { label: "Troubleshoot continuous aggregates", link: "/build/tips-and-tricks/troubleshoot-continuous-aggregates" },
                { label: "Troubleshoot hypertables", link: "/build/tips-and-tricks/troubleshoot-hypertables" },
                { label: "Troubleshoot import and ingest", link: "/build/tips-and-tricks/troubleshoot-import-ingest" },
                { label: "Troubleshoot hypercore", link: "/build/tips-and-tricks/troubleshoot-hypercore" },
                { label: "Troubleshoot schema management", link: "/build/tips-and-tricks/troubleshoot-schema-management" },
                { label: "Troubleshoot query data", link: "/build/tips-and-tricks/troubleshoot-query-data" },
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
              link: "/migrate",
            },
            {
              label: "Import & migration methods",
              collapsed: false,
              items: [
                { label: "Sync from Postgres", link: "/migrate/livesync-for-postgresql" },
                { label: "Sync from S3", link: "/migrate/livesync-for-s3" },
                { label: "Upload a file (Console)", link: "/migrate/import-console" },
                { label: "Upload a file (terminal)", link: "/migrate/import-terminal" },
                { label: "Live migration", link: "/migrate/live-migration" },
                { label: "Migrate with downtime", link: "/migrate/migrate-with-downtime" },
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
        // Integrate tab — Sort by Category, Industry, Integration Type; Troubleshooting
        {
          label: "Integrate",
          link: "/integrate",
          sidebar: [
            {
              label: "Overview",
              link: "/integrate",
            },
            {
              label: "Find connection details",
              link: "/integrate/find-connection-details",
            },
            {
              label: "Sort by Category",
              collapsed: true,
              items: [
                { label: "Sort by Category", link: "/integrate/#integrate-categories-heading" },
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
            {
              label: "Sort by Industry",
              collapsed: true,
              items: [
                { label: "Sort by Industry", link: "/integrate/#by-industry" },
                { label: "Oil and Gas", link: "/integrate/#integrate-industry-oil-and-gas" },
                { label: "IoT", link: "/integrate/#integrate-industry-iot" },
                { label: "Energy", link: "/integrate/#integrate-industry-energy" },
                { label: "Crypto", link: "/integrate/#integrate-industry-crypto" },
                { label: "Healthcare", link: "/integrate/#integrate-industry-healthcare" },
                { label: "Manufacturing", link: "/integrate/#integrate-industry-manufacturing" },
              ],
            },
            {
              label: "Sort by Integration Type",
              collapsed: true,
              items: [
                { label: "Tiger Connectors", link: "/integrate/connectors" },
                { label: "Partner Integrations", link: "/integrate/#integrate-type-partner" },
                { label: "Third Party Integrations", link: "/integrate/#integrate-type-third-party" },
              ],
            },
            {
              label: "Troubleshooting",
              link: "/integrate/troubleshooting",
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
              link: "/deploy",
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
              link: "/reference",
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
                        "reference/timescaledb/hypertables/show_chunks",
                        "reference/timescaledb/hypertables/drop_chunks",
                        "reference/timescaledb/hypertables/move_chunk",
                        "reference/timescaledb/hypertables/reorder_chunk",
                        "reference/timescaledb/hypertables/merge_chunks",
                        "reference/timescaledb/hypertables/split_chunk",
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
                        "reference/timescaledb/informational-views/data_nodes",
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
                  autogenerate: { directory: "reference/toolkit/hyperloglog" },
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

  redirects: {
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
  },
});
