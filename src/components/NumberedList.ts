/**
 * NumberedList and NumberedItem are Astro components, not React islands.
 *
 * They used to be React (NumberedList.tsx). @astrojs/react 5.0.3 and later strip every
 * `<link rel="stylesheet">` from an island's rendered HTML, which removed the Expressive Code
 * stylesheet that is injected into the first code block of a document, so every procedure whose
 * first code block sat inside a step lost its code-block styling. Astro components render their
 * slots as plain HTML, so nothing is stripped, and there is no island to hydrate.
 *
 * This file keeps the import every page already uses:
 *   import { NumberedList, NumberedItem } from "@components/NumberedList";
 */
export { default as NumberedList } from "./numbered-list/NumberedList.astro";
export { default as NumberedItem } from "./numbered-list/NumberedItem.astro";
