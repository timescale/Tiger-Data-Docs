/**
 * Breadcrumb trail with group-level links.
 * Same logic as @stainless-api/docs ContentBreadcrumbs findBreadcrumbTrail,
 * but group entries get href = first link in that group so every segment can link (e.g. "pgai" → /reference/pgai/).
 */
import type { StarlightRouteData } from "@astrojs/starlight/route-data";

export type BreadcrumbItem = { title: string; href: string };

type SidebarEntry = StarlightRouteData["sidebar"][number];

function normalizePath(path: string) {
  return path.endsWith("/") ? path : path + "/";
}

/** First link href in a group (recursively), or "" if none. */
function getFirstLinkHref(entries: SidebarEntry[]): string {
  for (const entry of entries) {
    if (entry.type === "link") return entry.href;
    if (entry.type === "group") {
      const found = getFirstLinkHref(entry.entries);
      if (found) return found;
    }
  }
  return "";
}

export function findBreadcrumbTrail(
  sidebarEntry: StarlightRouteData["sidebar"],
  targetPath: string,
  includeCurrentPage: boolean,
  trail: BreadcrumbItem[] = []
): BreadcrumbItem[] | null {
  const entries = sidebarEntry.filter((entry) => {
    const attrs = (entry as SidebarEntry & { attrs?: { class?: string } }).attrs;
    return !attrs?.class?.includes("stl-mobile-only-sidebar-item");
  });
  const normalizedTarget = normalizePath(targetPath);

  for (const entry of entries) {
    if (entry.type === "link") {
      const normalizedHref = normalizePath(entry.href);
      if (normalizedHref === normalizedTarget) {
        const fullTrail = [...trail, { title: entry.label, href: entry.href }];
        if (includeCurrentPage || fullTrail.length === 1) {
          return fullTrail;
        }
        return fullTrail.slice(0, -1);
      }
    } else if (entry.type === "group") {
      const firstHref = getFirstLinkHref(entry.entries);
      const groupBreadcrumb: BreadcrumbItem = {
        title: entry.label,
        href: firstHref,
      };
      const result = findBreadcrumbTrail(
        entry.entries,
        targetPath,
        includeCurrentPage,
        [...trail, groupBreadcrumb]
      );
      if (result) return result;
    }
  }

  return null;
}
