---
name: write-docs-integration-guide
description: Write an integration guide for the Tiger Data Docs site following established conventions. Use when documenting how to connect a third-party tool (database client, BI tool, streaming platform, observability stack, ETL connector, etc.) to Tiger Cloud or self-hosted TimescaleDB.
user-invocable: true
allowed-tools: Read Grep Glob Edit Write Bash Agent
argument-hint: "[product name or source URL]"
effort: high
---

# Write a Tiger Data Docs integration guide

End state: a `.mdx` file at `src/content/docs/integrate/<category>/<slug>.mdx`, a sidebar entry in `astro.config.ts`, and (optionally) a logo asset. Most guides are **bilateral**: configuration on the third-party side, configuration on the database side, and optionally a step that triggers data flow. Short integrations may collapse to one part; long ones may have three or four.

In every `AskUserQuestion` call, treat options as equal — no `(Recommended)` labels.

## Start by reading two files

Before writing anything, read:

1. `src/content/docs/integrate/_template-integration.mdx` — the canonical skeleton you copy from. This file is the source of truth for placeholder wording in scaffold mode.
2. One existing page in the same category as a tone/depth reference:
   - **BI/visualization** → `bi-vizualization/tableau.mdx`
   - **Data engineering/ETL** → `data-engineering-etl/apache-kafka.mdx` (long, multipart) or `debezium.mdx` (short, two-part)
   - **Observability/alerting** → `observability-alerting/grafana.mdx`
   - **Workflow orchestration** → `data-engineering-etl/apache-airflow.mdx`

Match the depth and tone of an existing page in the same category. Don't invent a new structure.

## Identify the product

Pin down the canonical product name and its kebab-case slug before anything else — they reappear in title, intro, prereqs, verify section, success line, sidebar label, file path, and logo filename.

- If a product name was passed as argument, normalize it (`kafka` → `Apache Kafka`, slug `apache-kafka`) and confirm via `AskUserQuestion`.
- Otherwise ask: "What's the canonical product name?" and derive the slug (lowercase, spaces and `/` → `-`, punctuation dropped).

Record:

- **Product name** — vendor's preferred casing (`Apache Kafka`, `Power BI`, `pgAdmin`). Used in prose, title, sidebar label, success line.
- **Product slug** — kebab-case. Used in file path, logo filename, `RelatedContentCard href`.
- **Vendor URL** — for the one-liner.

Pre-fill exactly one sentence at the top of the body: a vendor-linked one-liner about what the product is. Example: *"[Apache Kafka](https://kafka.apache.org/) is a distributed event streaming platform used for high-performance data pipelines, streaming analytics, and data integration."* Stop there. The "This page shows you how to..." sentence is procedural content — handle it per mode below.

## Modes of operation

Ask via `AskUserQuestion` which mode applies:

| Mode | Choose when |
|---|---|
| Scaffold | The user knows the integration steps and wants the template pre-processed — frontmatter resolved, structure laid down, placeholders to fill in. |
| Full draft | The agent writes the body content from a source URL (vendor docs, GitHub example, blog post) or general product knowledge. |

The deployment-scope question, cloud-platform follow-up, logo question, sidebar entry, and `pnpm build` pass run in **both** modes.

### Scaffold mode

Resolve from up-front answers: frontmatter (title, description, `integrationPlatforms`, sidebar label, category), imports, prereq partial choice, product name everywhere it appears, vendor one-liner, success line, sidebar entry.

For everything procedural — part headings, `NumberedItem` titles, body lines, code blocks, verify steps — **copy `_template-integration.mdx` verbatim**, preserving every parenthesized placeholder for the user to fill in. Don't invent part headings ("Configure your database" is a guess unless the user said so), and don't write SQL, CLI commands, or connection examples.

If you find yourself typing a real heading like *"Create a hypertable"* or a real `CREATE TABLE`, you've drifted into full-draft mode — stop.

### Full-draft mode

After the up-front questions, ask the user for a source: vendor integration page URL, GitHub example repo, existing draft, or blog post.

