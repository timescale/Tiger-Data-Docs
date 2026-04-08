import React from "react";
import type { ReactNode } from "react";

/**
 * NumberedList – a numbered instruction list with step circles and a vertical connecting line.
 * Use in MDX for step-by-step guides. Styles live in theme.css.
 *
 * Import from any MDX file (use the @components alias):
 *   import { NumberedList, NumberedItem } from "@components/NumberedList";
 *
 * Usage:
 *   <NumberedList>
 *     <NumberedItem title="Step one">Description or body text.</NumberedItem>
 *     <NumberedItem title="Step two">More details here.</NumberedItem>
 *   </NumberedList>
 *
 * Backticks in title strings are rendered as <code> elements:
 *   <NumberedItem title="Use `psql` to connect">...</NumberedItem>
 */

/** Parse backtick-wrapped segments in a string into <code> elements. */
function renderInlineCode(text: string): ReactNode {
  const parts = text.split(/(`[^`]+`)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part.startsWith("`") && part.endsWith("`")
      ? React.createElement("code", { key: i }, part.slice(1, -1))
      : part,
  );
}

export interface NumberedItemProps {
  title: ReactNode;
  children?: ReactNode;
}

export function NumberedItem({ title, children }: NumberedItemProps) {
  const renderedTitle =
    typeof title === "string" ? renderInlineCode(title) : title;
  return (
    <li className="numbered-list__item">
      <div className="numbered-list__item-content">
        <strong className="numbered-list__item-title">{renderedTitle}</strong>
        {children != null && (
          <div className="numbered-list__item-body">{children}</div>
        )}
      </div>
    </li>
  );
}

export interface NumberedListProps {
  /** Optional heading above the steps (Figma: Heading 18 Strong) */
  heading?: string;
  children?: ReactNode;
}

export function NumberedList({ heading, children }: NumberedListProps) {
  return (
    <div className="numbered-list-wrapper">
      {heading ? <h2 className="numbered-list__heading">{heading}</h2> : null}
      <ol className="numbered-list">{children}</ol>
    </div>
  );
}