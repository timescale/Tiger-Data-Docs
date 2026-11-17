import { defineRouteMiddleware } from "@astrojs/starlight/route-data";
import type { StarlightRouteData } from "@astrojs/starlight/route-data";
import { flattenSidebarSingleChildGroups } from "./lib/flatten-sidebar-single-child-groups";

type SidebarEntry = StarlightRouteData["sidebar"][number];

const withoutTrailingSlash = (path: string) => path.replace(/\/$/, "");

/**
 * Starlight opens the groups around the current page by comparing whole hrefs, so entries that
 * link to an anchor on the page (the REST reference topics) never count. Open the groups that
 * hold a link to an anchor on this page. Returns whether `entries` holds one.
 */
function expandGroupsWithAnchorsOnPage(entries: SidebarEntry[], url: URL): boolean {
  let found = false;
  for (const entry of entries) {
    if (entry.type === "link") {
      const target = new URL(entry.href, url);
      if (target.hash && withoutTrailingSlash(target.pathname) === withoutTrailingSlash(url.pathname)) {
        found = true;
      }
    } else if (expandGroupsWithAnchorsOnPage(entry.entries, url)) {
      entry.collapsed = false;
      found = true;
    }
  }
  return found;
}

/**
 * Starlight route middleware runs after `locals.starlightRoute` is set and can mutate it before
 * the layout renders. Single-link groups become one clickable row (group label + destination),
 * and the groups around an anchor entry of the current page are opened.
 */
export const onRequest = defineRouteMiddleware(async (context, next) => {
  // Let downstream middleware (e.g. Stainless API placeholder replacement) run first
  // so the sidebar has its final entries before we flatten single-child groups.
  await next();

  try {
    const route = context.locals.starlightRoute;
    if (route) {
      // Set siteTitleHref to point the logo at the main Tiger Data website
      route.siteTitleHref = "https://www.tigerdata.com";
      // Flatten single-child sidebar groups
      if (route.sidebar?.length) {
        route.sidebar = flattenSidebarSingleChildGroups(route.sidebar);
        expandGroupsWithAnchorsOnPage(route.sidebar, context.url);
      }
    }
  } catch {
    // starlightRoute may not be available during prerender of non-Starlight pages (e.g., 404)
  }
});
