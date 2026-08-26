# First-party images (`src/assets/images`)

Store documentation-owned images here so Astro can **bundle, fingerprint, and optimize** them (via `astro:assets` and Sharp).

## Layout

| Path | Purpose |
|------|---------|
| `hero-cloud/`, `hero-enterprise/`, `hero-local/` | Welcome / get-started hero card illustrations, one light and one dark per card (`HeroGetStartedCard.astro`) |
| `learn/` | Learn tab diagrams and figures (optional subfolders: `fundamentals/`, `deep-dive/`, `examples/`, `production-patterns/`) |
| `migrate/` | Migration guides (RDS, S3 connector screenshots, etc.) |
| `integrate/` | Integration guide screenshots, in a subfolder named for the tool (for example `integrate/grafana/`) |

### Integration screenshots

Save integration images as PNG under `integrate/<tool-name>/`. When a screenshot shows product UI that changes with the color theme, provide both a **light-mode** and a **dark-mode** version and switch between them (see `ThemeImage.astro`) so the image matches the reader's theme. Import the image in the page as shown below.

## Usage in MDX

**Raster images (PNG, WebP, etc.)**: import and use `<Image>`:

```mdx
import { Image } from "astro:assets";
import diagram from "../../../assets/images/learn/fundamentals/my-diagram.png";

<Image src={diagram} alt="Short description of the diagram" />
```

**SVG**: use a URL import with `<img>` (the `Image` component does not optimize SVGs the same way):

```mdx
import illustration from "../../../assets/images/migrate/my-flow.svg?url";

<img src={illustration} alt="Description" />
```

Paths are relative to the MDX file (for example, from `src/content/docs/migrate/` use `../../../assets/images/...`; from `src/partials/` use `../assets/images/...`).
