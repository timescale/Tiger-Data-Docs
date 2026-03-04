/**
 * Re-exports all MDX components from the Stainless docs package, but overrides
 * Callout with our custom Callout.astro (Figma Tip design with lightbulb icon).
 * Used via Vite alias so that "import { Callout } from '@stainless-api/docs/components'"
 * resolves to our component without changing any MDX files.
 */
export * from "@stainless-api/ui-primitives";
export { default as Callout } from "@components/Callout.astro";
