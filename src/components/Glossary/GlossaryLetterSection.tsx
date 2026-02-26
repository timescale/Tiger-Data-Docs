import type { GlossaryTerm } from "../../lib/glossary-data";
import { GlossaryTermCard } from "./GlossaryTermCard";

interface GlossaryLetterSectionProps {
  letter: string;
  terms: GlossaryTerm[];
  highlight?: string;
}

export function GlossaryLetterSection({
  letter,
  terms,
  highlight,
}: GlossaryLetterSectionProps) {
  return (
    <section
      id={`letter-${letter}`}
      className="glossary-letter-section"
      aria-label={`Terms starting with ${letter}`}
    >
      <div className="glossary-letter-section__title-row">
        <span className="glossary-letter-section__letter">{letter}</span>
        <div className="glossary-letter-section__line" />
        <span className="glossary-letter-section__count">
          {terms.length} {terms.length === 1 ? "term" : "terms"}
        </span>
      </div>
      <div className="glossary-term-grid">
        {terms.map((term) => (
          <GlossaryTermCard
            key={term.term}
            term={term}
            highlight={highlight}
          />
        ))}
      </div>
    </section>
  );
}
