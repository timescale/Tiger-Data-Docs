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
  return sidebar.flatMap((e) => (e.type === "group" ? flattenSidebar(e.entries) : e));
}

function findParentOfSidebarEntry(
  sidebar: SidebarEntry[],
  targetEntry: SidebarEntry
): SidebarGroup | null {
  for (const entry of sidebar) {
    if (entry.type === "group") {
      if (entry.entries.includes(targetEntry)) return entry;
      const found = findParentOfSidebarEntry(entry.entries, targetEntry);
      if (found) return found;
    }
  }
  return null;
}

export type PrevNextLink = { href: string; label: string; description?: string };

export async function getPrevNextPage(
  page: StarlightRouteData,
  paginationEnabled: boolean
): Promise<{ prev: PrevNextLink | null; next: PrevNextLink | null } | null> {
  if (!paginationEnabled) return null;

  const docsContent = await getCollection("docs");
  const findSidebarLinkInContent = (link: SidebarLink) =>
    docsContent.find((doc) => {
      if (doc.id === "index" && link.href === "/") return true;
      return doc.id === link.href.replace(/^\//, "").replace(/\/$/, "");
    });

  const currentSidebar = page.sidebar;

  const paginationSequence: (SidebarLink & { description?: string })[] = flattenSidebar(
    currentSidebar
  )
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
        const parent = findParentOfSidebarEntry(currentSidebar, link);
        if (parent) return { ...link, label: parent.label };
      }
      return link;
    })
    .map((link) => {
      const contentEntry = findSidebarLinkInContent(link);
      if (contentEntry) return { ...link, description: contentEntry.data.description };
      return link;
    });

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
}
