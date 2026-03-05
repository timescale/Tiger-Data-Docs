# Component usage guide

This doc describes how to use the custom and overridden components in Tiger Data Docs. Use the sections below to expand only what you need. **Callouts** are the main thing doc editors use in MDX; **Main / primary button** explains when to use the primary CTA style (header and callout CTAs).

---

## Callouts – quick copy-paste for doc editors

<details>
<summary><strong>Blurb to copy into contributor docs or style guides</strong></summary>

**How to use callouts in Tiger Data Docs (MDX)**

In any `.mdx` file under `src/content/docs/`, add this import at the top:

```mdx
import { Callout } from "@stainless-api/docs/components";
```

Then use one of these blocks. **Tip** and **Note** are the most common; use **Important** or **Warning** for cautions, and **Callout with button** when you need a CTA.

- **Tip** (hints, best practices):  
  `<Callout variant="tip">Your text here.</Callout>`

- **Note** (extra context):  
  `<Callout variant="note">Your text here.</Callout>`  
  Optional: add `title="Your title"` to override the default "Note".

- **Important** (don’t skip):  
  `<Callout variant="important">Your text here.</Callout>`

- **Warning** (cautions):  
  `<Callout variant="warning">Your text here.</Callout>`

- **Callout with button** (promo/CTA):  
  `<Callout variant="callout" title="Optional title" buttonLabel="Button text" buttonHref="/path">Body text.</Callout>`

Use a single import per file; you can use multiple `<Callout>` blocks with different `variant` values in the same file.

</details>

---

## Callouts

<details>
<summary><strong>How to use callouts (Tip, Note, Important, Warning, Callout with button)</strong></summary>

Callouts are implemented by the custom **Callout** component and are available in any MDX file under `src/content/docs/` or in partials. Import from the docs package and use the `variant` prop (and optional `title`, plus button props for the CTA variant).

### Import

In your `.mdx` file:

```mdx
import { Callout } from "@stainless-api/docs/components";
```

### Variants and props

| Variant       | Default title        | When to use                          |
|---------------|----------------------|--------------------------------------|
| `tip`         | Tips                 | Helpful hints, best practices        |
| `note`        | Note                 | Supplementary or clarifying info     |
| `important`   | Important            | Key info that shouldn’t be skipped    |
| `warning`     | Warning              | Cautions, limitations, or caveats    |
| `callout`     | Callout with button  | Promo/CTA with an action button      |

Optional prop for all variants: **`title`** — overrides the default heading (e.g. "Note", "Tips").

For **`variant="callout"`** only:

- **`buttonLabel`** — text on the button (e.g. `"Try for free"`).
- **`buttonHref`** — URL for the button. If both `buttonLabel` and `buttonHref` are set, the callout shows a CTA button.

### Examples

**Tip**

```mdx
<Callout variant="tip">
  Set `migrate_data` to `true` when converting an existing table to a hypertable.
</Callout>
```

**Note (custom title)**

```mdx
<Callout variant="note" title="Continuous aggregates">
  When a continuous aggregate name is provided, the function transparently looks up
  the backing hypertable and returns its statistics instead.
</Callout>
```

**Important**

```mdx
<Callout variant="important">
  Backup your database before running this migration.
</Callout>
```

**Warning**

```mdx
<Callout variant="warning">
  This operation cannot be undone.
</Callout>
```

**Callout with button**

```mdx
<Callout
  variant="callout"
  title="Callout with button"
  buttonLabel="Try for free"
  buttonHref="/signup"
>
  Your Timescale Cloud trial is completely free for the first thirty days—enough time
  to complete the tutorials and run test projects.
</Callout>
```

- Omit `buttonLabel` or `buttonHref` to render only title + body (no button).
- The default title for `variant="callout"` is **"Callout with button"** if `title` is not set.

</details>

---

## Main / primary button – when to use it

<details>
<summary><strong>When to use the primary (accent) button</strong></summary>

The **main button** is the primary CTA style: dark background (`#0b0b0f` in light theme), light text, 4px radius, 16px padding. It’s used for the single most important action in a given context (e.g. “Try for free”, “Get started”).

### When to use

- **One primary action per view** — e.g. “Get started” in the header, or “Try for free” inside a callout. Reserve it for the main conversion or next step you want the user to take.
- **Header links** — In `astro.config.ts`, `header.links` entries are rendered as buttons; the **last** link is styled as the primary (accent) button. Use that slot for the top-level CTA (e.g. sign up, start trial, get started).
- **In-content CTAs** — Use **Callout with button** (`variant="callout"` with `buttonLabel` and `buttonHref`) when you want a prominent CTA inside a doc (e.g. trial signup, product signup). That callout’s button uses the same primary style.

### When not to use

- **Secondary or alternate actions** — Use outline buttons or text links instead so the primary CTA stays visually dominant.
- **Multiple equal-weight actions** — If two actions are equally important, use outline style or links for both; avoid two primary buttons in the same block.
- **Low-emphasis or tertiary actions** — Prefer links or outline buttons so the main button doesn’t compete with them.

### Where it appears

| Location              | How it’s set                                                                 |
|-----------------------|-------------------------------------------------------------------------------|
| **Header**            | `astro.config.ts` → `header.links`. Last item gets accent (primary) style.   |
| **Callout with button**| `<Callout variant="callout" buttonLabel="…" buttonHref="…">…</Callout>` in MDX. |

Styling is in `theme.css`: variables `--stl-button-primary-bg` and `--stl-button-primary-fg`, and classes `.stl-ui-button`, `.stl-ui-button--accent`. The callout CTA button shares these tokens so header and in-doc CTAs stay consistent.

