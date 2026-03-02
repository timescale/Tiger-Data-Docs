import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IntegrateToc, getViewFromHash, type IntegrateView } from "./IntegrateToc";

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

function getIndustryOrder(): string[] {
  try {
    const el = document.querySelector("[data-industry-order]");
    const raw = el?.getAttribute("data-industry-order");
    if (raw) return JSON.parse(raw) as string[];
  } catch {
    // ignore
  }
  return ["crypto", "IoT", "healthcare", "manufacturing"];
}

/**
 * Portals the integrate "On this page" TOC into the right sidebar.
 * Replaces the default Starlight TOC with a dynamic TOC that shows the current
 * view (by category, by industry, Tiger Data connectors, external) and
 * subcategories when applicable.
 */
export function IntegrateTocPortal() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [currentView, setCurrentView] = useState<IntegrateView>(() => getViewFromHash());
  const [industryOrder, setIndustryOrder] = useState<string[]>([]);
  const clearedRef = useRef(false);

  useEffect(() => {
    const el = findRightSidebar();
    if (el) {
      setTarget(el);
      setIndustryOrder(getIndustryOrder());
      return () => setTarget(null);
    }
    const observer = new MutationObserver(() => {
      const found = findRightSidebar();
      if (found) {
        setTarget(found);
        setIndustryOrder(getIndustryOrder());
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const t = setTimeout(() => {
      observer.disconnect();
      setTarget(findRightSidebar());
      setIndustryOrder(getIndustryOrder());
    }, 500);
    return () => {
      observer.disconnect();
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    const onHashChange = () => setCurrentView(getViewFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Replace default Starlight TOC with our content (clear once)
  useEffect(() => {
    if (target && !clearedRef.current) {
      target.innerHTML = "";
      clearedRef.current = true;
    }
  }, [target]);

  if (!target) return null;

  return createPortal(
    <div className="glossary-page-toc-wrapper">
      <IntegrateToc currentView={currentView} industryOrder={industryOrder} />
    </div>,
    target
  );
}