- **Source provided:** adapt it. Extract real commands, sequence, prereqs, then write a full draft. In your final reply, list parts you couldn't verify against the source.
- **No source:** improvise from general product knowledge. In your final reply, state explicitly that the content is unverified and every command needs to be reviewed.

Warnings about uncertainty go in your reply to the user, not into the published page as `Callout` blocks. The published doc reads as confident prose with placeholders only where the user still needs to fill in.

## Confirm deployment scope

Ask via `AskUserQuestion` which Tiger Data deployment(s) this integration supports. The answer drives frontmatter, prereq partial, title, prose constants, and whether to use `<Tabs>`.

| Scope | `integrationPlatforms` | Prereq partial | Title pattern | Constants in prose | `<Tabs>`? |
|---|---|---|---|---|---|
| Tiger Cloud only | cloud platforms (follow-up) | `_prereqs-cloud-no-connection.mdx` | Integrate `<Product>` with Tiger Cloud | `{C.SERVICE_LONG}`, `{C.CLOUD_LONG}` | No |
| Self-hosted only | `[self-hosted]` | `_prereqs-self-instance.mdx` | Integrate `<Product>` with TimescaleDB | `{C.SELF_LONG}`, `{C.TIMESCALE_DB}` | No |
| Cloud-primary, self-hosted parity assumed | cloud platforms + `self-hosted` | `_prereqs-cloud-and-self.mdx` | Integrate `<Product>` with Tiger Cloud | Lead with `{C.SERVICE_LONG}`; partial adds parity note | No |
| Both equally supported, identical steps | cloud platforms + `self-hosted` | `_prereqs-cloud-or-self.mdx` | Integrate `<Product>` with Tiger Data | "your service or database" | No |
| Both equally supported, diverging steps | cloud platforms + `self-hosted` | `_prereqs-cloud-or-self.mdx` | Integrate `<Product>` with Tiger Data | Per-tab: `{C.CLOUD_LONG}` / `{C.SELF_LONG}` | Yes; labels `Tiger Cloud` / `Self-hosted TimescaleDB` |

