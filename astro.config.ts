import { defineConfig } from "astro/config";
import { generateAPIReferenceItems, stainlessDocs } from "@stainless-api/docs";
import aiChat from "@stainless-api/docs-ai-chat/plugin";

// https://astro.build/config
export default defineConfig({
  vite: {
    resolve: {
      alias: {
        "@components": new URL("./src/components", import.meta.url).pathname,
        "@constants": new URL("./src/constants.ts", import.meta.url).pathname,
      },
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
      social: [
        { icon: "github", label: "GitHub", href: "https://github.com/timescale/timescaledb" },
      ],
      experimental: {
        aiChat: aiChat(),
        starlightCompat: {
          components: {
            Header: "./src/components/Header.astro",
          },
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
              label: "Time-Series / Hypertables",
              autogenerate: { directory: "build/time-series" },
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
              label: "Tiered Storage",
              collapsed: true,
              autogenerate: { directory: "build/tiered-storage" },
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
              label: "Migration",
              collapsed: true,
              autogenerate: { directory: "build/migration" },
            },
            {
              label: "Operations",
              collapsed: true,
              autogenerate: { directory: "build/operations" },
            },
            {
              label: "Cookbooks",
              collapsed: true,
              autogenerate: { directory: "build/cookbooks" },
            },
            {
              label: "Troubleshooting",
              collapsed: true,
              autogenerate: { directory: "build/troubleshooting" },
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
              autogenerate: { directory: "reference/timescaledb" },
            },
            {
              label: "Toolkit",
              collapsed: true,
              autogenerate: { directory: "reference/toolkit" },
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
});
