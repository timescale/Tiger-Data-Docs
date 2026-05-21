# Tiger Data Docs

Documentation site for Tiger Data, built on Astro + Starlight using the Stainless Docs Platform (`@stainless-api/docs`).

## Prerequisites

- **Node.js** (v18 or later): [nodejs.org](https://nodejs.org/)
- **pnpm** (package manager): install with `npm install -g pnpm` or see [pnpm.io/installation](https://pnpm.io/installation)
- **Stainless API key**: required only if you need the generated **Tiger Cloud REST API** reference locally. To run without any Stainless credentials, use **`pnpm dev:local`** (see below).
  1. Sign in at [app.stainless.com](https://app.stainless.com)
  2. Go to **Org Settings → API keys** and copy your key (starts with `stl_sk...`)
  3. Create a `.env` file in the project root (use `.env.example` as a template):
     ```
     STAINLESS_API_KEY="stl_sk..."
     ```
- **Stainless CLI** (optional but recommended): [CLI quickstart](https://www.stainless.com/docs/getting-started/quickstart-cli)

## Development Quickstart

1. Clone the repo and `cd` into it
2. Copy the env file: `cp .env.example .env` and add your Stainless API key
3. Install dependencies: `pnpm install`
4. (Optional) Authenticate with the Stainless CLI: `stl auth login`
5. Start the dev server: `pnpm dev`
6. Visit [localhost:4321](http://localhost:4321/)

### Run without a Stainless API key

If you do not have `STAINLESS_API_KEY` or `stl auth login`, use the local preset so the site skips downloading the Tiger Cloud OpenAPI spec from Stainless:

```bash
pnpm install
pnpm dev:local
```

`dev:local` sets `DOCS_LOCAL_WITHOUT_STAINLESS=1`, which disables generated REST API pages and points the Reference sidebar to a stub page (`/reference/tiger-cloud-rest-local-preview` in the running site). All other docs (TimescaleDB reference, Toolkit, guides, and so on) work normally.

For a production build without Stainless (for example, CI that cannot reach the API), use `pnpm build:local`. To restore the full REST reference, unset `DOCS_LOCAL_WITHOUT_STAINLESS`, add a key or CLI auth, and run `pnpm dev` or `pnpm build` again.

### Other Commands

```bash
pnpm build         # Build for production
pnpm build:local   # Build with DOCS_LOCAL_WITHOUT_STAINLESS (no Stainless API for REST reference)
pnpm dev:local     # Dev server without Stainless API (same as DOCS_LOCAL_WITHOUT_STAINLESS=1)
pnpm preview       # Preview production build
pnpm format        # Format code
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

``` md
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

### Integrate section: hide a page from the `/integrate` card grid

The [Integrate overview](/integrate) page (`src/content/docs/integrate/index.mdx`) shows a searchable card grid of integrations. Some pages (for example [Troubleshoot](/integrate/troubleshooting)) should stay in the **sidebar** and remain reachable by URL, but should **not** appear as a card on that overview.

In the page’s frontmatter, set:

```yaml
integrationHideFromOverviewCards: true
```

This only removes the page from the **card grid** (and from the overview’s filter options that are derived from visible cards). It does **not** remove the page from the Starlight sidebar or from search indexing.

### Integrate overview: Technology filter and frontmatter

The **Technology** dropdown on `/integrate` tags each card with one or more technology labels so readers can filter (for example AWS, Kafka, PostgreSQL). Labels must be declared in the content schema or Astro strips them:

1. **`keywords`** (optional array of strings) — Used for search and, when `integrationTechnologies` is omitted, to **infer** technologies by matching substrings (see `src/lib/integration-technologies.ts`). Example: a keyword containing `kafka` maps to the **Kafka** filter.

2. **`integrationTechnologies`** (optional array) — **Explicit** tags. Use when inference is wrong or too broad. Allowed values are exactly: `PostgreSQL`, `Python`, `SQL`, `Kafka`, `AWS`, `Azure`, `GCP`, `Terraform`, `Kubernetes`, `Grafana`, `Prometheus`, `REST API`.

Example:

```yaml
keywords: ["kafka integration", "event streaming"]
integrationTechnologies: ["Kafka", "AWS"]
```

If you set `integrationTechnologies`, it **replaces** inference from `keywords` for that page (the explicit list wins).

## About Stainless Docs

The Stainless Docs Platform is built on top of [Astro](https://astro.build) and [Starlight](https://starlight.astro.build). Starlight is a powerful documentation framework designed for speed, accessibility, and customizability.

This project uses the `@stainless-api/docs` integration which provides:
- Automatic API reference generation from the `tiger-cloud` Stainless project
- MDX components (`Callout`, `Tabs`, `TabItem`, `Cards`, etc.)
- Theme customization via `theme.css`

**→ [Component usage guide (readme-component.md)](./readme-component.md)**: How to use callouts (Tip, Note, Important, Warning, Callout with button) and other custom components. Instructions are in collapsible sections so you can expand only what you need.

## Environment

`STAINLESS_API_KEY` (or `stl auth login`) is required for **generated** Tiger Cloud REST API reference unless you set **`DOCS_LOCAL_WITHOUT_STAINLESS=1`** or use **`pnpm dev:local`** / **`pnpm build:local`**. See `.env.example`.

### Optional: Sentry error monitoring

The site uses [`@sentry/astro`](https://docs.sentry.io/platforms/javascript/guides/astro/) for client and server error monitoring. Set `SENTRY_DSN` in your environment (or as a CI/CD secret) to enable it:

```
SENTRY_DSN=https://<key>@o<org>.ingest.us.sentry.io/<project>
```

Omitting the variable disables Sentry silently — no errors, no events captured.

#### Sentry MCP for AI assistants

The repo includes pre-configured [Sentry MCP](https://docs.sentry.io/organization/integrations/integration-platform/internal-integrations/mcp-server/) configs so AI coding assistants can query Sentry issues, stack traces, and alerts directly:

- `.mcp.json` — Claude Code (project-level config)
- `.cursor/mcp.json` — Cursor
- `.vscode/mcp.json` — VS Code / GitHub Copilot

No extra setup is needed; your assistant discovers the config automatically when you open the repo.

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

## Right-rail Learn more card

Any page can surface a "Learn more" card in the right rail (tutorials, related blog posts, and an optional CTA button) by adding a `learnMore` block to its frontmatter. No imports or per-page wiring required — the card renders automatically when the key is present and hides itself when it isn't.

**Minimal example (drop this into any page's frontmatter):**

```yaml
learnMore:
  tutorials:
    - label: Your first hypertable
      href: /build/how-to/your-first-hypertable/
  relatedPosts:
    - label: Why use hypertables
      href: https://www.timescale.com/blog/why-hypertables/
  cta:
    label: Try for free
    href: https://console.cloud.tigerdata.com/signup
```

**→ See [`src/components/LearnMore.README.md`](./src/components/LearnMore.README.md)** for the full authoring guide: 8 copy-paste recipes (tutorial pages, concept pages, quickstarts, reference pages, custom headings, external links, CTA-only, etc.), field reference, troubleshooting, architecture, and theming notes.

## Want to learn more?

- [Stainless Docs Platform documentation](https://stainless.com/docs/docs-platform/)
- [Starlight docs](https://starlight.astro.build/getting-started/)
- [Astro docs](https://docs.astro.build)
