/**
 * Copy to clipboard button – copies a given string on click and shows "Copied!" feedback.
 * Matches SecondaryButton styling (Figma 3245-9636, 3245-9637) for consistency with
 * the Stainless Docs Platform and Tiger Data design system.
 *
 * Use for connection strings, one-line code snippets, or any text you want users to
 * copy with one click. For full code blocks, rely on Expressive Code’s built-in copy
 * button in Starlight.
 *
 * @see https://www.stainless.com/docs/docs-platform
 * @see README-component.md – Copy to clipboard section
 */
import { useState, useCallback, useRef, useEffect } from "react";

const COPY_ICON = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden focusable="false">
    <path d="M8 4.5V8.5C8 8.78 7.78 9 7.5 9H3.5C3.22 9 3 8.78 3 8.5V4.5C3 4.22 3.22 4 3.5 4H7.5C7.78 4 8 4.22 8 4.5Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M9 3V7.5C9 7.78 8.78 8 8.5 8H4.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const CHECK_ICON = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden focusable="false">
    <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

export interface CopyToClipboardProps {
  /** Text to copy to the clipboard when the button is clicked. */
  text: string;
  /** Button label before copy. Default: "Copy". */
  label?: string;
  /** Label shown after a successful copy. Default: "Copied!". */
  copiedLabel?: string;
  /** Visual variant: "default" (white bg) or "subtle" (gray bg). Same as SecondaryButton. */
  variant?: "default" | "subtle";
  /** Accessible name; defaults to label, then "Copy to clipboard". */
  "aria-label"?: string;
  /** Optional class name for the button. */
  className?: string;
}

const COPIED_RESET_MS = 2000;

export default function CopyToClipboard({
  text,
  label = "Copy",
  copiedLabel = "Copied!",
  variant = "default",
  "aria-label": ariaLabel,
  className = "",
}: CopyToClipboardProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClick = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      timeoutRef.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      // Fallback for older browsers or non-HTTPS
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        timeoutRef.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
      } catch {
        // Ignore; user can select and copy manually
      }
    }
  }, [text]);

  const resolvedAriaLabel = ariaLabel ?? (copied ? copiedLabel : label);
  const displayLabel = copied ? copiedLabel : label;
  const baseClass = "stl-ui-button--secondary";
  const variantClass = `stl-ui-button--${variant}`;
  const classes = [baseClass, variantClass, className].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      className={classes}
      onClick={handleClick}
      aria-label={resolvedAriaLabel}
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="stl-ui-button__icon" aria-hidden="true">
        {copied ? CHECK_ICON : COPY_ICON}
      </span>
      <span className="stl-ui-button__label">{displayLabel}</span>
    </button>
  );
}
