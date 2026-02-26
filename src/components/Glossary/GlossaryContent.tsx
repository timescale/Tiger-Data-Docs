import { useState, useMemo, useCallback } from "react";
import { glossaryTerms, categories } from "../../lib/glossary-data";
import { GlossaryHeader } from "./GlossaryHeader";
import { AlphabetNav } from "./AlphabetNav";
import { CategoryFilter } from "./CategoryFilter";
import { GlossaryLetterSection } from "./GlossaryLetterSection";
import { GlossaryTocPortal } from "./GlossaryTocPortal";

export function GlossaryContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  const filteredTerms = useMemo(() => {
    return glossaryTerms.filter((term) => {
      const matchesSearch =
        !searchQuery ||
        term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.definition.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        !activeCategory || term.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const groupedTerms = useMemo(() => {
    const groups: Record<string, typeof filteredTerms> = {};
    for (const term of filteredTerms) {
      const letter = term.term[0].toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(term);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredTerms]);

  const availableLetters = useMemo(() => {
    return new Set(filteredTerms.map((t) => t.term[0].toUpperCase()));
  }, [filteredTerms]);

  const handleLetterClick = useCallback((letter: string) => {
    setActiveLetter(letter);
    const el = document.getElementById(`letter-${letter}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setActiveLetter(null);
  }, []);

  const sortedForToc = useMemo(
    () => [...filteredTerms].sort((a, b) => a.term.localeCompare(b.term, undefined, { sensitivity: "base" })),
    [filteredTerms]
  );

  return (
    <div className="glossary-root">
      <GlossaryTocPortal terms={sortedForToc} />
      <div className="glossary-content-wrap">
        <GlossaryHeader
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          totalTerms={glossaryTerms.length}
          filteredCount={filteredTerms.length}
        />
        <AlphabetNav
          availableLetters={availableLetters}
          activeLetter={activeLetter}
          onLetterClick={handleLetterClick}
        />
        <main className="glossary-main">
          <div className="glossary-main__filter-wrap">
            <CategoryFilter
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>
          {groupedTerms.length > 0 ? (
            <div className="glossary-sections">
              {groupedTerms.map(([letter, terms]) => (
                <GlossaryLetterSection
                  key={letter}
                  letter={letter}
                  terms={terms}
                  highlight={searchQuery}
                />
              ))}
            </div>
          ) : (
            <div className="glossary-empty">
              <p className="glossary-empty__title">No terms found</p>
              <p className="glossary-empty__hint">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </main>
        <footer className="glossary-footer">
          <div className="glossary-footer__inner">
            <span>{glossaryTerms.length} terms</span>
            <span>{categories.length} categories</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
