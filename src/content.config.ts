import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

import {
  INTEGRATION_TECHNOLOGY_KEYS,
  type IntegrationTechnologyKey
} from "./lib/integration-technologies";

const integrationTechnologyZodEnum = z.enum(
  INTEGRATION_TECHNOLOGY_KEYS as unknown as [
    IntegrationTechnologyKey,
    ...IntegrationTechnologyKey[]
  ]
);

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
  /**
   * Optional keywords for search and for inferring the Integrate overview "Technology" filter when
   * `integrationTechnologies` is not set. Must be listed in the content schema or Zod strips them.
   */
  keywords: z.array(z.string()).optional(),
  /**
   * Explicit technology tags for the /integrate card grid filter. When omitted, technologies are
   * inferred from `keywords` using substring patterns (see `src/lib/integration-technologies.ts`).
   */
  integrationTechnologies: z.array(integrationTechnologyZodEnum).optional(),
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
   * Optional raster logo file under `src/assets/images/integrate/card-logos/` (for example `kafka.png`).
   * Used in light mode (or as the only logo when `integrationCardLogoDark` is absent).
   * When omitted, the overview shows initials in a colored badge.
   */
  integrationCardLogo: z.string().optional(),
  /**
   * Dark-mode variant of the card logo (for example `kafka-dark.png`).
   * When omitted but `integrationCardLogo` is set, the light logo is used for both themes.
   */
  integrationCardLogoDark: z.string().optional(),
  /** Accessible label for the logo; defaults to the card title. */
  integrationCardLogoAlt: z.string().optional(),
  /** Override initials in the placeholder badge (for example `λ` for AWS Lambda). */
  integrationCardInitials: z.string().optional(),
  /**
   * When true, this page is omitted from the `/integrate` card grid and filter chips only.
   * The page remains in the sidebar and is reachable by URL.
   */
  integrationHideFromOverviewCards: z.boolean().optional(),
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
