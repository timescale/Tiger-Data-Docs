# First-party images (`src/assets/images`)

Store documentation-owned images here so Astro can **bundle, fingerprint, and optimize** them (via `astro:assets` and Sharp).

## Layout

| Path | Purpose |
|------|---------|
| `hero-cloud/`, `hero-local/` | Welcome / get-started hero card illustrations (`HeroGetStartedCard.astro`) |
| `learn/` | Learn tab diagrams and figures (optional subfolders: `fundamentals/`, `deep-dive/`, `examples/`, `production-patterns/`) |
| `migrate/` | Migration guides (RDS, S3 connector screenshots, etc.) |

## Usage in MDX

**Raster images (PNG, WebP, etc.)** — import and use `<Image>`:

```mdx
import { Image } from "astro:assets";
import diagram from "../../../assets/images/learn/fundamentals/my-diagram.png";

<Image src={diagram} alt="Short description of the diagram" />
```

**SVG** — use a URL import with `<img>` (the `Image` component does not optimize SVGs the same way):

```mdx
import illustration from "../../../assets/images/migrate/my-flow.svg?url";

<img src={illustration} alt="Description" />
```

Paths are relative to the MDX file (e.g. from `src/content/docs/migrate/` use `../../../assets/images/...`; from `src/partials/` use `../assets/images/...`).

## Synced reference repos

Images pulled by `pnpm sync` from sibling repositories still land under **`public/assets/{timescaledb,pgai,pgvectorscale}/`** (see `scripts/sync-docs.ts`). Prefer `src/assets` for new, hand-authored docs imagery.
