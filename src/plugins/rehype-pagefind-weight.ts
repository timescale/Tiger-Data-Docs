/**
 * Rehype plugin that wraps each docs page's HAST in a
 * `<div data-pagefind-weight="N">` so Pagefind weights the page's body by its
 * `products` frontmatter. {C.CLOUD_LONG}-flavoured pages boost; self-hosted /
 * MST pages demote, so Cloud content ranks above TimescaleDB content for
 * cross-cutting search queries.
 *
 * Mirrors the priority scheme the old Gatsby docs site applied via Algolia
 * `customRanking: asc(weight)`, translated to Pagefind. Algolia indexing
 * happens inside the Stainless package and is unaffected — see
 * `node_modules/@stainless-api/docs/plugin/buildAlgoliaIndex.ts`.
 *
 * Applies to pages under `src/content/docs/` only. Partials inherit the parent
 * page's weight via DOM nesting (the partial's compiled HTML ends up inside
 * the page's wrapper), so wrapping them separately would double-up nodes.
 */

type Product = "cloud" | "mst" | "self_hosted";

interface HastRoot {
  type: "root";
  children: HastNode[];
}

interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

interface VFile {
  path?: string;
  data?: { astro?: { frontmatter?: { products?: Product[] } } };
}

function getWeight(products: Product[] | undefined): string {
  if (!products || products.length === 0) return "1";
  const hasCloud = products.includes("cloud");
  if (hasCloud && products.length === 1) return "2";
  if (hasCloud) return "1.5";
  return "0.4";
}

export default function rehypePagefindWeight() {
  return (tree: HastRoot, file: VFile) => {
    if (!file.path?.includes("/src/content/docs/")) return;

    const products = file.data?.astro?.frontmatter?.products;
    const weight = getWeight(products);

    // `mdxjsEsm` nodes carry the file's import/export declarations and must
    // stay at the root for MDX module resolution. Wrapping them inside an
    // element breaks JSX components that depend on those imports (e.g.
    // `<GlossaryContent />` in learn/glossary.mdx).
    const esmNodes: HastNode[] = [];
    const contentNodes: HastNode[] = [];
    for (const child of tree.children) {
      if (child.type === "mdxjsEsm") esmNodes.push(child);
      else contentNodes.push(child);
    }

    tree.children = [
      ...esmNodes,
      {
        type: "element",
        tagName: "div",
        properties: { dataPagefindWeight: weight },
        children: contentNodes,
      },
    ];
  };
}
