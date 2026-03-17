import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BuildToc } from "./BuildToc";

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

/**
 * Portals the Build index "On this page" TOC into the right sidebar.
 * Use only on the Build index page (/build).
 */
export function BuildTocPortal() {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = findRightSidebar();
    if (el) {
      el.innerHTML = "";
      setTarget(el);
      return () => setTarget(null);
    }
    const observer = new MutationObserver(() => {
      const found = findRightSidebar();
      if (found) {
        found.innerHTML = "";
        setTarget(found);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const t = setTimeout(() => {
      observer.disconnect();
      const found = findRightSidebar();
      if (found) {
        found.innerHTML = "";
        setTarget(found);
      }
    }, 500);
    return () => {
      observer.disconnect();
      clearTimeout(t);
    };
  }, []);

  if (!target) return null;

  return createPortal(<BuildToc />, target);
}
