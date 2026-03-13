/**
 * Dynamic "On this page" TOC for the integrate index.
 * Shows the current view (See all integrations, by category, by industry, by plan)
 * with subcategories when applicable (e.g. industry sections, category links, plan sections).
 */

const HASH_TO_VIEW: Record<string, string> = {
  all: "all",
  "by-category": "category",
  "by-industry": "industry",
  "by-plan": "plan",
};

/** Category slug from href e.g. /integrate/data-engineering-etl -> data-engineering-etl */
function hrefToCategorySlug(href: string): string {
  return href.replace(/^\/integrate\/?/, "").replace(/\/$/, "") || "";
}
/** Category sections for "By category" view (matches IntegrateOverview and sidebar). */
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

const INDUSTRY_LABELS: Record<string, string> = {
  crypto: "Crypto",
  IoT: "IoT",
  healthcare: "Healthcare",
  manufacturing: "Manufacturing",
};

export type IntegrateView = "all" | "category" | "industry" | "plan";

export type AllIntegrationTocItem = { title: string; id: string };

export type PlanTocSection = { key: string; label: string; id: string; items: AllIntegrationTocItem[] };

interface IntegrateTocProps {
  currentView: IntegrateView;
  industryOrder: string[];
  categoryOrder: string[];
  allIntegrations: AllIntegrationTocItem[];
  planSections: PlanTocSection[];
}

function getViewFromHash(): IntegrateView {
  const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
  const view = HASH_TO_VIEW[hash];
  return (view as IntegrateView) || "all";
}

export function IntegrateToc({ currentView, industryOrder, categoryOrder, allIntegrations, planSections }: IntegrateTocProps) {
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
            <a
              href="#all"
              className={`glossary-page-toc__link ${currentView === "all" ? "integrate-toc__link--active" : ""}`}
              onClick={(e) => { e.preventDefault(); window.location.hash = "all"; }}
            >
              See all integrations
            </a>
            {currentView === "all" && allIntegrations.length > 0 && (
              <ul className="glossary-page-toc__list integrate-toc__sublist">
                {allIntegrations.map((item) => (
                  <li key={item.id} className="glossary-page-toc__item">
                    <a href={`#integrate-card-${item.id}`} className="glossary-page-toc__link integrate-toc__sublink">
                      {item.title.replace(/\s+and Tiger Data$/i, "")}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
          <li className="glossary-page-toc__item">
            <a
              href="#by-category"
              className={`glossary-page-toc__link ${currentView === "category" ? "integrate-toc__link--active" : ""}`}
              onClick={(e) => { e.preventDefault(); window.location.hash = "by-category"; }}
            >
              By category
            </a>
            {currentView === "category" && categoryOrder.length > 0 && (
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
            <a
              href="#by-industry"
              className={`glossary-page-toc__link ${currentView === "industry" ? "integrate-toc__link--active" : ""}`}
              onClick={(e) => { e.preventDefault(); window.location.hash = "by-industry"; }}
            >
              By industry
            </a>
            {currentView === "industry" && industryOrder.length > 0 && (
              <ul className="glossary-page-toc__list integrate-toc__sublist">
                {industryOrder.map((key) => {
                  const id = `integrate-industry-${String(key).toLowerCase()}`;
                  const label = INDUSTRY_LABELS[key] ?? key;
                  return (
                    <li key={id} className="glossary-page-toc__item">
                      <a href={`#${id}`} className="glossary-page-toc__link integrate-toc__sublink">
                        {label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
          <li className="glossary-page-toc__item">
            <a
              href="#by-plan"
              className={`glossary-page-toc__link ${currentView === "plan" ? "integrate-toc__link--active" : ""}`}
              onClick={(e) => { e.preventDefault(); window.location.hash = "by-plan"; }}
            >
              By plan
            </a>
            {currentView === "plan" && planSections.length > 0 && (
              <ul className="glossary-page-toc__list integrate-toc__sublist">
                {planSections.map((section) => (
                  <li key={section.id} className="glossary-page-toc__item">
                    <a href={`#${section.id}`} className="glossary-page-toc__link integrate-toc__sublink">
                      {section.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
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

export { getViewFromHash };
