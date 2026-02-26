import { Search } from "lucide-react";

interface GlossaryHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalTerms: number;
  filteredCount: number;
}

export function GlossaryHeader({
  searchQuery,
  onSearchChange,
  totalTerms,
  filteredCount,
}: GlossaryHeaderProps) {
  return (
    <header className="glossary-header">
      <div className="glossary-header__inner">
        <div className="glossary-header__content">
          <div className="glossary-header__text">
            <h1 className="glossary-header__title">Glossary</h1>
            <p className="glossary-header__description">
              A reference guide to commonly used terms and concepts in software
              development, infrastructure, and security.
            </p>
          </div>
          <div className="glossary-header__search-wrap">
            <Search className="glossary-header__search-icon" aria-hidden />
            <input
              type="search"
              className="glossary-header__search-input"
              placeholder="Search terms..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Search glossary terms"
            />
            {searchQuery && (
              <span className="glossary-header__search-count">
                {filteredCount} of {totalTerms}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
