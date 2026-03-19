# Tiger Data Docs

Documentation site for Tiger Data, built on Astro + Starlight using the Stainless Docs Platform (`@stainless-api/docs`).

## Development Quickstart

1. Authenticate with the [Stainless CLI](https://www.stainless.com/docs/getting-started/quickstart-cli): `stl auth login`
2. Install dependencies: `pnpm install`
3. Run the dev server: `pnpm dev`
4. Visit [localhost:4321](http://localhost:4321/)

### Other Commands

```bash
pnpm build      # Build for production (runs sync first via prebuild)
pnpm preview    # Preview production build
pnpm sync       # Sync docs from source repos (timescaledb, pgai, pgvectorscale)
pnpm format     # Format code
```

## Site Structure

All documentation content lives under `src/content/docs/`. The structure follows the new Information Architecture with categorical sections, each containing subcategories and individual pages.

### Main Sections

| Folder | Description |
|--------|-------------|
| `get-started/` | Welcome and quickstart content for new users |
| `learn/` | Conceptual learning content, fundamentals, and deep-dives |
| `build/` | Task-oriented guides organized by feature |
| `migrate/` | Migration guides from other databases |
| `integrate/` | Tool and framework integrations |
| `reference/` | API reference, SQL functions, and configuration |
| `deploy/` | Deployment options (cloud, self-hosted) |

### Folder Hierarchy

Each main section follows a three-level hierarchy:

```
src/content/docs/
└── {section}/              # Main section (e.g., build, learn, deploy)
    ├── index.mdx           # Landing page for the section
    └── {category}/         # Category folder (e.g., columnar-storage)
        ├── index.mdx       # Category landing page (optional)
        └── {page}.mdx      # Individual pages (alphabetically ordered)
```

**Example:** The `build/` section:

``` md
build/
├── index.mdx                      # Build section landing page
├── columnar-storage/
│   ├── about-compression.mdx
│   ├── compression-design.mdx
│   ├── compression-methods.mdx
│   └── ...
├── continuous-aggregates/
├── cost-optimization/
├── migration/
├── operations/
├── performance-optimization/
├── tiered-storage/
├── time-series/
├── tips-and-tricks/
└── troubleshooting/
```

### Key Points

- The `index.mdx` in each folder serves as the "home" or "landing page" for that section/category
- Pages within category folders are ordered **alphabetically**
- Content was drafted/migrated from existing docs during the IA restructure
- Each subcategory should have sub-pages built out and prepped for migration

## About Stainless Docs

The Stainless Docs Platform is built on top of [Astro](https://astro.build) and [Starlight](https://starlight.astro.build). Starlight is a powerful documentation framework designed for speed, accessibility, and customizability.

This project uses the `@stainless-api/docs` integration which provides:
- Automatic API reference generation from the `tiger-cloud` Stainless project
- MDX components (`Callout`, `Tabs`, `TabItem`, `Cards`, etc.)
- Theme customization via `theme.css`

**→ [Component usage guide (readme-component.md)](./readme-component.md)** — How to use callouts (Tip, Note, Important, Warning, Callout with button) and other custom components. Instructions are in collapsible sections so you can expand only what you need.

## Environment

Requires `STAINLESS_API_KEY` for API reference generation. See `.env.example`.

### Optional: Algolia instead of Pagefind

By default, search uses [Pagefind](https://pagefind.app/) (no extra services). To use [Algolia](https://www.algolia.com/) for site search, set the four variables in `.env.example` and follow [Stainless: site search](https://www.stainless.com/docs/docs-platform/hosting-and-deploys/#site-search) (keys, security, and running `pnpm build` to upload the index).

### Troubleshooting: `Connection error` (Stainless API)

If `pnpm dev` or `pnpm build` fails with **`Error: Connection error`** from `@stainless-api/sdk` / `loadSpecs` / `inputResolver`, the docs plugin cannot reach **Stainless’s API** to download the **Tiger Cloud** OpenAPI spec and config. Try, in order:

1. **API key in `.env`**  
   Copy `.env.example` to `.env` in the **project root**. Add a real key from [Stainless → org settings → API keys](https://app.stainless.com/org/default/settings) (format `stl_sk_…`). Restart the dev server so Astro picks up the env var.

2. **CLI auth (alternative to `.env`)**  
   Run `stl auth login` ([Stainless CLI quickstart](https://www.stainless.com/docs/getting-started/quickstart-cli)). The plugin can use CLI login if no key is in `.env`.

3. **Network**  
   Confirm you can reach the API (browser or terminal):  
   `curl -sI https://api.stainless.com`  
   VPNs, corporate firewalls, or offline mode often cause this error.

4. **Project access**  
   Your key or CLI user must be able to access the **`tiger-cloud`** Stainless project configured in `astro.config.ts`. If you only have a personal org key, you may need access from the Tiger Data / Timescale team.

After fixing auth or network, run `pnpm dev` again.

## Doc constants (brand and product variables)

The repo uses shared constants so product and database names can be changed in one place. They live in `src/constants.ts` and are imported in MDX, Astro, and TS as `@constants`.

**In MDX (docs and partials):**

1. At the top of the file, add: `import * as C from "@constants";` (if not already present).
2. Use the constants in **prose** and **headings** with curly braces, e.g. `{C.PG}`, `{C.CLOUD_LONG}`, `{C.TIMESCALE_DB}`.

Examples:

- Prose: `Connect to {C.PG} and run the query.`
- Headings: `## Using {C.PG} with time-series data`
- In component props (JS expressions): `` title={`Install ${C.PG}`} ``

The database name is intentionally centralized: use `{C.PG}` or `{C.POSTGRESQL}` instead of literal "PostgreSQL" or "Postgres" in prose and headings. The lint script `pnpm run lint:postgresql-variable` (and the CI workflow) enforce this. **Exceptions:** literal "PostgreSQL"/"Postgres" is allowed inside URLs (e.g. `https://postgresql.org`) and inside backticks (UI elements, code, file paths, commands).

## Want to learn more?

- [Stainless Docs Platform documentation](https://stainless.com/docs/docs-platform/)
- [Starlight docs](https://starlight.astro.build/getting-started/)
- [Astro docs](https://docs.astro.build)
