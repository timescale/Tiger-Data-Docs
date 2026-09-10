import { defineRouteMiddleware } from "@astrojs/starlight/route-data";
import { flattenSidebarSingleChildGroups } from "./lib/flatten-sidebar-single-child-groups";

/**
 * Starlight route middleware runs after `locals.starlightRoute` is set and can mutate it before
 * the layout renders. Single-link groups become one clickable row (group label + destination).
 */
export const onRequest = defineRouteMiddleware(async (context, next) => {
  // Let downstream middleware (e.g. Stainless API placeholder replacement) run first
  // so the sidebar has its final entries before we flatten single-child groups.
  await next();

  try {
    const route = context.locals.starlightRoute;
    if (route) {
      // Leave `siteTitleHref` alone: Starlight derives it from `base`, so the logo
      // stays inside whichever deployment is being viewed (production, preview, or dev).
      // Flatten single-child sidebar groups
      if (route.sidebar?.length) {
        route.sidebar = flattenSidebarSingleChildGroups(route.sidebar);
      }
    }
  } catch {
    // starlightRoute may not be available during prerender of non-Starlight pages (e.g., 404)
  }
});
