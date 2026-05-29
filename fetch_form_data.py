#!/usr/bin/env python3
"""Fetch and display current entries from PI Google Form sheets.

Usage:
    python3 fetch_form_data.py              # show all entries
    python3 fetch_form_data.py --network    # network sheet only
    python3 fetch_form_data.py --consulting # consulting sheet only
"""

import csv
import io
import sys
import urllib.request

SHEETS = {
    "network": {
        "title": "Protocol Institute Network",
        "url": "https://docs.google.com/spreadsheets/d/1HtK0_DennkrcAFcsTLbAWXduqSlgkfKczijPpMVv_e0/export?format=csv",
        "fields": [
            ("Timestamp", "timestamp"),
            ("What is your parent organization", "parent_org"),
            ("What is the name of your unit/workgroup within the organization?", "unit"),
            ("Web page where your unit's public information and outputs can be found", "website"),
            ("What protocol-related work does your unit do?", "work"),
            ("Name and job/role title of primary contact who will interface with PIN", "contact"),
            ("Email of primary contact", "contact_email"),
            ("What capabilities can your unit offer to other members of the network", "capabilities"),
            ("URL for logo for your unit", "logo_url"),
        ],
    },
    "consulting": {
        "title": "Consulting Directory",
        "url": "https://docs.google.com/spreadsheets/d/11jpKf7ShOBdj-UWseLcC9HVLNOq740FXhRaPbNSAv_s/export?format=csv",
        "fields": [
            ("Timestamp", "timestamp"),
            ("Your name", "name"),
            ("Your email", "email"),
            ("Brief relevant background for consulting on protocols, and particular areas of expertise.", "background"),
            ("Consulting portfolio page if you have one (recommended)", "portfolio"),
            ("URL for a photograph (headshot)", "photo_url"),
            ("URL for others to contact you OR an email address that can be shown publicly", "public_contact"),
            ("What Summer of Protocols or PI activities, if any, have you participated in recently? List 2-3 if you have many.", "pi_activities"),
        ],
    },
}


def fetch_csv(url: str) -> list[dict]:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        # follow redirect if needed
        content = resp.read().decode("utf-8")
    return list(csv.DictReader(io.StringIO(content)))


def truncate(text: str, max_len: int = 120) -> str:
    text = text.strip().replace("\n", " ")
    return text[:max_len] + "…" if len(text) > max_len else text


def print_sheet(key: str) -> None:
    sheet = SHEETS[key]
    print(f"\n{'='*60}")
    print(f"  {sheet['title'].upper()}")
    print(f"{'='*60}")

    try:
        rows = fetch_csv(sheet["url"])
    except Exception as e:
        print(f"  ERROR fetching sheet: {e}")
        return

    if not rows:
        print("  (no entries)")
        return

    # Build a lookup from raw header → short key
    field_map = {raw: short for raw, short in sheet["fields"]}

    for i, row in enumerate(rows, 1):
        # Map raw headers to short keys where possible
        entry = {field_map.get(k, k): v for k, v in row.items()}

        timestamp = entry.get("timestamp", "")
        if key == "network":
            label = f"{entry.get('unit', '?')}, {entry.get('parent_org', '?')}"
        else:
            label = entry.get("name", "?")

        print(f"\n  [{i}] {label}  ({timestamp})")

        if key == "network":
            print(f"       Website:     {entry.get('website', '')}")
            print(f"       Contact:     {entry.get('contact', '')}")
            print(f"       Logo URL:    {entry.get('logo_url', '')}")
            print(f"       Work:        {truncate(entry.get('work', ''))}")
        else:
            print(f"       Portfolio:   {entry.get('portfolio', '')}")
            print(f"       Photo URL:   {entry.get('photo_url', '')}")
            print(f"       Contact:     {entry.get('public_contact', '')}")
            print(f"       Background:  {truncate(entry.get('background', ''))}")
            print(f"       PI activity: {entry.get('pi_activities', '')}")

    print()


def main() -> None:
    args = sys.argv[1:]
    if "--network" in args:
        keys = ["network"]
    elif "--consulting" in args:
        keys = ["consulting"]
    else:
        keys = ["network", "consulting"]

    for key in keys:
        print_sheet(key)


if __name__ == "__main__":
    main()