### Outline + hover button (Figma 3245-9618, 3245-9617)

The **Button** component implements the two Figma states: **enabled** (outline: light bg, dark border, dark text) and **hover** (filled: dark bg, white text). Use it for secondary actions that highlight on hover.

Import and use in MDX or Astro:

```mdx
import { Button } from "@stainless-api/docs/components";

<Button label="Button enabled" icon="down" />
<Button label="Download" href="/download" variant="outline" icon="down" />
<Button label="Primary CTA" variant="accent" href="/get-started" />
```

| Prop | Description |
|------|-------------|
| `label` | Button text (required). |
| `href` | If set, renders as `<a>`; otherwise `<button>`. |
| `variant` | `"outline"` (default) = enabled → hover fill; `"accent"` = primary only. |
| `icon` | `"down"` or `true` = show down-arrow icon (Figma “Arrow / With base / Down”). |
| `type` | For `<button>`: `"button"` \| `"submit"` \| `"reset"`. |
| `class` | Extra CSS classes. |

</details>

---

## Navigation and layout (custom overrides)

<details>
<summary><strong>Page navigation (Previous / Next), Breadcrumbs, PageTitle, Header</strong></summary>

These are **layout and chrome** components. You don’t use them directly in MDX; they are wired in via `astro.config.ts` and Starlight. This section is for maintainers and developers.

| Component        | Role                                                                 | Config / override path                          |
|------------------|----------------------------------------------------------------------|-------------------------------------------------|
| **PageNavigation** | Bottom-of-page “Previous” / “Next” links with labels and page titles | `starlightCompat.components.Pagination` → `src/components/PageNavigation.astro` |
| **Breadcrumbs**  | Breadcrumb trail above the page title                                | Rendered inside `PageTitle`                     |
| **PageTitle**    | Page heading + optional description + breadcrumbs                   | `starlightCompat.components.PageTitle` → `src/components/PageTitle.astro` |
| **Header**       | Site header (logo, nav)                                              | `starlightCompat.components.Header` → `src/components/Header.astro` |

- **Breadcrumbs:** Built from the sidebar; group labels (e.g. “pgai”) link to the first page in that group. The current page is the last segment and is not a link.
- **PageNavigation:** Order follows the sidebar; “Previous” / “Next” show sibling or parent/child pages.

No MDX import is required for these; they are part of the default layout.

</details>

---

## Other custom components

<details>
<summary><strong>Button, Glossary, NumberedList, IntegrateToc, Changelog, etc.</strong></summary>

Other project-specific components live under `src/components/` and are used in specific pages or layouts.

### SecondaryButton (icon + label, default / subtle) – Figma 3245-9636, 3245-9637

The **SecondaryButton** component implements the two Figma variants: **default** (white background) and **subtle** (light gray background). Both use a dark border, 12px Geist Medium label, and an optional icon (default: Copy). Use for secondary actions (e.g. copy, download) where the primary CTA is something else.

**Import (MDX or Astro):**

```mdx
import SecondaryButton from "@components/SecondaryButton.astro";
```

**Usage:**

```mdx
<SecondaryButton variant="default" label="Button" />
<SecondaryButton variant="subtle" label="Copy" href="/copy" />
```

| Prop | Description |
|------|-------------|
| `variant` | `"default"` (white bg, Figma 3245-9636) or `"subtle"` (gray bg, Figma 3245-9637). Default: `"default"`. |
| `label` | Button text (required). |
| `href` | If set, renders as `<a>`; otherwise `<button>`. |
| `type` | For `<button>`: `"button"` \| `"submit"` \| `"reset"`. |
| `aria-label` | Override accessible name (defaults to `label`). |

Use the **icon** slot to replace the default Copy icon: put your SVG (or icon component) inside the component with `slot="icon"`.

### Button (outline + hover, optional icon)

The **Button** component matches Figma 3245-9618 (enabled) and 3245-9617 (hover). Use it for standalone actions: outline style by default, fills to primary on hover; optional down-arrow icon.

**Import (in MDX or Astro):**

```mdx
import { Button } from "@stainless-api/docs/components";
```

**Props:** `label` (required), `href` (optional; renders as `<a>` if set), `variant` (`"outline"` | `"accent"`), `icon` (`"down"` or `true` for the arrow), `type`, `class`.

**Examples:**

```mdx
<Button label="Button enabled" icon="down" />
<Button label="Download" href="/download" variant="outline" icon="down" />
<Button label="Primary CTA" variant="accent" href="/get-started" />
```

See **Main / primary button** above for when to use primary vs outline and how it ties into theme tokens.

- **Glossary** (`Glossary/`) — glossary UI (filters, letter nav, term cards). Used on glossary pages.
- **NumberedList** / **NumberedItem** — step-by-step or ordered flows in docs.
- **IntegrateToc** — table of contents for the Integrate section.
- **Changelog** — changelog entries, tags, filters. Used on changelog pages.

Use them by importing from `@components/...` or `@stainless-api/docs/components` (for Button/Callout) in the relevant Astro/MDX files. See `src/components/` and `astro.config.ts` for exact paths and usage.

</details>

---

## Quick reference: Callout only

| Variant     | Example usage |
|------------|----------------|
| Tip        | `<Callout variant="tip">…</Callout>` |
| Note       | `<Callout variant="note">…</Callout>` |
| Important  | `<Callout variant="important">…</Callout>` |
| Warning    | `<Callout variant="warning">…</Callout>` |
| CTA        | `<Callout variant="callout" buttonLabel="…" buttonHref="…">…</Callout>` |

Import once per file: `import { Callout } from "@stainless-api/docs/components";`
