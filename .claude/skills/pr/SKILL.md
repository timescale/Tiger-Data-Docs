---
name: pr
description: Run this repo's checks (build, prose lint, link lint) and open a draft PR using the repo's PR template. Use when the user says "create a PR", "open a PR", "let's PR this", "submit this", or any variation of wanting to submit doc changes for review.
user-invocable: true
allowed-tools: Read Grep Glob Bash
argument-hint: "[optional one-line summary of the change]"
effort: medium
---

# Create a pull request

Run this repo's checks, commit, push, and open a **draft** PR using `.github/pull_request_template.md`. This repo has no test suite, no secrets scanner, and no Claude auto-review bot — don't invent steps that don't apply here. Do not skip or reorder the steps below.

**PRs are opened as draft by default.** The `git-bounce` workflow (`.github/workflows/pr-checklist-check.yml`) only enforces the PR-template checklist once a PR leaves draft, so keeping work in draft avoids a red check on unfinished work. After the checks pass and the PR is created, the skill asks whether to flip it to ready.

`$ARGUMENTS` — if a one-line summary was passed, treat it as the authoritative description of the change and use it for the commit message and PR "Describe your changes" section. If not given, derive the summary from the diff and conversation context; if that's not enough to write an honest one-liner, ask the user.

## 1. Verify branch

- Confirm you are NOT on `main`. If you are, create a feature branch named for the work (e.g. `add-hypercore-tuning-guide`) and switch to it.
- Run `git status` to see staged, unstaged, and untracked changes.

## 2. Capture the diff

```bash
git fetch origin main --quiet
git diff --name-only origin/main...HEAD > /tmp/pr-changed-files.txt
git ls-files --others --exclude-standard >> /tmp/pr-changed-files.txt
sort -u -o /tmp/pr-changed-files.txt /tmp/pr-changed-files.txt
```

Exclude `pnpm-lock.yaml` from anything you read for review purposes (still fine to commit).

## 3. Run checks

- **Build** (always): `pnpm build`. This compiles every MDX page and fails on any MDX/component error.
- **Prose lint** (always, changed files only): `pnpm lint:prose`. It lints only the `.md`/`.mdx` files changed vs. `main`, so no need to pass paths manually.
- **Link lint** (when the diff adds/moves pages, or changes internal/external links): `pnpm lint:links`. Skip if the change is prose-only with no link edits.

Run `build` and `lint:prose` in parallel since they don't share write targets; run `lint:links` after (it also does a full build, so there's no benefit to overlapping it with `pnpm build`):

```bash
( pnpm build > /tmp/pr-build.log 2>&1; echo $? > /tmp/pr-build.exit ) &
( pnpm lint:prose > /tmp/pr-lintprose.log 2>&1; echo $? > /tmp/pr-lintprose.exit ) &
wait
```

If either fails, show the tail of the failing log and stop — do not commit until it's fixed. `TigerData.CompressionAPIs` is the only Vale rule that gates; other Vale findings are advisory, so use judgment on whether to fix them now or leave them for reviewer discussion (never silently ignore a `CompressionAPIs` failure).

## 4. Commit

- Stage the relevant files by name (never `git add -A`).
- Write a concise commit message focused on *why*, following the repo's existing commit style (`git log` for examples).
- If the user referenced an issue, note `Closes #N` or `Part of #N`.
- Never commit `.env` or anything that looks like a credential.

## 5. Push

```bash
git rebase origin/main
git push -u origin HEAD
```

If the rebase conflicts, stop and report the conflicting files — the user resolves them, don't guess.

## 6. Create the PR as draft

Use the repo's actual template (`.github/pull_request_template.md`) — don't invent a different shape. Tick only the checklist boxes you can honestly verify from the steps above; leave the rest unchecked for the human reviewer:

- `[ ] This is ready for review. If not, raise as a draft PR` — leave **unchecked**; this flips only in step 7.
- `[ ] I have reviewed my changes.` — tick, since you walked the diff in step 2.
- `[ ] I have confirmed the content is technically accurate.` — leave unchecked (requires human/domain judgment).
- `[ ] I have tested any code that is added or updated on the latest available version.` — leave unchecked unless the user explicitly confirmed they tested SQL/code snippets.
- `[ ] I have confirmed the content is free of typos or grammar errors.` — tick only if `pnpm lint:prose` passed clean with no advisory findings left unaddressed.
- `[ ] I have verified all images and videos are clear and match production (or dev for unreleased features).` — leave unchecked unless the diff has no image/video changes, in which case tick it (nothing to verify).
- `[ ] This references a feature that is public. If not, add a note and we can schedule the merge for after the feature release.` — leave unchecked unless the user has confirmed the referenced feature is public.

Leave "Affected pages" as the template's placeholder text — the `affected-pages.yml` bot fills it in once the build runs.

```bash
gh pr create --draft --title "<title, under 70 chars>" --body "$(cat <<'EOF'
## Describe your changes

<what changed and why, from $ARGUMENTS or the diff>

## Affected pages

_Once you open the PR and the build runs, links to changed pages will appear here automatically. Please review them to make sure everything is OK, including rendered output, links, code blocks, and images._

## Related Issues

Issue: <#number, or omit this line if none>

## Checklist before requesting a review

- [ ] - This is ready for review. If not, raise as a draft PR
- [x] - I have reviewed my changes.
- [ ] - I have confirmed the content is technically accurate.
- [ ] - I have tested any code that is added or updated on the latest available version.
- [x] - I have confirmed the content is free of typos or grammar errors.
- [ ] - I have verified all images and videos are clear and match production (or dev for unreleased features).
- [ ] - This references a feature that is public. If not, add a note and we can schedule the merge for after the feature release.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Adjust the ticked boxes per the rules above before running — the template shown has example ticks, not fixed defaults.

## 7. Confirm and offer to flip to ready

- Print the PR URL.
- Ask: "Ready to mark this PR as ready for review?"
  - **Yes**: edit the PR body to tick `This is ready for review`, then run `gh pr ready <PR_NUMBER>`. Remind the user that `git-bounce` will now check that every listed box is ticked truthfully — go back and tick any remaining ones only if they're actually true.
  - **No**: leave it in draft. Note that they can re-invoke `/pr` or run `gh pr ready <PR_NUMBER>` themselves once ready.
