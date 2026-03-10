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

// https://astro.build/config
export default defineConfig({
  vite: {
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
          },
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
              label: "Feature comparison",
              link: "/get-started/feature-comparison",
            },
            {
              label: "Quickstart",
              autogenerate: { directory: "get-started" },
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
              link: "/learn",
            },
            {
              label: "Fundamentals",
              autogenerate: { directory: "learn/fundamentals" },
            },
            {
              label: "Deep Dive",
              collapsed: true,
              autogenerate: { directory: "learn/deep-dive" },
            },
            {
              label: "Examples",
              collapsed: true,
              autogenerate: { directory: "learn/examples" },
            },
            {
              label: "Production Patterns",
              collapsed: true,
              autogenerate: { directory: "learn/production-patterns" },
            },
            {
              label: "Glossary",
              collapsed: false,
              items: [
                { label: "All", link: "/learn/glossary" },
                { label: "TimescaleDB", link: "/learn/glossary?category=TimescaleDB" },
                { label: "Storage", link: "/learn/glossary?category=Storage" },
                { label: "Time-series", link: "/learn/glossary?category=Time-series" },
                { label: "Cloud", link: "/learn/glossary?category=Cloud" },
                { label: "Security", link: "/learn/glossary?category=Security" },
                { label: "Operations", link: "/learn/glossary?category=Operations" },
                { label: "Observability", link: "/learn/glossary?category=Observability" },
                { label: "AI & vectors", link: "/learn/glossary?category=AI%20%26%20vectors" },
                { label: "PostgreSQL", link: "/learn/glossary?category=PostgreSQL" },
                { label: "Data & migration", link: "/learn/glossary?category=Data%20%26%20migration" },
              ],
            },
          ],
        },
        // Build tab
        {
          label: "Build",
          link: "/build",
          sidebar: [
            {
              label: "Overview",
              link: "/build",
            },
            {
              label: "Data Management",
              collapsed: true,
              autogenerate: { directory: "build/data-management" },
            },
            {
              label: "Continuous Aggregates",
              collapsed: true,
              autogenerate: { directory: "build/continuous-aggregates" },
            },
            {
              label: "Columnar Storage",
              collapsed: true,
              autogenerate: { directory: "build/columnar-storage" },
            },
            {
              label: "Performance Optimization",
              collapsed: true,
              autogenerate: { directory: "build/performance-optimization" },
            },
            {
              label: "Cost Optimization",
              collapsed: true,
              autogenerate: { directory: "build/cost-optimization" },
            },
            {
              label: "Tips and Tricks",
              collapsed: true,
              autogenerate: { directory: "build/tips-and-tricks" },
            },
          ],
        },
        // Migrate tab
        {
          label: "Migrate",
          link: "/migrate",
          sidebar: [
            {
              label: "Overview",
              link: "/migrate",
            },
            {
              label: "Import Methods",
              autogenerate: { directory: "migrate" },
            },
            {
              label: "Migrate From",
              collapsed: true,
              autogenerate: { directory: "migrate/migrate-from" },
            },
          ],
        },
        // Integrate tab
        {
          label: "Integrate",
          link: "/integrate",
          sidebar: [
            {
              label: "Overview",
              link: "/integrate",
            },
            {
              label: "Data Engineering & ETL",
              collapsed: true,
              autogenerate: { directory: "integrate/data-engineering-etl" },
            },
            {
              label: "BI & Visualization",
              collapsed: true,
              autogenerate: { directory: "integrate/bi-vizualization" },
            },
            {
              label: "Data Ingestion & Streaming",
              collapsed: true,
              autogenerate: { directory: "integrate/data-ingestion-streaming" },
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
                { slug: "reference/timescaledb" },
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
              label: "Toolkit",
              collapsed: true,
              items: [
                { slug: "reference/toolkit" },
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
              label: "pgai",
              collapsed: true,
              autogenerate: { directory: "reference/pgai" },
            },
            {
              label: "pgvectorscale",
              collapsed: true,
              autogenerate: { directory: "reference/pgvectorscale" },
            },
            {
              label: "Tiger Cloud API",
              collapsed: true,
              autogenerate: { directory: "reference/tiger-cloud-api" },
            },
            {
              label: "Configuration",
              collapsed: true,
              autogenerate: { directory: "reference/configuration" },
            },
            {
              label: "Cloud API Reference",
              collapsed: true,
              items: generateAPIReferenceItems({
                excludeResourceOverviewPages: true,
              }),
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
              autogenerate: { directory: "deploy/tiger-cloud" },
            },
            {
              label: "Tiger Cloud on AWS",
              autogenerate: { directory: "deploy/tiger-cloud-AWS" },
            },
            {
              label: "Tiger Cloud on Azure",
              autogenerate: { directory: "deploy/tiger-cloud-azure" },
            },
            {
              label: "Self-Hosted",
              collapsed: true,
              autogenerate: { directory: "deploy/self-hosted" },
            },
            {
              label: "Managed Service (MST)",
              collapsed: true,
              autogenerate: { directory: "deploy/mst" },
            },
          ],
        },
      ],
    }),
  ],

  redirects: {
    "/api-reference/timescaledb-toolkit": "/reference/toolkit",
    "/api-reference/timescaledb": "/reference/timescaledb",
    "/api-reference": "/reference",
  },
});
