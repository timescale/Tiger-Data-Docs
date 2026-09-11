#!/usr/bin/env python3
"""Build a catalog of doc pages for matching external resources to pages.

For each MDX/MD page under src/content/docs, captures path, section, title,
description, and whether it already has a `learnMore:` block (so the matcher can
decide add-vs-replace). Run from the repo root.

Usage:
    python3 build_doc_catalog.py [--out catalog.json]
"""
import argparse, json, os, re, sys

ROOT = "src/content/docs"


def parse_related(fm):
    """Extract existing relatedPosts links ({label, href}) from frontmatter text.

    Lets the matcher reason about replacement (drop a weaker existing link in
    favor of a better new one) instead of blindly appending.
    """
    lines = fm.split("\n")
    rp = next((i for i, l in enumerate(lines) if re.match(r"^\s+relatedPosts:\s*$", l)), None)
    if rp is None:
        return []
    key_indent = len(lines[rp]) - len(lines[rp].lstrip())
    out, label = [], None
    for l in lines[rp + 1:]:
        if l.strip() and (len(l) - len(l.lstrip())) <= key_indent:
            break  # dedented to a sibling key; list is done
        m = re.match(r"\s*-\s*label:\s*(.+)$", l)
        if m:
            label = m.group(1).strip().strip("\"'")
            continue
        h = re.match(r"\s*href:\s*(\S+)", l)
        if h and label is not None:
            out.append({"label": label, "href": h.group(1)})
            label = None
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="-")
    ap.add_argument(
        "--exclude",
        default="reference",
        help="Comma-separated top-level sections to skip (default: reference). "
        "learnMore cards never belong on function-reference pages, and skipping "
        "them roughly halves what the matcher has to weigh. Pass '' to include all.",
    )
    a = ap.parse_args()
    excluded = {s.strip() for s in a.exclude.split(",") if s.strip()}

    cat = []
    for dp, _, fns in os.walk(ROOT):
        for fn in fns:
            if not fn.endswith((".md", ".mdx")):
                continue
            p = os.path.join(dp, fn)
            rel = re.sub(r"/index$", "", re.sub(r"\.(md|mdx)$", "", os.path.relpath(p, ROOT)))
            if rel.split("/")[0] in excluded:
                continue
            with open(p, encoding="utf-8", errors="ignore") as fh:
                txt = fh.read()
            fm = re.match(r"^---\n(.*?)\n---", txt, re.S)
            fm = fm.group(1) if fm else ""

            def g(k):
                x = re.search(rf"^{k}:\s*(.+)$", fm, re.M)
                return x.group(1).strip().strip("\"'") if x else ""

            has_lm = bool(re.search(r"^learnMore:", fm, re.M))
            related = parse_related(fm) if has_lm else []
            cat.append({
                "path": "/" + rel,
                "file": p,
                "section": rel.split("/")[0],
                "title": g("title"),
                "desc": g("description"),
                "has_learnMore": has_lm,
                "existing_related": related,
            })
    cat.sort(key=lambda c: c["path"])

    out = json.dumps(cat, indent=1)
    if a.out == "-":
        print(out)
    else:
        with open(a.out, "w") as f:
            f.write(out)
    print(f"[catalog] {len(cat)} pages ({sum(1 for c in cat if c['has_learnMore'])} already have learnMore)", file=sys.stderr)


if __name__ == "__main__":
    main()