#!/usr/bin/env python3
# -*- coding: utf-8 -*-
#
# Generate Overview page of available GUCs in TimescaleDB with descriptions
#
# This script is a "bridge" between the C source code and our documentation.
# It targets 'src/guc.c' in the TimescaleDB repository, which defines the 
# configuration parameters (GUCs - Grand Unified Configuration).
#
# High-level workflow:
# 1. Fetch the raw C source code from GitHub for a specific tag.
# 2. Parse the file using regex to find calls to 'DefineCustom*Variable' macros.
# 3. Extract the metadata (name, description, default value, min/max).
# 4. Generate a Markdown table for the documentation.
#
# Args: 
#   tag: The git tag (e.g., 2.13.0) to pull the guc.c from.
#   destination: The local file path where the .md table will be written.
#
# Dependencies
#   - requests: For fetching the remote C file.

import argparse
import requests
import re
import logging

# Configure logging to provide visibility into the script's progress.
logging.basicConfig(format='%(asctime)s %(levelname)s: %(message)s', level=logging.INFO)

parser = argparse.ArgumentParser(description='Extracts GUC definitions from TimescaleDB source code.')
parser.add_argument('tag', type=str, help='Git tag name to pull guc.c from (e.g., 2.14.0)')
parser.add_argument('destination', type=str, help='Local path to write the output Markdown file')
args = parser.parse_args()

# Mapping of C macro function names to their corresponding documentation types.
# These macros are used in guc.c to register different types of configuration parameters.
TYPES = {
    "DefineCustomBoolVariable"  : "BOOLEAN",
    "DefineCustomIntVariable"   : "INTEGER",
    "DefineCustomEnumVariable"  : "ENUM",
    "DefineCustomStringVariable": "STRING",
    "DefineCustomRealVariable"  : "REAL",
}

# These are used for potential future filtering or labeling based on C preprocessor macros.
# Currently, the script doesn't fully implement scope-based filtering.
SCOPES = {
    "PG16_GE"      : "Postgres 16 or greater",
    "TS_DEBUG"     : "Debug mode",
    "USE_TELEMETRY": "Telemetry enabled", 
}

# List of GUCs to exclude from the docs if we want to hide internal/experimental settings.
EXCLUDE = []

"""
Fetches the raw content of guc.c from the official TimescaleDB GitHub repository.
@param url: The raw.githubusercontent.com URL.
@return The file content as a string.
"""
def get_content(url: str) -> str:
    try:
        resp = requests.get(url=url)
        if resp.status_code != 200:
            logging.error(f"Failed to fetch {url}. Status: {resp.status_code}")
            exit(10)
        return resp.text
    except Exception as e:
        logging.error(f"Error during network request: {e}")
        exit(1)

"""
The 'unwrap' function is the core parser. It takes raw text blocks captured by regex 
and breaks them down into structured GUC data.

C macros like DefineCustomIntVariable look like this:
    DefineCustomIntVariable(
        "timescaledb.max_background_workers",
        "Maximum number of background workers",
        "Detailed description...",
        &max_bg_workers,
        8, 0, 1000,
        PGC_POSTMASTER,
        0,
        NULL, NULL, NULL
    );

The function handles:
1. Multi-line arguments.
2. Comma-separated values.
3. Metadata extraction (name, descriptions, defaults).

@param gucs: List of raw strings, each containing the arguments of a macro call.
@param guc_type: The documentation type (from TYPES mapping).
@return A dictionary where key is GUC name and value is a metadata dict.
"""
def unwrap(gucs: list, guc_type: str) -> dict:
    result_map = {}

    for guc in gucs:
        # Step 1: Clean up whitespace and tabs.
        # We split by newline, strip, and then reconstruct a "clean" list of strings.
        lines = [re.sub(r"[\n\t]*", "", v).strip() for v in guc.split("\n")]
        it = []
        lst = []
        
        # Step 2: Handle multi-line strings/arguments.
        # C code often breaks long strings or argument lists across lines.
        # This loop aggregates lines until it hits a comma, which signifies the end of an argument.
        for line in lines:
            if not line: continue
            if line[-1:] == ",":
                val = "".join(lst) + line[:-1]
                lst = []
                it.append(val)
            else:
                lst.append(line)

        # Basic validation: ensure we have at least the name and descriptions.
        if len(it) < 3:
            continue

        # Step 3: Sanitize the extracted components.
        # Names in C are often quoted "name" or inside macros (MAKE_EXTOPTION).
        name = re.sub(r"[\"\(\)]*", "", it[0])
        short_desc = sanitize_description(it[1])
        # If long_desc is NULL, we fall back to short_desc.
        long_desc = short_desc if it[2].lower() == "null" else sanitize_description(it[2])

        # Step 4: Map to our structured format.
        if name not in EXCLUDE:
            result_map[name] = {
                "name"      : name,
                "short_desc": short_desc,
                "long_desc" : long_desc,
                # parts[4] is usually the default value in these macros.
                "value"     : get_value(guc_type, it),
                # meta contains extra info like min/max for numbers.
                "meta"      : get_meta_data(guc_type, it),
                "type"      : guc_type,
                "scopes"    : [], # reserved for future use
            }
    return result_map

