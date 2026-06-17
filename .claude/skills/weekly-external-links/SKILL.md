---
name: weekly-external-links
description: Pull recent content from Tiger Den (Tiger Data's marketing content hub), match it to docs pages, and draft learnMore right-rail cards on a review branch. Use for the recurring "add new external links to the docs" task, or when asked to refresh learnMore cards from recent blog/video/customer content.
user-invocable: true
allowed-tools: Read Grep Glob Edit Write Bash
argument-hint: "[--days N] (default 7)"
effort: high
---

# Weekly external-links refresh

Gather content published in the **last N days** (default 7) from **Tiger Den**,
match it to docs pages, and write `learnMore` right-rail cards onto a **review
branch**. A human reviews the branch; the skill never merges.

Background on the `learnMore` card: [`src/components/LearnMore.README.md`](../../../src/components/LearnMore.README.md).

## Source: Tiger Den (single source of truth)

[Tiger Den](https://den.tigerdata.com) is Tiger Data's marketing content hub. It
tracks every blog post, YouTube video, case study, whitepaper, podcast, and
third-party / KOL publication as a "content item", which makes it the single
source for this refresh: one place to read everything that was published.

Access is the read-only **`TIGER_DEN_TOKEN`**. The matching step uses
**`ANTHROPIC_API_KEY`**. Both
live in the gitignored `.env` locally (see `.env.example`) and as repository
secrets for the scheduled run.

## Pipeline

Four scripts under `scripts/`, run from the repo root. All are zero-dependency
(Python stdlib only), so no install step is needed:

```bash
DAYS=7   # or the value passed in args
mkdir -p .learnmore-work

# 1. Fetch recent content from Tiger Den (token auth, paginated, normalized).
python3 .claude/skills/weekly-external-links/scripts/fetch_tiger_den.py \
    --days "$DAYS" --out .learnmore-work/tiger-den.json

# 2. Build the docs page catalog. Excludes the `reference` section by default
#    (cards never belong on function-reference pages, and skipping it roughly
#    halves the catalog and the matching cost). Captures existing learnMore links.
python3 .claude/skills/weekly-external-links/scripts/build_doc_catalog.py \
    --out .learnmore-work/catalog.json

# 3. Match + compose cards. Calls the Claude API (Opus 4.8, structured output,
#    streaming) to curate, match to pages, and draft the final card link sets.
python3 .claude/skills/weekly-external-links/scripts/match_content.py \
    --items .learnmore-work/tiger-den.json \
    --catalog .learnmore-work/catalog.json \
    --out .learnmore-work/mapping.json

# 4. Apply the drafted cards into page frontmatter.
python3 .claude/skills/weekly-external-links/scripts/apply_cards.py \
    --mapping .learnmore-work/mapping.json \
    --catalog .learnmore-work/catalog.json

# Optional: render a Markdown summary (used as the PR body on scheduled runs).
python3 .claude/skills/weekly-external-links/scripts/render_report.py \
    .learnmore-work/mapping.json > .learnmore-work/report.md
```

### Tuning knobs (environment variables)

- `MAX_LINKS_PER_CARD` (default `4`): hard cap on total links per card.
- `ANTHROPIC_MODEL` (default `claude-opus-4-8`): the matching model. Opus is the
  most careful at the editorial judgment; `claude-sonnet-4-6` roughly halves cost
  with some quality tradeoff.
- `build_doc_catalog.py --exclude` (default `reference`): comma-separated sections
  to skip. Pass `--exclude ''` to include everything.

## The editorial rules (enforced in the matcher prompt)

These were set by the docs owner. The matcher applies them; the cap is also
enforced in code as a safety net.

- **Curate first.** Drop pgai Vectorizer content (deprecated), Ghost / Agentic
  Postgres content (different product), and pure social one-liners.
- **Hard cap: at most `MAX_LINKS_PER_CARD` (4) links per card**, counting existing
  plus new. Never exceed it.
- **At least 2 links per card.** If a topic can't reach two, it's dropped.
- **Replace, don't pile on.** For a page that already has a card, the matcher
  starts from its existing links and folds in the new one(s); if that would
  exceed the cap, it drops the weakest or oldest existing links to make room,
  preferring a newer/more-direct link over an older one. The card's `links` are
  the **final** set, and `apply_cards.py` replaces the page's relatedPosts list
  with it (existing links it keeps are reproduced verbatim, so diffs stay small).
- **At most 2 customer stories per card.**
- **No external-contributor names in labels** (drop "(Justin Mitchel)"). Customer
  names inside a customer-story label are fine.
- **No em dashes** (house style). Video labels are prefixed `Video: `.

The card lands in `relatedPosts` (external-link icon, opens in a new tab):

```yaml
learnMore:
  relatedPostsHeading: Related resources   # or "Watch" / "Related reading"
  relatedPosts:
    - label: "A blog post title"
      href: https://www.tigerdata.com/blog/...
    - label: "Video: a descriptive title"
      href: https://www.youtube.com/watch?v=...
```

## Run types

### Local / interactive

Run the pipeline, then review the working tree directly. Verify before handing off:

```bash
pnpm build:local        # must succeed
pnpm lint:prose         # 0 errors in your additions
grep -rn '—' src/content/docs --include='*.mdx' | grep -E 'label:|relatedPostsHeading:'   # must be empty
```

Leave the changes uncommitted for the human to review. Do not commit, push, or
open a PR. Clean up `.learnmore-work/` when done (it's scratch; never commit it).

### Scheduled (GitHub Action)

`.github/workflows/weekly-external-links.yml` runs the pipeline weekly (and on
manual dispatch), then opens a **pull request** against `main` with the drafted
cards and a summary body. It never pushes to or merges `main`. Required repository
secrets: `TIGER_DEN_TOKEN`, `ANTHROPIC_API_KEY`, and `ORG_AUTOMATION_TOKEN` (the
existing token used by the other PR-opening workflows).

## Cost

The only paid step is the matcher (one Claude API call per run). At Opus 4.8
rates this is roughly **$0.50-1.00 per weekly run** (~$3/month). The Tiger Den
fetch and catalog build are free. Lower it with `ANTHROPIC_MODEL=claude-sonnet-4-6`
if needed.

## Idempotency

`build_doc_catalog.py` records each page's existing links, and the matcher folds
them into the final set, so re-running does not duplicate links on a page. An
item already represented on its target page with nothing better to add is dropped.