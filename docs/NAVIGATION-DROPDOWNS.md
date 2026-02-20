# Navigation dropdown menus (hover)

This doc explains how the tab-bar dropdowns work and alternative ways you could implement them.

## What’s implemented

The site uses **hover dropdowns** on the main navigation tabs (Learn, Build, Migrate, etc.). When a tab has a sidebar config in `astro.config.ts`, that tab shows a chevron and a dropdown panel on hover with:

- An “Overview” link (tab landing page) plus a short description
- Links for each top-level sidebar section (from the tab’s `sidebar` array)

**Overview description (config-driven):** The line of text under each tab’s “Overview” link in the dropdown comes from that section’s **index.mdx** frontmatter. Add `overviewDescription` to any section index (e.g. `src/content/docs/learn/index.mdx`) to control the text; if missing, it falls back to “Overview and key topics”.

Implementation details:

- **Custom Header** – The Stainless Docs default header is overridden via `experimental.starlightCompat.components.Header` so we can use our own tab bar.
- **`NavTabsWithDropdown.astro`** – Renders the tab row; tabs with a `sidebar` get a dropdown, others stay plain links. Dropdown content is derived from the same `tabs[].sidebar` config used for the sidebars.
- **Pure CSS hover** – Dropdown visibility is toggled with `:hover` (and `:focus-within` for keyboard). No React or extra JS.
- **`SplashMobileMenuToggle.astro`** – Local copy of the Stainless mobile menu for splash pages, so the custom header doesn’t depend on package-internal paths.

Config is in `astro.config.ts` under `experimental.starlightCompat.components.Header` and the tab `sidebar` arrays.

---

## Different ways to do it

### 1. Current approach: CSS hover + Header override (what we use)

**How:** Override the Starlight/Stainless Header with a custom `Header.astro` that uses `NavTabsWithDropdown.astro`. Dropdowns are shown with CSS (`:hover`, `:focus-within`). Dropdown items come from the existing `tabs[].sidebar` in config.

**Pros:**

- No new dependencies (we only added `@stainless-api/ui-primitives` so the custom header can use the same Button as the rest of the site).
- Fits the existing Stainless/Starlight setup; dropdown content stays in sync with sidebars.
- No Tailwind or React required for the nav itself.

**Cons:**

- You maintain a copy of the header layout and any header subcomponents (e.g. `SplashMobileMenuToggle`) that aren’t exported by the package.
- Hover-only can be less ideal for touch; you can add a small script to open on click/focus if needed.

---

### 2. shadcn/ui Navigation Menu (React)

**How:** Add [Tailwind CSS](https://tailwindcss.com/) and [shadcn/ui for Astro](https://ui.shadcn.com/docs/installation/astro), then add the [Navigation Menu](https://ui.shadcn.com/docs/components/navigation-menu) component. Use a React island (e.g. in the header) that renders `NavigationMenu`, `NavigationMenuTrigger`, and `NavigationMenuContent` for each tab, and wire it to your tab/sidebar config.

**Pros:**

- Polished, accessible behavior (keyboard, focus, ARIA).
- Matches the pattern in your reference (ClickHouse/shadcn-style menu).
- Good for more complex menus (nested items, descriptions, etc.).

**Cons:**

- Requires adding Tailwind and the shadcn CLI setup.
- Navigation menu is React-based; you’d replace or wrap the current (Astro) tab bar with a client-side island.
- More moving parts and dependency surface.

**Rough steps:**

1. Follow [Astro + Tailwind + shadcn](https://ui.shadcn.com/docs/installation/astro): create Astro project with Tailwind, run `pnpm dlx shadcn@latest init`, then `pnpm dlx shadcn@latest add navigation-menu`.
2. Build a React component that takes your tabs (and optionally sidebar data) and renders `NavigationMenu` with `NavigationMenuTrigger` / `NavigationMenuContent` per tab.
3. Override the Header (same as now) but render this React nav component as an island (e.g. `client:visible` or `client:load`) instead of `NavTabsWithDropdown.astro`.
4. Either pass tab/sidebar config from Astro into the island as props, or have the island read from a shared config/virtual module if you can expose it to the client.

---

### 3. Hybrid: keep current dropdown, add click/touch

**How:** Keep `NavTabsWithDropdown.astro` and the custom header, but add a small script that toggles the dropdown on click (and/or focus) and closes it when clicking outside or pressing Escape. Style and structure stay as they are; only behavior is enhanced.

**Pros:**

- Minimal change; reuses existing markup and CSS.
- Better on touch devices and for users who don’t rely on hover.

**Cons:**

- You maintain a bit of custom JS and need to keep it in sync with the dropdown DOM (e.g. same classes/attributes).

---

### 4. No dropdown: keep default tab bar

**How:** Remove the Header override and the custom nav. Use the default Stainless Docs tab bar (flat list of tab links, no dropdowns).

**Pros:**

- No custom header or nav code; upgrades are simpler.

**Cons:**

- No “Manage data”–style dropdowns; users only see the tab links.

---

## Files involved (current implementation)

| File | Role |
|------|------|
| `astro.config.ts` | `experimental.starlightCompat.components.Header` → `./src/components/Header.astro` |
| `src/components/Header.astro` | Custom header: same layout as StackedHeader, uses `NavTabsWithDropdown` and inlined header links |
| `src/components/NavTabsWithDropdown.astro` | Tab bar with hover dropdowns; reads `TABS` from `virtual:stl-docs-virtual-module` and builds dropdown links from `tab.sidebar` |
| `src/components/SplashMobileMenuToggle.astro` | Local copy of Stainless splash mobile menu so the custom header doesn’t import from package internals |
| `theme.css` | Existing header/nav variables (e.g. `--sl-nav-height`); dropdown styles live in `NavTabsWithDropdown.astro` |

If you later switch to shadcn (option 2), you’d keep the Header override but swap `NavTabsWithDropdown.astro` for a React Navigation Menu island and optionally adjust `theme.css` to match shadcn’s tokens.
