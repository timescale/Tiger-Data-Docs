import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { GlossaryTerm } from "../../lib/glossary-data";
import { GlossaryToc } from "./GlossaryToc";

/** Selectors for the site's right sidebar (same panel as "On this page" on other docs). */
const RIGHT_SIDEBAR_SELECTORS = [
  ".right-sidebar-container .right-sidebar",
  ".right-sidebar",
  "aside.right-sidebar-container",
  "[class*='right-sidebar']",
];

function findRightSidebar(): HTMLElement | null {
  for (const sel of RIGHT_SIDEBAR_SELECTORS) {
    const el = document.querySelector(sel);
    if (el instanceof HTMLElement) return el;
  }
  return null;
}

interface GlossaryTocPortalProps {
  terms: GlossaryTerm[];
}

/**
 * Renders the glossary "On this page" TOC into the site's right sidebar panel
 * (same place as the default Starlight TOC on other pages).
 */
export function GlossaryTocPortal({ terms }: GlossaryTocPortalProps) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = findRightSidebar();
    if (el) {
      setTarget(el);
      return () => setTarget(null);
    }
    const observer = new MutationObserver(() => {
      const found = findRightSidebar();
      if (found) {
        setTarget(found);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const t = setTimeout(() => {
      observer.disconnect();
      setTarget(findRightSidebar());
    }, 500);
    return () => {
      observer.disconnect();
      clearTimeout(t);
    };
  }, []);

  if (!target) return null;

  return createPortal(
    <div className="glossary-page-toc-wrapper">
      <GlossaryToc terms={terms} />
    </div>,
    target
  );
}