"""
Cleans up C-style strings for documentation.
Removes quotes and normalizes whitespace.
"""
def sanitize_description(text) -> str:
    # Remove all quotes and normalize whitespace to single line
    cleaned = ' '.join(text.replace('"', '').split()).strip()
    return strip_comment_pattern(cleaned)

"""
Removes C comments used as labels within function calls.
Example: /* name= */ -> ""
"""
def strip_comment_pattern(text) -> str:
    pattern = r'/\*\s*[a-zA-Z0-9_]*=\s*\*/'
    return re.sub(pattern, '', extract_gettext_noop_string(text))

"""
Extracts strings from the gettext_noop() macro used for internationalization in Postgres.
Example: gettext_noop("some string") -> some string
"""
def extract_gettext_noop_string(text):
    pattern = r'gettext_noop\s*\(\s*"([^"]*(?:\\.[^"]*)*)"\s*\)'
    match = re.search(pattern, text, re.DOTALL)
    return match.group(1) if match else text

"""
Extracts the default value from the argument list.
The index varies slightly by macro, but it's generally index 4.
"""
def get_value(type: str, parts: list) -> str:
    if len(parts) <= 4:
        return "N/A"
    # Note: ENUM types might need more complex parsing to find the actual label.
    return strip_comment_pattern(parts[4]).strip()

"""
Extracts numeric constraints (Min/Max) for INTEGER and REAL types.
These are found at indices 5 and 6 in the DefineCustomInt/RealVariable macros.
"""
def get_meta_data(type: str, parts: list) -> str:
    if type in ["INTEGER", "REAL"] and len(parts) > 6:
        min_val = strip_comment_pattern(parts[5]).strip()
        max_val = strip_comment_pattern(parts[6]).strip()
        return "min: `%s`, max: `%s`" % (min_val, max_val)
    return ""

"""
Finds all GUC definitions in the C file using regex.
The script looks for DefineCustom*Variable macros specifically wrapped in MAKE_EXTOPTION.

Why two patterns? 
Developers sometimes add comments like /* name= */ before the arguments, 
which changes how the regex needs to look for the starting parenthesis.
"""
def prepare(content: str) -> dict:
    all_gucs = {}

    for pattern, guc_type in TYPES.items():
        # Pattern 1: Direct call
        # Example: DefineCustomBoolVariable(MAKE_EXTOPTION(...)
        matches1 = re.findall(r"%s\(MAKE_EXTOPTION(.*?)\);" % pattern, content, re.DOTALL)
        all_gucs.update(unwrap(matches1, guc_type))
        
        # Pattern 2: Call with comment label
        # Example: DefineCustomBoolVariable(/* name= */ MAKE_EXTOPTION(...)
        matches2 = re.findall(r"%s\(\/\* name= \*\/ MAKE_EXTOPTION(.*?)\);" % pattern, content, re.DOTALL)
        all_gucs.update(unwrap(matches2, guc_type))

    # Log summary statistics for verification.
    summary = {}
    for v in all_gucs.values():
        summary[v["type"]] = summary.get(v["type"], 0) + 1
    
    for k, v in summary.items():
        logging.info(f"Registered {v} GUCs of type: {k}")

    # Return dict with alphabetically sorted keys for consistent doc ordering.
    return {i: all_gucs[i] for i in sorted(all_gucs.keys())}

"""
Generates the final Markdown file.
Uses a standard table format: | Name | Type | Default | Description |
"""
def render(gucs: dict, filename: str, version: str):
    with open(filename, "w") as f:
        # Table Header
        f.write("| Name | Type | Default | Description |\n")
        f.write("| ---- | ---- | ------- | ----------- |\n")
        
        for guc in gucs.values():
            desc = guc["long_desc"]
            # Append min/max info if available.
            if guc["meta"] != "":
                desc += "<br />" + guc["meta"] 
            
            # Format as a Markdown table row.
            f.write("| `%s` | `%s` | `%s` | %s |\n" % (guc["name"], guc["type"], guc["value"], desc))
        
        # Add a footer with a link to the source version.
        f.write("\n")
        f.write("Version: [%s](https://github.com/timescale/timescaledb/releases/tag/%s)" % (version, version))
    
    logging.info(f"Rendering completed to {filename}")

if __name__ == "__main__":
    # 1. Fetch
    source_url = "https://raw.githubusercontent.com/timescale/timescaledb/refs/tags/%s/src/guc.c" % args.tag
    content = get_content(source_url)
    logging.info(f"Fetched guc.c file for version: {args.tag}")
    
    # 2. Parse & Prepare
    gucs = prepare(content)
    
    # 3. Output
    render(gucs, args.destination, args.tag)
