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

  const route = context.locals.starlightRoute;
  if (route?.sidebar?.length) {
    route.sidebar = flattenSidebarSingleChildGroups(route.sidebar);
  }
});
