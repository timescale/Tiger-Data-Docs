---
description: 
alwaysApply: true
---

# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Tiger Data documentation site built on Astro + Starlight using the Stainless Docs Platform (`@stainless-api/docs`). Documentation content is sourced from three sibling repositories: `timescaledb`, `pgai`, and `pgvectorscale`. Includes experimental AI chat via `@stainless-api/docs-ai-chat`.

## Commands

```bash
# Install dependencies
pnpm install

# Start dev server (http://localhost:4321)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Sync docs from source repos (timescaledb, pgai, pgvectorscale)
pnpm sync

# Sync with file watching
pnpm sync:watch

# Format code
pnpm format

# Lint heading case (sentence case enforcement)
pnpm lint:headings

# Lint postgresql variable naming
pnpm lint:postgresql-variable

# Check for broken links (runs astro build with CHECK_LINKS=true)
pnpm lint:links
```

## Architecture

### Content Sync System

`scripts/sync-docs.ts` pulls markdown from sibling repos and transforms it:
- Source repos must exist at `../timescaledb`, `../pgai`, `../pgvectorscale`
- Transforms Mintlify components to Stainless equivalents (Note → Callout, Tab → TabItem, etc.)
- Converts `.md` to `.mdx`, `README.md` becomes `index.mdx`
- Auto-generates frontmatter (title/description) if missing
- Copies images to `public/assets/{source}/`

Other scripts in `scripts/`:
- `lint-heading-case.ts` — enforces sentence case on headings
- `lint-postgresql-variable.ts` — lints postgresql variable usage
- `assign-glossary-categories.cjs` — assigns categories to glossary entries

### Site Configuration

All navigation, tabs, and sidebar structure is defined in `astro.config.ts` via the `stainlessDocs()` integration:
- 7 main tabs: Get Started, Learn, Build, Migrate, Integrate, Reference, Deploy
- Tiger Cloud REST API Reference is nested inside the Reference tab (auto-generated from the `tiger-cloud` Stainless project)
- Sidebar entries use `autogenerate: { directory: "..." }` to pull from content directories
- Custom Starlight component overrides via `experimental.starlightCompat.components`: Header, PageTitle, Pagination (PageNavigation), Callout
- Vite alias overrides `@stainless-api/docs/components` to `src/lib/docs-components.ts` for custom Callout styling
- Link validation via `starlight-links-validator` (enabled when `CHECK_LINKS=true`)

### Custom Components

Custom Astro/React components live in `src/components/`:
- `Header.astro`, `PageTitle.astro`, `PageNavigation.astro` — Starlight overrides
- `Callout.astro` — custom callout with Figma-styled lightbulb icon
- `AuthorByline.astro` — author attribution for tutorials
- `ChangelogEntry.astro`, `ChangelogFilter.astro`, `ChangelogTag.astro` — changelog/release notes
- `Glossary/` — glossary term rendering with category filtering
- `IntegrateOverview.astro`, `IntegrateToc/` — integration page layouts
- `NumberedList.astro`, `NumberedList.tsx`, `NumberedItem.astro` — ordered step components
- `HeaderSearchBar.astro` — site search bar
- `SinceRelease.astro` — version badge component

Helper modules in `src/lib/`:
- `docs-components.ts` — re-exports Stainless components with Callout override
- `breadcrumb.ts`, `pagination.ts`, `glossary-data.ts` — utility modules

### Content Structure

