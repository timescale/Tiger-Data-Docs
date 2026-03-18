/**
 * "On this page" TOC for the integrate index.
 * Lists Sort by Category, Sort by Industry, Sort by Integration Type (matches left sidebar and main content).
 */

/** Category slug from href e.g. /integrate/data-engineering-etl -> data-engineering-etl */
function hrefToCategorySlug(href: string): string {
  return href.replace(/^\/integrate\/?/, "").replace(/\/$/, "") || "";
}
/** Category sections (matches IntegrateOverview and left sidebar). */
const CATEGORIES = [
  { title: "Data Engineering & ETL", href: "/integrate/data-engineering-etl" },
  { title: "BI & Visualization", href: "/integrate/bi-vizualization" },
  { title: "Data Ingestion & Streaming", href: "/integrate/data-ingestion-streaming" },
  { title: "Connectors", href: "/integrate/connectors" },
  { title: "Code & Libraries", href: "/integrate/code" },
  { title: "Query & Administration", href: "/integrate/query-administration" },
  { title: "Secure Connectivity", href: "/integrate/secure-connectivity" },
  { title: "Observability & Alerting", href: "/integrate/observability-alerting" },
  { title: "Configuration & Deployment", href: "/integrate/configuration-deployment" },
];
const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [hrefToCategorySlug(c.href), c.title])
);
function getCategoryLabel(slug: string): string {
  return CATEGORY_LABELS[slug] ?? slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

const INDUSTRY_ITEMS = [
  { id: "integrate-industry-oil-and-gas", label: "Oil and Gas" },
  { id: "integrate-industry-iot", label: "IoT" },
  { id: "integrate-industry-energy", label: "Energy" },
  { id: "integrate-industry-crypto", label: "Crypto" },
  { id: "integrate-industry-healthcare", label: "Healthcare" },
  { id: "integrate-industry-manufacturing", label: "Manufacturing" },
];

const INTEGRATION_TYPE_ITEMS = [
  { id: "integrate-type-tiger-connectors", label: "Tiger Connectors" },
  { id: "integrate-type-partner", label: "Partner Integrations" },
  { id: "integrate-type-third-party", label: "Third Party Integrations" },
];

export interface IntegrateTocProps {
  categoryOrder: string[];
}

export function IntegrateToc({ categoryOrder }: IntegrateTocProps) {
  return (
    <aside className="glossary-page-toc integrate-toc" aria-label="On this page">
      <h2 className="glossary-page-toc__title">On this page</h2>
      <nav className="glossary-page-toc__nav">
        <ul className="glossary-page-toc__list">
          <li className="glossary-page-toc__item">
            <a href="#" className="glossary-page-toc__link" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0 }); }}>
              Overview
            </a>
          </li>
          <li className="glossary-page-toc__item">
            <a href="#integrate-categories-heading" className="glossary-page-toc__link">
              Sort by Category
            </a>
            {categoryOrder.length > 0 && (
              <ul className="glossary-page-toc__list integrate-toc__sublist">
                {categoryOrder.map((slug) => {
                  const id = `integrate-category-${slug.replace(/\s+/g, "-").toLowerCase()}`;
                  return (
                    <li key={id} className="glossary-page-toc__item">
                      <a href={`#${id}`} className="glossary-page-toc__link integrate-toc__sublink">
                        {getCategoryLabel(slug)}
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
          <li className="glossary-page-toc__item">
            <a href="#integrate-industries-heading" className="glossary-page-toc__link">
              Sort by Industry
            </a>
            <ul className="glossary-page-toc__list integrate-toc__sublist">
              {INDUSTRY_ITEMS.map((item) => (
                <li key={item.id} className="glossary-page-toc__item">
                  <a href={`#${item.id}`} className="glossary-page-toc__link integrate-toc__sublink">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </li>
          <li className="glossary-page-toc__item">
            <a href="#integrate-types-heading" className="glossary-page-toc__link">
              Sort by Integration Type
            </a>
            <ul className="glossary-page-toc__list integrate-toc__sublist">
              {INTEGRATION_TYPE_ITEMS.map((item) => (
                <li key={item.id} className="glossary-page-toc__item">
                  <a href={`#${item.id}`} className="glossary-page-toc__link integrate-toc__sublink">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </li>
          <li className="glossary-page-toc__item">
            <a href="#postgresql-compatibility" className="glossary-page-toc__link">
              PostgreSQL compatibility
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
