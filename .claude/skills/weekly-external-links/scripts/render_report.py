#!/usr/bin/env python3
"""Render a mapping (match_content.py) as a Markdown summary.

Used for the pull-request body on scheduled runs and as a quick human-readable
recap on local runs. Reads the mapping JSON and prints Markdown to stdout.

Usage:
    python3 render_report.py .learnmore-work/mapping.json > body.md
"""

import json
import sys


def main():
    if len(sys.argv) < 2:
        sys.exit("usage: render_report.py <mapping.json>")
    with open(sys.argv[1]) as f:
        m = json.load(f)
    cards = m.get("cards", [])
    dropped = m.get("dropped", [])

    out = []
    out.append("## Weekly external-links refresh")
    out.append("")
    out.append(
        f"Drafted **{len(cards)}** learnMore card(s) from Tiger Den content and "
        f"set aside **{len(dropped)}** item(s). Please review each card for "
        "editorial fit before merging: topic matches and add-vs-replace choices "
        "are judgment calls."
    )
    out.append("")

    if cards:
        out.append("### Cards applied")
        for c in cards:
            out.append(f"\n**`{c['page_path']}`** ({c.get('action', 'add')}, {len(c['links'])} links)")
            for l in c["links"]:
                out.append(f"- {l['kind']}: [{l['label']}]({l['href']})")
            if c.get("notes"):
                out.append(f"- _note: {c['notes']}_")

    if dropped:
        out.append("\n### Set aside (not linked)")
        for d in dropped:
            out.append(f"- {d['title']}: {d['reason']}")

    print("\n".join(out))


if __name__ == "__main__":
    main()