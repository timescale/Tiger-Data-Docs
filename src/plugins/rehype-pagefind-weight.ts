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

/** Cloud-only 2, Cloud plus another 1.5, no products 1, self-hosted or MST only 0.4. */
export function getProductWeight(products: Product[] | undefined): number {
  if (!products || products.length === 0) return 1;
  const hasCloud = products.includes("cloud");
  if (hasCloud && products.length === 1) return 2;
  if (hasCloud) return 1.5;
  return 0.4;
}

/**
 * Body text is a tiebreaker: titles and keywords (see PageTitle.astro) decide
 * the ranking, and the body only orders pages that match on neither.
 * Pagefind stores a weight as the integer part of weight * 24, so each value
 * sits just above its step: Cloud-only pages take 2/24 and every other page
 * 1/24, reference pages included: they are found by name, and their body
 * repeats common words such as "install".
 */
export function getBodyWeight(products: Product[] | undefined, isReference: boolean): string {
  return !isReference && getProductWeight(products) === 2 ? "0.0834" : "0.0417";
}

export default function rehypePagefindWeight() {
  return (tree: HastRoot, file: VFile) => {
    if (!file.path?.includes("/src/content/docs/")) return;

    const products = file.data?.astro?.frontmatter?.products;
    const isReference = file.path.includes("/src/content/docs/reference/");
    const weight = getBodyWeight(products, isReference);

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
