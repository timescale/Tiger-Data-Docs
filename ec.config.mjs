/**
 * Expressive Code config: bundles light + dark Shiki themes so syntax tokens
 * adapt to the active mode. Starlight switches between them via
 * `:root[data-theme="dark"]`. The wrapper background/foreground are driven by
 * `--tiger-code-block-bg` / `--tiger-code-block-fg` in `src/styles/tokens.css`.
 * See https://expressive-code.com/reference/configuration/
 */
import { defineEcConfig } from "@astrojs/starlight/expressive-code";

export default defineEcConfig({
  themes: ["github-light", "github-dark"],
  styleOverrides: {
    codeBackground: ({ theme }) =>
      theme.type === "dark" ? "#333" : "#f5f5f5",
    codeForeground: ({ theme }) =>
      theme.type === "dark" ? "#ffffff" : "#262626"
  }
});
