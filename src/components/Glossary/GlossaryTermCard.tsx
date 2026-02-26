import type { ReactNode } from "react";
import type { GlossaryTerm } from "../../lib/glossary-data";

interface GlossaryTermCardProps {
  term: GlossaryTerm;
  highlight?: string;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text: string, query: string): ReactNode {
  if (!query) return text;
  const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
  const parts = text.split(regex);
  // Odd-indexed parts are the regex capture groups (matches)
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="glossary-term-card__highlight">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function GlossaryTermCard({ term, highlight }: GlossaryTermCardProps) {
  return (
    <div className="glossary-term-card">
      <div className="glossary-term-card__header">
        <h3 className="glossary-term-card__term">
          {highlight ? highlightText(term.term, highlight) : term.term}
        </h3>
        <span className="glossary-term-card__badge">{term.category}</span>
      </div>
      <p className="glossary-term-card__definition">
        {highlight ? highlightText(term.definition, highlight) : term.definition}
      </p>
    </div>
  );
}
