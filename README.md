# Tiger Data Docs

Documentation site for Tiger Data, built on Astro 6, Starlight, and the Stainless Docs renderer.

## Prerequisites

- **Node.js** (v22.12.0 or later, as required by `package.json`): [nodejs.org](https://nodejs.org/)
- **pnpm** (package manager): install with `npm install -g pnpm` or see [pnpm.io/installation](https://pnpm.io/installation)

## Development quickstart

1. Clone the repo and `cd` into it
2. Install dependencies: `pnpm install`
3. Start the dev server: `pnpm dev`
4. Visit [localhost:4321](http://localhost:4321/)

The development server and production build run without external API credentials. `dev:local` and `build:local` remain as aliases for compatibility.

### Other commands

```bash
pnpm build         # Build for production
pnpm build:local   # Alias for pnpm build
pnpm dev:local     # Alias for pnpm dev
pnpm preview       # Preview production build
pnpm format        # Format code
pnpm openapi:update # Refresh the checked-in Tiger Cloud OpenAPI definition
```

The Tiger Cloud REST reference is generated locally from `stainless/openapi.yml`
and `stainless/stainless.yml`. See [`stainless/README.md`](./stainless/README.md)
for provenance and update instructions.

## Site structure

All documentation content lives under `src/content/docs/`. The structure follows the new Information Architecture with categorical sections, each containing subcategories and individual pages.

### Main sections

| Folder | Description |
|--------|-------------|
| `get-started/` | Welcome and quickstart content for new users |
| `learn/` | Conceptual learning content, fundamentals, and deep-dives |
| `build/` | Task-oriented guides organized by feature |
| `migrate/` | Migration guides from other databases |
| `integrate/` | Tool and framework integrations |
| `reference/` | API reference, SQL functions, and configuration |
| `deploy/` | Deployment options (cloud, self-hosted) |

### Folder hierarchy

Each main section follows a three-level hierarchy:

``` md
src/content/docs/
└── {section}/              # Main section (e.g., build, learn, deploy)
    ├── index.mdx           # Landing page for the section
    └── {category}/         # Category folder (e.g., columnar-storage)
        ├── index.mdx       # Category landing page (optional)
        └── {page}.mdx      # Individual pages (alphabetically ordered)
```

**Example:** the `build/` section:

``` md
build/
├── index.mdx                      # Build section landing page
├── columnar-storage/
│   └── setup-hypercore.mdx
├── continuous-aggregates/
├── cost-optimization/
├── data-management/
├── examples/
├── how-to/
├── performance-optimization/
└── tips-and-tricks/
```

### Key points

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

1. **`keywords`** (optional array of strings): used for search and, when `integrationTechnologies` is omitted, to **infer** technologies by matching substrings (see `src/lib/integration-technologies.ts`). Example: a keyword containing `kafka` maps to the **Kafka** filter.

2. **`integrationTechnologies`** (optional array): **explicit** tags. Use when inference is wrong or too broad. Allowed values are exactly: `PostgreSQL`, `Python`, `Ruby`, `Node.js`, `Go`, `Java`, `SQL`, `Kafka`, `MQTT`, `OPC UA`, `Apache Iceberg`, `AWS`, `Azure`, `GCP`, `Terraform`, `Kubernetes`, `Grafana`, `Prometheus` (the source of truth is `INTEGRATION_TECHNOLOGY_KEYS` in `src/lib/integration-technologies.ts`).

Example:

```yaml
keywords: ["kafka integration", "event streaming"]
integrationTechnologies: ["Kafka", "AWS"]
```

If you set `integrationTechnologies`, it **replaces** inference from `keywords` for that page (the explicit list wins).

## Documentation platform

The site uses [Astro](https://astro.build) and [Starlight](https://starlight.astro.build) directly. Project-owned components in `src/components/` provide custom callouts, cards, tabs, badges, and navigation.

**→ [Component usage guide (README-component.md)](./README-component.md)**: how to use callouts (Tip, Note, Important, Warning, Callout with button) and other custom components. Instructions are in collapsible sections so you can expand only what you need.

## Environment

No environment variables are required for a local build. Optional integrations are documented in `.env.example`.

### Optional: Sentry error monitoring

The site uses [`@sentry/astro`](https://docs.sentry.io/platforms/javascript/guides/astro/) for client and server error monitoring. Set `SENTRY_DSN` in your environment (or as a CI/CD secret) to enable it:

```
SENTRY_DSN=https://<key>@o<org>.ingest.us.sentry.io/<project>
```

Omitting the variable disables Sentry silently: no errors, no events captured.

#### Sentry MCP for AI assistants

The repo includes pre-configured [Sentry MCP](https://docs.sentry.io/organization/integrations/integration-platform/internal-integrations/mcp-server/) configs so AI coding assistants can query Sentry issues, stack traces, and alerts directly:

- `.mcp.json`: Claude Code (project-level config)
- `.cursor/mcp.json`: Cursor
- `.vscode/mcp.json`: VS Code / GitHub Copilot

No extra setup is needed; your assistant discovers the config automatically when you open the repo.

### Optional: Algolia instead of Pagefind

By default, search uses [Pagefind](https://pagefind.app/) and needs no extra service. To use [Algolia](https://www.algolia.com/), set the four variables in `.env.example`.

## Doc constants (brand and product variables)

The repo uses shared constants so product and database names can be changed in one place. They live in `src/constants.ts` and are imported in MDX, Astro, and TS as `@constants`.

**In MDX (docs and partials):**

1. At the top of the file, add: `import * as C from "@constants";` (if not already present).
2. Use the constants in **prose** and **headings** with curly braces, for example `{C.PG}`, `{C.CLOUD_LONG}`, `{C.TIMESCALE_DB}`.

Examples:

- Prose: `Connect to {C.PG} and run the query.`
- Headings: `## Using {C.PG} with time-series data`
- In component props (JS expressions): `` title={`Install ${C.PG}`} ``

The database name is intentionally centralized: use `{C.PG}` or `{C.POSTGRESQL}` instead of literal "PostgreSQL" or "Postgres" in prose and headings. This is nudged by the `TigerData.ProductConstants` Vale rule; run `pnpm lint:prose` to check changed files (see the `vale.yml` CI workflow). **Exceptions:** literal "PostgreSQL"/"Postgres" is allowed inside URLs (for example, `https://postgresql.org`) and inside backticks (UI elements, code, file paths, commands).

## Right-rail Learn more card

Any page can surface a "Learn more" card in the right rail (tutorials, related blog posts, and an optional CTA button) by adding a `learnMore` block to its frontmatter. No imports or per-page wiring required: the card renders automatically when the key is present and hides itself when it isn't.

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

**→ See [`src/components/LearnMore.README.md`](./src/components/LearnMore.README.md)** for the full authoring guide: 8 copy-paste recipes (tutorial pages, concept pages, quickstarts, reference pages, custom headings, external links, CTA-only, and so on), field reference, troubleshooting, architecture, and theming notes.

## Want to learn more?

- [Starlight docs](https://starlight.astro.build/getting-started/)
- [Astro docs](https://docs.astro.build)
