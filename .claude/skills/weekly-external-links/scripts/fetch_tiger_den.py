#!/usr/bin/env python3
"""Fetch content items published in the last N days from Tiger Den.

Tiger Den (https://den.tigerdata.com) is Tiger Data's marketing content hub. It
tracks every blog post, YouTube video, case study, whitepaper, podcast, and
third-party/KOL publication as a "content item", and is the single source for the
weekly external-links refresh.

Access is the Tiger Den read-only bearer token (TIGER_DEN_TOKEN). The script
talks to the Tiger Den MCP HTTP endpoint over JSON-RPC and calls the read-only
`list_content` tool, paging until it has every item published on or after the
cutoff date. Output is a normalized JSON array the matcher step consumes.

Usage:
    python3 fetch_tiger_den.py --days 7 --out .learnmore-work/tiger-den.json
"""

import argparse
import datetime as dt
import json
import os
import sys
import urllib.request
import urllib.error

ENDPOINT = "https://den.tigerdata.com/api/mcp/mcp"
PAGE_SIZE = 100  # list_content max


def _rpc(method, params, token, rpc_id=1):
    """Call one JSON-RPC method against the Tiger Den MCP endpoint.

    The endpoint replies with Server-Sent Events (text/event-stream): one or more
    `data: {json}` lines. We parse out the JSON-RPC envelope from those.
    """
    payload = json.dumps(
        {"jsonrpc": "2.0", "id": rpc_id, "method": method, "params": params}
    ).encode()
    req = urllib.request.Request(
        ENDPOINT,
        data=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = resp.read().decode()
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")[:300]
        sys.exit(f"Tiger Den request failed ({e.code}): {detail}")
    except urllib.error.URLError as e:
        sys.exit(f"Could not reach Tiger Den: {e.reason}")

    envelope = None
    for line in body.splitlines():
        line = line[6:] if line.startswith("data: ") else line
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            envelope = json.loads(line)
        except json.JSONDecodeError:
            continue
    if envelope is None:
        sys.exit(f"Unexpected Tiger Den response: {body[:300]}")
    if "error" in envelope:
        sys.exit(f"Tiger Den error: {envelope['error']}")
    return envelope["result"]


def _call_tool(name, arguments, token, rpc_id=1):
    """Call an MCP tool and return its decoded JSON payload."""
    result = _rpc(
        "tools/call", {"name": name, "arguments": arguments}, token, rpc_id
    )
    # Tool results arrive as a content array of {type:text, text:"<json>"}.
    text = result["content"][0]["text"]
    return json.loads(text)


def fetch(days, token):
    cutoff = (dt.date.today() - dt.timedelta(days=days)).isoformat()
    items, offset = [], 0
    while True:
        page = _call_tool(
            "list_content",
            {
                "published_after": cutoff,
                "sort_by": "published",
                "limit": PAGE_SIZE,
                "offset": offset,
            },
            token,
            rpc_id=offset + 1,
        )
        batch = page.get("items", [])
        items.extend(batch)
        # Stop when the last page is short, or pagination metadata says we're done.
        total = page.get("total")
        if total is not None and offset + len(batch) >= total:
            break
        if len(batch) < PAGE_SIZE:
            break
        offset += PAGE_SIZE

    # Normalize to the fields the matcher needs (keep it small and stable).
    normalized = []
    for it in items:
        normalized.append(
            {
                "id": it.get("id"),
                "title": it.get("title"),
                "url": it.get("url"),
                "content_type": it.get("contentType"),
                "publisher_type": it.get("publisherType"),
                "description": it.get("description"),
                "tags": it.get("tags") or [],
                "author": it.get("author"),
                "publish_date": it.get("publishDate"),
                "view_count": it.get("viewCount"),
            }
        )
    return cutoff, normalized


def main():
    ap = argparse.ArgumentParser(description="Fetch recent Tiger Den content.")
    ap.add_argument("--days", type=int, default=7, help="Look back this many days (default 7).")
    ap.add_argument("--out", required=True, help="Path to write the JSON array.")
    args = ap.parse_args()

    token = os.environ.get("TIGER_DEN_TOKEN")
    if not token:
        sys.exit("TIGER_DEN_TOKEN is not set. Add it to .env (see .env.example).")

    cutoff, items = fetch(args.days, token)
    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    with open(args.out, "w") as f:
        json.dump(items, f, indent=2)
    print(f"Wrote {len(items)} item(s) published on/after {cutoff} to {args.out}")


if __name__ == "__main__":
    main()