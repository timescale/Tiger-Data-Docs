---
name: apply-constants
description: Apply the constants from src/constants.ts to a docs page — scan the page, swap every literal that matches a constant value (PostgreSQL, Tiger Cloud, TimescaleDB, hypertable, chunk, columnstore, service, and so on) for its {C.X} constant in the correct MDX/JSX syntax, add the import if missing, then verify the page renders. Use when asked to "apply constants/variables", "use the constants", or "swap literals for C.X" on an existing .md/.mdx page.
user-invocable: true
allowed-tools: Read Grep Glob Edit Bash
argument-hint: "[path to the .md/.mdx page]"
effort: medium
---

# Apply constants to a docs page

You are editing one existing docs page so that literal product, brand, and feature names use the centralized `{C.X}` constants from `src/constants.ts`, in the correct syntax for where each name appears. Then you verify the page still renders.

Apply **every** constant that matches — product and brand names (PostgreSQL, Tiger Cloud, TimescaleDB, Tiger CLI, MST, pgai, …) **and** feature/service/common nouns (hypertable, chunk, columnstore, hypercore, continuous aggregate, service, job, …). If a literal in the prose matches a constant's value, swap it.

## Step 1 — Identify the page

The target page is the path passed as the argument (a file under `src/content/docs/` or `src/partials/`). If no path was given, ask which page. Read the whole file first.

## Step 2 — Build the full mapping from constants.ts

1. Read `src/constants.ts`. Each `export const NAME = '…'` (or a template literal like `` `${PRODUCT_PREFIX} Cloud` ``) gives you a literal string value and its constant name. Resolve the template literals to their final text (for example `CLOUD_LONG` → `Tiger Cloud`, `SELF_LONG` → `self-hosted TimescaleDB`).
2. Build a literal→`C.NAME` map from **all** the exports, except the `// URLS` section and email/URL values (`WEBSITE_DOCS`, `CONTACT_SALES`, `CONSOLE_URL`, and similar) — those are link targets, not prose to swap.
3. `.github/styles/TigerData/ProductConstants.yml` already lists the product/brand subset in correct precedence order; use it for those, and extend with the feature/common-noun constants from `constants.ts`.
4. **Match longest-to-shortest and case-sensitively.** Compound names win over substrings ("Tiger Cloud SQL editor" before "Tiger Cloud" before "Console"; "self-hosted TimescaleDB" before "TimescaleDB"). "Service" and "service", "Chunk" and "chunk" are different constants (`_CAP` vs not) — pick the one matching the literal's case. Never double-swap a substring you already swapped inside a longer match.

## Step 3 — Apply each match in the correct syntax

Where the literal appears determines the syntax:

| Location | Syntax | Example |
| --- | --- | --- |
| Body prose | `{C.X}` | `Tiger Cloud is fast` → `{C.CLOUD_LONG} is fast` |
| Headings (`##`) | `{C.X}` | `## About TimescaleDB` → `## About {C.TIMESCALE_DB}` (resolved by a remark plugin) |
| Markdown table cells | `{C.X}` | `| PostgreSQL | …` → `| {C.PG} | …` |
| JSX prop, whole value | `prop={C.X}` | `<Foo title="Tiger Cloud" />` → `<Foo title={C.CLOUD_LONG} />` |
| JSX prop, mixed text | `prop={`… ${C.X} …`}` | `description="Use Tiger Cloud"` → ``description={`Use ${C.CLOUD_LONG}`}`` |

Possessives and plurals keep the trailing letters outside the constant: `TimescaleDB's` → `{C.TIMESCALE_DB}'s`; `hypertables` → `{C.HYPERTABLE}s`.

### Never change these — leave the literal as written

- **Frontmatter** (everything between the opening `---` and closing `---`). It is YAML and cannot interpolate `{C.X}`; `title:` and `description:` stay literal.
- **Inside backticks / code spans** — `` `timescaledb.compress` ``, `` `pg_textsearch` ``.
- **Inside fenced code blocks** (```` ``` ````), including SQL, shell, and config.
- **URLs and link targets** — `https://www.tigerdata.com`, `(/deploy/tiger-cloud/...)`.
- **Image alt text** — the `alt` in Markdown `![alt text](src)`. It's a plain string, not a JSX expression, so `{C.X}` there renders literally as the characters `{C.X}`. Leave the alt literal (and leave the `src` path alone too).
- **`import` / `export` lines.**
- **Component prop values that aren't display names** — for example `product="tsdb"` in `<SinceRelease product="tsdb" />`.
- **Anything already using `{C.X}`** — don't touch existing constants.

### Use judgment on genuinely generic words

Some constant values are ordinary English (`job`, `service`, `chunk`, `Scale`, `Performance`, `Free`). Swap them when they refer to the product concept (in these docs they almost always do). Leave them literal only when the word is plainly generic and unrelated (for example "a background job scheduler in general", or "free of charge"). When unsure, prefer swapping — that is the point of this skill.

## Step 4 — Add the import if missing

If you changed anything and the file doesn't already import the constants, add this once, right after the frontmatter (grouped with any other `import` lines):

```tsx
import * as C from "@constants";
```

If the file already has `import * as C from "@constants";`, leave it. Partials and pages use the same import.

## Step 5 — Verify the page renders

`{C.X}` used without the import (or wrong syntax) breaks the MDX render, so rendering the page is the real test.

1. Start the dev server in the background (run_in_background):
   ```bash
   pnpm dev
   ```
2. Wait until it answers, then fetch the page you edited. Map the file path to a URL: drop `src/content/docs`, drop the `.mdx`/`.md` extension, and drop a trailing `/index`. For example `src/content/docs/reference/timescaledb/continuous-aggregates/alter_materialized_view.mdx` → `http://localhost:4321/reference/timescaledb/continuous-aggregates/alter_materialized_view`.
   ```bash
   until curl -sf -o /dev/null http://localhost:4321/; do sleep 2; done
   curl -s -o /tmp/page.html -w '%{http_code}\n' '<page-url>'
   ```
3. The page renders cleanly when the status is `200` and the HTML has no error overlay. Check:
   ```bash
   grep -iE 'astro-error|vite-error|is not defined|Cannot read|MDXError' /tmp/page.html && echo "RENDER ERROR" || echo "OK"
   ```
   A common failure is `C is not defined` — that means a `{C.X}` was added without the import (Step 4).
4. Stop the background dev server when done.

For a stronger, all-pages compile check you can additionally run `pnpm build` (it fails on any MDX/component error). Use it if the page imports partials you also touched.

## Step 6 — Report

Summarize what you swapped: each literal → constant and how many occurrences, anything intentionally left as a literal (code spans, frontmatter, URLs, genuinely generic words), and the render result.

## Checklist

- [ ] Read the whole page and `src/constants.ts` + `ProductConstants.yml`
- [ ] Built the full literal→constant map (product/brand **and** feature/common nouns)
- [ ] Longest-match-first, case-sensitive; no double-swapped substrings
- [ ] Correct syntax per location (prose vs JSX prop vs template literal)
- [ ] Left frontmatter, code spans, fenced code, URLs, image alt text, imports, and `product="…"` props untouched
- [ ] Added `import * as C from "@constants";` if it was missing and is now needed
- [ ] Page renders (200, no error overlay); dev server stopped
- [ ] Reported swaps and anything intentionally left literal