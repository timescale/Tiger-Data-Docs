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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="-")
    a = ap.parse_args()

    cat = []
    for dp, _, fns in os.walk(ROOT):
        for fn in fns:
            if not fn.endswith((".md", ".mdx")):
                continue
            p = os.path.join(dp, fn)
            txt = open(p, encoding="utf-8", errors="ignore").read()
            fm = re.match(r"^---\n(.*?)\n---", txt, re.S)
            fm = fm.group(1) if fm else ""

            def g(k):
                x = re.search(rf"^{k}:\s*(.+)$", fm, re.M)
                return x.group(1).strip().strip("\"'") if x else ""

            rel = re.sub(r"/index$", "", re.sub(r"\.(md|mdx)$", "", os.path.relpath(p, ROOT)))
            has_lm = bool(re.search(r"^learnMore:", fm, re.M))
            existing = re.findall(r"href:\s*(\S+)", fm) if has_lm else []
            cat.append({
                "path": "/" + rel,
                "file": p,
                "section": rel.split("/")[0],
                "title": g("title"),
                "desc": g("description"),
                "has_learnMore": has_lm,
                "existing_hrefs": existing,
            })
    cat.sort(key=lambda c: c["path"])

    out = json.dumps(cat, indent=1)
    if a.out == "-":
        print(out)
    else:
        open(a.out, "w").write(out)
    print(f"[catalog] {len(cat)} pages ({sum(1 for c in cat if c['has_learnMore'])} already have learnMore)", file=sys.stderr)


if __name__ == "__main__":
    main()