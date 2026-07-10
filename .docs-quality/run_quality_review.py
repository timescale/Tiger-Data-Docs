#!/usr/bin/env python3
"""
Docs Quality Engine - Build Data Management Section Review
Comprehensive quality review of ~30 pages in build/data-management/
"""

import json
import sys
from pathlib import Path
from datetime import datetime

# Findings from manual review
findings = [
    {
        "checklistItem": "A4",
        "category": "product-tag-missing",
        "severity": "high",
        "pages": ["/build/data-management/hyperfunctions/index"],
        "evidence": "File: src/content/docs/build/data-management/hyperfunctions/index.mdx. Frontmatter has: title, description, keywords, learnMore, but NO 'products' tag.",
        "why": "Every page must declare which products it applies to (cloud, self_hosted, mst). Index pages are often overview pages but still must declare applicability. This page covers hyperfunctions available on both products.",
        "suggestedFix": "Add 'products: [cloud, self_hosted]' to the frontmatter. Hyperfunctions are available on both Tiger Cloud and self-hosted TimescaleDB.",
        "deferCheck": "A4 is a catalog-level check (missing frontmatter field). Not a Vale/build/testing-tool issue."
    },
    {
        "checklistItem": "A4",
        "category": "product-tag-missing",
        "severity": "high",
        "pages": ["/build/data-management/hyperfunctions/gapfilling-interpolation"],
        "evidence": "File: src/content/docs/build/data-management/hyperfunctions/gapfilling-interpolation/index.mdx. Frontmatter has: title, description, keywords, but NO 'products' tag.",
        "why": "Index page is missing the required products declaration. Gapfilling is available on both Tiger Cloud and self-hosted TimescaleDB (via Toolkit).",
        "suggestedFix": "Add 'products: [cloud, self_hosted]' to frontmatter.",
        "deferCheck": "A4 is a frontmatter schema requirement, not a content/prose issue."
    },
    {
        "checklistItem": "A4",
        "category": "product-tag-missing",
        "severity": "high",
        "pages": ["/build/data-management/hyperfunctions/percentile-approx"],
        "evidence": "File: src/content/docs/build/data-management/hyperfunctions/percentile-approx/index.mdx. Frontmatter has: title, description, keywords, but NO 'products' tag.",
        "why": "Index page is missing the required products declaration. Percentile approximation is available on both Tiger Cloud and self-hosted (via Toolkit).",
        "suggestedFix": "Add 'products: [cloud, self_hosted]' to frontmatter.",
        "deferCheck": "A4 is a frontmatter schema requirement, not a content/prose issue."
    },
    {
        "checklistItem": "A4",
        "category": "product-tag-missing",
        "severity": "high",
        "pages": ["/build/data-management"],
        "evidence": "File: src/content/docs/build/data-management/index.mdx. Frontmatter has: title, description, but NO 'products' tag.",
        "why": "Section index page is missing the required products declaration. This is the gateway to the entire data management section which covers both Tiger Cloud and self-hosted.",
        "suggestedFix": "Add 'products: [cloud, self_hosted]' to frontmatter.",
        "deferCheck": "A4 is a frontmatter schema requirement, not a content/prose issue."
    },
    {
        "checklistItem": "H3",
        "category": "terminology-inconsistency",
        "severity": "medium",
        "pages": ["/build/data-management/about-automation"],
        "evidence": "Page description (line 3): 'Automate refresh, hypercore, retention, and custom tasks with scheduled jobs'. Page body (lines 12-15) lists: '{C.CAGG_CAP} policies', '{C.COLUMNSTORE_CAP} policies', 'Retention policies', 'Reordering policies'. Description says 'hypercore' but body says 'columnstore policies'.",
        "why": "The description mentions 'hypercore' as an automation feature, but the page's actual list of built-in policies uses '{C.COLUMNSTORE_CAP}' not 'hypercore'. Inconsistent terminology may confuse readers about what automation tasks are available. The terms should match between description and body.",
        "suggestedFix": "Change description to: 'Automate refresh, columnstore conversion, retention, and custom tasks with scheduled jobs' OR verify if 'hypercore' should be listed in the policy examples.",
        "deferCheck": "H3 covers factual inconsistency in product/feature naming across sections of a page. Not a Vale style issue or build error."
    },
    {
        "checklistItem": "K3",
        "category": "narrated-output-mismatch",
        "severity": "medium",
        "pages": ["/build/data-management/storage/query-tiered-data"],
        "evidence": "File: src/content/docs/build/data-management/storage/query-tiered-data.mdx, lines 37-41. The code comment says 'This queries data from all {C.CHUNK}s including tiered and non-tiered {C.CHUNK}s:' followed by a table marked as '||count|', '|---|', '|1000|'. This is not valid markdown table syntax.",
        "why": "The example output table is malformed. A proper markdown table requires a header row, separator, and data rows in the format: '| col1 | col2 |' / '|---|---|' / '| val1 | val2 |'. This breaks readability and may confuse readers trying to replicate the example output. The prose says 'count' but the table doesn't render properly.",
        "suggestedFix": "Fix the table format to: '| count |' / '|---|' / '| 1000 |' OR clarify what the count column represents.",
        "deferCheck": "K3 is about prose-code agreement in readability. Malformed tables are content quality issues, not structural validation or build errors."
    }
]

