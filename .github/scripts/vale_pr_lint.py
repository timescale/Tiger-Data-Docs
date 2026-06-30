#!/usr/bin/env python3
"""Lint only the lines a PR changed with Vale, and explain failures clearly.

Why this exists
---------------
The previous CI used reviewdog's `filter_mode: added`. That filters which
*inline comments* get posted, but `fail_on_error` still trips on every error
Vale finds anywhere in a touched file -- so a pre-existing violation on a line
the PR never changed would fail the check, with no clear reason shown on the PR.

This script does the filtering ourselves and owns the pass/fail decision:

  1. Read the PR's changed files and their diffs from the GitHub API.
  2. From each diff, collect the set of line numbers the PR actually added or
     modified (context and removed lines don't count).
  3. Run Vale (`--output=JSON`) over those files.
  4. Keep only alerts whose line is in the changed set.
  5. Fail (exit 1) only if a kept alert is error-severity. Warnings and
     suggestions are advisory and never fail the build.

Output
------
  - A human-readable table in the GitHub step summary explaining each finding:
    severity, rule, file:line, the message, and (for the gating rule) how to
    fix it. This is what shows on the PR's checks page.
  - GitHub workflow annotations (`::error` / `::warning`) so findings also show
    inline on the Files changed tab.

Environment: GH_TOKEN, REPO (owner/name), PR (number). Requires `gh` and `vale`.
"""

import json
import os
import re
import subprocess
import sys

DOC_FORMATS = (".md", ".mdx")

# Per-rule guidance appended to the explanation so an author can act without
# spelunking. Keyed by Vale check name.
RULE_HELP = {
    "TigerData.CompressionAPIs": (
        "The legacy compression API was renamed to the columnstore/hypercore API "
        "in TimescaleDB 2.18.0 and must not appear in new docs. See the mapping in "
        "`.claude/references/deprecated-compression-apis.md` and use the current name."
    ),
}


def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def changed_files_with_lines(repo, pr):
    """Return {filename: set(changed_line_numbers)} for docs files in the PR."""
    res = run(
        [
            "gh", "api", f"repos/{repo}/pulls/{pr}/files",
            "--paginate", "--jq",
            # one compact JSON object per file, newline-delimited
            '.[] | {filename, status, patch}',
        ]
    )
    if res.returncode != 0:
        sys.stderr.write(f"Failed to list PR files:\n{res.stderr}\n")
        sys.exit(2)

    out = {}
    for line in res.stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        f = json.loads(line)
        name = f["filename"]
        if f.get("status") == "removed" or not name.endswith(DOC_FORMATS):
            continue
        patch = f.get("patch")
        if not patch:
            # No diff text (e.g. very large file). Fall back to linting the whole
            # file rather than silently skipping it; flag with None.
            out[name] = None
            continue
        out[name] = added_lines(patch)
    return out


def added_lines(patch):
    """Line numbers (in the new file) that the patch adds or modifies."""
    lines = set()
    new_no = 0
    hunk = re.compile(r"^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@")
    for ln in patch.splitlines():
        m = hunk.match(ln)
        if m:
            new_no = int(m.group(1))
            continue
        if ln.startswith("+++") or ln.startswith("---"):
            continue
        if ln.startswith("+"):
            lines.add(new_no)
            new_no += 1
        elif ln.startswith("-"):
            pass  # removed line: doesn't advance the new-file counter
        else:
            new_no += 1  # context line
    return lines


def run_vale(files):
    res = run(["vale", "--output=JSON", *files])
    # Vale exits non-zero when it finds alerts; that's expected. Only a missing
    # binary or config error (no JSON on stdout) is fatal.
    if not res.stdout.strip():
        sys.stderr.write(f"Vale produced no output.\n{res.stderr}\n")
        sys.exit(2)
    try:
        return json.loads(res.stdout)
    except json.JSONDecodeError:
        sys.stderr.write(f"Could not parse Vale output:\n{res.stdout}\n{res.stderr}\n")
        sys.exit(2)


def annotate(severity, path, line, rule, message):
    """Emit a GitHub workflow annotation (shows inline on the PR)."""
    level = "error" if severity == "error" else "warning"
    msg = message.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
    title = f"Vale: {rule}"
    print(f"::{level} file={path},line={line},title={title}::{msg}")


def main():
    repo = os.environ["REPO"]
    pr = os.environ["PR"]

    changed = changed_files_with_lines(repo, pr)
    if not changed:
        print("No changed Markdown/MDX files to lint.")
        write_summary([], [], linted=[])
        return 0

    files = list(changed.keys())
    print(f"Linting changed lines in: {', '.join(files)}")
    results = run_vale(files)

    errors, advisories = [], []
    for path, alerts in results.items():
        wanted = changed.get(path)
        for a in alerts:
            ln = a.get("Line", 0)
            # wanted is None => no diff available, lint whole file.
            if wanted is not None and ln not in wanted:
                continue
            rec = {
                "path": path,
                "line": ln,
                "rule": a.get("Check", ""),
                "severity": a.get("Severity", ""),
                "message": a.get("Message", "").strip(),
                "match": a.get("Match", "").strip(),
            }
            if rec["severity"] == "error":
                errors.append(rec)
            else:
                advisories.append(rec)

    for rec in errors:
        annotate("error", rec["path"], rec["line"], rec["rule"], rec["message"])
    for rec in advisories:
        annotate("warning", rec["path"], rec["line"], rec["rule"], rec["message"])

    write_summary(errors, advisories, linted=files)

    if errors:
        print(f"\n{len(errors)} error(s) on changed lines. See the job summary for details.")
        return 1
    print("\nNo errors on changed lines.")
    return 0


def write_summary(errors, advisories, linted):
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if not path:
        return
    lines = ["# Vale prose lint", ""]
    lines.append(
        "Only the lines changed in this PR are checked. "
        "**Errors block merge**; warnings and suggestions are advisory."
    )
    lines.append("")

    if not linted:
        lines.append("No Markdown/MDX files changed. Nothing to lint.")
        _write(path, lines)
        return

    if errors:
        lines += [
            "## ❌ Errors (must fix)",
            "",
            "| Rule | Location | Message |",
            "| --- | --- | --- |",
        ]
        for r in errors:
            lines.append(
                f"| `{r['rule']}` | `{r['path']}:{r['line']}` | {_md(r['message'])} |"
            )
        lines.append("")
        # Per-rule how-to-fix, once per distinct rule.
        for rule in sorted({r["rule"] for r in errors}):
            if rule in RULE_HELP:
                lines.append(f"**How to fix `{rule}`:** {RULE_HELP[rule]}")
                lines.append("")
    else:
        lines += ["## ✅ No errors on changed lines", ""]

    if advisories:
        lines += [
            "<details><summary>Advisory (warnings & suggestions, non-blocking)</summary>",
            "",
            "| Severity | Rule | Location | Message |",
            "| --- | --- | --- | --- |",
        ]
        for r in advisories:
            lines.append(
                f"| {r['severity']} | `{r['rule']}` | `{r['path']}:{r['line']}` | {_md(r['message'])} |"
            )
        lines += ["", "</details>"]

    _write(path, lines)


def _md(text):
    return text.replace("|", "\\|").replace("\n", " ")


def _write(path, lines):
    with open(path, "a", encoding="utf-8") as fh:
        fh.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    sys.exit(main())