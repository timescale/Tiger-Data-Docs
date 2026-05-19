---
name: ship
description: Stage all changes, commit, push to a new branch, and open a PR. Use when user asks to "ship", "commit and push", "add all and push", or requests staging all changes, committing, and pushing.
disable-model-invocation: true
compatibility: Requires git and gh CLI. Optionally uses npm scripts for lint and test.
---

# Ship Changes

## Pre-loaded context

- Status: !`git status`
- Diff: !`git diff HEAD`
- Log: !`git log --oneline -10`

## Workflow

1. Review all changes from status and diff
2. Analyze recent commit style from log
3. Check for quality check commands:
   - If `package.json` exists, check for `lint` and `test` scripts
   - Run available checks in parallel: `npm run lint`, `npm test`
   - If no package.json, skip quality checks
4. If checks fail: report errors, STOP — do not commit or push
5. Generate a branch name from the changes (e.g., `feat/short-description` or `fix/short-description`)
6. Create and switch to the new branch: `git checkout -b <branch-name>`
7. Stage all files: `git add -A`
8. Commit with HEREDOC format, message matching repo style
9. Push the new branch: `git push -u origin <branch-name>`
10. Create a PR to `main` using `gh pr create` with title and body (use HEREDOC for body)
11. Return the PR URL to the user

## Rules

- NEVER commit or push directly to `main` — always create a new branch
- Stage ALL changes with `git add -A`
- Generate message from changed files, match repo style
- Only run package manager commands if package.json exists with those scripts
- NEVER push if lint or tests fail
- NEVER force push (`-f` or `--force`)
- NEVER skip hooks
- NEVER commit secrets
- NEVER add Co-Authored-By or any co-author trailers to commit messages
- NEVER add "Generated with Claude Code" or any AI attribution lines to PR descriptions

## Error Handling

- If lint or tests fail → report all errors, stop; do not commit or push
- If `git push` is rejected (non-fast-forward) → run `git pull --rebase` then retry push once
- If pre-commit hook fails → fix reported issues, re-stage, create a NEW commit (never `--amend`)
