import type { ReactNode } from "react";
import { StepCard } from "./StepCard";

export { StepCard };
export type { StepCardProps } from "./StepCard";

/**
 * StepCards – grid of StepCards for linking to tools, guides, or pages.
 * Figma step tiles (3387-360, 3387-361). Optional section heading.
 *
 * Usage in MDX:
 *   import { StepCards, StepCard } from "@components/StepCards";
 *   <StepCards heading="Next steps">
 *     <StepCard title="Terraform guide" description="Configure with IaC." href="/integrate/configuration-deployment/terraform" />
 *     <StepCard title="API reference" description="REST API docs." href="/reference/tiger-cloud-api" />
 *   </StepCards>
 */
export interface StepCardsProps {
  /** Optional heading above the card grid (Figma: Heading 18 Regular) */
  heading?: string;
  children?: ReactNode;
}

export function StepCards({ heading, children }: StepCardsProps) {
  return (
    <div className="step-cards">
      {heading ? <h2 className="step-cards__heading">{heading}</h2> : null}
      <div className="step-cards__grid">{children}</div>
    </div>
  );
}
