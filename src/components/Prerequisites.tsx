import type { ReactNode } from "react";

/**
 * Prerequisites – success-styled banner for "Prerequisites for this tutorial" (Figma 3492-619).
 * Renders a green-tinted box with checkmark icon, title, optional intro line, and body (lists/paragraphs).
 *
 * Usage in MDX:
 *   import { Prerequisites } from "@components/Prerequisites";
 *   <Prerequisites>
 *     - Prerequisite 1 (e.g. [Tiger Cloud account](/link))
 *     - Prerequisite 2
 *   </Prerequisites>
 *
 * Optional props: title, intro (set to false to hide the default intro line).
 */
export interface PrerequisitesProps {
  /** Heading text; default "Prerequisites for this tutorial" */
  title?: string;
  /** Intro sentence above the list; default "To follow the procedure on this page, you'll need to:". Set to false to hide. */
  intro?: string | false;
  children?: ReactNode;
}

function SuccessCheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="prerequisites__icon"
    >
      <circle cx="8" cy="8" r="8" fill="var(--prerequisites-icon-bg, #0d9488)" />
      <path
        d="M5 8l2.5 2.5L11 6"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Prerequisites({
  title = "Prerequisites for this tutorial",
  intro = "To follow the procedure on this page, you'll need:",
  children,
}: PrerequisitesProps) {
  return (
    <div className="prerequisites">
      <div className="prerequisites__header">
        <SuccessCheckIcon />
        <h2 className="prerequisites__title">{title}</h2>
      </div>
      <div className="prerequisites__body">
        {intro !== false && <p className="prerequisites__intro">{intro}</p>}
        {children}
      </div>
    </div>
  );
}
