#!/usr/bin/env python3
"""
Fetch the SIGs Google Calendar iCal feed, parse recurring events per SIG,
and write data/sig-meetings.json.

Run from repo root:
  python3 sync_sig_meetings.py

The output JSON drives the client-side schedule display on /sigs and each SIG page.
"""

import json
import re
import urllib.request
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from pathlib import Path

ICAL_URL = (
    "https://calendar.google.com/calendar/ical/"
    "sigs%40protocol-institute.org/public/basic.ics"
)

# Match substrings of SUMMARY (case-insensitive) to site slugs.
# Earlier entries win — put more specific patterns first.
SLUG_MAP = [
    ("SIGFPT", "sigfpt"),
    ("Formal Protocol Theory", "sigfpt"),
    ("SIGPSY", "sigpsy"),
    ("Psychohistory", "sigpsy"),
    ("PFSIG", "protfisig"),
    ("Protocol Fiction", "protfisig"),
    ("Protocols for Business", "sigpfb"),
    ("Distributed Robotics", "drg"),
    ("Memory Research", "mrg"),
]

BYDAY_MAP = {
    "MO": "Monday", "TU": "Tuesday", "WE": "Wednesday", "TH": "Thursday",
    "FR": "Friday", "SA": "Saturday", "SU": "Sunday",
}

ALL_SLUGS = ["sigfpt", "mrg", "sigpfb", "protfisig", "drg", "sigpsy"]


def slug_for(summary):
    for pattern, slug in SLUG_MAP:
        if pattern.lower() in summary.lower():
            return slug
    return None


def parse_ical_blocks(text):
    events = []
    current = {}
    in_event = False
    last_key = None
    for raw_line in text.splitlines():
        if raw_line.startswith((' ', '\t')) and last_key and in_event:
            current[last_key] = current[last_key] + raw_line[1:]
            continue
        if raw_line == "BEGIN:VEVENT":
            in_event = True
            current = {}
            last_key = None
        elif raw_line == "END:VEVENT":
            in_event = False
            events.append(current)
            last_key = None
        elif in_event and ':' in raw_line:
            key_part, _, value = raw_line.partition(':')
            key_base = key_part.split(';')[0]
            params_raw = key_part[len(key_base):]
            tzid_match = re.search(r'TZID=([^;:]+)', params_raw)
            tzid = tzid_match.group(1) if tzid_match else None
            if key_base == "DTSTART":
                current['DTSTART_RAW'] = value
                current['DTSTART_TZID'] = tzid
            else:
                current[key_base] = value
            last_key = key_base
    return events


def dtstart_to_utc(raw, tzid):
    dt = datetime.strptime(raw, "%Y%m%dT%H%M%S")
    if tzid:
        try:
            dt = dt.replace(tzinfo=ZoneInfo(tzid)).astimezone(timezone.utc)
        except Exception as e:
            print(f"    TZ warning ({tzid}): {e}")
    return dt


def parse_rrule(rrule_str):
    """Return (interval_weeks, day_name) or None."""
    parts = dict(p.split('=', 1) for p in rrule_str.split(';') if '=' in p)
    if parts.get('FREQ') != 'WEEKLY':
        return None
    interval = int(parts.get('INTERVAL', 1))
    byday = re.sub(r'^[+-]?\d+', '', parts.get('BYDAY', ''))
    day = BYDAY_MAP.get(byday)
    return (interval, day) if day else None


def main():
    print(f"Fetching {ICAL_URL} …")
    with urllib.request.urlopen(ICAL_URL) as resp:
        text = resp.read().decode('utf-8')

    events = parse_ical_blocks(text)
    print(f"Parsed {len(events)} VEVENTs")

    sigs = {}
    for ev in events:
        summary = ev.get('SUMMARY', '')
        rrule = ev.get('RRULE', '')
        dtstart_raw = ev.get('DTSTART_RAW')
        dtstart_tzid = ev.get('DTSTART_TZID')

        # Skip one-off instances (exceptions to a series have no RRULE)
        if not rrule or not dtstart_raw:
            continue

        slug = slug_for(summary)
        if not slug:
            print(f"  No slug match for: {summary!r}")
            continue

        rr = parse_rrule(rrule)
        if not rr:
            continue

        if slug in sigs:
            print(f"  Duplicate {slug}: {summary!r} — skipping")
            continue

        interval, day = rr
        dt_utc = dtstart_to_utc(dtstart_raw, dtstart_tzid)
        time_utc = dt_utc.strftime("%H:%M")
        # Anchor is the UTC calendar date of this particular occurrence
        anchor = dt_utc.strftime("%Y-%m-%d")

        sigs[slug] = {
            "day": day,
            "time_utc": time_utc,
            "interval_weeks": interval,
            "anchor": anchor,
            "_calendar_summary": summary,
        }
        print(f"  {slug}: {day} {time_utc} UTC every {interval}w (anchor {anchor})")

    output = {
        "synced": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "sigs": sigs,
    }

    out_path = Path("data/sig-meetings.json")
    out_path.write_text(json.dumps(output, indent=2) + "\n")
    print(f"\nWrote {out_path}")

    missing = [s for s in ALL_SLUGS if s not in sigs]
    if missing:
        print(f"\nWARNING: no calendar entry found for: {', '.join(missing)}")
        print("Add these manually to data/sig-meetings.json if needed.")


if __name__ == "__main__":
    main()
