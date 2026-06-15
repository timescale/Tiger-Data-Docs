#!/usr/bin/env python3
"""Find Tiger Data blog posts published in the last N days.

Source of truth for publish date is each post's `article:published_time` meta tag
(the sitemap `lastmod` is edit time, not publish time, so we verify against the page).

Usage:
    python3 fetch_new_blog.py [--days 7] [--out blog.json]

Output: JSON array of {url, title, pub, desc, tags} to --out (default stdout),
plus a one-line summary to stderr.
"""
import argparse, json, re, sys, html, urllib.request, concurrent.futures
from datetime import datetime, timezone, timedelta

SITEMAP = "https://www.tigerdata.com/blog/sitemap.xml"
UA = {"User-Agent": "Mozilla/5.0 (TigerDocs weekly-external-links skill)"}


def get(url, timeout=25):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout).read().decode("utf-8", "ignore")


def parse_date(s):
    """Return a timezone-aware datetime from an ISO-ish string, or None."""
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.strip())
    except ValueError:
        m = re.match(r"(\d{4}-\d{2}-\d{2})", s.strip())
        return datetime.fromisoformat(m.group(1) + "T00:00:00+00:00") if m else None


def fetch_meta(url):
    try:
        h = get(url)
    except Exception as e:
        return {"url": url, "error": str(e)}

    def m(pat):
        x = re.search(pat, h)
        return html.unescape(x.group(1)).strip() if x else None

    title = m(r'<meta property="og:title" content="([^"]*)"')
    if title:
        title = title.replace(" | Tiger Data", "")
    return {
        "url": url,
        "title": title,
        "pub": m(r'<meta name="article:published_time" content="([^"]*)"'),
        "desc": m(r'<meta name="description" content="([^"]*)"'),
        "tags": [html.unescape(t) for t in re.findall(r'<meta name="article:tag" content="([^"]*)"', h)],
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=7)
    ap.add_argument("--out", default="-")
    a = ap.parse_args()

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=a.days)
    # Candidate slugs: lastmod within the window plus a buffer (edits lag publish).
    buffer_cut = now - timedelta(days=a.days + 10)

    xml = get(SITEMAP)
    pairs = re.findall(r"<loc>(https://www\.tigerdata\.com/blog/[^<]+)</loc>\s*<lastmod>([^<]+)</lastmod>", xml)
    cands = []
    for loc, lm in pairs:
        d = parse_date(lm)
        if d and d >= buffer_cut and "/blog/search" not in loc and "/blog/tag/" not in loc and "/blog/author/" not in loc:
            cands.append(loc)

    posts = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
        for r in ex.map(fetch_meta, cands):
            if r.get("error"):
                continue
            d = parse_date(r.get("pub"))
            if d and cutoff <= d <= now + timedelta(days=1):
                posts.append(r)
    posts.sort(key=lambda r: r["pub"])

    out = json.dumps(posts, indent=1)
    if a.out == "-":
        print(out)
    else:
        open(a.out, "w").write(out)
    print(f"[blog] {len(posts)} post(s) published in last {a.days} days "
          f"(from {len(cands)} candidates)", file=sys.stderr)


if __name__ == "__main__":
    main()