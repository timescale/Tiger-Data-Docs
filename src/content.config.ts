import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

/** Optional description shown in the nav dropdown for this section’s overview link. */
const overviewDescriptionSchema = z.object({
  overviewDescription: z.string().optional(),
});

/**
 * SEO/social summary only: injected into `<meta name="description">` and `og:description` via
 * `src/components/Head.astro`. Does not appear in the sidebar (unlike `description`).
 * If both `description` and `seoDescription` are set, `description` is used for meta and sidebar;
 * `seoDescription` is ignored for injection.
 */
const seoDescriptionSchema = z.object({
  seoDescription: z.string().optional(),
});

/**
 * Page labels – tags at the top of the page to define/categorize content (Figma 3387-1829, 1817, 1833, 1845, 1850).
 * Each string is one tag; variant is inferred: "Experimental" → error, "Popular feature" | "Optional" → highlight, else neutral.
 */
const pageLabelsSchema = z.object({
  pageLabels: z.array(z.string()).optional(),
});

/**
 * Integration-specific frontmatter for the Integrate section.
 * Used to power the integrate index views: by category, by industry, Tiger Data connectors, and external tools.
 */
const integrationSchema = z.object({
  /** Category slug (e.g. data-engineering-etl). Derivable from path but can be set for override. */
  integrationCategory: z.string().optional(),
  /** Industries this integration is relevant for (e.g. ["IoT", "Finance"]). Used for "By industry" view. */
  integrationIndustry: z.array(z.string()).optional(),
  /** Whether this is a Tiger Data native connector or an external tool integration. */
  connectorType: z.enum(["tiger-data", "external"]).optional(),
  /** Sort order within Tiger Data / External lists (lower = first). */
  sortOrder: z.number().optional(),
  /** Short name for integration cards: displayed as "{integrationCardTitle} and Tiger Cloud". */
  integrationCardTitle: z.string().optional(),
  /** Platforms this integration is available on; shown as chips and used for filtering. */
  integrationPlatforms: z.array(z.enum(["aws", "azure", "self-hosted"])).optional(),
  /**
   * Optional raster logo file under `src/assets/images/integrate/card-logos/` (e.g. `kafka.png`).
   * Used in light mode (or as the sole logo when `integrationCardLogoDark` is absent).
   * When omitted, the card shows no logo media area.
   */
  integrationCardLogo: z.string().optional(),
  /**
   * Dark-mode variant of the card logo (e.g. `kafka-dark.png`).
   * When omitted but `integrationCardLogo` is set, the light logo is used for both themes.
   */
  integrationCardLogoDark: z.string().optional(),
  /** Accessible alt text for the logo; defaults to the card title. */
  integrationCardLogoAlt: z.string().optional(),
});

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: overviewDescriptionSchema
        .merge(seoDescriptionSchema)
        .merge(integrationSchema)
        .merge(pageLabelsSchema),
    }),
  }),
};
