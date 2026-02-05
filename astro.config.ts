import { defineConfig } from "astro/config";
import { generateAPIReferenceItems, stainlessDocs } from "@stainless-api/docs";
import aiChat from "@stainless-api/docs-ai-chat/plugin";

// https://astro.build/config
export default defineConfig({
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
            link: "/",
          },
        ],
      },
      experimental: {
        aiChat: aiChat(),
      },
      tabs: [
        {
          label: "Guides",
          link: "/",
          sidebar: [
            "",
            {
              label: "Getting started",
              autogenerate: { directory: "getting-started" },
            },
            {
              label: "Manage Data",
              collapsed: true,
              autogenerate: { directory: "manage-data" },
            },
            {
              label: "Integrations",
              collapsed: true,
              autogenerate: { directory: "integrations" },
            },
            {
              label: "Tutorials",
              collapsed: true,
              autogenerate: { directory: "tutorials" },
            },
          ],
        },
        {
          label: "Deploy & Operate",
          link: "/deploy-and-operate/choose-deployment-type",
          sidebar: [
            {
              label: "Overview",
              link: "/deploy-and-operate/choose-deployment-type",
            },
            {
              label: "Tiger Cloud",
              autogenerate: { directory: "deploy-and-operate/tiger-cloud" },
            },
            {
              label: "Self-Hosted",
              autogenerate: { directory: "deploy-and-operate/self-hosted" },
            },
            {
              label: "Managed Service (MST)",
              autogenerate: { directory: "deploy-and-operate/mst" },
            },
          ],
        },
        {
          label: "Agentic Postgres",
          link: "/agentic-postgres/key-vector-database-concepts",
          sidebar: [
            {
              label: "Key Concepts",
              link: "/agentic-postgres/key-vector-database-concepts",
            },
            {
              label: "Agents",
              autogenerate: { directory: "agentic-postgres/agents" },
            },
            {
              label: "Interfaces",
              autogenerate: { directory: "agentic-postgres/interfaces" },
            },
            {
              label: "pgai",
              autogenerate: { directory: "agentic-postgres/pgai" },
            },
            {
              label: "pgvectorscale",
              autogenerate: { directory: "agentic-postgres/pgvectorscale" },
            },
          ],
        },
        {
          label: "TimescaleDB",
          link: "/timescaledb",
          sidebar: [
            {
              label: "Overview",
              link: "/timescaledb",
            },
            {
              label: "Getting Started",
              autogenerate: { directory: "timescaledb/getting-started" },
            },
            {
              label: "Guides",
              autogenerate: { directory: "timescaledb", collapsed: true },
            },
          ],
        },
        {
          label: "pgai",
          link: "/pgai",
          sidebar: [
            {
              label: "Overview",
              link: "/pgai",
            },
            {
              label: "Vectorizer",
              autogenerate: { directory: "pgai/vectorizer" },
            },
            {
              label: "Semantic Catalog",
              autogenerate: { directory: "pgai/semantic_catalog" },
            },
            {
              label: "Utilities",
              autogenerate: { directory: "pgai/utils" },
            },
            {
              label: "Extension",
              collapsed: true,
              items: [
                {
                  label: "Overview",
                  link: "/pgai/extension",
                },
                {
                  label: "Installation",
                  autogenerate: { directory: "pgai/extension/install" },
                },
                {
                  label: "Model Calling",
                  autogenerate: { directory: "pgai/extension/model_calling" },
                },
                {
                  label: "Security",
                  autogenerate: { directory: "pgai/extension/security" },
                },
                {
                  label: "Utilities",
                  autogenerate: { directory: "pgai/extension/utils" },
                },
              ],
            },
          ],
        },
        {
          label: "pgvectorscale",
          link: "/pgvectorscale",
          sidebar: [
            {
              label: "Overview",
              link: "/pgvectorscale",
            },
            {
              label: "Development",
              link: "/pgvectorscale/development",
            },
            {
              label: "Testing",
              link: "/pgvectorscale/testing",
            },
            {
              label: "Contributing",
              link: "/pgvectorscale/contributing",
            },
          ],
        },
        {
          label: "Cloud API Reference",
          link: "/api",
          sidebar: generateAPIReferenceItems({
            excludeResourceOverviewPages: true,
          }),
        },
      ],
    }),
  ],
});
