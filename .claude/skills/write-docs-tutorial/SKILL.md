---
name: write-docs-tutorial
description: Write a tutorial for the Tiger Data Docs site following established conventions. Use when creating a new tutorial, cookbook, or step-by-step guide for the /build/examples section — especially for database, search, AI, or data engineering topics.
user-invocable: true
allowed-tools: Read Grep Glob Edit Write Bash Agent
argument-hint: "[topic or source URL]"
effort: high
---

# Write a Tiger Data Docs tutorial

You are writing a tutorial for the Tiger Data Docs site (Astro + Starlight + Stainless Docs). Follow these conventions exactly.

## What you're building

A self-contained, step-by-step tutorial MDX file that lives in `src/content/docs/build/examples/`. The tutorial should be followable from scratch — a reader with no prior setup should be able to go from zero to a working result by following every step in order.

If given a source URL (e.g., a GitHub cookbook repo), adapt that content into the docs format. If given a topic, research the codebase and write from scratch.

## File structure

Create the tutorial at: `src/content/docs/build/examples/<slug>.mdx`

### Frontmatter

```yaml
---
title: <Action verb> <what the tutorial builds> — sentence case
description: One sentence, sentence case, for search and cards.
products: [cloud, self_hosted]
keywords: [tutorials, <topic>, <level>, <technologies>, ...]
---
```

### Imports — always include these

```tsx
import * as C from "@constants";
import { Callout } from "@stainless-api/docs/components";
import { NumberedList, NumberedItem } from "@components/NumberedList";
import { RelatedContentCards, RelatedContentCard } from "@components/RelatedContentCards";
import { Prerequisites } from "@components/Prerequisites";
```

## Page layout (in order)

1. **Opening hook** — A conversational sentence or two that frames why the reader cares. Add personality without being cheesy. Then a brief explanation of what the tutorial covers.

2. **GitHub repo callout** (if applicable) — Immediately after the opening, link to the source repo:
   ```mdx
   <Callout variant="tip">
     The complete source code for this tutorial is available in the
     [repo-name on GitHub](https://github.com/...).
     You can clone the repository to get started quickly, or follow this tutorial step by
     step to build everything from scratch.
   </Callout>
   ```

3. **Bullet point summary** — What the two (or more) technologies/approaches do, with a touch of personality.

4. **"By the end" list** — Learning objectives as bullet points.

5. **Prerequisites component**:
   ```mdx
   <Prerequisites>
   - A [Tiger Cloud service](/get-started/quickstart/create-service) running PostgreSQL 17+,
     or a [self-hosted instance](/get-started/choose-your-path/install-timescaledb)
   - Other requirements with install links
   </Prerequisites>
   ```

6. **Horizontal rule** — `---` to visually separate intro from tutorial steps.

7. **Steps** — Each major section is `## Step N: <Action phrase>`.

8. **Going further** — Production tips, advanced patterns.

9. **Current limitations** (if applicable).

10. **Next steps** — `RelatedContentCards` linking to related docs.

## Step conventions

### Headings

- Major sections: `## Step N: <Action phrase in sentence case>`
- Sub-sections within a step: `### <Phrase>`
- CI enforces **sentence case** headings. Proper nouns and acronyms are exceptions.

### Numbered sub-steps

Use `NumberedList` and `NumberedItem` for sequential procedures within a step:

```mdx
<NumberedList>
<NumberedItem title="Do the thing">

Explanation of what to do and why.

\`\`\`sql
-- the code
\`\`\`

What the user should see or verify after this step.

</NumberedItem>
</NumberedList>
```

### Code snippets — ALWAYS add context

Every code block MUST have surrounding text that tells the reader:
- **Where to run it**: "Run the following SQL in your SQL client", "In your terminal, run...", "In the same SQL session..."
- **What it does**: Brief explanation of what the code accomplishes
- **What to expect**: Expected output or what to verify after running

Never drop a bare code block without context.

### Callout variants

- `variant="tip"` — Helpful shortcuts, alternative approaches
- `variant="note"` — Important context, supplementary info
- `variant="warning"` — Security concerns (.env files, secrets), destructive actions

### Collapsible sections

Use `<details>`/`<summary>` for:
- Multiple setup options (e.g., Tiger Cloud vs Docker vs manual install)
- Alternative paths (clone repo vs build from scratch)
- Verbose content that not every reader needs

