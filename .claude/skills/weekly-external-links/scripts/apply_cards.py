#!/usr/bin/env python3
"""Apply drafted learnMore cards (match_content.py) to the docs page files.

Each card's `links` is the final, complete relatedPosts set for its page. For
each card, this edits the target page's YAML frontmatter:
- page has no `learnMore:` block -> insert a complete one before the closing `---`.
- page has a card with relatedPosts -> replace its relatedPosts items with the
  card's link set, leaving the heading, tutorials, and cta intact.
- page has a card but no relatedPosts (e.g. only tutorials) -> add a relatedPosts
  section.

The page's real state is re-derived from the file, not trusted from the card's
`action`, so a mismatch can't corrupt frontmatter. Labels are double-quoted so
colons are safe. No YAML dependency: we edit the frontmatter lines directly to
preserve formatting and comments.

Usage:
    python3 apply_cards.py --mapping .learnmore-work/mapping.json \
        --catalog .learnmore-work/catalog.json
"""

import argparse
import json
import re
import sys


def dq(s):
    """Double-quote a YAML scalar, escaping backslashes and quotes."""
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def frontmatter_bounds(lines):
    """Return (start, end): indices of the opening and closing '---' lines."""
    if not lines or lines[0].rstrip() != "---":
        return None
    for i in range(1, len(lines)):
        if lines[i].rstrip() == "---":
            return 0, i
    return None


def item_lines(links, indent):
    """Render relatedPosts list items at the given base indent (spaces)."""
    pad = " " * indent
    out = []
    for ln in links:
        prefix = "Video: " if ln["kind"] == "video" and not ln["label"].lower().startswith("video:") else ""
        out.append(f"{pad}- label: {dq(prefix + ln['label'])}")
        out.append(f"{pad}  href: {ln['href']}")
    return out


def apply_card(path, card):
    """Edit one file in place for one card. Returns a status string."""
    with open(path, encoding="utf-8") as f:
        lines = f.read().split("\n")
    b = frontmatter_bounds(lines)
    if not b:
        return f"SKIP (no frontmatter): {path}"
    fm_start, fm_end = b
    fm = lines[fm_start + 1 : fm_end]

    links = card.get("links", [])
    if not links:
        return f"skip (no links): {card['page_path']}"
    heading = card.get("heading") or "Related resources"

    lm_idx = next((i for i, l in enumerate(fm) if re.match(r"^learnMore:\s*$", l)), None)

    if lm_idx is None:
        # No card yet: insert a full learnMore block before the closing '---'.
        block = ["learnMore:", f"  relatedPostsHeading: {heading}", "  relatedPosts:"]
        block += item_lines(links, 4)
        lines[fm_end:fm_end] = block
        verb = "added new card"
    else:
        # Find the extent of the learnMore block (until the next top-level key).
        lm_end = len(fm)
        for i in range(lm_idx + 1, len(fm)):
            if fm[i] and not fm[i][0].isspace():
                lm_end = i
                break
        rp_idx = next(
            (i for i in range(lm_idx + 1, lm_end) if re.match(r"^\s+relatedPosts:\s*$", fm[i])),
            None,
        )
        if rp_idx is not None:
            # The card's links are the final set: replace the existing relatedPosts
            # items wholesale (the matcher already merged/dropped/capped). Keeps the
            # relatedPosts: key, its heading, and any tutorials/cta intact.
            key_indent = len(fm[rp_idx]) - len(fm[rp_idx].lstrip())
            list_end = lm_end
            for i in range(rp_idx + 1, lm_end):
                indent = len(fm[i]) - len(fm[i].lstrip())
                if fm[i].strip() and indent <= key_indent:
                    list_end = i
                    break
            abs_start = fm_start + 1 + rp_idx + 1
            abs_end = fm_start + 1 + list_end
            lines[abs_start:abs_end] = item_lines(links, key_indent + 2)
            verb = "replaced card links"
        else:
            # learnMore exists but has no relatedPosts (e.g. only tutorials).
            block = [f"  relatedPostsHeading: {heading}", "  relatedPosts:"]
            block += item_lines(links, 4)
            abs_at = fm_start + 1 + lm_end
            lines[abs_at:abs_at] = block
            verb = "added relatedPosts to existing card"

    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    return f"{verb}: {card['page_path']} ({len(links)} link(s) total)"


def main():
    ap = argparse.ArgumentParser(description="Apply learnMore cards to page files.")
    ap.add_argument("--mapping", required=True)
    ap.add_argument("--catalog", required=True)
    args = ap.parse_args()

    with open(args.mapping) as f:
        mapping = json.load(f)
    with open(args.catalog) as f:
        path_by_page = {c["path"]: c["file"] for c in json.load(f)}

    applied = 0
    for card in mapping.get("cards", []):
        path = path_by_page.get(card["page_path"])
        if not path:
            print(f"SKIP (page not in catalog): {card['page_path']}")
            continue
        msg = apply_card(path, card)
        print(msg)
        if not msg.lower().startswith("skip"):
            applied += 1
    print(f"\nApplied {applied} card(s). Dropped (not applied): {len(mapping.get('dropped', []))} item(s).")


if __name__ == "__main__":
    main()