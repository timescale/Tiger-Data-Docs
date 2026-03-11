import type { ReactNode } from "react";
import { RelatedContentCard } from "./RelatedContentCard";

export { RelatedContentCard };
export type { RelatedContentCardProps } from "./RelatedContentCard";

export interface RelatedContentCardsProps {
  heading?: string;
  children?: ReactNode;
}

/**
 * RelatedContentCards – grid of related content link cards (Figma 3387-363).
 * Use for "Learn more", "Next steps", "Other examples", etc.
 */
export function RelatedContentCards({
  heading,
  children,
}: RelatedContentCardsProps) {
  return (
    <div className="related-content-cards">
      {heading ? (
        <h2 className="related-content-cards__heading">{heading}</h2>
      ) : null}
      <div className="related-content-cards__grid">{children}</div>
    </div>
  );
}
