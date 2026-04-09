import { defineRouteMiddleware } from "@astrojs/starlight/route-data";
import { flattenSidebarSingleChildGroups } from "./lib/flatten-sidebar-single-child-groups";

/**
 * Starlight route middleware runs after `locals.starlightRoute` is set and can mutate it before
 * the layout renders. Single-link groups become one clickable row (group label + destination).
 */
export const onRequest = defineRouteMiddleware(async (context, next) => {
  const route = context.locals.starlightRoute;
  if (route?.sidebar?.length) {
    route.sidebar = flattenSidebarSingleChildGroups(route.sidebar);
  }
  await next();
});
