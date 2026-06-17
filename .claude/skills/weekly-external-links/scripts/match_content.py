#!/usr/bin/env python3
"""Match Tiger Den content items to docs pages and draft learnMore cards.

Reads the Tiger Den items (fetch_tiger_den.py) and the docs catalog
(build_doc_catalog.py), then calls the Claude API once to do the whole editorial
pass headlessly: curate (drop excluded content), match each surviving item to the
1-3 most relevant pages, and compose learnMore cards under the docs owner's hard
rules. Output is a structured mapping the apply step consumes.

Runs without the Anthropic SDK (raw HTTPS via urllib) to stay consistent with the
other zero-dependency scripts in this skill and avoid adding a Python dependency
to this Node repo's CI. Uses structured outputs so the response is guaranteed to
match MAPPING_SCHEMA.

Usage:
    python3 match_content.py --items .learnmore-work/tiger-den.json \
        --catalog .learnmore-work/catalog.json --out .learnmore-work/mapping.json
"""

import argparse
import json
import os
import sys
import urllib.request
import urllib.error

ENDPOINT = "https://api.anthropic.com/v1/messages"
DEFAULT_MODEL = "claude-opus-4-8"
DEFAULT_MAX_LINKS = 4


def build_system(max_links):
    return f"""\
You are the editorial engine for the Tiger Data Docs weekly external-links \
refresh. You receive a list of content items from Tiger Den (Tiger Data's \
marketing content hub) and a catalog of documentation pages. Your job: decide \
which items belong on which docs pages as "learnMore" right-rail cards, applying \
the docs owner's rules exactly.

CURATE FIRST. Drop an item entirely (record it in `dropped` with a reason) when:
- It is pgai Vectorizer content (Vectorizer is deprecated; never link it).
- It is Ghost / Agentic Postgres content (a different product, not covered here).
- It is a pure social one-liner (a standalone post with no substantive \
walkthrough). Keep substantive third-party tutorials and deep-dive articles.

CLASSIFY each surviving item by kind: "video" (youtube_video / podcast), \
"customer story" (a named-customer narrative, e.g. Glooko, CERN, Axpo), or \
"blog post" (everything else: blog_post, website_content, whitepaper, \
press_release, social_article).

MATCH each item to the 1-3 most relevant pages by topic (compare the item's \
title/description/tags against each page's title/description). Prefer the most \
specific page. Conceptual /learn, task /build, integration /integrate, and \
/migrate pages are the usual homes; function-level /reference pages are rarely a \
good fit. Customer stories belong on the relevant feature/example/overview page, \
not scattered onto how-tos.

COMPOSE cards. For each target page, the card's `links` array is the FINAL, \
complete relatedPosts list for that page: it REPLACES whatever is there now. \
HARD RULES (set by the docs owner, non-negotiable):
- HARD CAP: at most {max_links} links per card, counting everything (existing + \
new). Never exceed {max_links}. This prevents cards from bloating over time.
- At least 2 links per card. If you cannot reach 2, do not emit the card; record \
the item in `dropped` with reason "only one link, cannot reach two".
- At most 2 customer stories per card.
- No external-contributor names in labels (drop "(Justin Mitchel)", \
"(DevopsToolbox)"). Customer names inside a customer-story label are fine.
- No em dashes anywhere (house style). Use commas, colons, or "and".
- Prefix video labels with "Video: ".
- Use the item's real title for the label; tidy it but keep it faithful.

EXISTING CARDS, REPLACE NOT PILE-ON: a catalog page may already have a card \
(`has_learnMore` true) whose links are listed in `existing_related` (label + \
href). When you add to such a page:
- Start from the existing links, then fold in the new item(s).
- If the total would exceed {max_links}, DROP the weakest or oldest existing \
links to make room. Prefer a new link over an existing one when it covers the \
same topic more directly or is more recent (a newer release post replacing an \
older one). Do not just append.
- Reproduce every existing link you keep VERBATIM (same label and href from \
`existing_related`).
- In the card's `notes`, say which existing links you dropped or replaced and why.
- If the new item is already represented on the page and you have nothing better \
to add, leave the page alone and record the item in `dropped` (reason "already \
covered, no improvement").

ACTION: set "new" if the page has no card yet, "add" if it already has one \
(informational; `links` is always the full final set either way).

Never invent URLs. Use each item's `url` verbatim. If you are unsure about a \
match, prefer dropping over forcing it, and explain in `dropped`.
"""