The **default path should be from scratch** (not collapsed). The shortcut/clone path should be the collapsible one.

```mdx
<details>
<summary>**Already cloned the repo?** Skip to the shortcut</summary>

Shortcut content here...

</details>

Follow the steps below to build from scratch.
```

## Constants — CRITICAL

Import constants once at the top of every tutorial:

```tsx
import * as C from "@constants";
```

Then use the matching constant for every product, brand, or term it covers. **The full list of available constants lives in `src/constants.ts` — read it directly when you need to find the right key, and treat that file as the source of truth.** Common ones include `{C.PG}` (PostgreSQL), `{C.CLOUD_LONG}` (Tiger Cloud), `{C.TIMESCALE_DB}`, `{C.SERVICE_LONG}` (Tiger Cloud service), `{C.SELF_LONG}` (self-hosted TimescaleDB), `{C.CLOUD_EDITOR}` (Tiger Cloud SQL editor), `{C.PGVECTORSCALE}`, and `{C.COMPANY}` (Tiger Data) — but any constant defined in `constants.ts` is fair game when it matches what you're writing.

**Never hardcode** a product or brand name in prose when a constant exists for it. The `lint:postgresql-variable` CI check specifically enforces `{C.PG}`.

**Exception:** Inside backticks or URLs, use the literal string. Extension names that appear as code (`pg_textsearch`, `pgvectorscale`) should be in backticks in prose for consistent formatting.

## .env file handling

When a tutorial involves environment variables:
1. Explain that the user should **create** (or **duplicate from .env.example**) a `.env` file
2. Include a **warning callout** about adding `.env` to `.gitignore`
3. Explain **what each variable is for** (not just what to set)
4. Show connection variables for both local and Tiger Cloud scenarios

## Cross-linking

Link to existing docs wherever relevant:
- `/learn/search/using-pg-textsearch` — BM25 concepts
- `/learn/search/pgvector-pgvectorsearch` — vector search concepts
- `/reference/pgvectorscale/` — StreamingDiskANN reference
- `/get-started/quickstart/create-service` — creating a service
- `/get-started/choose-your-path/install-timescaledb` — self-hosted setup
- Deploy guides under `/deploy/tiger-cloud/`

Use `Grep` to find existing pages about the tutorial's technologies before writing.

## Tone and personality

- Write like a knowledgeable friend walking someone through the process
- Add light personality to transitions between steps ("Time to take your indexes for a spin", "Here's where things get interesting")
- Use analogies sparingly to explain complex concepts
- Keep the humor encouraging, never condescending
- The personality should enhance the reading experience without distracting from the technical content

## After writing the tutorial

You MUST also:

1. **Add a sidebar entry** in `astro.config.ts` under the "Tutorials" section (~line 514):
   ```ts
   { label: "<Tutorial title>", link: "/build/examples/<slug>" },
   ```

2. **Add a card** to `src/content/docs/build/examples/index.mdx`:
   ```mdx
   <RelatedContentCard title="<Title>" description={`<Description using ${C.CONSTANT} if needed>`} href="/build/examples/<slug>" />
   ```

3. **Add glossary entries** for any new terms introduced. Edit `src/lib/glossary-data.ts` and insert alphabetically. Use the appropriate category from: TimescaleDB, Storage, Time-series, Cloud, Security, Operations, Observability, AI & vectors, PostgreSQL, Data & migration.

4. **Verify the build** passes with `pnpm build`.

## Checklist before finishing

- [ ] Frontmatter has title (sentence case), description, products, keywords
- [ ] GitHub repo linked at top in a callout (if applicable)
- [ ] All product names use constants (no hardcoded "PostgreSQL" in prose)
- [ ] Extension names formatted in backticks consistently
- [ ] Every code block has context (where to run, what it does, what to expect)
- [ ] Prerequisites component lists all requirements with install links
- [ ] `---` separator between prerequisites and Step 1
- [ ] Steps numbered as `## Step N: <Action>`
- [ ] Default path is "from scratch", clone shortcut is collapsible
- [ ] .env handling includes gitignore warning
- [ ] Cross-links to related existing docs
- [ ] RelatedContentCards in Next steps section
- [ ] Sidebar entry added in astro.config.ts
- [ ] Card added to examples index page
- [ ] Glossary entries for new terms
- [ ] `pnpm build` passes cleanly
- [ ] Headings are sentence case