If the scope is "Both equally supported", follow up with `AskUserQuestion` to distinguish **identical steps** (single body, no `<Tabs>`) from **diverging steps** (page-level `<Tabs>`, see [Bilateral parts](#bilateral-parts)).

If the scope includes Tiger Cloud, follow up to pin cloud platforms: AWS only → `[aws]`, Azure only → `[azure]`, both → `[aws, azure]`. Skip when the scope is Self-hosted only.

## File location

`src/content/docs/integrate/<category>/<slug>.mdx`. `<category>` is one of:

| Folder | For products that... |
|---|---|
| `bi-vizualization` | Visualize data or build dashboards (Tableau, Power BI) |
| `code` | Help developers write app code against the database |
| `configuration-deployment` | Provision, deploy, or manage infrastructure |
| `connectors` | Are Tiger Data native source/destination connectors |
| `data-engineering-etl` | Move, transform, or orchestrate data (Kafka, Airflow, Debezium) |
| `data-ingestion-streaming` | Ingest or stream data into the database (Fivetran, HiveMQ) |
| `observability-alerting` | Monitor, alert on, or scrape metrics/logs (Grafana, Prometheus, Datadog) |
| `query-administration` | Manage queries, schemas, or admin tasks |
| `secure-connectivity` | Add network or auth security on top of connections |

If no category fits, ask before inventing a new folder.

## Frontmatter

Match existing pages — strings unquoted unless they contain `:` or `[`, arrays inline:

```yaml
---
title: Integrate <Product name> with <Tiger Data product>
description: One-sentence SEO-optimized description, sentence case, ends in a period
integrationCategory: <category folder slug>
integrationPlatforms: [<subset of: aws, azure, self-hosted>]
integrationIndustry: [<industry 1>, <industry 2>, <industry 3>]
keywords: [<topic 1>, <topic 2>, <topic 3>, <topic 4>, <topic 5>]
integrationCardLogo: <product-slug>.png
sidebar:
  label: <Third-party product name>
---
```

- `integrationPlatforms` is a strict enum (`aws`, `azure`, `self-hosted`) validated by `src/content.config.ts`.
- `integrationIndustry` is free-form — 2–3 realistic verticals, don't pad.
- `keywords` — 4–7 phrases readers would actually search for; include the product name plus its function.
- `integrationCardLogo` is optional. See [Logos and images](#logos-and-images).

## Imports — required vs optional

Always required:

```tsx
import * as C from "@constants";
import { Prerequisites } from "@components/Prerequisites";
import { NumberedList, NumberedItem } from "@components/NumberedList";
import IntegrationPrereqs from "@partials/<path-to-prereq-partial>.mdx";
```

Pick the prereq partial based on deployment scope:

| Partial | Use when |
|---|---|
| `_prereqs-cloud-and-self.mdx` | Same steps work on Tiger Cloud and self-hosted |
| `_prereqs-cloud-or-self.mdx` | Reader picks Tiger Cloud OR self-hosted (two equal paths) |
| `_prereqs-self-instance.mdx` | Self-hosted only |
| `_prereqs-cloud-no-connection.mdx` | Console-only workflow inside Tiger Cloud |

Also import `<ConnectionDetails />` when the procedure asks the reader to plug `host`/`port`/`dbname`/`user`/`password` into the third-party tool. The decision is about what the steps below require, not which prereq partial you picked.

Only import below what you actually use — the build flags unused imports:

```tsx
import { Callout } from "@stainless-api/docs/components";                                  // scope callouts, warnings
import { RelatedContentCards, RelatedContentCard } from "@components/RelatedContentCards"; // Next steps section
import ConnectionDetails from "@partials/_prereqs-connection-details.mdx";                 // inside Prerequisites
import { Image } from "astro:assets";                                                      // optimized images
import { Tabs, TabItem } from "@astrojs/starlight/components";                             // parallel paths (Cloud vs self-hosted)
```

## Page layout (top → bottom)

1. **Intro paragraph** — what the product does, plus one sentence on what this page shows.
2. **Optional scope `Callout`** (`variant="note"`) — only when the product has multiple integration paths and this page covers one of them. Example: *"This page covers the self-managed Apache Kafka path. If your Kafka cluster runs on Confluent Cloud, use the fully managed connector in {C.CONSOLE} instead."*
3. **"In this integration guide, you:" bullets** — short verb-led outcomes.
4. **`<Prerequisites context="integration">`** — `<IntegrationPrereqs />`, then `<ConnectionDetails />` if applicable, then product-specific bullets (account, install, version). Always link installation pages.
5. **One or more parts** — see [Bilateral parts](#bilateral-parts).
6. **`## Verify the integration`** — two concrete end-to-end steps; one usually triggers something on the third-party side, the other confirms on the database side.
7. **Success line** — "You have successfully integrated <Product> with <Tiger Data product>."
8. **Optional `## Troubleshooting`** — specific gotchas, one-line cause/fix; link `/integrate/troubleshooting` for general issues.
9. **Optional `## Limitations`** — what isn't supported.
10. **Optional `## Next steps`** — `RelatedContentCards` linking to related pages.

## Bilateral parts

Most integrations split into two parts: one for the third-party side, one for the database side. Use `##` headings that name the outcome — never `## Step 1:`. The `NumberedList` inside the section does the numbering.

Typical shapes:

- **Configure `<tool>` + Prepare your service** — Kafka (install + sink connector on tool side, hypertable on db side)
- **Configure your database + Configure `<tool>`** — Debezium (publication on db side, connector on tool side)
- **Single bilateral step** — Tableau (one part is enough)

If the integration has a discrete data-movement step (send a test message, run a DAG, kick off a sync), that becomes a third part.

Inside each part:

```mdx
<NumberedList>
  <NumberedItem title="Verb-phrase title for the sub-step">

    What the reader does. Use [connection details](/integrate/find-connection-details) when referring to `host`, `port`, `dbname`, `user`, `password`.

    ```sql
    -- code if needed
    ```

    What the reader should see or verify after this sub-step.

  </NumberedItem>
</NumberedList>
```

If a sub-step has its own numbered sequence, write every item as `1.` inside the `NumberedItem` body — the renderer styles them as `a.`, `b.`, `c.` at the nested level. Don't nest a second `NumberedList`.

### Diverging Tiger Cloud vs self-hosted steps

When the scope is "Both equally supported, diverging steps", wrap the entire procedural body — from the first part heading through `## Verify the integration` — in a single page-level `<Tabs>` block. Shared content (intro, outcomes, `<Prerequisites>`, Troubleshooting, Limitations, Next steps) stays outside.

```mdx
<Tabs>
  <TabItem label="Tiger Cloud">
    {/* parts + verify section, copying placeholder wording from _template-integration.mdx; use {C.CLOUD_LONG} */}
  </TabItem>
  <TabItem label="Self-hosted TimescaleDB">
    {/* same shape; use {C.SELF_LONG} */}
  </TabItem>
</Tabs>
```

Tab labels are the Tiger Data product names exactly: `Tiger Cloud` and `Self-hosted TimescaleDB`. Reuse the template's placeholder wording inside each `<TabItem>` — don't invent new phrasing for the tabbed variant.

## Constants — required

```tsx
import * as C from "@constants";
```

Use the matching constant for every product, brand, or term it covers. The full list lives in `src/constants.ts` — read it directly. Common ones: `{C.PG}` (PostgreSQL), `{C.CLOUD_LONG}` (Tiger Cloud), `{C.SERVICE_LONG}` (Tiger Cloud service), `{C.SELF_LONG}` (self-hosted TimescaleDB), `{C.TIMESCALE_DB}`, `{C.CONSOLE}`, `{C.HYPERTABLE}`, `{C.COMPANY}`.

Never hardcode a product or brand name in prose when a constant exists. The `TigerData.ProductConstants` Vale rule (run by the `vale.yml` CI check) nudges literal product/brand names toward their constant, including `{C.PG}` for PostgreSQL/Postgres. Inside backticks or URLs, the literal string is fine.

In `NumberedItem` titles, use a template literal when interpolating:

```mdx
<NumberedItem title={`Connect to your ${C.SERVICE_LONG}`}>
```

Preserve inline backticks in titles — they render correctly.

## Authoring rules

- **Headings are sentence case.** Proper nouns and acronyms excepted. The `Google.Headings` Vale rule (run by the `vale.yml` CI check) enforces this.
- **No `## Step N:` prefix.** `NumberedList` handles numbering; use plain verb-phrase headings.
- **No `---` horizontal rules.** Section headings already separate content.
- **No Latinisms.** "for example" not "e.g.", "that is" not "i.e.", "and so on" not "etc.", "versus" not "vs.".
- **No emojis** unless asked.
- **Every code block needs context.** Tell the reader where to run it, what it does, what to expect.
- **Cross-link liberally.** Link `/integrate/find-connection-details` when referring to `host`/`port`/etc.; link concept pages in `/learn/...` when introducing concepts.
- **No backwards-compat scaffolding.** Delete optional sections that don't apply.
- **No deprecated compression APIs.** See [Use current columnstore/hypercore APIs](#use-current-columnstorehypercore-apis).

## Use current columnstore/hypercore APIs

TimescaleDB 2.18.0 renamed the compression API to columnstore/hypercore (`compress_chunk` → `convert_to_columnstore`, `*_compression_policy` → `*_columnstore_policy`, `timescaledb.compress` → `timescaledb.enable_columnstore`, etc.). The old names still work as backwards-compat aliases but **must not appear in new integration guides** — in prose, SQL, CLI examples, connector configs, dbt models, or screenshots. If you're adapting from a vendor doc or source URL that uses the old names, translate as you write.

Full mapping table, carve-outs (`compress_chunk_time_interval` and `compress_sparse_index` are NOT deprecated), and verification grep one-liner live in `.claude/references/deprecated-compression-apis.md`. Read that file before writing SQL or pasting third-party config, and again before saving the page.

## Logos and images

### Card logo

Ask via `AskUserQuestion` whether the user has a logo:

| Option | What to do |
|---|---|
| Light + dark variants | Save both to `src/assets/images/integrate/card-logos/` as `<product-slug>.png` and `<product-slug>-dark.png`. Set both `integrationCardLogo` and `integrationCardLogoDark` in frontmatter. |
| Light only | Save `<product-slug>.png`. Set `integrationCardLogo` in frontmatter; omit `integrationCardLogoDark`. |
| No file yet | Omit `integrationCardLogo` entirely — the overview card falls back to initials in a colored badge. Optionally set `integrationCardInitials` to override the default initials (for example, `λ` for AWS Lambda). |

### Screenshots and illustrations

Save to `src/assets/images/integrate/<category>/<descriptive-name>.png`. Import with `astro:assets`:

```tsx
import { Image } from "astro:assets";
import imgFoo from "../../../../assets/images/integrate/<category>/<file>.png";

<Image src={imgFoo} alt="Descriptive alt text" />
```

See `src/assets/images/README.md` for the project's image conventions, including the integration-screenshot layout and light/dark-mode versions.

## Components reference

| Component | Source / docs |
|---|---|
| `Callout` | `src/components/Callout.astro` — variants are exactly `tip`, `note`, `important`, `warning`, `callout` (CTA with button). No `info`/`success`/`danger`/`caution` — any other value is an authoring error. |
| `NumberedList` / `NumberedItem` | `src/components/NumberedList.tsx` — `NumberedItem` accepts `title: string` |
| `Prerequisites` | `src/components/Prerequisites.tsx` — pass `context="integration"` |
| `RelatedContentCards` / `RelatedContentCard` | `src/components/RelatedContentCard.tsx`; per-page right-rail guide in `src/components/LearnMore.README.md` |
| `Tabs` / `TabItem` | `@astrojs/starlight/components` (NOT Stainless) — https://starlight.astro.build/components/tabs/ |
| `Image` | `astro:assets` — https://docs.astro.build/en/guides/images/ |

## After writing the page

1. **Add a sidebar entry** in `astro.config.ts` under the matching category in the "Integrate" tab. Insert alphabetically within the category:

   ```ts
   { label: "<Product name>", link: "/integrate/<category>/<slug>" },
   ```

2. **Place the card logo** in `src/assets/images/integrate/card-logos/` if the user provided one.

3. **Run the build:**

   ```bash
   pnpm build
   ```

   Fix anything flagged — MDX errors show as `Element type is invalid: undefined` or `Expected component X to be defined`. Prose, product-constant, and heading checks run separately via Vale (`pnpm lint:prose`, or the `vale.yml` CI check on changed lines), not as part of `pnpm build`.

## Checklist before finishing

- [ ] File at `src/content/docs/integrate/<category>/<slug>.mdx`
- [ ] Frontmatter has title, description, integrationCategory, integrationPlatforms (subset of enum), integrationIndustry, keywords, integrationCardLogo, sidebar.label
- [ ] Required imports present; optional imports only present if used
- [ ] Prereq partial matches the deployment scope
- [ ] `<ConnectionDetails />` rendered if and only if the procedure asks the reader to enter db credentials into the third-party tool
- [ ] Intro is one paragraph + "In this integration guide, you:" bullets
- [ ] Parts use plain verb-phrase headings — no "Step N:" prefix
- [ ] `Verify the integration` section has two concrete steps
- [ ] All product names use `{C.CONSTANT}` — no hardcoded "PostgreSQL" / "Tiger Cloud" / "TimescaleDB" in prose
- [ ] No deprecated compression APIs — grep is clean (see [the mapping](#use-current-columnstorehypercore-apis))
- [ ] Headings are sentence case; no `---` rules, Latinisms, or emojis
- [ ] Every code block has surrounding context
- [ ] Card logo handled (file in `card-logos/` and `integrationCardLogo` set, or field omitted for initials fallback)
- [ ] Sidebar entry added in `astro.config.ts`, alphabetical within category
- [ ] `pnpm build` passes