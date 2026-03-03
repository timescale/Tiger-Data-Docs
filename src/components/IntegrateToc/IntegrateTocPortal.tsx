import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { IntegrateToc, getViewFromHash, type IntegrateView, type AllIntegrationTocItem } from "./IntegrateToc";

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

function getCategoryOrder(): string[] {
  try {
    const el = document.querySelector("[data-category-order]");
    const raw = el?.getAttribute("data-category-order");
    if (raw) return JSON.parse(raw) as string[];
  } catch {
    // ignore
  }
  return [];
}

function getAllIntegrations(): { title: string; id: string }[] {
  try {
    const el = document.querySelector("[data-all-integrations]");
    const raw = el?.getAttribute("data-all-integrations");
    if (raw) return JSON.parse(raw) as AllIntegrationTocItem[];
  } catch {
    // ignore
  }
  return [];
}

function getTigerDataIntegrations(): { title: string; id: string }[] {
  try {
    const el = document.querySelector("[data-tiger-data-integrations]");
    const raw = el?.getAttribute("data-tiger-data-integrations");
    if (raw) return JSON.parse(raw) as { title: string; id: string }[];
  } catch {
    // ignore
  }
  return [];
}

function getExternalIntegrations(): { title: string; id: string }[] {
  try {
    const el = document.querySelector("[data-external-integrations]");
    const raw = el?.getAttribute("data-external-integrations");
    if (raw) return JSON.parse(raw) as { title: string; id: string }[];
  } catch {
    // ignore
  }
  return [];
}

/**
 * Portals the integrate "On this page" TOC into the right sidebar when it exists.
 * If the right sidebar is not in the DOM (e.g. layout hides it on this page),
 * renders the TOC inline so it still appears.
 */
export function IntegrateTocPortal() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [currentView, setCurrentView] = useState<IntegrateView>(() => getViewFromHash());
  const [industryOrder, setIndustryOrder] = useState<string[]>([]);
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [allIntegrations, setAllIntegrations] = useState<{ title: string; id: string }[]>([]);
  const [tigerDataIntegrations, setTigerDataIntegrations] = useState<{ title: string; id: string }[]>([]);
  const [externalIntegrations, setExternalIntegrations] = useState<{ title: string; id: string }[]>([]);

  useEffect(() => {
    const el = findRightSidebar();
    if (el) {
      el.innerHTML = "";
      setTarget(el);
      setIndustryOrder(getIndustryOrder());
      setCategoryOrder(getCategoryOrder());
      setAllIntegrations(getAllIntegrations());
      setTigerDataIntegrations(getTigerDataIntegrations());
      setExternalIntegrations(getExternalIntegrations());
      return () => setTarget(null);
    }
    const observer = new MutationObserver(() => {
      const found = findRightSidebar();
      if (found) {
        found.innerHTML = "";
        setTarget(found);
        setIndustryOrder(getIndustryOrder());
        setCategoryOrder(getCategoryOrder());
        setAllIntegrations(getAllIntegrations());
        setTigerDataIntegrations(getTigerDataIntegrations());
        setExternalIntegrations(getExternalIntegrations());
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
        setIndustryOrder(getIndustryOrder());
        setCategoryOrder(getCategoryOrder());
        setAllIntegrations(getAllIntegrations());
        setTigerDataIntegrations(getTigerDataIntegrations());
        setExternalIntegrations(getExternalIntegrations());
      } else {
        setUseFallback(true);
        setIndustryOrder(getIndustryOrder());
        setCategoryOrder(getCategoryOrder());
        setAllIntegrations(getAllIntegrations());
        setTigerDataIntegrations(getTigerDataIntegrations());
        setExternalIntegrations(getExternalIntegrations());
      }
    }, 800);
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

  const tocContent = (
    <div className="glossary-page-toc-wrapper integrate-toc-wrapper">
      <IntegrateToc currentView={currentView} industryOrder={industryOrder} categoryOrder={categoryOrder} allIntegrations={allIntegrations} tigerDataIntegrations={tigerDataIntegrations} externalIntegrations={externalIntegrations} />
    </div>
  );

  if (target) {
    return createPortal(tocContent, target);
  }

  if (useFallback) {
    return (
      <aside className="integrate-toc-fallback" aria-label="On this page">
        {tocContent}
      </aside>
    );
  }

  return null;
}
