/**
 * RelatedContentCard – link card for related docs/tools (Figma 3387-363).
 * Title 16px Regular, description 14px; no arrow. Use inside RelatedContentCards.
 */
export interface RelatedContentCardProps {
  title: string;
  description: string;
  href: string;
  external?: boolean;
}

export function RelatedContentCard({
  title,
  description,
  href,
  external,
}: RelatedContentCardProps) {
  return (
    <a
      className="related-content-card"
      href={href}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
    >
      <span className="related-content-card__title">{title}</span>
      <p className="related-content-card__description">{description}</p>
    </a>
  );
}
