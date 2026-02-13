/**
 * Remark plugin that replaces $VARIABLE_NAME patterns in markdown text nodes
 * with values from src/vars.ts.
 *
 * - Matches `$UPPER_CASE_NAME` patterns (not preceded by another $)
 * - Handles plural suffixes: `$SERVICE_SHORTs` → "services"
 * - Skips `code` and `inlineCode` AST nodes
 * - Leaves unrecognized `$PATTERN` untouched
 */
import type { Root, Text, Parent } from "mdast";
import { visit, SKIP } from "unist-util-visit";
import vars from "./vars";

// Match $VARIABLE_NAME optionally followed by a lowercase plural suffix (e.g. "s", "es").
// Negative lookbehind ensures we don't match $$VAR (escaped or shell syntax).
const VARIABLE_RE = /(?<!\$)\$([A-Z][A-Z0-9_]+)([a-z]*)/g;

// Node types whose children should not be processed
const SKIP_TYPES = new Set(["code", "inlineCode"]);

function replaceVariables(text: string): string {
  return text.replace(VARIABLE_RE, (match, name: string, suffix: string) => {
    const value = vars[name];
    if (value === undefined) {
      // Not a known variable — leave as-is
      return match;
    }
    return value + suffix;
  });
}

export default function remarkVariables() {
  return (tree: Root) => {
    visit(tree, (node, _index, parent) => {
      // Skip code blocks and inline code entirely
      if (SKIP_TYPES.has(node.type)) {
        return SKIP;
      }

      if (node.type === "text") {
        const textNode = node as Text;
        const replaced = replaceVariables(textNode.value);
        if (replaced !== textNode.value) {
          textNode.value = replaced;
        }
      }
    });
  };
}
