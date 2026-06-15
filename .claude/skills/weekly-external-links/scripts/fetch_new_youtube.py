#!/usr/bin/env python3
"""Find Tiger Data YouTube videos published in the last N days.

Uses the channel RSS feed (latest ~15 uploads, with publish dates and canonical URLs),
so no manual list and no URL-guessing is needed.

IMPORTANT: the company channel is UCPmHSkid9IOYbdN1Psh24lg
("Tiger Data (creators of TimescaleDB)"). The @TigerData handle resolves to an
unrelated personal channel, so do NOT use that one.

Usage:
    python3 fetch_new_youtube.py [--days 7] [--out youtube.json]
"""
import argparse, json, re, sys, html, urllib.request
from datetime import datetime, timezone, timedelta

CHANNELS = ["UCPmHSkid9IOYbdN1Psh24lg"]  # Tiger Data (creators of TimescaleDB)
UA = {"User-Agent": "Mozilla/5.0 (TigerDocs weekly-external-links skill)"}


def get(url, timeout=25):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout).read().decode("utf-8", "ignore")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=7)
    ap.add_argument("--out", default="-")
    a = ap.parse_args()

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=a.days)

    vids = []
    for cid in CHANNELS:
        xml = get(f"https://www.youtube.com/feeds/videos.xml?channel_id={cid}")
        for entry in re.findall(r"<entry>(.*?)</entry>", xml, re.S):
            vid = re.search(r"<yt:videoId>([^<]+)</yt:videoId>", entry)
            title = re.search(r"<title>([^<]*)</title>", entry)
            pub = re.search(r"<published>([^<]+)</published>", entry)
            if not (vid and title and pub):
                continue
            d = datetime.fromisoformat(pub.group(1).strip())
            if d >= cutoff:
                vids.append({
                    "title": html.unescape(title.group(1)).strip(),
                    "url": f"https://www.youtube.com/watch?v={vid.group(1)}",
                    "pub": pub.group(1).strip(),
                })
    vids.sort(key=lambda v: v["pub"])

    out = json.dumps(vids, indent=1)
    if a.out == "-":
        print(out)
    else:
        open(a.out, "w").write(out)
    print(f"[youtube] {len(vids)} video(s) published in last {a.days} days", file=sys.stderr)
    print("[youtube] NOTE: RSS exposes only the latest ~15 uploads; widen --days cautiously.", file=sys.stderr)


if __name__ == "__main__":
    main()