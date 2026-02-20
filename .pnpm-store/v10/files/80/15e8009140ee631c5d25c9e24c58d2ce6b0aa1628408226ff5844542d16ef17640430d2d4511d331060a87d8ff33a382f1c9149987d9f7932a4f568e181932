import { ChevronRight } from 'lucide-react';
import { Join } from '@stainless-api/docs-ui/components';
import style from '@stainless-api/docs-ui/style';
import type { StarlightRouteData } from '@astrojs/starlight/route-data';

type Breadcrumb = { title: string; href: string };

// Normalize paths to avoid mismatches due to trailing slashes
function normalizePath(path: string) {
  return path.endsWith('/') ? path : path + '/';
}

export function findBreadcrumbTrail(
  sidebarEntry: StarlightRouteData['sidebar'],
  targetPath: string,
  includeCurrentPage: boolean,
  trail: Breadcrumb[] = [],
): Breadcrumb[] | null {
  const entries = sidebarEntry.filter((entry) => {
    return !(
      entry as StarlightRouteData['sidebar'][number] & { attrs?: { class?: string } }
    ).attrs?.class?.includes('stl-mobile-only-sidebar-item');
  });
  const normalizedTarget = normalizePath(targetPath);

  for (const entry of entries) {
    if (entry.type === 'link') {
      const normalizedHref = normalizePath(entry.href);
      if (normalizedHref === normalizedTarget) {
        const fullTrail = [...trail, { title: entry.label, href: entry.href }];
        if (includeCurrentPage || fullTrail.length === 1) {
          return fullTrail;
        } else {
          return fullTrail.slice(0, -1);
        }
      }
    } else if (entry.type === 'group') {
      const groupBreadcrumb: Breadcrumb = { title: entry.label, href: '' };
      const result = findBreadcrumbTrail(entry.entries, targetPath, includeCurrentPage, [
        ...trail,
        groupBreadcrumb,
      ]);
      if (result) return result;
    }
  }

  return null;
}

export function ContentBreadcrumbs({
  currentPath,
  sidebarEntry,
}: {
  currentPath: string;
  sidebarEntry: StarlightRouteData['sidebar'];
}) {
  const breadcrumbs = findBreadcrumbTrail(sidebarEntry, currentPath, true);

  if (!breadcrumbs) {
    return null;
  }

  const items = breadcrumbs?.map((crumb, index) => (
    <div key={index} className={style.BreadcrumbsItem}>
      {crumb.href ? (
        <a href={crumb.href} className={style.BreadcrumbsLink}>
          {crumb.title}
        </a>
      ) : (
        <span className={style.BreadcrumbsNonLink}>{crumb.title}</span>
      )}
    </div>
  ));

  return (
    <div className="stl-content-breadcrumbs stldocs-root">
      <div className={style.Breadcrumbs}>
        <Join limit={breadcrumbs?.length} items={items}>
          <ChevronRight />
        </Join>
      </div>
    </div>
  );
}
