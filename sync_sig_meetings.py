#!/usr/bin/env python3
"""
Fetch the SIGs Google Calendar iCal feed, parse recurring events per SIG,
and write data/sig-meetings.json.

Run from repo root:
  python3 sync_sig_meetings.py

The output JSON drives the client-side schedule display on /sigs and each SIG page.
Each SIG entry stores pre-expanded UTC occurrence datetimes so the browser needs
no arithmetic — it just finds the first future entry and uses toLocaleTimeString().
"""

import json
import re
import urllib.request
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from pathlib import Path

ICAL_URL = (
    "https://calendar.google.com/calendar/ical/"
    "sigs%40protocol-institute.org/public/basic.ics"
)

# Match substrings of SUMMARY (case-insensitive) to site slugs.
# Earlier entries win — put more specific patterns first.
#
# NOT ALL SLUGS HERE ARE STANDING SIGS. "stigmergy-workshop" is a time-boxed
# (UNTIL-bounded) workshop coordination call — see ALL_SLUGS/SIG_DISPLAY
# comments below. This whole file (and the PI_SIGS-keyed rendering in
# js/sig-meta.js / events/index.html) still assumes "calendar entry" ==
# "SIG" almost everywhere; TODO (noted 2026-08-10, not yet done): loosen
# that assumption so other call types (workshops, one-off coordination
# series) don't have to be shoehorned through the SIG data model/slug map
# each time one comes up.
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
    ("Stigmergy workshop", "stigmergy-workshop"),
]

BYDAY_MAP = {
    "MO": "Monday", "TU": "Tuesday", "WE": "Wednesday", "TH": "Thursday",
    "FR": "Friday", "SA": "Saturday", "SU": "Sunday",
}

# The 6 standing SIGs only — used solely for the "missing from calendar"
# warning at the end of main(). stigmergy-workshop is deliberately excluded:
# it's a 5-week series (ends 2026-09-18), not a standing SIG, so it SHOULD
# disappear from the calendar/warning once its RRULE's UNTIL passes.
ALL_SLUGS = ["sigfpt", "mrg", "sigpfb", "protfisig", "drg", "sigpsy"]

SIG_DISPLAY = {
    "sigfpt":    ("SIGFPT — Formal Protocol Theory",        "https://protocol-institute.org/sigs/sigfpt/"),
    "mrg":       ("Memory Research Group (MRG)",            "https://protocol-institute.org/sigs/mrg/"),
    "sigpfb":    ("SIGPfB — Protocols for Business",        "https://protocol-institute.org/sigs/sigpfb/"),
    "protfisig": ("ProtFiSIG — Protocol Fiction",           "https://protocol-institute.org/sigs/protfisig/"),
    "drg":       ("DRG — Distributed Robotics Group",       "https://protocol-institute.org/sigs/drg/"),
    "sigpsy":    ("SIGPSY — Psychohistory",                 "https://protocol-institute.org/sigs/sigpsy/"),
    "stigmergy-workshop": (
        "Stigmergy Workshop — Code Coordination Call",
        "https://protocol-institute.org/events/protocol-symposium-2026/program/workshops/workshop-protocol-hackathon-securing-stigmergic",
    ),
}

DAY_TO_BYDAY = {
    "Monday": "MO", "Tuesday": "TU", "Wednesday": "WE", "Thursday": "TH",
    "Friday": "FR", "Saturday": "SA", "Sunday": "SU",
}

# Manual entries for SIGs not yet on the calendar.
# DTSTART_RAW: YYYYMMDDTHHMMSS in the given TZID (or UTC if TZID is None).
MANUAL_SIGS = {
    "mrg": {
        "day": "Thursday",
        "interval_weeks": 2,
        "DTSTART_RAW": "20260605T143000",
        "TZID": None,  # UTC
        "_calendar_summary": "manually set — not yet on SIGs calendar",
    },
}


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


def parse_rrule(rrule_str):
    """Return (interval_weeks, day_name, until_utc_or_None) or None.

    UNTIL support matters for time-boxed series (e.g. a 5-week workshop
    coordination call) — without it every RRULE is treated as indefinite,
    so a short series would keep generating fabricated future occurrences
    long after it actually ended.
    """
    parts = dict(p.split('=', 1) for p in rrule_str.split(';') if '=' in p)
    if parts.get('FREQ') != 'WEEKLY':
        return None
    interval = int(parts.get('INTERVAL', 1))
    byday = re.sub(r'^[+-]?\d+', '', parts.get('BYDAY', ''))
    day = BYDAY_MAP.get(byday)
    if not day:
        return None
    until = None
    until_raw = parts.get('UNTIL')
    if until_raw:
        # Google Calendar always emits UNTIL in UTC (trailing Z) for weekly RRULEs.
        until = datetime.strptime(until_raw.rstrip('Z'), "%Y%m%dT%H%M%S").replace(tzinfo=timezone.utc)
    return (interval, day, until)


