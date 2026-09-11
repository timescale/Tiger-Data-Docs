import type { ReactNode } from "react";

/**
 * Prerequisites – success-styled banner shown above a list of things the reader needs before
 * starting (Figma 3492-619). Renders a green-tinted box with checkmark icon, a title,
 * an intro line, and a body (lists/paragraphs passed as children).
 *
 * --------------------------------------------------------------------------
 * How to pick the `context` prop (controls the noun in the title)
 * --------------------------------------------------------------------------
 * The component renders its title as: `Prerequisites for this {noun}`. Pick the value of
 * `context` based on what kind of doc the reader is on:
 *
 *   context="procedure"   → "Prerequisites for this procedure"
 *                           Use for short, focused how-to page sections that walk through one task
 *                           (e.g. enabling a feature, configuring a setting). DEFAULT.
 *
 *   context="page"        → "Prerequisites for this page"
 *                           Use for reference / explanatory pages that aren't a single
 *                           ordered task — e.g. cookbooks, conceptual overviews with
 *                           multiple independent examples.
 *
 *   context="tutorial"    → "Prerequisites for this tutorial"
 *                           Use for end-to-end learning content under /build/examples/
 *                           and similar (multi-step tutorials, full walkthroughs).
 *
 *   context="integration" → "Prerequisites for this integration guide"
 *                           Use for pages under /integrate/ that show how to connect a
 *                           third-party tool to Tiger Cloud / TimescaleDB.
 *
 * If none of these fit, pass `title="..."` to override the heading entirely. The intro
 * line ("To follow these steps, you'll need:") is the same for every context and is
 * supplied by this component — partials/children should NOT include their own intro.
 * Pass `intro={false}` if you really need to hide it (rare).
 *
 * --------------------------------------------------------------------------
 * Usage in MDX
 * --------------------------------------------------------------------------
 *   import { Prerequisites } from "@components/Prerequisites";
 *
 *   <Prerequisites context="tutorial">
 *     - A [Tiger Cloud account](/get-started/quickstart/create-account)
 *     - [Python 3.9+](https://www.python.org/) installed
 *   </Prerequisites>
 *
 * Bullets should be NOUN PHRASES ("A Tiger Cloud service", "Docker installed"), not verb
 * phrases ("Create a service", "Install Docker") — they read as completions of the intro
 * "you'll need: ___".
 */
export type PrerequisitesContext = "procedure" | "page" | "tutorial" | "integration";

const CONTEXT_NOUN: Record<PrerequisitesContext, string> = {
  procedure: "procedure",
  page: "page",
  tutorial: "tutorial",
  integration: "integration guide",
};

export interface PrerequisitesProps {
  /**
   * Selects the noun used in the default title: "Prerequisites for this {noun}".
   * Pick by content type — see the component-level JSDoc above for guidance.
   * Default: "procedure".
   */
  context?: PrerequisitesContext;
  /** Full heading text override; replaces the context-derived title. Use only if no `context` fits. */
  title?: string;
  /** Intro sentence above the list; default "To follow these steps, you'll need:". Set to false to hide. */
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
  context = "procedure",
  title,
  intro = "To follow these steps, you'll need:",
  children,
}: PrerequisitesProps) {
  const heading = title ?? `Prerequisites for this ${CONTEXT_NOUN[context]}`;
  return (
    <div className="prerequisites">
      <div className="prerequisites__header">
        <SuccessCheckIcon />
        <h2 className="prerequisites__title">{heading}</h2>
      </div>
      <div className="prerequisites__body">
        {intro !== false && <p className="prerequisites__intro">{intro}</p>}
        {children}
      </div>
    </div>
  );
}
