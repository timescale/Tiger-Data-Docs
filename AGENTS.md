---
description: 
alwaysApply: true
---

# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Tiger Data documentation site built on Astro + Starlight using the Stainless Docs Platform (`@stainless-api/docs`). Documentation content is sourced from three sibling repositories: `timescaledb`, `pgai`, and `pgvectorscale`.

## Commands

```bash
# Install dependencies
pnpm install

# Start dev server (http://localhost:4321)
pnpm dev

# Build for production (runs sync first via prebuild)
pnpm build

# Preview production build
pnpm preview

# Sync docs from source repos (timescaledb, pgai, pgvectorscale)
pnpm sync

# Format code
pnpm format
```

## Architecture

### Content Sync System

`scripts/sync-docs.ts` pulls markdown from sibling repos and transforms it:
- Source repos must exist at `../timescaledb`, `../pgai`, `../pgvectorscale`
- Transforms Mintlify components to Stainless equivalents (Note → Callout, Tab → TabItem, etc.)
- Converts `.md` to `.mdx`, `README.md` becomes `index.mdx`
- Auto-generates frontmatter (title/description) if missing
- Copies images to `public/assets/{source}/`

### Site Configuration

All navigation, tabs, and sidebar structure is defined in `astro.config.ts` via the `stainlessDocs()` integration:
- 8 main tabs: Get Started, Learn, Build, Migrate, Integrate, Reference, Deploy, Cloud API Reference
- API Reference is auto-generated from the `tiger-cloud` Stainless project
- Sidebar entries use `autogenerate: { directory: "..." }` to pull from content directories

### Content Structure

```
src/content/docs/
├── get-started/         # Welcome + quickstart path
│   ├── index.mdx        # Welcome page with path selection
│   ├── quickstart-5-minutes.mdx
│   ├── create-service.mdx
│   ├── connect-your-app.mdx
│   ├── next-steps.mdx
│   └── new.mdx          # Changelog
│
├── learn/               # Conceptual learning content
│   ├── fundamentals/    # Core concepts (hypertables, chunks, compression)
│   ├── deep-dive/       # Advanced architecture topics
│   ├── examples/        # Real-world use case tutorials
│   └── production-patterns/  # Best practices for production
│
├── build/               # Task-oriented guides by feature
│   ├── time-series/     # Hypertables and time-series operations
│   ├── continuous-aggregates/  # CAGG setup and management
│   ├── columnar-storage/  # Hypercore and compression
│   ├── tiered-storage/  # Data tiering configuration
│   ├── performance-optimization/  # Query and schema optimization
│   ├── cost-optimization/  # Cost reduction strategies
│   ├── migration/       # General migration strategies (links to /migrate)
│   ├── operations/      # Jobs, monitoring, maintenance
│   ├── cookbooks/       # Step-by-step recipes
│   └── troubleshooting/ # Common issues and fixes
│
├── migrate/             # Migration from other databases
│   ├── index.mdx        # Migration overview
│   ├── import-*.mdx     # Import methods
│   └── migrate-from/    # Database-specific guides
│       ├── postgres.mdx
│       ├── mongodb.mdx
│       ├── clickhouse.mdx
│       └── ...
│
├── integrate/           # Tool and framework integrations
│   ├── data-engineering-etl/
│   ├── bi-vizualization/
│   ├── data-ingestion-streaming/
│   ├── connectors/
│   ├── code/
│   ├── query-administration/
│   ├── secure-connectivity/
│   ├── observability-alerting/
│   └── configuration-deployment/
│
├── reference/           # API reference and configuration
│   ├── timescaledb/     # SQL function reference (synced from repo)
│   ├── toolkit/         # Toolkit function reference
│   ├── pgai/            # pgai reference (synced from repo)
│   ├── pgvectorscale/   # pgvectorscale reference (synced from repo)
│   ├── tiger-cloud-api/ # REST API reference
│   ├── configuration/   # PostgreSQL/TimescaleDB settings
│   └── glossary.mdx
│
└── deploy/              # Deployment options
    ├── tiger-cloud/     # Managed cloud service
    │   ├── get-started/
    │   ├── configuration/
    │   ├── data-security/
    │   ├── secure-access/
    │   ├── monitoring/
    │   ├── storage/
    │   └── pricing/
    ├── self-hosted/     # Self-managed deployment
    │   ├── install/
    │   ├── configuration/
    │   └── operations/
    └── mst/             # Managed Service for TimescaleDB
```

### Legacy Content (deprecated)

The following directories are deprecated and have been reorganized:
- `getting-started/` → `get-started/`
- `manage-data/` → `build/` and `learn/`
- `tutorials/` → `learn/examples/`
- `integrations/` → `integrate/`
- `deploy-and-operate/` → `deploy/`
- `agentic-postgres/` → removed (content moved to reference)

### MDX Components

When using Stainless components in MDX files, import from `@stainless-api/docs/components`:

```mdx
import { Callout, Tabs, TabItem, Cards, Card } from "@stainless-api/docs/components";

<Callout variant="note">Note content</Callout>
<Callout variant="warning">Warning content</Callout>
<Callout variant="tip">Tip content</Callout>
```

### Theming

`theme.css` defines CSS custom properties:
- `--stl-color-accent`: Purple in light mode (#6446fb), yellow in dark mode (#f5ff80)
- `--stl-color-background`: White/black for light/dark modes
- Uses CSS `light-dark()` function for theme switching

### Environment

Requires `STAINLESS_API_KEY` for API reference generation (see `.env.example`).

### Hosting, search, and cache (self-hosted)

When not using Stainless hosting, the site can be built with `pnpm build` and deployed anywhere that serves static files (Vercel, Netlify, Cloudflare Pages, etc.).

- **Search**: By default the build uses [Pagefind](https://pagefind.app/) for site search (header search bar and ⌘K). For Algolia-backed search, set the Algolia env vars in `.env.example` before building.
- **Cache headers**: So the site is performant, set cache headers per [Stainless’ recommendation](https://www.stainless.com/docs/docs-platform/hosting-and-deploys/#configuring-cache-headers):
  - `/_astro/*`: long-lived (e.g. `Cache-Control: public, max-age=604800, immutable`) — versioned assets.
  - Other files (HTML, etc.): shorter TTL (e.g. `max-age=3600`).
  - This repo sets these via `public/_headers` (Netlify, Cloudflare Pages) and `vercel.json` (Vercel). For other hosts, configure equivalent headers in the platform’s config.
