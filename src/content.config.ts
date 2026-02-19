import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

/** Optional description shown in the nav dropdown for this section’s overview link. */
const overviewDescriptionSchema = z.object({
  overviewDescription: z.string().optional(),
});

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({ extend: overviewDescriptionSchema }),
  }),
};
