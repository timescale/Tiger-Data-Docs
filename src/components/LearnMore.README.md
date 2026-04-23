# LearnMore card

Right-rail sidebar card that points readers to related tutorials, blog posts, and an optional CTA. Driven entirely by page frontmatter — no per-page imports or component wiring required. Toggles on automatically when the `learnMore` key is present in frontmatter, hides itself when it's absent.

← Back to the [main README](../../README.md).

## When to use it

Add `learnMore` to any MDX page's frontmatter when you want a "Related content" card to appear at the bottom of the right rail, below the TOC. Common use cases:

- Quickstart or tutorial pages — point readers at the next tutorial plus a sign-up CTA
- Concept pages — link to deep-dive blog posts
- Reference pages — surface related guides

## Frontmatter shape

```yaml
---
title: My page
learnMore:
  tutorials:
    - label: Your first hypertable
      href: /build/how-to/your-first-hypertable/
    - label: Connect your app
      href: /get-started/quickstart/connect-your-app/
  relatedPosts:
    - label: Why use hypertables
      href: https://www.timescale.com/blog/...
  cta:
    label: Try for free
    href: https://console.cloud.tigerdata.com/signup
---
```

Every field is optional. The card is hidden when none of `tutorials`, `relatedPosts`, or `cta` is set.

## Fields

| Field | Type | Default | Notes |
|---|---|---|---|
| `title` | string | `"Learn more"` | Card title shown next to the graduation-cap icon. |
| `tutorials` | `{ label, href }[]` | — | Internal links (right-arrow icon). |
| `tutorialsHeading` | string | `"Tutorials"` | Heading above the tutorials list. |
| `relatedPosts` | `{ label, href }[]` | — | External references (external-link icon). |
| `relatedPostsHeading` | string | `"Related blog posts"` | Heading above the related posts list. |
| `cta` | `{ label, href }` | — | Optional outlined button at the bottom. Solid on hover. |

### URL handling

- **Relative URLs** (`/build/foo/`) render as in-site links.
- **Absolute URLs** (`https://…`) open in a new tab with `rel="noopener noreferrer"`.

The detection is a simple `^https?://` check, so protocol-relative URLs and mailto/tel links fall through to the in-site path.

## Architecture

| Concern | File |
|---|---|
| Frontmatter schema | `src/content.config.ts` → `learnMoreSchema` |
| Card component | `src/components/LearnMore.astro` |
| Rail mount point | `src/components/PageSidebar.astro` (overrides Starlight's default `PageSidebar`) |
| Registration | `astro.config.ts` → `starlightCompat.components.PageSidebar` |

### How it renders

1. Every docs page runs through `PageSidebar.astro`. It reads `Astro.locals.starlightRoute.entry.data.learnMore` from the page's frontmatter.
2. If that object is present and has at least one of `tutorials`, `relatedPosts`, or `cta`, the component appends `<LearnMore />` after Starlight's default TOC inside the existing `.sl-container`.
3. `.sl-container` is styled as a flex column with `min-height: calc(100dvh - nav - 2rem)`. The card has `margin-top: auto`, which pushes it to the bottom of that column. Because Starlight's rail container is already viewport-sticky at the top, bottom-of-column ends up visually equal to bottom-of-viewport on any page taller than the viewport — no `position: sticky` needed on the card itself.

### Style isolation

Styles live in `LearnMore.astro` as an `is:global` block, with every selector chained through `.learn-more .learn-more__X` (specificity `0,2,0`). This:

- Beats Starlight's right-sidebar defaults like `.right-sidebar-panel :where(a)` (specificity `0,1,0`) without needing `!important` or scope-breaking rules in `PageSidebar.astro`.
- Keeps the card's type scale and colors owned by this one file — the rail's TOC CSS can't accidentally mutate the card, and vice versa.

### Theming

The card uses local `--lm-*` CSS variables that cascade from project tokens (`src/styles/tokens.css`) with sensible fallbacks:

| Local token | Source token | Used for |
|---|---|---|
| `--lm-bg` | `--step-card-bg` | Card background |
| `--lm-border` | `--step-card-border` | Card border |
| `--lm-fg-strong` | `--toc-title-active` | Title, section heads, icons |
| `--lm-fg-muted` | `--toc-title-inactive` | Link text and icons |
| `--lm-cta-bg` / `--lm-cta-fg` / `--lm-cta-border` | `--button-secondary-*` | Outlined CTA (default state) |
| `--lm-cta-hover-bg` / `--lm-cta-hover-fg` | `--stl-button-primary-*` | CTA on hover/focus |

Because all four source families flip correctly in dark mode, the card (and its button) Just Work when the user toggles the theme.

## Figma

- [Card — light, no CTA (3588-7875)](https://www.figma.com/design/yQV8pW06ktc0enJNrieCQR/Docs---Navigation-restructure---Q2---WIP-?node-id=3588-7875)
- [Card — light, with CTA (3588-7948)](https://www.figma.com/design/yQV8pW06ktc0enJNrieCQR/Docs---Navigation-restructure---Q2---WIP-?node-id=3588-7948)
- [Card — dark, no CTA (3588-7974)](https://www.figma.com/design/yQV8pW06ktc0enJNrieCQR/Docs---Navigation-restructure---Q2---WIP-?node-id=3588-7974)
- [Card — dark, with CTA (3588-8047)](https://www.figma.com/design/yQV8pW06ktc0enJNrieCQR/Docs---Navigation-restructure---Q2---WIP-?node-id=3588-8047)
- [CTA button (3245-9622)](https://www.figma.com/design/yQV8pW06ktc0enJNrieCQR/Docs---Navigation-restructure---Q2---WIP-?node-id=3245-9622)

## Gotchas

- The graduation-cap and download-arrow icons are inlined SVGs with `currentColor`, so they follow the surrounding text color through theme changes. Don't replace them with `<img>` or they'll stop flipping.
- Changing styles inside the card's `<style is:global>` block sometimes doesn't invalidate through Astro's HMR. If your tweak doesn't land after a save, kill the dev server, remove `.astro` / `node_modules/.vite` / `node_modules/.astro`, and restart with `pnpm dev`.
- Don't add new `:global(.learn-more ...)` rules to `PageSidebar.astro`. Anything LearnMore-specific belongs in `LearnMore.astro` so the two files don't mutate each other's cascade.

## Related

- [Starlight `PageSidebar` docs](https://starlight.astro.build/reference/overrides/#pagesidebar)
- Ticket: **EDU-94**