# Write findings.json
findings_file = Path(".docs-quality/findings.json")
with open(findings_file, "w") as f:
    json.dump(findings, f, indent=2)
print(f"Wrote {len(findings)} findings to {findings_file}")

# Generate report.md
report_file = Path(".docs-quality/report.md")
with open(report_file, "w") as f:
    f.write("# Data-Management Section Quality Review\n\n")
    f.write(f"**Reviewed:** {datetime.now().isoformat()}\n\n")
    f.write("**Scope:** `/build/data-management/` section (30 pages)\n\n")

    # Summary table
    f.write("## Summary\n\n")

    severity_counts = {}
    category_counts = {}
    for finding in findings:
        sev = finding["severity"]
        cat = finding["category"]
        severity_counts[sev] = severity_counts.get(sev, 0) + 1
        category_counts[cat] = category_counts.get(cat, 0) + 1

    f.write("| Severity | Count |\n")
    f.write("|----------|-------|\n")
    for sev in ["high", "medium", "low"]:
        if sev in severity_counts:
            f.write(f"| {sev.capitalize()} | {severity_counts[sev]} |\n")

    f.write("\n| Category | Count |\n")
    f.write("|----------|-------|\n")
    for cat in sorted(category_counts.keys()):
        f.write(f"| {cat} | {category_counts[cat]} |\n")

    f.write(f"\n**Total findings:** {len(findings)}\n\n")

    # Findings by severity
    f.write("## Findings\n\n")

    for severity in ["high", "medium", "low"]:
        severity_findings = [x for x in findings if x["severity"] == severity]
        if not severity_findings:
            continue

        f.write(f"### {severity.upper()}\n\n")
        for finding in severity_findings:
            f.write(f"#### [{finding['checklistItem']}] {finding['category'].replace('-', ' ').title()}\n\n")
            f.write(f"**Pages affected:** {', '.join(finding['pages'])}\n\n")
            f.write(f"**Evidence:** {finding['evidence']}\n\n")
            f.write(f"**Why:** {finding['why']}\n\n")
            f.write(f"**Suggested fix:** {finding['suggestedFix']}\n\n")
            f.write(f"**Deferral check:** {finding['deferCheck']}\n\n")
            f.write("---\n\n")

print(f"Wrote report to {report_file}")
print(f"\nSummary:")
print(f"  Total findings: {len(findings)}")
print(f"  HIGH: {severity_counts.get('high', 0)}")
print(f"  MEDIUM: {severity_counts.get('medium', 0)}")
print(f"  LOW: {severity_counts.get('low', 0)}")
print(f"\nReport: {report_file.absolute()}")