```
src/content/docs/
├── get-started/           # Welcome + quickstart path
│   ├── index.mdx          # Welcome page
│   ├── quickstart-5-minutes.mdx
│   ├── quickstart/        # Multi-step quickstart subpages
│   ├── create-service.mdx
│   ├── create-mst-service.mdx
│   ├── connect-your-app.mdx
│   ├── next-steps.mdx
│   ├── feature-comparison.mdx
│   ├── key-features-timescale.mdx
│   ├── timescaledb-editions.mdx
│   ├── install-timescaledb.mdx
│   ├── supported-platforms.mdx
│   ├── cli-rest-api.mdx
│   ├── mcp-cli.mdx
│   ├── contributing.mdx   # How to contribute to docs
│   ├── new.mdx            # Changelog
│   └── release-notes.mdx
│
├── learn/                 # Conceptual learning content
│   ├── fundamentals/      # Core concepts (hypertables, chunks, compression)
│   ├── deep-dive/         # Advanced architecture topics
│   ├── examples/          # Real-world use case tutorials
│   ├── production-patterns/  # Best practices for production
│   └── glossary.mdx       # Glossary with category filtering
│
├── build/                 # Task-oriented guides by feature
│   ├── data-management/   # General data management operations
│   ├── continuous-aggregates/  # CAGG setup and management
│   ├── columnar-storage/  # Hypercore and compression
│   ├── performance-optimization/  # Query and schema optimization
│   ├── cost-optimization/ # Cost reduction strategies
│   └── tips-and-tricks/   # Practical tips and recipes
│
├── migrate/               # Migration from other databases
│   ├── index.mdx          # Migration overview
│   ├── import-console.mdx / import-terminal.mdx  # Import methods
│   ├── live-migration.mdx / livesync-for-postgresql.mdx / livesync-for-s3.mdx
│   ├── migrate-with-downtime.mdx
│   └── migrate-from/      # Database-specific guides
│       ├── postgres.mdx
│       ├── mongodb.mdx
│       ├── clickhouse.mdx
│       └── index.mdx
│
├── integrate/             # Tool and framework integrations
│   ├── data-engineering-etl/
│   ├── bi-vizualization/
│   ├── data-ingestion-streaming/
│   ├── connectors/        # Source and destination connectors
│   │   ├── source/        # Kafka, Postgres, S3
│   │   └── destination/   # Tigerlake
│   ├── code/
│   ├── query-administration/
│   ├── secure-connectivity/
│   ├── observability-alerting/
│   └── configuration-deployment/
│
├── reference/             # API reference and configuration
│   ├── timescaledb/       # SQL function reference (synced from repo)
│   ├── toolkit/           # Toolkit function reference
│   ├── pgai/              # pgai reference (synced from repo)
│   ├── pgvectorscale/     # pgvectorscale reference (synced from repo)
│   ├── tiger-cloud-api/   # REST API reference (auto-generated)
│   └── configuration/     # PostgreSQL/TimescaleDB settings
│
└── deploy/                # Deployment options
    ├── tiger-cloud/       # Managed cloud service (generic)
    ├── tiger-cloud-AWS/   # Tiger Cloud on AWS
    ├── tiger-cloud-azure/ # Tiger Cloud on Azure
    ├── self-hosted/       # Self-managed deployment
    │   ├── install/
    │   ├── install-and-update/
    │   ├── configuration/
    │   ├── operations/
    │   ├── manage-data-security/
    │   └── troubleshooting/
    └── mst/               # Managed Service for TimescaleDB
```

### Legacy Content (deprecated)

The following legacy paths have redirect `.mdx` stubs at the top level of `src/content/docs/`:
- `agentic-postgres.mdx` — legacy agentic postgres page
- `deploy-and-operate.mdx` — redirects to `deploy/`
- `integrations.mdx` — redirects to `integrate/`
- `manage-data.mdx` — redirects to `build/` and `learn/`
- `tutorials.mdx` — redirects to `learn/examples/`

Previous directory reorganization:
- `getting-started/` → `get-started/`
- `manage-data/` → `build/` and `learn/`
- `tutorials/` → `learn/examples/`
- `integrations/` → `integrate/`
- `deploy-and-operate/` → `deploy/`

### MDX Components

When using Stainless components in MDX files, import from `@stainless-api/docs/components`:

```mdx
import { Callout, Tabs, TabItem, Cards, Card } from "@stainless-api/docs/components";

<Callout variant="note">Note content</Callout>
<Callout variant="warning">Warning content</Callout>
<Callout variant="tip">Tip content</Callout>
```

Note: The `Callout` import is aliased via Vite to the custom `src/components/Callout.astro` component.

### Theming

`theme.css` defines CSS custom properties:
- `--stl-color-accent`: Purple in light mode (#6446fb), yellow in dark mode (#f5ff80)
- `--stl-color-background`: White/black for light/dark modes
- Uses CSS `light-dark()` function for theme switching

### Environment

Requires `STAINLESS_API_KEY` for API reference generation (see `.env.example`).
Optional Algolia env vars for search: `PUBLIC_ALGOLIA_APP_ID`, `PUBLIC_ALGOLIA_INDEX`, `PUBLIC_ALGOLIA_SEARCH_KEY`, `PRIVATE_ALGOLIA_WRITE_KEY`.

### Hosting, search, and cache (self-hosted)

When not using Stainless hosting, the site can be built with `pnpm build` and deployed anywhere that serves static files (Vercel, Netlify, Cloudflare Pages, etc.).

- **Search**: By default the build uses [Pagefind](https://pagefind.app/) for site search (header search bar and ⌘K). For Algolia-backed search, set the Algolia env vars in `.env.example` before building.
- **Cache headers**: So the site is performant, set cache headers per [Stainless' recommendation](https://www.stainless.com/docs/docs-platform/hosting-and-deploys/#configuring-cache-headers):
  - `/_astro/*`: long-lived (e.g. `Cache-Control: public, max-age=604800, immutable`) — versioned assets.
  - Other files (HTML, etc.): shorter TTL (e.g. `max-age=3600`).
  - This repo sets these via `public/_headers` (Netlify, Cloudflare Pages) and `vercel.json` (Vercel). For other hosts, configure equivalent headers in the platform's config.
