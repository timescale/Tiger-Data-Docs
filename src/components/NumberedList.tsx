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
 */

export interface NumberedItemProps {
  title: string;
  children?: ReactNode;
}

export function NumberedItem({ title, children }: NumberedItemProps) {
  return (
    <li className="numbered-list__item">
      <div className="numbered-list__item-content">
        <strong className="numbered-list__item-title">{title}</strong>
        {children != null && (
          <div className="numbered-list__item-body">{children}</div>
        )}
      </div>
    </li>
  );
}

export interface NumberedListProps {
  children?: ReactNode;
}

export function NumberedList({ children }: NumberedListProps) {
  return <ol className="numbered-list">{children}</ol>;
}
