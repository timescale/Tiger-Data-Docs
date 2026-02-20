type SidebarEntry = App.Locals['starlightRoute']['sidebar'][number];

/**
 * Extending Astro’s `App.Locals` interface
 */
declare namespace App {
  interface Locals {
    _stlStarlightPage?: {
      skipRenderingStarlightTitle?: boolean;
      hasMarkdownRoute?: boolean;
      fullSidebar?: SidebarEntry[];
    };

    stainlessProject?: string;
    language?: import('@stainless-api/docs-ui/routing').DocsLanguage;
  }
}
