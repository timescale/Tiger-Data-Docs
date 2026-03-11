import type { ReactNode } from "react";

/**
 * StepCard – link card for docs: title, description, arrow icon.
 * Figma 3387-360 (default), 3387-361 (hover). Use inside StepCards.
 *
 * Usage in MDX:
 *   import { StepCards, StepCard } from "@components/StepCards";
 *   <StepCards heading="Optional heading">
 *     <StepCard title="Guide name" description="Short description." href="/path" />
 *   </StepCards>
 */
export interface StepCardProps {
  /** Card title (Figma: Heading 18 Regular) */
  title: string;
  /** Short description (Figma: Body 16 Regular, fg/emphasized) */
  description: string;
  /** Link URL (internal path or external) */
  href: string;
  /** Optional: open in new tab (e.g. for external links) */
  external?: boolean;
}

function ArrowRightIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="step-card__icon"
    >
      <path
        d="M5 12h14m-7-7 7 7-7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StepCard({ title, description, href, external }: StepCardProps) {
  return (
    <a
      className="step-card"
      href={href}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
    >
      <div className="step-card__header">
        <span className="step-card__title">{title}</span>
        <span className="step-card__icon-wrap">
          <ArrowRightIcon />
        </span>
      </div>
      <p className="step-card__description">{description}</p>
    </a>
  );
}
