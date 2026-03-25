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
- Copies images to `public/assets/{source}/` (reference content from sibling repos only)

**First-party / hand-authored images** should live under **`src/assets/images/`** (for example `learn/`, `migrate/`, `hero-cloud/`, `hero-local/`) and be referenced via **`import`** in MDX or `.astro` so Astro can optimize them (`astro:assets`, Sharp). See `src/assets/images/README.md`. Do not use `public/` for those unless you need a raw static URL with no processing.

Other scripts in `scripts/`:
- `lint-heading-case.ts`: enforces sentence case on headings
- `lint-postgresql-variable.ts`: lints postgresql variable usage
- `assign-glossary-categories.cjs`: assigns categories to glossary entries

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
- `Header.astro`, `PageTitle.astro` (breadcrumbs + `@stainless-api/docs/components/AIDropdown`), `PageNavigation.astro`: Starlight overrides
- `Callout.astro`: custom callout with Figma-styled lightbulb icon
- `AuthorByline.astro`: author attribution for tutorials
- `ChangelogEntry.astro`, `ChangelogFilter.astro`, `ChangelogTag.astro`: changelog/release notes
- `Glossary/`: glossary term rendering with category filtering
- `IntegrateOverview.astro`, `IntegrateToc/`: integration page layouts
- `NumberedList.astro`, `NumberedList.tsx`, `NumberedItem.astro`: ordered step components
- `HeaderSearchBar.astro`: site search bar
- `SinceRelease.astro`: version badge component

Helper modules in `src/lib/`:
- `docs-components.ts`: re-exports Stainless components with Callout override
- `breadcrumb.ts`, `pagination.ts`, `glossary-data.ts`: utility modules

### Content Structure

```
src/content/docs/
├── get-started/           # Welcome + quickstart path
│   ├── index.mdx          # Welcome page
│   ├── feature-comparison.mdx
│   ├── contributing.mdx   # How to contribute to docs
│   ├── quickstart/        # 5-min quickstart, create service, connect app, next steps
│   ├── choose-your-path/  # MST service, install self-hosted, platforms, editions
│   ├── tools/             # CLI/REST API, MCP/CLI, Tiger Cloud essentials
│   └── news/              # Changelog (new.mdx), release-notes.mdx
│
├── learn/                 # Conceptual learning content (glossary, topics)
│   ├── data-model/        # Table layout, keys & uniqueness (wide/narrow/medium, primary keys, …)
│   ├── hypertables/       # Hypertable concepts + Tiger Cloud design hub (/learn/hypertables/...)
│   ├── compression/       # Tiger Cloud compression guides (/learn/compression/...)
│   ├── continuous-aggregates/  # Tiger Cloud CAGG notes (/learn/continuous-aggregates/...)
│   ├── data-lifecycle/    # Retention & tiering guides (/learn/data-lifecycle/...)
│   ├── chunks/            # Chunk concepts (/learn/chunks/...); Learn sidebar nests this group under Hypertables
│   ├── capabilities-and-comparison/  # Capabilities & product comparison (/learn/capabilities-and-comparison/...)
│   ├── deep-dive/         # Advanced architecture topics
│   └── glossary.mdx       # Glossary with category filtering
│
├── build/                 # Task-oriented guides, tutorials, examples, production patterns (URLs under /build/...)
│   ├── how-to/            # Quickstarts (e.g. your first hypertable, basic compression)
│   ├── examples/          # Real-world tutorials and cookbook (Build sidebar → Examples)
│   ├── production-patterns/  # Production best practices (Build sidebar → Production patterns)
│   ├── data-management/   # General data management operations
│   ├── continuous-aggregates/  # CAGG setup and management
│   ├── columnar-storage/  # Hypercore and compression
│   ├── performance-optimization/  # Query and schema optimization
│   ├── cost-optimization/ # Cost reduction strategies
│   └── tips-and-tricks/   # Practical tips and troubleshooting
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
- `agentic-postgres.mdx`: legacy agentic postgres page
- `deploy-and-operate.mdx`: redirects to `deploy/`
- `integrations.mdx`: redirects to `integrate/`
- `manage-data.mdx`: redirects to `build/` and `learn/`
- `tutorials.mdx`: legacy page with links; prefer **`/build/examples`** for tutorials (`astro.config.ts` redirects old `/learn/examples` URLs)

Previous directory reorganization:
- `getting-started/` → `get-started/`
- `manage-data/` → `build/` and `learn/`
- `tutorials/` → `build/examples/` (old `/learn/examples` URLs redirect in `astro.config.ts`)
- `integrations/` → `integrate/`
- `deploy-and-operate/` → `deploy/`

### Documentation style (prose)

- Do not use the em dash (Unicode U+2014) in documentation. Prefer commas, semicolons, colons, or parentheses, or split into two sentences. For label-and-description lines, use a colon after the label (for example `**Label**: description`). See [Contribute to the docs: Writing style](/get-started/contributing#writing-style).
- Optional frontmatter **`seoDescription`**: SEO/social summary without sidebar subtitles (see [Writing style: SEO summary](/get-started/contributing#seo-summary-in-frontmatter)); implemented in `src/components/Head.astro`. If both `description` and `seoDescription` are set, **`description` is used** for meta and sidebar; `seoDescription` is ignored for injection.

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
Optional Algolia env vars for search: `PUBLIC_ALGOLIA_APP_ID`, `PUBLIC_ALGOLIA_INDEX`, `PUBLIC_ALGOLIA_SEARCH_KEY`, `PRIVATE_ALGOLIA_WRITE_KEY`. Setup: `.env.example` + [Stainless site search](https://www.stainless.com/docs/docs-platform/hosting-and-deploys/#site-search).

### Hosting, search, and cache (self-hosted)

When not using Stainless hosting, the site can be built with `pnpm build` and deployed anywhere that serves static files (Vercel, Netlify, Cloudflare Pages, etc.).

- **Search**: By default the build uses [Pagefind](https://pagefind.app/) for site search (header search bar and ⌘K). For Algolia-backed search, set the Algolia env vars in `.env.example` before building.
- **Cache headers**: So the site is performant, set cache headers per [Stainless' recommendation](https://www.stainless.com/docs/docs-platform/hosting-and-deploys/#configuring-cache-headers):
  - `/_astro/*`: long-lived (e.g. `Cache-Control: public, max-age=604800, immutable`), versioned assets.
  - Other files (HTML, etc.): shorter TTL (e.g. `max-age=3600`).
  - This repo sets these via `public/_headers` (Netlify, Cloudflare Pages) and `vercel.json` (Vercel). For other hosts, configure equivalent headers in the platform's config.
