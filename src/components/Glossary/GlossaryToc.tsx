import type { GlossaryTerm } from "../../lib/glossary-data";
import { slug } from "../../lib/glossary-data";

interface GlossaryTocProps {
  terms: GlossaryTerm[];
}

/**
 * "On this page" sidebar: list of glossary terms in alphabetical order.
 * Rendered only on the glossary page; replace the default Starlight TOC.
 */
export function GlossaryToc({ terms }: GlossaryTocProps) {
  const sorted = [...terms].sort((a, b) =>
    a.term.localeCompare(b.term, undefined, { sensitivity: "base" })
  );

  if (sorted.length === 0) return null;

  return (
    <aside
      className="glossary-page-toc"
      aria-label="On this page"
    >
      <h2 className="glossary-page-toc__title">On this page</h2>
      <nav className="glossary-page-toc__nav">
        <ul className="glossary-page-toc__list">
          {sorted.map((term) => (
            <li key={slug(term.term)} className="glossary-page-toc__item">
              <a
                href={`#${slug(term.term)}`}
                className="glossary-page-toc__link"
              >
                {term.term}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
