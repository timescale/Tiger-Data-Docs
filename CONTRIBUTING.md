# Contributing to Tiger Data Docs

This file is the developer/agent-facing entry point for working in this repo: local setup, where the conventions live, and how the PR workflow works.

If you're an external contributor looking to report a docs issue, suggest a change, or request a changelog entry without setting up a local dev environment, see the published guide instead: [Contribute to the docs](https://tigerdata.com/docs/get-started/contributing) (source: `src/content/docs/get-started/contributing.mdx`).

## Local setup

- **Node.js** >=22.12.0, **pnpm** as the package manager.
- Clone the repo, then:
  ```bash
  pnpm install
  pnpm dev
  ```
  Visit [localhost:4321](http://localhost:4321/).
- No Stainless API key handy? Use `pnpm dev:local` instead: it skips generating the Tiger Cloud REST API reference and stubs that page.
- Full setup details, environment variables, and other commands: [`README.md`](./README.md).

## Conventions

[`AGENTS.md`](./AGENTS.md) (symlinked as `CLAUDE.md`) is the single source of truth for content and component conventions: the constants system (`{C.X}`), partials, frontmatter, links, redirects, SQL/API naming, and Vale prose rules. Read it before making non-trivial changes. Deeper references:

- [`README-component.md`](./README-component.md): component usage guide (callouts, buttons, partials, Prerequisites)
- [`README-changelog.md`](./README-changelog.md): how to add a changelog entry
- [`src/components/LearnMore.README.md`](./src/components/LearnMore.README.md): the right-rail "Learn more" card

## Before you open a PR

Run these locally so CI doesn't surprise you:

```bash
pnpm build          # fails on any MDX/component error
pnpm lint:prose      # Vale, checked files only (pnpm lint:prose -- --all for everything)
pnpm lint:links      # if your change touches links or adds/moves pages
```

## PR workflow and etiquette

- **Open PRs as draft until they're ready for review.** The `git-bounce` workflow (`.github/workflows/pr-checklist-check.yml`) only enforces the PR-template checklist once a PR leaves draft, so keep work-in-progress PRs in draft to avoid a red check for something you're not done with yet.
- **"Ready for review" means:** every checklist box in the PR template reflects reality (not rubber-stamped), the `affected-pages.yml` bot's preview links have been clicked through, and the Vale annotations on your diff have been addressed or consciously left (advisory rules can be judgment calls; `TigerData.CompressionAPIs` is the only rule that gates).
- **What reviewers should do:** confirm technical accuracy, skim the Vale/affected-pages CI output, spot-check rendered output for anything visual, and verify the checklist boxes are actually true rather than just checked.
- Fill out the PR template's sections rather than replacing them. See `.github/pull_request_template.md`.

For issue templates (doc feedback, doc correction, changelog request) and what makes a good vs. weak issue, see the published [Contribute to the docs](https://tigerdata.com/docs/get-started/contributing) guide.