MAPPING_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "cards": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "page_path": {"type": "string", "description": "Catalog page path, e.g. /learn/search/using-pg-textsearch"},
                    "action": {"type": "string", "enum": ["new", "add"]},
                    "heading": {"type": "string", "description": "relatedPostsHeading: 'Related resources', 'Watch', or 'Related reading'"},
                    "links": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "properties": {
                                "label": {"type": "string"},
                                "href": {"type": "string"},
                                "kind": {"type": "string", "enum": ["video", "blog post", "customer story"]},
                            },
                            "required": ["label", "href", "kind"],
                        },
                    },
                    "notes": {"type": "string", "description": "Any add/replace caveat, or empty string"},
                },
                "required": ["page_path", "action", "heading", "links", "notes"],
            },
        },
        "dropped": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "title": {"type": "string"},
                    "url": {"type": "string"},
                    "reason": {"type": "string"},
                },
                "required": ["title", "url", "reason"],
            },
        },
    },
    "required": ["cards", "dropped"],
}


def call_claude(items, catalog, api_key, model, max_links):
    user_content = (
        "Tiger Den content items (JSON):\n"
        + json.dumps(items, indent=1)
        + "\n\nDocs page catalog (JSON):\n"
        + json.dumps(catalog, indent=1)
        + "\n\nProduce the mapping per the rules."
    )
    body = json.dumps({
        "model": model,
        "max_tokens": 32000,
        "stream": True,
        "thinking": {"type": "adaptive"},
        "output_config": {
            "effort": "high",
            "format": {"type": "json_schema", "schema": MAPPING_SCHEMA},
        },
        "system": build_system(max_links),
        "messages": [{"role": "user", "content": user_content}],
    }).encode()

    req = urllib.request.Request(
        ENDPOINT,
        data=body,
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        method="POST",
    )

    # Stream the response. Adaptive thinking at high effort over a large prompt can
    # run for minutes; streaming keeps bytes flowing (deltas + pings) so the
    # per-read socket timeout never trips on a single blocking read.
    text_parts = []
    stop_reason = None
    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            for raw in resp:
                line = raw.decode("utf-8", "replace").strip()
                if not line.startswith("data:"):
                    continue
                try:
                    ev = json.loads(line[5:].strip())
                except json.JSONDecodeError:
                    continue
                etype = ev.get("type")
                if etype == "content_block_delta" and ev.get("delta", {}).get("type") == "text_delta":
                    text_parts.append(ev["delta"]["text"])
                elif etype == "message_delta":
                    stop_reason = ev.get("delta", {}).get("stop_reason", stop_reason)
                elif etype == "error":
                    sys.exit(f"Claude API stream error: {ev.get('error')}")
    except urllib.error.HTTPError as e:
        sys.exit(f"Claude API request failed ({e.code}): {e.read().decode(errors='replace')[:400]}")
    except urllib.error.URLError as e:
        sys.exit(f"Could not reach the Claude API: {e.reason}")

    if stop_reason == "refusal":
        sys.exit("Claude declined the request (stop_reason: refusal).")
    if stop_reason == "max_tokens":
        sys.exit("Claude hit max_tokens; output is incomplete. Re-run with fewer items or raise max_tokens.")

    text = "".join(text_parts)
    if not text.strip():
        sys.exit(f"Empty response from Claude (stop_reason: {stop_reason}).")
    return json.loads(text)


def main():
    ap = argparse.ArgumentParser(description="Match Tiger Den content to docs pages.")
    ap.add_argument("--items", required=True, help="Path to fetch_tiger_den.py output.")
    ap.add_argument("--catalog", required=True, help="Path to build_doc_catalog.py output.")
    ap.add_argument("--out", required=True, help="Path to write the mapping JSON.")
    args = ap.parse_args()

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        sys.exit("ANTHROPIC_API_KEY is not set. Add it to .env (see .env.example).")
    model = os.environ.get("ANTHROPIC_MODEL", DEFAULT_MODEL)
    max_links = int(os.environ.get("MAX_LINKS_PER_CARD", DEFAULT_MAX_LINKS))

    with open(args.items) as f:
        items = json.load(f)
    with open(args.catalog) as f:
        catalog = json.load(f)
    if not items:
        print("No items to match; writing empty mapping.")
        with open(args.out, "w") as f:
            json.dump({"cards": [], "dropped": []}, f, indent=2)
        return

    mapping = call_claude(items, catalog, api_key, model, max_links)

    # Safety net: enforce the cap in code even if the model overshoots.
    for card in mapping.get("cards", []):
        if len(card.get("links", [])) > max_links:
            card["notes"] = (card.get("notes", "") + f" [auto-trimmed to {max_links} links]").strip()
            card["links"] = card["links"][:max_links]

    with open(args.out, "w") as f:
        json.dump(mapping, f, indent=2)
    print(
        f"Wrote {len(mapping.get('cards', []))} card(s) and "
        f"{len(mapping.get('dropped', []))} dropped item(s) to {args.out} (model: {model})"
    )


if __name__ == "__main__":
    main()