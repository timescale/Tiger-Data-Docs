# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tiger Data Docs is a documentation site built with **Astro 6 + Starlight + Stainless Docs**. It covers Tiger Cloud, TimescaleDB, pgai, and related products. Deployed on Vercel.

## Commands

```bash
pnpm dev              # Start dev server at localhost:4321
pnpm build            # Production build (runs astro sync as prebuild)
pnpm preview          # Preview production build
pnpm format           # Prettier formatting
pnpm lint:headings    # Enforce sentence case headings (--fix available)
pnpm lint:postgresql-variable  # Enforce {C.PG} constant usage
pnpm lint:links       # Build with link checking (CHECK_LINKS=true)
```

**Node requirement:** >=22.12.0. Uses pnpm.

**Stainless auth:** Requires `stl auth login` or STAINLESS_API_KEY in .env for API reference generation.

## Architecture

### Content

- **MDX docs** live in `src/content/docs/` organized by section: get-started, learn, build, migrate, integrate, reference, deploy
- **Partials** (`src/partials/_*.mdx`) — 300+ reusable MDX snippets imported to reduce duplication
- **Sidebar navigation** is defined in `astro.config.ts` (large file, ~1400 lines) with tab-based structure

### Constants System (Critical)

All product/brand names are centralized in `src/constants.ts`. Import as:
```ts
import * as C from "@constants";
```
Then use `{C.CLOUD_LONG}`, `{C.PG}`, `{C.TIMESCALE_DB}`, etc. in MDX content. **Never hardcode "PostgreSQL" or "Postgres" in prose** — use `{C.PG}` instead. The `lint:postgresql-variable` CI check enforces this. Exceptions: inside backticks or URLs.

### TypeScript Path Aliases

- `@components/*` → `src/components/*`
- `@constants` → `src/constants.ts`
- `@partials/*` → `src/partials/*`

### Custom Components

Key overrides of Starlight defaults in `src/components/`:
- `Callout.astro` — custom styled callout (overrides Stainless default)
- `Header.astro`, `Footer.astro`, `PageTitle.astro`, `PageNavigation.astro`
- `PageSidebar.astro` + `LearnMore.astro` — right-rail "Learn more" card driven by per-page frontmatter (`learnMore:` block). See [`src/components/LearnMore.README.md`](./src/components/LearnMore.README.md) for the full authoring guide with copy-paste recipes for tutorials, concept pages, quickstarts, and reference pages.
- `IntegrateOverview.astro`, `BuildToc/`, `IntegrateToc/`, `Glossary/` — section-specific components

React components (`.tsx`) are used for interactive pieces like `CopyToClipboard`, `Prerequisites`.

### Per-page right-rail card

Authors can add a `learnMore:` block to any MDX page's frontmatter to surface a tutorials / related posts / CTA card in the right rail. No imports needed. Full schema, 8 variations, and troubleshooting are in **[`src/components/LearnMore.README.md`](./src/components/LearnMore.README.md)** — start there before suggesting per-page related-content patterns.

### Custom Plugins

- `src/plugins/remark-resolve-constants-in-headings.ts` — resolves `{C.CONSTANT}` syntax in headings
- `src/plugins/rehype-base-path.ts` — adds BASE_PATH to relative URLs

### Content Schema

Defined in `src/content.config.ts`. Extends Starlight's docsSchema with custom fields:
- `pageLabels` — tags like "Experimental", "Popular feature", "Optional"
- `overviewDescription` — dropdown descriptions
- `integrationSchema` — metadata for the Integrate section

## Content Conventions

- **Headings must be sentence case.** CI enforces this via `lint:headings`. Proper nouns and acronyms are excepted.
- **Use constants for product names.** `{C.PG}`, `{C.CLOUD_LONG}`, `{C.TIMESCALE_DB}`, etc. CI enforces PostgreSQL constant usage.
- **Partials use underscore prefix:** `_partial-name.mdx`
- **No deprecated compression APIs.** TimescaleDB 2.18.0 renamed the compression API to columnstore/hypercore (`compress_chunk` → `convert_to_columnstore`, `*_compression_policy` → `*_columnstore_policy`, `timescaledb.compress` → `timescaledb.enable_columnstore`, etc.). Old names still work as backwards-compat aliases but must not appear in new docs. Full mapping, carve-outs, and verification grep: `.claude/references/deprecated-compression-apis.md`.

## CI Checks

- **lint-headings.yml** — Validates sentence case on all headings
- **lint-postgresql-variable.yml** — Validates `{C.PG}` usage instead of literal PostgreSQL/Postgres
- **pr-checklist-check.yml** — Ensures PR checklist items are addressed
