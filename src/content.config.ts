import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

/** Optional description shown in the nav dropdown for this section’s overview link. */
const overviewDescriptionSchema = z.object({
  overviewDescription: z.string().optional(),
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
});

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: overviewDescriptionSchema.merge(integrationSchema),
    }),
  }),
};
