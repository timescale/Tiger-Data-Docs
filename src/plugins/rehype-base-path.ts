/**
 * Rehype plugin that prefixes root-relative `href` values with the Astro
 * `base` path at build time.
 *
 * Handles two node shapes produced by the MDX pipeline:
 *
 * 1. **HTML elements** (`node.type === "element"`)
 *    → `node.properties.href`
 *
 * 2. **MDX JSX elements** (`mdxJsxFlowElement` / `mdxJsxTextElement`)
 *    → attribute objects in `node.attributes` where `name === "href"`
 *
 * Removal plan: delete this file and remove the registration line from
 * astro.config.ts once all hrefs in content use relative paths or the
 * framework handles base-prefixing natively.
 */

interface HastElement {
  type: "element";
  tagName: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

interface MdxJsxAttribute {
  type: "mdxJsxAttribute";
  name: string;
  value: string | null | { type: string; value: string };
}

interface MdxJsxNode {
  type: "mdxJsxFlowElement" | "mdxJsxTextElement";
  name: string | null;
  attributes: (MdxJsxAttribute | { type: string })[];
}

interface HastNode {
  type: string;
  children?: HastNode[];
  properties?: Record<string, unknown>;
  attributes?: unknown[];
}

export default function rehypeBasePath({ base }: { base: string }) {
  const prefix = base.replace(/\/$/, "");
  if (!prefix) return () => {};

  return (tree: HastNode) => {
    walk(tree, prefix);
  };
}

function walk(node: HastNode, prefix: string): void {
  if (node.type === "element") {
    const el = node as HastElement;
    const href = el.properties?.href;
    if (typeof href === "string" && needsPrefix(href, prefix)) {
      el.properties!.href = prefix + href;
    }
  }

  if (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") {
    const jsx = node as unknown as MdxJsxNode;
    if (Array.isArray(jsx.attributes)) {
      for (const attr of jsx.attributes) {
        if (
          attr.type === "mdxJsxAttribute" &&
          (attr as MdxJsxAttribute).name === "href"
        ) {
          const a = attr as MdxJsxAttribute;
          if (typeof a.value === "string" && needsPrefix(a.value, prefix)) {
            a.value = prefix + a.value;
          }
        }
      }
    }
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      walk(child, prefix);
    }
  }
}

function needsPrefix(href: string, prefix: string): boolean {
  if (!href.startsWith("/")) return false;
  if (href.startsWith(prefix + "/") || href === prefix) return false;
  return true;
}
