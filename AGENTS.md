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
- 7 main tabs: Guides, Deploy & Operate, Agentic Postgres, TimescaleDB, pgai, pgvectorscale, Cloud API Reference
- API Reference is auto-generated from the `tiger-cloud` Stainless project
- Sidebar entries use `autogenerate: { directory: "..." }` to pull from content directories

### Content Structure

```
src/content/docs/
├── getting-started/     # Quickstart guides
├── manage-data/         # Data management docs
├── integrations/        # Integration guides
├── tutorials/           # Step-by-step tutorials
├── deploy-and-operate/  # Tiger Cloud, Self-Hosted, MST deployment
├── agentic-postgres/    # Vector DB, agents, interfaces, pgai, pgvectorscale
├── timescaledb/         # Synced from timescaledb repo
├── pgai/                # Synced from pgai repo
└── pgvectorscale/       # Synced from pgvectorscale repo
```

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
