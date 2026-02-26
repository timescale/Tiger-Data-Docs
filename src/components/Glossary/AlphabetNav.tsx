interface AlphabetNavProps {
  availableLetters: Set<string>;
  activeLetter: string | null;
  onLetterClick: (letter: string) => void;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function AlphabetNav({
  availableLetters,
  activeLetter,
  onLetterClick,
}: AlphabetNavProps) {
  return (
    <nav
      className="glossary-alphabet-nav"
      aria-label="Alphabetical navigation"
    >
      <div className="glossary-alphabet-nav__inner">
        <div className="glossary-alphabet-nav__letters">
          {ALPHABET.map((letter) => {
            const isAvailable = availableLetters.has(letter);
            const isActive = activeLetter === letter;
            return (
              <button
                key={letter}
                type="button"
                onClick={() => isAvailable && onLetterClick(letter)}
                disabled={!isAvailable}
                aria-label={`Jump to letter ${letter}`}
                className={`glossary-alphabet-nav__letter ${
                  isActive ? "glossary-alphabet-nav__letter--active" : ""
                } ${
                  isAvailable
                    ? "glossary-alphabet-nav__letter--available"
                    : "glossary-alphabet-nav__letter--disabled"
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
