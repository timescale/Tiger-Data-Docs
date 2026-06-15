---
name: weekly-external-links
description: Find external resources (Tiger Data blog posts, YouTube videos, and external/KOL posts) published in the last week, match them to relevant docs pages, and propose learnMore right-rail cards on a review branch. Use for the recurring "add new external links to the docs" task, or when asked to refresh learnMore cards from recent blog/video/community content.
user-invocable: true
allowed-tools: Read Grep Glob Edit Write Bash Agent WebSearch WebFetch
argument-hint: "[--days N] (default 7)"
effort: high
---

# Weekly external-links refresh

Gather external resources published in the **last N days** (default 7), match them to docs pages,
and write `learnMore` right-rail cards onto a **review branch** — never committing or pushing. The
human reviews the branch and the generated mapping file.

Background on the `learnMore` card: [`src/components/LearnMore.README.md`](../../../src/components/LearnMore.README.md).

## Sources

1. **Tiger Data blog** — `scripts/fetch_new_blog.py` (sitemap → real `article:published_time` filter).
2. **YouTube** — `scripts/fetch_new_youtube.py` (channel RSS, **UCPmHSkid9IOYbdN1Psh24lg**; the
   `@TigerData` handle is an unrelated personal channel — do not use it). RSS gives canonical URLs, so
   no URL-guessing. Caveat: RSS only exposes the latest ~15 uploads.
3. **External / community posts** — third-party coverage by external creators (videos, articles).
   - **Primary source: the `#feed-kol` Slack channel.** The marketing team funnels approved
     community/KOL posts into a dedicated Slack feed channel (named `feed-kol`, or similar). Read it
     with the Slack MCP tools: resolve the channel by name (`slack_search_channels`), then read its
     posts from the last N days and pull out the external links. The feed is human-approved, so it's
     the best source. The skill names only this topic feed channel — no people or account IDs.
   - **Fallback: web-search sweep.** Only when Slack MCP is not available (a user without access, or a
     headless/scheduled run), discover candidates with `WebSearch`/`WebFetch` instead. No auth, but
     lower precision than the curated feed. See step 3b.

## Procedure

### 1. Gather (run from repo root)

```bash
DAYS=7   # or the value passed in args
mkdir -p .learnmore-work
python3 .claude/skills/weekly-external-links/scripts/fetch_new_blog.py    --days "$DAYS" --out .learnmore-work/blog.json
python3 .claude/skills/weekly-external-links/scripts/fetch_new_youtube.py --days "$DAYS" --out .learnmore-work/youtube.json
python3 .claude/skills/weekly-external-links/scripts/build_doc_catalog.py            --out .learnmore-work/catalog.json
```

For external/community posts, prefer the `#feed-kol` Slack channel: with Slack MCP available, resolve
the channel by name (`slack_search_channels` for `feed-kol`), read its posts from the last N days, and
extract the external links. If Slack is not reachable, fall back to the web-search sweep in step 3b.

### 2. Curate (apply exclusions)

Drop, before matching:

- **pgai Vectorizer** content — Vectorizer is deprecated in Tiger Cloud
  (`/deploy/tiger-cloud/vectorizer-deprecation`). Never link promo content for deprecated features.
- **Ghost / Agentic Postgres** content — different product, not covered by these docs.
- **Pure social one-liners** (standalone X/LinkedIn posts with no substantive walkthrough). Keep
  substantive third-party tutorials and deep-dive articles.

Classify each surviving resource by **kind**: `video`, `blog post`, or `customer story` (a named-customer
narrative, whether blog or video — for example Glooko, MarketReader, CERN, Axpo, BioT).

### 3. Match to pages

Read `.learnmore-work/catalog.json`. For each resource, pick the **1–3 most relevant pages** by topic
(match resource title/tags/description against page title/description). Prefer the most specific page.
Conceptual `/learn`, task `/build`, integration `/integrate`, and `/migrate` pages are the usual homes;
function-level `/reference` pages are rarely a good fit. Customer stories belong on the relevant
feature/example/overview page, not scattered onto how-tos.

