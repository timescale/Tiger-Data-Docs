# Right-rail `Learn more` sidebar card

A frontmatter-driven card that appears in the **right rail** of any docs page (below the table of contents) to point readers at related tutorials, blog posts, and an optional call-to-action button.

**No imports. No per-page wiring. No JavaScript.** Just add a `learnMore:` block to a page's frontmatter and the card renders itself. Omit it and the card stays hidden.

← Back to the [main README](../../README.md).

---

## Table of contents

1. [Quick start: copy-paste example](#quick-start-copy-paste-example)
2. [What it looks like and where it lives](#what-it-looks-like-and-where-it-lives)
3. [Frontmatter shape](#frontmatter-shape)
4. [Field reference](#field-reference)
5. [Variations and recipes](#variations-and-recipes) ← **most authors land here**
   - [Recipe 1: Tutorial page (full card)](#recipe-1-tutorial-page-full-card)
   - [Recipe 2: Concept page (related reading only)](#recipe-2-concept-page-related-reading-only)
   - [Recipe 3: Quickstart with a single CTA](#recipe-3-quickstart-with-a-single-cta)
   - [Recipe 4: Reference page (related guides)](#recipe-4-reference-page-related-guides)
   - [Recipe 5: Custom section headings](#recipe-5-custom-section-headings)
   - [Recipe 6: External versus internal links](#recipe-6-external-versus-internal-links)
   - [Recipe 7: Custom card title](#recipe-7-custom-card-title)
   - [Recipe 8: Tutorials-only or CTA-only](#recipe-8-tutorials-only-or-cta-only)
6. [Testing locally](#testing-locally)
7. [Troubleshooting](#troubleshooting)
8. [Real pages already using this](#real-pages-already-using-this)
9. [Architecture](#architecture)
10. [Theming](#theming)
11. [Figma](#figma)
12. [Gotchas](#gotchas)

---

## Quick start: copy-paste example

Open the page you want to add the card to. At the top, inside the existing `---` frontmatter block, paste this and edit the labels and hrefs:

```yaml
learnMore:
  tutorials:
    - label: Your first hypertable
      href: /build/how-to/your-first-hypertable/
    - label: Connect your app
      href: /get-started/quickstart/connect-your-app/
  relatedPosts:
    - label: Why use hypertables
      href: https://www.timescale.com/blog/why-hypertables/
  cta:
    label: Try for free
    href: https://console.cloud.tigerdata.com/signup
```

Save, run `pnpm dev`, and the card appears in the right rail. That's it.

---

## What it looks like and where it lives

The card renders inside the **right rail** (the column that holds the page's table of contents), pinned to the **bottom** of that column so it stays anchored even on long pages. On mobile and tablet (below 1024px) the right rail collapses, so the card hides automatically along with the TOC.

Visually:

```
┌─ Page content ───────────┬─ Right rail ─────────────┐
│                          │  On this page            │
│  # Article title         │   - Section 1            │
│                          │   - Section 2            │
│  Lorem ipsum…            │   - Section 3            │
│                          │                          │
│  ## Section 1            │                          │
│  …                       │                          │
│                          │  ┌──────────────────┐    │
│  ## Section 2            │  │ 🎓 Learn more    │    │
│  …                       │  │                  │    │
│                          │  │ Tutorials        │    │
│                          │  │  → Tutorial A    │    │
│                          │  │  → Tutorial B    │    │
│                          │  │                  │    │
│                          │  │ Related blog…    │    │
│                          │  │  ↗ Post X        │    │
│                          │  │                  │    │
│                          │  │ ┌─────────────┐  │    │
│                          │  │ │ Try for free│  │    │
│                          │  │ └─────────────┘  │    │
│                          │  └──────────────────┘    │
└──────────────────────────┴──────────────────────────┘
```

---

## Frontmatter shape

A single top-level `learnMore:` key with three optional children: `tutorials`, `relatedPosts`, and `cta`. Plus a few optional overrides for headings.

```yaml
---
title: My page title
description: My page description
learnMore:
  title: Learn more            # optional, defaults to "Learn more"
  tutorials:                   # optional list
    - label: Your first hypertable
      href: /build/how-to/your-first-hypertable/
    - label: Connect your app
      href: /get-started/quickstart/connect-your-app/
  tutorialsHeading: Tutorials  # optional, defaults to "Tutorials"
  relatedPosts:                # optional list
    - label: Why use hypertables
      href: https://www.timescale.com/blog/why-hypertables/
  relatedPostsHeading: Related blog posts  # optional, default shown
  cta:                         # optional single CTA button
    label: Try for free
    href: https://console.cloud.tigerdata.com/signup
---
```

**Every field is optional.** If `tutorials`, `relatedPosts`, and `cta` are all absent (or empty), the card hides itself completely, with no empty card and no broken layout.

---

## Field reference

| Field | Type | Default | Notes |
|---|---|---|---|
| `title` | string | `"Learn more"` | Card title shown next to the graduation-cap icon. |
| `tutorials` | `{ label, href }[]` | None | Internal tutorial-style links. Render with a right-arrow icon. |
| `tutorialsHeading` | string | `"Tutorials"` | Heading above the tutorials list. |
| `relatedPosts` | `{ label, href }[]` | None | External references (blog posts, articles, third-party docs). Render with an external-link icon. |
| `relatedPostsHeading` | string | `"Related blog posts"` | Heading above the related posts list. |
| `cta` | `{ label, href }` | None | A single outlined button at the bottom of the card. Solid fill on hover/focus. |

### URL handling

- **Relative URLs** (`/build/foo/`) render as in-site links and open in the same tab.
- **Absolute URLs** (`https://…`) automatically get `target="_blank"` and `rel="noopener noreferrer"`.

Detection is `^https?://` only. Protocol-relative (`//example.com`), `mailto:`, and `tel:` URLs all fall through to the in-site path. Always use a leading slash for in-site links so the relative-vs-absolute logic stays predictable.

---

## Variations and recipes

These are copy-paste-ready. Pick the closest match, drop it into your page's frontmatter, edit the labels and hrefs.

### Recipe 1: Tutorial page (full card)

The full card: next tutorials, related blog posts, and a sign-up CTA. Best for end-of-tutorial pages where you want to keep readers in the funnel.

```yaml
---
title: Build hybrid search with BM25 and vector similarity
description: Combine keyword search and semantic vector search in PostgreSQL.
learnMore:
  tutorials:
    - label: Understand pg_textsearch and BM25 search
      href: /learn/search/using-pg-textsearch/
    - label: Understand pgvector and pgvectorscale
      href: /learn/search/pgvector-pgvectorsearch/
    - label: Key vector database concepts
      href: /learn/search/key-vector-database-concepts/
  relatedPosts:
    - label: Hybrid search with pg_textsearch and pgvectorscale
      href: https://www.timescale.com/blog/hybrid-search/
    - label: Why we built pg_textsearch
      href: https://www.timescale.com/blog/pg-textsearch-bm25/
  cta:
    label: Try for free
    href: https://console.cloud.tigerdata.com/signup
---
```

This pattern is live on `src/content/docs/build/examples/hybrid-search.mdx` (see [PR #267](https://github.com/timescale/Tiger-Data-Docs/pull/267)).

### Recipe 2: Concept page (related reading only)

For a conceptual `learn/` page where the goal is to deepen understanding, not push action. Skip the CTA and tutorials, just show related blog posts.

```yaml
---
title: Understand hypertables
description: How hypertables partition time-series data automatically.
learnMore:
  relatedPosts:
    - label: When to use hypertables
      href: https://www.timescale.com/blog/when-to-hypertable/
    - label: Hypertables versus partitioned tables
      href: https://www.timescale.com/blog/hypertables-vs-partitioning/
---
```

### Recipe 3: Quickstart with a single CTA

For a quickstart's final page, give readers one obvious next step.

```yaml
---
title: You're all set
description: Wrap up the 5-minute quickstart.
learnMore:
  cta:
    label: Open Tiger Cloud Console
    href: https://console.cloud.tigerdata.com/
---
```

### Recipe 4: Reference page (related guides)

For an API or SQL reference page, point readers to the practical how-tos. Tutorials only, no CTA, no blog posts.

```yaml
---
title: create_hypertable()
description: Reference for the create_hypertable SQL function.
learnMore:
  tutorials:
    - label: Your first hypertable
      href: /build/how-to/your-first-hypertable/
    - label: Choose a partitioning column
      href: /build/how-to/choose-a-partitioning-column/
---
```

### Recipe 5: Custom section headings

Override the default headings when "Tutorials" or "Related blog posts" doesn't quite fit. Useful when the linked items aren't strictly tutorials (for example, video walkthroughs).

```yaml
---
title: Migrate from PostgreSQL
learnMore:
  tutorialsHeading: Next steps
  tutorials:
    - label: Live migration walkthrough
      href: /migrate/live-migration/
    - label: Validate after migration
      href: /migrate/validate/
  relatedPostsHeading: Customer stories
  relatedPosts:
    - label: How Company X migrated 8 TB in a weekend
      href: https://www.timescale.com/blog/customer-x/
---
```

### Recipe 6: External versus internal links

The component decides target tab from the href, not from which list the link is in. So you *can* put an external link in `tutorials` (it'll still open in a new tab), but stylistically the icon won't match (you'll get a right-arrow on an external link). Keep the convention:

- `tutorials` → internal docs paths starting with `/`
- `relatedPosts` → absolute `https://…` URLs

```yaml
learnMore:
  tutorials:
    - label: Internal — opens in same tab
      href: /build/how-to/something/
  relatedPosts:
    - label: External — opens in new tab
      href: https://www.timescale.com/blog/something/
```

### Recipe 7: Custom card title

Replace the default "Learn more" title when something else reads better in context (for example, on a troubleshooting page).

```yaml
learnMore:
  title: Need more help?
  tutorials:
    - label: Common errors
      href: /reference/troubleshooting/common-errors/
  cta:
    label: Contact support
    href: https://www.tigerdata.com/support/
```

### Recipe 8: Tutorials-only or CTA-only

Any subset works. The component shows only what you provide.

**Tutorials only:**

```yaml
learnMore:
  tutorials:
    - label: Next tutorial
      href: /build/how-to/next/
```

**CTA only:**

```yaml
learnMore:
  cta:
    label: Try for free
    href: https://console.cloud.tigerdata.com/signup
```

**Posts + CTA, no tutorials:**

```yaml
learnMore:
  relatedPosts:
    - label: The case for time-series databases
      href: https://www.timescale.com/blog/time-series-case/
  cta:
    label: Read the whitepaper
    href: https://www.timescale.com/resources/whitepaper/
```

---

## Testing locally

1. Add or edit `learnMore:` in a page's frontmatter.
2. Run `pnpm dev` (or `pnpm dev:local` if you don't have a Stainless API key).
3. Open the page at `http://localhost:4321/<your-page-path>`.
4. Resize the browser to at least **1024px wide**. The card lives in the right rail, which collapses on smaller viewports.
5. Toggle light/dark mode and confirm the card flips colors correctly.
6. Click each link. Confirm internal links stay in-tab and external links open in a new tab.

If the card doesn't appear, jump to [Troubleshooting](#troubleshooting).

---

## Troubleshooting

### The card doesn't show up

- **Viewport too narrow.** The right rail is hidden below 1024px. Widen the window.
- **Frontmatter key is misspelled or wrong-cased.** It must be `learnMore` (camelCase), not `learn_more`, `learnmore`, or `LearnMore`.
- **All sections are empty.** The card hides itself if `tutorials`, `relatedPosts`, and `cta` are all absent or empty arrays.
- **YAML indentation is off.** Each list item needs a `- ` and labels/hrefs need to be indented under the list item. When in doubt, copy a recipe above verbatim and edit.
- **Dev server cache.** Astro occasionally caches frontmatter aggressively. Stop the dev server, then `rm -rf .astro node_modules/.vite node_modules/.astro` and restart `pnpm dev`.

### "Property 'learnMore' is not allowed" content-collection error

The content schema in `src/content.config.ts` strips unknown frontmatter keys. If you're seeing a schema error, you may be on a branch that pre-dates the schema merge. Pull the latest `main`.

### A link styles look weird (tiny gray text, no underline)

The card uses its own styles (specificity `0,2,0`) to override Starlight's default right-sidebar styles. If a link looks like it inherited the TOC styling, you may have nested an extra element inside the link or accidentally added a `<p>` in YAML. Strip it back to the recipe shape: each item is just `{ label, href }`.

### The CTA button is the wrong color in dark mode

The card pulls from `--button-secondary-*` (default) and `--stl-button-primary-*` (hover) tokens defined in `src/styles/tokens.css`. If your local CSS overrides those, the button will follow. Don't override them per-page; they're meant to be theme-wide.

### Card appears mid-page instead of pinned to the bottom

The card uses `margin-top: auto` inside a flex column. If you've added custom CSS on the page that breaks the `.sl-container` flex layout, the card will lose its bottom anchor. Don't add CSS that touches `.sl-container` or `.right-sidebar-panel`.

---

## Real pages already using this

Browse these live examples to see the card in production context:

- `src/content/docs/build/examples/hybrid-search.mdx`: full card (tutorials + related posts) added in [PR #267](https://github.com/timescale/Tiger-Data-Docs/pull/267).
- Search the repo with `grep -rn "learnMore:" src/content/docs/` to find every page currently using the card.

When you ship a new page using `learnMore`, you don't need to register it anywhere; it's auto-discovered through frontmatter.

---

## Architecture

| Concern | File |
|---|---|
| Frontmatter schema | `src/content.config.ts` → `learnMoreSchema` |
| Card component | `src/components/LearnMore.astro` |
| Rail mount point | `src/components/PageSidebar.astro` (overrides Starlight's default `PageSidebar`) |
| Registration | `astro.config.ts` → `starlightCompat.components.PageSidebar` |

### How it renders (under the hood)

1. Every docs page runs through `PageSidebar.astro`. It reads `Astro.locals.starlightRoute.entry.data.learnMore` from the page's frontmatter.
2. If that object is present and has at least one of `tutorials`, `relatedPosts`, or `cta`, the component appends `<LearnMore />` after Starlight's default TOC inside the existing `.sl-container`.
3. `.sl-container` is styled as a flex column with `min-height: calc(100dvh - nav - 2rem)`. The card has `margin-top: auto`, which pushes it to the bottom of that column. Because Starlight's rail container is already viewport-sticky at the top, bottom-of-column ends up visually equal to bottom-of-viewport on any page taller than the viewport, with no `position: sticky` needed on the card itself.

### Style isolation

Styles live in `LearnMore.astro` as an `is:global` block, with every selector chained through `.learn-more .learn-more__X` (specificity `0,2,0`). This:

- Beats Starlight's right-sidebar defaults like `.right-sidebar-panel :where(a)` (specificity `0,1,0`) without needing `!important` or scope-breaking rules in `PageSidebar.astro`.
- Keeps the card's type scale and colors owned by this one file: the rail's TOC CSS can't accidentally mutate the card, and vice versa.

---

## Theming

The card uses local `--lm-*` CSS variables that cascade from project tokens (`src/styles/tokens.css`) with sensible fallbacks:

| Local token | Source token | Used for |
|---|---|---|
| `--lm-bg` | `--step-card-bg` | Card background |
| `--lm-border` | `--step-card-border` | Card border |
| `--lm-fg-strong` | `--toc-title-active` | Title, section heads, icons |
| `--lm-fg-muted` | `--tiger-fg-emphasized` | Link text and icons (chosen over `--toc-title-inactive` so 14px body copy clears WCAG AA at 4.5:1 in both themes) |
| `--lm-cta-bg` / `--lm-cta-fg` / `--lm-cta-border` | `--button-secondary-*` | Outlined CTA (default state) |
| `--lm-cta-hover-bg` / `--lm-cta-hover-fg` | `--stl-button-primary-*` | CTA on hover/focus |

Because all four source families flip correctly in dark mode, the card (and its button) Just Work when the user toggles the theme.

---

## Figma

- [Card, light, no CTA (3588-7875)](https://www.figma.com/design/yQV8pW06ktc0enJNrieCQR/Docs---Navigation-restructure---Q2---WIP-?node-id=3588-7875)
- [Card, light, with CTA (3588-7948)](https://www.figma.com/design/yQV8pW06ktc0enJNrieCQR/Docs---Navigation-restructure---Q2---WIP-?node-id=3588-7948)
- [Card, dark, no CTA (3588-7974)](https://www.figma.com/design/yQV8pW06ktc0enJNrieCQR/Docs---Navigation-restructure---Q2---WIP-?node-id=3588-7974)
- [Card, dark, with CTA (3588-8047)](https://www.figma.com/design/yQV8pW06ktc0enJNrieCQR/Docs---Navigation-restructure---Q2---WIP-?node-id=3588-8047)
- [CTA button (3245-9622)](https://www.figma.com/design/yQV8pW06ktc0enJNrieCQR/Docs---Navigation-restructure---Q2---WIP-?node-id=3245-9622)

---

## Gotchas

- The graduation-cap and download-arrow icons are inlined SVGs with `currentColor`, so they follow the surrounding text color through theme changes. Don't replace them with `<img>` or they'll stop flipping.
- Changing styles inside the card's `<style is:global>` block sometimes doesn't invalidate through Astro's HMR. If your tweak doesn't land after a save, kill the dev server, remove `.astro` / `node_modules/.vite` / `node_modules/.astro`, and restart with `pnpm dev`.
- Don't add new `:global(.learn-more ...)` rules to `PageSidebar.astro`. Anything LearnMore-specific belongs in `LearnMore.astro` so the two files don't mutate each other's cascade.
- The right rail and this card both disappear on viewports under 1024px, which is by design. If you need related-content links to surface on mobile, put them in the page body itself (for example, using `RelatedContentCards`).

---

## Related

- [Starlight `PageSidebar` docs](https://starlight.astro.build/reference/overrides/#pagesidebar)
- Original implementation: [PR #220](https://github.com/timescale/Tiger-Data-Docs/pull/220) (EDU-94)
- First usage: [PR #267](https://github.com/timescale/Tiger-Data-Docs/pull/267) (EDU-539)
