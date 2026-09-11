import type { StarlightRouteData } from "@astrojs/starlight/route-data";

type SidebarEntry = StarlightRouteData["sidebar"][number];

/**
 * When a sidebar group has exactly one child and that child is a link, replace the group with
 * one link: same href/attrs as the child, label from the group (section heading). Nested groups
 * are processed bottom-up so multi-level trees still collapse correctly.
 *
 * Opt out by setting `attrs: { "data-no-flatten": "true" }` on the inner link entry — useful when
 * a group is intentionally a single-item collapsible category (e.g. "Destination" with one item).
 */
export function flattenSidebarSingleChildGroups(entries: SidebarEntry[]): SidebarEntry[] {
  return entries.map(transformEntry);
}

function transformEntry(entry: SidebarEntry): SidebarEntry {
  if (entry.type === "link") {
    return entry;
  }

  const processed = entry.entries.map(transformEntry);

  if (
    processed.length === 1 &&
    processed[0].type === "link" &&
    processed[0].attrs?.["data-no-flatten"] !== "true"
  ) {
    const link = processed[0];
    return {
      type: "link",
      label: entry.label,
      href: link.href,
      isCurrent: link.isCurrent,
      badge: entry.badge ?? link.badge,
      attrs: { ...link.attrs },
    };
  }

  return {
    ...entry,
    entries: processed,
  };
}
