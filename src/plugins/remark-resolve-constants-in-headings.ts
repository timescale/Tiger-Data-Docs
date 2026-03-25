/**
 * Starlight's TOC (and heading slugs) are built from the MDX **mdast** before React renders.
 * Headings like `## {C.HYPERTABLE_CAP} indexes` stay as `mdxTextExpression` + text, so the TOC
 * shows raw `C.HYPERTABLE_CAP` instead of "Hypertable". This remark plugin resolves
 * `C.<CONST_NAME>` in heading nodes to the string values from `@constants` so TOC and slugs match
 * the rendered page.
 */
import type { Heading, PhrasingContent, Root } from "mdast";
import * as C from "../constants";

type ConstMap = Record<string, string>;

const CONST_MAP: ConstMap = Object.fromEntries(
  Object.entries(C).filter(([, v]) => typeof v === "string") as [string, string][],
);

function resolveMemberExpression(expr: string): string | null {
  const m = expr.trim().match(/^C\.(\w+)$/);
  if (!m) return null;
  const val = CONST_MAP[m[1]];
  return val !== undefined ? val : null;
}

function transformTextValue(value: string): string {
  return value.replace(/\{C\.(\w+)\}/g, (full, key: string) => {
    const val = CONST_MAP[key];
    return val !== undefined ? val : full;
  });
}

function transformHeadingChildren(children: PhrasingContent[]): PhrasingContent[] {
  const out: PhrasingContent[] = [];

  for (const child of children) {
    if (child.type === "mdxTextExpression") {
      const lit = child as import("mdast").Literal & { type: "mdxTextExpression" };
      const raw = typeof lit.value === "string" ? lit.value : "";
      const resolved = resolveMemberExpression(raw);
      if (resolved !== null) {
        out.push({ type: "text", value: resolved });
        continue;
      }
    }

    if (child.type === "text") {
      const t = child as import("mdast").Text;
      out.push({ type: "text", value: transformTextValue(t.value) });
      continue;
    }

    out.push(child);
  }

  return out;
}

function visitHeadings(tree: Root, visitor: (h: Heading) => void): void {
  function walk(node: { type?: string; children?: unknown[] }): void {
    if (node.type === "heading") {
      visitor(node as Heading);
    }
    const ch = node.children;
    if (Array.isArray(ch)) {
      for (const c of ch) walk(c as { type?: string; children?: unknown[] });
    }
  }
  walk(tree as { type?: string; children?: unknown[] });
}

export default function remarkResolveConstantsInHeadings() {
  return (tree: Root) => {
    visitHeadings(tree, (heading) => {
      heading.children = transformHeadingChildren(heading.children as PhrasingContent[]);
    });
  };
}
