/**
 * Prev/next page resolution for custom PageNavigation.
 * Mirrors @stainless-api/docs pagination util so our custom component
 * shows the same sidebar order and filtering (mobile-only items excluded, etc.).
 */
import type { StarlightRouteData } from "@astrojs/starlight/route-data";
import { getCollection } from "astro:content";

type SidebarEntry = StarlightRouteData["sidebar"][number];
type SidebarLink = Extract<SidebarEntry, { type: "link" }>;
type SidebarGroup = Extract<SidebarEntry, { type: "group" }>;

function flattenSidebar(sidebar: SidebarEntry[]): SidebarLink[] {
  if (!sidebar || !Array.isArray(sidebar)) return [];
  try {
    const list = Array.from(sidebar);
    return list.flatMap((e) => {
      if (!e || typeof e !== "object") return [];
      if ((e as { type?: string }).type === "group") {
        const group = e as SidebarGroup;
        const entries = group.entries ?? (group as unknown as { items?: SidebarEntry[] }).items;
        return Array.isArray(entries) ? flattenSidebar(entries) : [];
      }
      return [e as SidebarLink];
    });
  } catch {
    return [];
  }
}

function findParentOfSidebarEntry(
  sidebar: SidebarEntry[],
  targetEntry: SidebarEntry
): SidebarGroup | null {
  if (!sidebar || !Array.isArray(sidebar)) return null;
  try {
    for (const entry of Array.from(sidebar)) {
      if (!entry || typeof entry !== "object") continue;
      if ((entry as { type?: string }).type === "group") {
        const group = entry as SidebarGroup;
        const entries = group.entries ?? (group as unknown as { items?: SidebarEntry[] }).items ?? [];
        if (Array.isArray(entries) && entries.includes(targetEntry)) return group;
        const found = findParentOfSidebarEntry(entries, targetEntry);
        if (found) return found;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export type PrevNextLink = { href: string; label: string; description?: string };

export async function getPrevNextPage(
  page: StarlightRouteData,
  paginationEnabled: boolean
): Promise<{ prev: PrevNextLink | null; next: PrevNextLink | null } | null> {
  try {
    if (!paginationEnabled) return null;
    if (!page?.sidebar || !Array.isArray(page.sidebar)) return null;

    const docsContent = await getCollection("docs");
    const docsList = Array.isArray(docsContent) ? docsContent : [];
    const findSidebarLinkInContent = (link: SidebarLink) =>
      docsList.find((doc) => {
        if (doc.id === "index" && link.href === "/") return true;
        return doc.id === link.href.replace(/^\//, "").replace(/\/$/, "");
      });

    const currentSidebar = page.sidebar;

    const flattened = flattenSidebar(Array.isArray(currentSidebar) ? currentSidebar : []);
    const paginationSequence: (SidebarLink & { description?: string })[] = Array.isArray(flattened)
      ? flattened
      .filter((e): e is SidebarLink => e != null && e.type === "link" && typeof (e as SidebarLink).href === "string")
      .filter(
        (link) =>
          !(link.attrs?.class ?? "")
            .trim()
            .split(/\s+/)
            .includes("stl-mobile-only-sidebar-item")
      )
      .filter((link) => !link.attrs?.["data-stldocs-method"])
      .map((link) => {
        if (link.attrs?.["data-stldocs-overview"] && link.label === "Overview") {
          const sidebarArr = Array.isArray(currentSidebar) ? currentSidebar : [];
          const parent = findParentOfSidebarEntry(sidebarArr, link);
          if (parent) return { ...link, label: parent.label };
        }
        return link;
      })
      .map((link) => {
        const contentEntry = findSidebarLinkInContent(link);
        if (contentEntry?.data) return { ...link, description: contentEntry.data.description };
        return link;
      })
      : [];

    const currentIndex = paginationSequence.findIndex((e) => e.isCurrent);
    if (currentIndex === -1) return null;

    const prevEntry =
      currentIndex > 0 ? paginationSequence[currentIndex - 1] ?? null : null;
    const nextEntry =
      currentIndex < paginationSequence.length - 1
        ? paginationSequence[currentIndex + 1] ?? null
        : null;

    return {
      prev: prevEntry ? { href: prevEntry.href, label: prevEntry.label, description: prevEntry.description } : null,
      next: nextEntry ? { href: nextEntry.href, label: nextEntry.label, description: nextEntry.description } : null,
    };
  } catch {
    return null;
  }
}
