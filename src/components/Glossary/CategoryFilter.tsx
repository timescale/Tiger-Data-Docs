interface CategoryFilterProps {
  categories: string[];
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export function CategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div className="glossary-category-filter">
      <span className="glossary-category-filter__label">Filter</span>
      <button
        type="button"
        onClick={() => onCategoryChange(null)}
        className={`glossary-category-filter__pill ${
          activeCategory === null ? "glossary-category-filter__pill--active" : ""
        }`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() =>
            onCategoryChange(activeCategory === category ? null : category)
          }
          className={`glossary-category-filter__pill ${
            activeCategory === category
              ? "glossary-category-filter__pill--active"
              : ""
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
