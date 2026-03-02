/**
 * Dynamic "On this page" TOC for the integrate index.
 * Shows the current view (by category, by industry, Tiger Data connectors, external)
 * with subcategories when applicable (e.g. industry sections, category links).
 */

const HASH_TO_VIEW: Record<string, string> = {
  "by-category": "category",
  "by-industry": "industry",
  "tiger-data": "tiger-data",
  external: "external",
};

const CATEGORIES = [
  { title: "Data Engineering & ETL", href: "/integrate/data-engineering-etl" },
  { title: "BI & Visualization", href: "/integrate/bi-vizualization" },
  { title: "Data Ingestion & Streaming", href: "/integrate/data-ingestion-streaming" },
  { title: "Connectors", href: "/integrate/connectors" },
  { title: "Query & Administration", href: "/integrate/query-administration" },
  { title: "Secure Connectivity", href: "/integrate/secure-connectivity" },
  { title: "Observability & Alerting", href: "/integrate/observability-alerting" },
  { title: "Configuration & Deployment", href: "/integrate/configuration-deployment" },
];

const INDUSTRY_LABELS: Record<string, string> = {
  crypto: "Crypto",
  IoT: "IoT",
  healthcare: "Healthcare",
  manufacturing: "Manufacturing",
};

export type IntegrateView = "category" | "industry" | "tiger-data" | "external";

interface IntegrateTocProps {
  currentView: IntegrateView;
  industryOrder: string[];
}

function getViewFromHash(): IntegrateView {
  const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
  const view = HASH_TO_VIEW[hash];
  return (view as IntegrateView) || "category";
}

export function IntegrateToc({ currentView, industryOrder }: IntegrateTocProps) {
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
              href="#by-category"
              className={`glossary-page-toc__link ${currentView === "category" ? "integrate-toc__link--active" : ""}`}
              onClick={(e) => { e.preventDefault(); window.location.hash = "by-category"; }}
            >
              By category
            </a>
            {currentView === "category" && (
              <ul className="glossary-page-toc__list integrate-toc__sublist">
                {CATEGORIES.map((cat) => (
                  <li key={cat.href} className="glossary-page-toc__item">
                    <a href={cat.href} className="glossary-page-toc__link integrate-toc__sublink">
                      {cat.title}
                    </a>
                  </li>
                ))}
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
              href="#tiger-data"
              className={`glossary-page-toc__link ${currentView === "tiger-data" ? "integrate-toc__link--active" : ""}`}
              onClick={(e) => { e.preventDefault(); window.location.hash = "tiger-data"; }}
            >
              Tiger Data connectors
            </a>
          </li>
          <li className="glossary-page-toc__item">
            <a
              href="#external"
              className={`glossary-page-toc__link ${currentView === "external" ? "integrate-toc__link--active" : ""}`}
              onClick={(e) => { e.preventDefault(); window.location.hash = "external"; }}
            >
              External integrations and tools
            </a>
          </li>
          <li className="glossary-page-toc__item">
            <a href="#pg-compatibility" className="glossary-page-toc__link">
              PostgreSQL compatibility
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export { getViewFromHash };
