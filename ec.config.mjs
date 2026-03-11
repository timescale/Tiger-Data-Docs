/**
 * Expressive Code config: use a dark Shiki theme so syntax tokens are light-on-dark
 * and readable on our #333 code block background (Figma 3388-1893).
 * See https://expressive-code.com/reference/configuration/
 */
import { defineEcConfig } from "@astrojs/starlight/expressive-code";

export default defineEcConfig({
  themes: ["github-dark"],
  styleOverrides: {
    codeBackground: "#333",
    codeForeground: "#ffffff",
  },
});
