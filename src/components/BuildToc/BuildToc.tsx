/**
 * "On this page" sidebar for the Build index: "I want to…" with six sub-items.
 * Rendered via BuildTocPortal into the right sidebar; no headings on the page.
 */
const BUILD_TOC_ITEMS: { label: string; href: string }[] = [
  { label: "Manage my time-series data", href: "#manage-my-time-series-data" },
  { label: "Keep pre-computed aggregations up to date", href: "#keep-pre-computed-aggregations-up-to-date" },
  { label: "Optimize storage and query speed", href: "#optimize-storage-and-query-speed" },
  { label: "Make queries and schemas faster", href: "#make-queries-and-schemas-faster" },
  { label: "Lower storage and compute costs", href: "#lower-storage-and-compute-costs" },
  { label: "Troubleshooting", href: "#troubleshooting" },
];

export function BuildToc() {
  return (
    <div className="build-page-toc-wrapper">
      <nav className="build-page-toc" aria-label="On this page">
        <h2 id="build-toc__on-this-page" className="build-page-toc__title">
          On this page
        </h2>
        <ul className="build-page-toc__list">
          <li className="build-page-toc__item">
            <span className="build-page-toc__parent">I want to…</span>
            <ul className="build-page-toc__sublist">
              {BUILD_TOC_ITEMS.map(({ label, href }) => (
                <li key={href} className="build-page-toc__subitem">
                  <a href={href} className="build-page-toc__link">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
}
