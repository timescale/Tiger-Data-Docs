import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { GlossaryTerm } from "../../lib/glossary-data";
import { GlossaryToc } from "./GlossaryToc";

/** Selectors for the site's right sidebar (same panel as "On this page" on other docs). */
const RIGHT_SIDEBAR_SELECTORS = [
  ".right-sidebar-container .right-sidebar",
  ".right-sidebar-panel",
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
  const [useFallback, setUseFallback] = useState(false);

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
      const found = findRightSidebar();
      if (found) {
        setTarget(found);
      } else {
        setUseFallback(true);
      }
    }, 800);
    return () => {
      observer.disconnect();
      clearTimeout(t);
    };
  }, []);

  const tocContent = (
    <div className="glossary-page-toc-wrapper">
      <GlossaryToc terms={terms} />
    </div>
  );

  if (target) {
    return createPortal(tocContent, target);
  }

  if (useFallback) {
    return (
      <aside className="glossary-toc-fallback" aria-label="On this page">
        {tocContent}
      </aside>
    );
  }

  return null;
}