def expand_occurrences(dtstart_raw, tzid, interval_weeks, count=30, until=None):
    """
    Expand the recurring event to the next `count` UTC ISO datetimes, or
    fewer if `until` (a UTC datetime) cuts the series off first.

    Works with naive datetimes in the source timezone so DST transitions
    are handled correctly: each step stays at the same local time-of-day
    (e.g. always 10:00 AM Pacific) and only the UTC offset varies.
    """
    dt_naive = datetime.strptime(dtstart_raw, "%Y%m%dT%H%M%S")
    step = timedelta(weeks=interval_weeks)

    if tzid:
        try:
            tz = ZoneInfo(tzid)
            def to_utc(naive):
                return naive.replace(tzinfo=tz).astimezone(timezone.utc)
        except Exception as e:
            print(f"    TZ warning ({tzid}): {e} — treating as UTC")
            def to_utc(naive):
                return naive.replace(tzinfo=timezone.utc)
    else:
        def to_utc(naive):
            return naive.replace(tzinfo=timezone.utc)

    # Advance to start of today UTC so we don't emit stale entries
    today_utc = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    while to_utc(dt_naive) < today_utc:
        dt_naive += step

    results = []
    for _ in range(count):
        occ_utc = to_utc(dt_naive)
        if until and occ_utc > until:
            break
        results.append(occ_utc.strftime("%Y-%m-%dT%H:%M:%SZ"))
        dt_naive += step

    return results


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
        dtend_raw = ev.get('DTEND')

        duration_minutes = 60
        if dtend_raw:
            try:
                start_naive = datetime.strptime(dtstart_raw, "%Y%m%dT%H%M%S")
                end_naive = datetime.strptime(dtend_raw, "%Y%m%dT%H%M%S")
                delta = end_naive - start_naive
                if delta.total_seconds() > 0:
                    duration_minutes = int(delta.total_seconds() // 60)
            except (ValueError, TypeError):
                pass

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

        interval, day, until = rr
        occurrences = expand_occurrences(dtstart_raw, dtstart_tzid, interval, until=until)

        if not occurrences:
            print(f"  {slug}: series has ended (UNTIL {until}) — no future occurrences, skipping")
            continue

        sigs[slug] = {
            "day": day,
            "interval_weeks": interval,
            "occurrences": occurrences,
            "until": until.strftime("%Y-%m-%dT%H:%M:%SZ") if until else None,
            "duration_minutes": duration_minutes,
            "_calendar_summary": summary,
        }
        print(f"  {slug}: {day} every {interval}w — {len(occurrences)} occurrences from {occurrences[0]}"
              + (f" (ends {until.date()})" if until else ""))

    # Fill in manual entries for SIGs not on the calendar
    for slug, manual in MANUAL_SIGS.items():
        if slug not in sigs:
            occurrences = expand_occurrences(
                manual["DTSTART_RAW"], manual["TZID"], manual["interval_weeks"]
            )
            sigs[slug] = {
                "day": manual["day"],
                "interval_weeks": manual["interval_weeks"],
                "occurrences": occurrences,
                "until": None,
                "duration_minutes": 60,
                "_calendar_summary": manual["_calendar_summary"],
            }
            print(f"  {slug}: using manual entry — {len(occurrences)} occurrences from {occurrences[0]}")

    output = {
        "synced": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "sigs": sigs,
    }

    out_path = Path("data/sig-meetings.json")
    out_path.write_text(json.dumps(output, indent=2) + "\n")
    print(f"\nWrote {out_path}")

    missing = [s for s in ALL_SLUGS if s not in sigs]
    if missing:
        print(f"\nWARNING: no entry found for: {', '.join(missing)}")
        print("Add these to MANUAL_SIGS in sync_sig_meetings.py.")

    write_ics_files(sigs, output["synced"])


def write_ics_files(sigs, synced_date):
    """Write one .ics file per SIG with a RRULE so calendar apps import the full series."""
    out_dir = Path("calendar/sigs")
    out_dir.mkdir(parents=True, exist_ok=True)

    dtstamp = synced_date.replace("-", "") + "T000000Z"

    for slug, sig in sigs.items():
        if not sig.get("occurrences"):
            continue
        name, url = SIG_DISPLAY.get(slug, (slug.upper(), f"https://protocol-institute.org/sigs/{slug}/"))
        dtstart = sig["occurrences"][0].replace("-", "").replace(":", "")  # → 20260626T170000Z
        byday = DAY_TO_BYDAY.get(sig["day"], "MO")
        interval = sig["interval_weeks"]
        freq_word = "weekly" if interval == 1 else f"every {interval} weeks"

        rrule = f"FREQ=WEEKLY;INTERVAL={interval};BYDAY={byday}"
        until = sig.get("until")
        if until:
            rrule += f";UNTIL={until.replace('-', '').replace(':', '')}"
        duration_minutes = sig.get("duration_minutes", 60)
        hours, mins = divmod(duration_minutes, 60)
        duration = "PT" + (f"{hours}H" if hours else "") + (f"{mins}M" if mins else "")

        lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Protocol Institute//SIG Meetings//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "BEGIN:VEVENT",
            f"UID:{slug}-recurring@protocol-institute.org",
            f"DTSTAMP:{dtstamp}",
            f"DTSTART:{dtstart}",
            f"DURATION:{duration}",
            f"RRULE:{rrule}",
            f"SUMMARY:{name}",
            f"DESCRIPTION:Protocol Institute — meets {freq_word}. See {url} for details.",
            f"URL:{url}",
            "END:VEVENT",
            "END:VCALENDAR",
            "",
        ]
        out_path = out_dir / f"{slug}.ics"
        out_path.write_text("\r\n".join(lines))
        print(f"  Wrote {out_path}")


if __name__ == "__main__":
    main()
