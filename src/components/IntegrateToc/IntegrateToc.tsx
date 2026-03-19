/**
 * "On this page" TOC for the integrate index.
 * Simplified for the new search + filter layout.
 */

export interface IntegrateTocProps {
  categoryOrder: string[];
}

export function IntegrateToc({ categoryOrder: _categoryOrder }: IntegrateTocProps) {
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
            <a href="#integrate-overview-root" className="glossary-page-toc__link">
              All integrations
            </a>
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