### 3b. Web-search fallback for community posts

Only when the `#feed-kol` channel is unreachable. Use `WebSearch` to find recent third-party coverage,
then `WebFetch` to confirm publish dates and substance. Keep only items from the last N days. Useful
queries:

- `TimescaleDB tutorial`, `TimescaleDB review`, `Tiger Data Postgres`
- `pg_textsearch`, `pgvectorscale`, `Tiger CLI`
- `site:youtube.com TimescaleDB`, `site:youtube.com Tiger Data`

Apply the step 2 curation, and be stricter than with the curated feed: keep substantive tutorials,
deep-dive articles, and named-customer stories; discard passing mentions and social one-liners. Note
in the report that the community source came from web search (lower precision than `#feed-kol`).

### 4. Compose cards (hard rules — these were set by the docs owner)

- **No one-link cards.** Every card must have **≥2 links**. Several links of the **same kind are fine**.
  If a topic only yields one resource, fold it into a related page's card or drop it.
- **At most 2 customer stories per page.**
- **All resources are external** → put them in `relatedPosts` (external-link icon, opens new tab).
  Prefix video labels with `Video:`.
- **No external-contributor names in labels** (e.g. drop "(Justin Mitchel)", "(DevopsToolbox)").
  Customer names inside customer-story labels are fine.
- **No em dashes** anywhere (house style, `TigerData.NoEmDash`). Use commas, colons, or "and".
- Frontmatter is plain YAML — **do not use `{C.X}` constants**; write product names out.
- Quote any label containing a colon.

Card shape:

```yaml
learnMore:
  relatedPostsHeading: Related resources   # or "Watch" (all videos) / "Related reading" (all articles)
  relatedPosts:
    - label: "A blog post title"
      href: https://www.tigerdata.com/blog/...
    - label: "Video: a descriptive title"
      href: https://www.youtube.com/watch?v=...
```

### 5. Add vs replace

- If a page has **no** `learnMore` block: add a new one (≥2 links).
- If a page **already has** one (`has_learnMore` / `existing_hrefs` in the catalog): **add** the new
  links if the card stays coherent and within the rules (≥2 links, ≤2 stories). Only **replace** an
  existing link when the new resource clearly supersedes it (for example a newer release post replacing
  an older one on the same feature). When in doubt, add rather than replace, and flag it in the mapping.
- Leave the pre-existing `build/examples/hybrid-search` card alone unless a new resource is a strong fit.

### 6. Branch, apply, verify

```bash
git checkout -b "docs/weekly-external-links-$(date +%Y-%m-%d)" main   # branch off main, never commit
```

Apply the cards by inserting each `learnMore:` block at the **end of the target file's frontmatter**
(just before the closing `---`). Then verify:

```bash
pnpm build:local        # must succeed
pnpm lint:prose         # must show 0 errors (warnings/suggestions in page bodies are pre-existing)
```

Confirm no em dashes landed in your additions:
`grep -rn '—' src/content/docs --include='*.mdx' | grep -E 'label:|relatedPostsHeading:'` should be empty.

### 7. Report

Write `LEARN-MORE-LINK-MAPPING.md` at the repo root summarizing: resources found per source, the
cards applied (page → links, with add/replace noted), anything dropped and why, and any URL-confidence
caveats. Then handle the branch per the run type (see Notes): local runs stay uncommitted for the
human to review; scheduled/cloud runs commit, push the branch, and open a PR against `main`.

## Notes

- Idempotency: the script reads current frontmatter, so re-runs won't duplicate an existing card on a
  page (skip pages whose `existing_hrefs` already include the resource URL).
- Clean up `.learnmore-work/` when done (it's scratch; do not commit it).
- **Local / interactive runs:** leave the changes on the branch for the human to review. Do not
  commit, push, or open a PR — the person reviews the working tree directly.
- **Headless / scheduled (cloud) runs:** the session is ephemeral, so commit the changes, **push the
  review branch**, and **open a pull request against `main`** (fill the repo's PR template). Never push
  directly to or merge `main`.