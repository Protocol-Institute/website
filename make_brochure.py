#!/opt/homebrew/bin/python3
"""Generate the Protocol Symposium 2026 program brochure as a PDF.

D1 is the source of truth for the schedule, so this script reads it live via
wrangler, renders a print-styled HTML document, and hands that to WeasyPrint.
Rerun it after any schedule change; nothing here is hand-maintained.

    /opt/homebrew/bin/python3 make_brochure.py                 # -> symposium-2026-program.pdf
    /opt/homebrew/bin/python3 make_brochure.py --html-only     # inspect the HTML in a browser
    /opt/homebrew/bin/python3 make_brochure.py --page-size letter

Brand fonts are not installed on this machine, so they are fetched from Google
Fonts as TTF (an old User-Agent gets TTF rather than woff2, which avoids a
brotli dependency in WeasyPrint) and cached in .brochure-cache/ (gitignored).

Output PDFs are gitignored (*.pdf). To publish one, upload it to R2:
    npx wrangler r2 object put pi-assets/<name>.pdf --file <name>.pdf \
        --content-type application/pdf --remote
"""

import argparse
import html
import json
import os
import pathlib
import re
import subprocess
import sys
from collections import OrderedDict
from datetime import date as _date, datetime
from zoneinfo import ZoneInfo

DB = "pi-members"
ROOT = pathlib.Path(__file__).resolve().parent
CACHE = ROOT / ".brochure-cache"
DEFAULT_OUT = ROOT / "symposium-2026-program.pdf"

# The New Nature key art, which already carries the symposium name and dates.
# Not in git (assets/*.png is gitignored, binaries live in R2), so it is pulled
# from the live site and cached.
COVER_ART_URL = "https://protocol-institute.org/assets/nn_dates_banner.webp"

INK = "#1A1A1A"
TEAL = "#2A6B6B"
MUTED = "#8A8A8A"
RULE = "#E0DDD8"
CREAM = "#FAFAF7"

SYMPOSIUM_DAYS = ["2026-09-23", "2026-09-24", "2026-09-25"]
WORKSHOP_DAYS = ["2026-09-21", "2026-09-22"]

# Reference timezones shown under every UTC time. Label is the zone's own
# abbreviation for that date (so CEST/CET and PDT/PST stay correct if the
# schedule ever moves across a DST boundary); Kuala Lumpur reports "+08", which
# is not a useful label, so it is overridden.
ZONES = [
    ("Europe/Berlin", None),
    ("Asia/Kuala_Lumpur", "MYT"),
    ("America/Los_Angeles", None),
    ("America/New_York", None),
]

# Values speakers type into an optional field to mean "nobody"; they must not
# reach a byline.
PLACEHOLDERS = {"none", "n/a", "na", "nil", "-", "--", "tbd", "tba", "n.a."}

MONTHS = ["January", "February", "March", "April", "May", "June", "July",
          "August", "September", "October", "November", "December"]
WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
            "Saturday", "Sunday"]


# ── D1 ────────────────────────────────────────────────────────────────

def d1(sql):
    """Run a read-only query against the remote D1 database."""
    proc = subprocess.run(
        ["npx", "wrangler", "d1", "execute", DB, "--remote", "--json",
         "--command", sql],
        cwd=ROOT, capture_output=True, text=True,
    )
    out = proc.stdout
    start = out.find("[")
    if proc.returncode != 0 or start == -1:
        sys.exit("D1 query failed:\n" + (proc.stderr or out))
    return json.loads(out[start:])[0]["results"]


def load():
    proposals = d1(
        "SELECT id, type, slug, title, abstract, speaker_name, speaker_website,"
        " co_speakers, organizer_name, organizer_bio, co_organizer_name,"
        " co_organizer_bio, host3_name, host4_name, host5_name, audience,"
        " takeaways, activities, max_participants, registration_url, session,"
        " scheduled_date, scheduled_time_utc, scheduled_end_time_utc,"
        " schedule_track"
        " FROM symposium_proposals WHERE is_shortlisted = 1"
        " ORDER BY scheduled_date, scheduled_time_utc, id"
    )
    sessions = d1("SELECT slug, name, date, start_time, end_time, description,"
                  " agenda, running_order_note FROM symposium_sessions")
    wsessions = d1("SELECT proposal_id, seq, date, start_time, end_time, note"
                   " FROM symposium_workshop_sessions ORDER BY proposal_id, seq")
    return proposals, sessions, wsessions


# ── assets ────────────────────────────────────────────────────────────

FONT_QUERY = ("https://fonts.googleapis.com/css?family="
              "Cormorant+Garamond:400,600,700,400italic|DM+Sans:400,500,700")


def font_css():
    """Fetch and cache the brand fonts, returning @font-face CSS."""
    CACHE.mkdir(exist_ok=True)
    src = CACHE / "fonts.css"
    if not src.exists():
        proc = subprocess.run(
            ["curl", "-sL", "-A", "Mozilla/4.0", FONT_QUERY],
            capture_output=True, text=True,
        )
        if proc.returncode != 0 or "@font-face" not in proc.stdout:
            print("! could not fetch brand fonts; falling back to system serif",
                  file=sys.stderr)
            return ""
        src.write_text(proc.stdout)
    css = src.read_text()

    for url in sorted(set(re.findall(r"url\((https://[^)]+\.ttf)\)", css))):
        local = CACHE / url.rsplit("/", 1)[-1]
        if not local.exists():
            subprocess.run(["curl", "-sL", "-o", str(local), url], check=True)
        css = css.replace(url, local.as_uri())
    return css


def cover_art():
    """Local URI for the cover artwork, downloading it once into the cache."""
    CACHE.mkdir(exist_ok=True)
    src = CACHE / COVER_ART_URL.rsplit("/", 1)[-1]
    if not src.exists():
        proc = subprocess.run(["curl", "-sL", "-o", str(src), COVER_ART_URL])
        if proc.returncode != 0 or not src.exists() or src.stat().st_size < 1000:
            print("! could not fetch cover art; cover will be type-only",
                  file=sys.stderr)
            return ""
    # Re-encode as JPEG: WeasyPrint embeds a WebP losslessly and the artwork is
    # high-noise, which pushed the finished PDF past 2.5 MB for one image.
    jpg = src.with_suffix(".jpg")
    if not jpg.exists():
        from PIL import Image
        Image.open(src).convert("RGB").save(
            jpg, "JPEG", quality=85, optimize=True, progressive=True)
    return jpg.as_uri()


# ── formatting helpers ────────────────────────────────────────────────

def esc(value):
    return html.escape(str(value or ""))


def paras(text):
    """Render a text field as paragraphs, preserving blank-line breaks."""
    if not text:
        return ""
    chunks = [c.strip() for c in re.split(r"\n\s*\n", str(text).strip()) if c.strip()]
    return "".join(
        "<p>%s</p>" % esc(c).replace("\n", "<br>") for c in chunks
    )


def hhmm(t):
    return (t or "")[:5]


def time_range(start, end):
    start, end = hhmm(start), hhmm(end)
    if start and end:
        return "%s&ndash;%s" % (start, end)
    return start or "TBA"


def time_stack(iso_date, start, end=None, show_range=True):
    """A UTC time with the four reference timezones stacked beneath it.

    The UTC line carries the full range where an end time is known, since that
    is what gives the duration; the converted lines show start times only, so
    the stack stays narrow enough for a margin column.
    """
    if not start or not iso_date:
        return '<div class="t-utc">time TBA</div>'
    y, m, d = (int(x) for x in iso_date.split("-"))
    hour, minute = (int(x) for x in hhmm(start).split(":"))
    base = datetime(y, m, d, hour, minute, tzinfo=ZoneInfo("UTC"))

    head = time_range(start, end) if (show_range and end) else hhmm(start)
    rows = ['<div class="t-utc">%s UTC</div>' % head]
    for zone, override in ZONES:
        local = base.astimezone(ZoneInfo(zone))
        shift = (local.date() - base.date()).days
        mark = ' <span class="t-day">(%+d)</span>' % shift if shift else ""
        rows.append('<div class="t-zone">%s %s%s</div>'
                    % (local.strftime("%H:%M"), esc(override or local.tzname()), mark))
    return "".join(rows)


def day_label(iso, short=False):
    y, m, d = (int(x) for x in iso.split("-"))
    wd = WEEKDAYS[_date(y, m, d).weekday()]
    month = MONTHS[m - 1]
    if short:
        return "%s %d %s" % (wd[:3], d, month[:3])
    return "%s, %s %d" % (wd, month, d)


def people(p):
    """Every credited name on a proposal, in order, de-duplicated.

    Field values are kept whole. Splitting on commas and ampersands would
    break names that legitimately contain them, e.g. a studio credited as
    "Paragonday Systems (Norm O'Hagan & Yatu Espinosa)".
    """
    names = []
    for field in ("speaker_name", "organizer_name", "co_speakers",
                  "co_organizer_name", "host3_name", "host4_name", "host5_name"):
        value = (p.get(field) or "").strip().rstrip(",;")
        if not value or value.lower() in PLACEHOLDERS:
            continue
        if value.lower() not in {n.lower() for n in names}:
            names.append(value)
    return names


def byline(p):
    names = people(p)
    if not names:
        return ""
    if len(names) == 1:
        return names[0]
    return ", ".join(names[:-1]) + " and " + names[-1]


def kind_label(p):
    return {"interactive": "Interactive session",
            "workshop": "Workshop"}.get(p["type"], "")


# ── schedule assembly ─────────────────────────────────────────────────
#
# TRACK NUMBERING. In D1, schedule_track = 'ii' marks the *general* talks that
# run parallel to a curated special session; the special session's own talks
# carry no track value. The published numbering is the other way round —
# general talks are Track I, the special session is Track II — so the mapping
# is applied here at render time rather than by rewriting the column, because
# the page's pairing logic looks up a special session *through* its 'ii' items
# and flipping the stored values would break that lookup. The website applies
# the same swap in renderParallelBlock().

def is_parallel_general(p):
    """True for a general talk scheduled against a special session (Track I)."""
    return p.get("schedule_track") == "ii"


def build_days(proposals, sessions):
    """Group symposium talks into per-day segments.

    Each day becomes an ordered list of segments: a "single" segment is one
    time slot running one track; a "dual" segment is a contiguous run of slots
    where a special session and a set of general talks run in parallel.
    """
    by_name = {s["name"]: s for s in sessions}
    scheduled, unplaced = [], []
    for p in proposals:
        if p["type"] == "workshop":
            continue
        if p["scheduled_date"] in SYMPOSIUM_DAYS:
            scheduled.append(p)
        elif p["session"] in by_name and by_name[p["session"]]["date"]:
            unplaced.append(p)

    slots_by_day = OrderedDict((iso, OrderedDict()) for iso in SYMPOSIUM_DAYS)

    def slot_for(iso, start):
        if iso not in slots_by_day:
            slots_by_day[iso] = OrderedDict()
        return slots_by_day[iso].setdefault(start, [])

    for p in scheduled:
        slot_for(p["scheduled_date"], hhmm(p["scheduled_time_utc"])).append(p)
    # A talk inside a special session that has no time of its own yet still
    # belongs to that session's block; show it there rather than dropping it.
    for p in unplaced:
        s = by_name[p["session"]]
        slot_for(s["date"], hhmm(s["start_time"])).append(dict(p, _tba=True))

    days = OrderedDict()
    for iso in SYMPOSIUM_DAYS:
        slots = sorted(slots_by_day.get(iso, {}).items())
        segments, run = [], []

        def flush_run():
            if not run:
                return
            track1, track2 = [], []
            for _, items in run:
                for p in items:
                    (track1 if is_parallel_general(p) else track2).append(p)
            key = lambda p: (hhmm(p["scheduled_time_utc"]) or "99:99", p["id"])
            track1.sort(key=key)
            track2.sort(key=key)
            ends = [hhmm(p["scheduled_end_time_utc"]) for p in track1 + track2
                    if p["scheduled_end_time_utc"]]
            session = next((by_name[p["session"]] for p in track2
                            if p["session"] in by_name), None)
            segments.append({
                "kind": "dual",
                "start": run[0][0],
                "end": max(ends) if ends else "",
                "session": session,
                "track1": track1,
                "track2": track2,
            })
            run.clear()

        for start, items in slots:
            if any(is_parallel_general(p) for p in items):
                run.append((start, items))
                continue
            flush_run()
            segments.append({"kind": "single", "start": start, "items": items})
        flush_run()
        days[iso] = segments
    return days, unplaced


def talk_count(days):
    total = 0
    for segments in days.values():
        for seg in segments:
            total += (len(seg["items"]) if seg["kind"] == "single"
                      else len(seg["track1"]) + len(seg["track2"]))
    return total


# ── HTML rendering ────────────────────────────────────────────────────

def render_cover(art_uri):
    art = ('<div class="cover-art"><img src="%s" alt=""></div>' % art_uri
           if art_uri else "")
    return """
<section class="cover">
  %s
  <div class="cover-text">
    <p class="cover-org">Protocol Institute</p>
    <h1 class="cover-title">Programme</h1>
    <p class="cover-sub">Workshops, talks and special sessions</p>
    <div class="cover-rule"></div>
    <p class="cover-foot">All times are UTC, with local conversions
       &middot; protocol-institute.org</p>
  </div>
</section>
""" % art


def render_note(days, workshops):
    dual_days = [iso for iso, segs in days.items()
                 if any(s["kind"] == "dual" for s in segs)]
    dual_note = ""
    if dual_days:
        dual_note = (
            "<p>On %s part of the programme runs on <strong>two parallel "
            "tracks</strong>. Track&nbsp;I carries general talks; "
            "Track&nbsp;II is the curated special session of that block. In "
            "the full programme each track is printed as a continuous run, "
            "with a page reference at the top of each so you can jump to the "
            "other one.</p>"
            % " and ".join(day_label(iso) for iso in dual_days)
        )
    return """
<section class="note">
  <h2>About this programme</h2>
  <p>The Protocol Symposium 2026 runs online over five days: two days of
     hands-on pre-symposium workshops (%(wdays)s), followed by three days of
     talks, panels and special sessions (%(sdays)s).</p>
  <p>This programme covers <strong>%(nw)d workshops</strong> and
     <strong>%(nt)d talks and sessions</strong>. It is generated from the live
     schedule; the authoritative and most current version is always the one on
     the web at <span class="url">protocol-institute.org/events/protocol-symposium-2026</span>.</p>
  %(dual)s
  <p class="tz"><strong>Times are given in UTC first</strong>, with
     Central European, Malaysia, US Pacific and US Eastern times stacked
     beneath. A <strong>(+1)</strong> or <strong>(&minus;1)</strong> marks a
     conversion that lands on the next or previous day.</p>
</section>
""" % {
        "wdays": " and ".join(day_label(d) for d in WORKSHOP_DAYS),
        "sdays": ", ".join(day_label(d) for d in SYMPOSIUM_DAYS[:-1])
                 + " and " + day_label(SYMPOSIUM_DAYS[-1]),
        "nw": len(workshops),
        "nt": talk_count(days),
        "dual": dual_note,
    }


def glance_item(p):
    tba = ' <span class="tba">time TBA</span>' if p.get("_tba") else ""
    return ('<div class="g-item"><span class="g-title">%s</span>%s'
            '<span class="g-by">%s</span></div>'
            % (esc(p["title"]), tba, esc(byline(p))))


def render_glance(days):
    out = ['<section class="glance"><h2 class="section-head">'
           'Programme at a glance</h2>']
    for iso, segments in days.items():
        if not segments:
            continue
        out.append('<div class="glance-day">')
        out.append('<h3 class="day-head">%s</h3>' % esc(day_label(iso)))
        out.append('<table class="glance-table"><tbody>')
        for seg in segments:
            if seg["kind"] == "single":
                out.append(
                    '<tr><td class="c-time">%s</td><td colspan="2">%s</td></tr>'
                    % (time_stack(iso, seg["start"], show_range=False),
                       "".join(glance_item(p) for p in seg["items"]))
                )
                continue

            out.append('<tr class="dual-head"><td class="c-time">%s&ndash;%s'
                       '</td><th>Track I</th><th>Track II%s</th></tr>'
                       % (esc(seg["start"]), esc(seg["end"]),
                          (' &middot; ' + esc(seg["session"]["name"]))
                          if seg["session"] else ""))
            starts = sorted({hhmm(p["scheduled_time_utc"])
                             for p in seg["track1"] + seg["track2"]
                             if p["scheduled_time_utc"]})
            for start in starts:
                pick = lambda items: "".join(
                    glance_item(p) for p in items
                    if hhmm(p["scheduled_time_utc"]) == start)
                one, two = pick(seg["track1"]), pick(seg["track2"])
                out.append('<tr><td class="c-time">%s</td><td>%s</td>'
                           '<td>%s</td></tr>'
                           % (time_stack(iso, start, show_range=False),
                              one or '<span class="empty">&mdash;</span>',
                              two or '<span class="empty">&mdash;</span>'))
            out.append('<tr class="dual-end"><td colspan="3">'
                       'End two-track portion</td></tr>')
        out.append("</tbody></table></div>")
    out.append("</section>")
    return "".join(out)


def render_entry(iso, p):
    label = kind_label(p)
    return """
<article class="entry">
  <div class="entry-when">%s</div>
  <div class="entry-body">
    <div class="entry-head">
      <h4 class="entry-title">%s</h4>
      <p class="entry-by">%s</p>
      %s
    </div>
    %s
  </div>
</article>
""" % (
        ('<div class="t-utc">time TBA</div>' if p.get("_tba")
         else time_stack(iso, p["scheduled_time_utc"], p["scheduled_end_time_utc"])),
        esc(p["title"]),
        esc(byline(p)) or "&nbsp;",
        ('<p class="entry-meta"><span class="kind">%s</span></p>' % esc(label))
        if label else "",
        paras(p["abstract"]),
    )


def render_session_banner(s):
    if not s:
        return ""
    return ('<div class="session-banner">'
            '<p class="session-kicker">Special session &middot; %s&ndash;%s UTC</p>'
            '<h4 class="session-name">%s</h4>%s%s%s</div>'
            % (esc(hhmm(s["start_time"])), esc(hhmm(s["end_time"])),
               esc(s["name"]), paras(s["description"]),
               ('<p class="session-agenda">%s</p>' % esc(s["agenda"]))
               if s["agenda"] and s["agenda"] != "TBD" else "",
               ('<p class="session-order-note">%s</p>'
                % esc(s["running_order_note"]))
               if s.get("running_order_note") else ""))


def render_program(days):
    out = ['<section class="program"><h2 class="section-head">'
           'The programme</h2>']
    for iso, segments in days.items():
        if not segments:
            continue
        out.append('<div class="program-day">')
        out.append('<h3 class="day-head day-head--major">%s</h3>'
                   % esc(day_label(iso)))
        for seg in segments:
            if seg["kind"] == "single":
                for p in seg["items"]:
                    out.append(render_entry(iso, p))
                continue

            one_id, two_id = "t1-%s" % iso, "t2-%s" % iso
            out.append('<p class="dual-open">Two parallel tracks &middot; '
                       '%s&ndash;%s UTC</p>' % (esc(seg["start"]), esc(seg["end"])))

            out.append('<h4 class="track-head" id="%s">Track I</h4>' % one_id)
            out.append('<p class="xref"><a href="#%s">For Track II, skip to '
                       'page </a></p>' % two_id)
            for p in seg["track1"]:
                out.append(render_entry(iso, p))

            out.append('<h4 class="track-head" id="%s">Track II%s</h4>'
                       % (two_id, (' &middot; ' + esc(seg["session"]["name"]))
                          if seg["session"] else ""))
            out.append('<p class="xref"><a href="#%s">For Track I, skip to '
                       'page </a></p>' % one_id)
            out.append(render_session_banner(seg["session"]))
            for p in seg["track2"]:
                out.append(render_entry(iso, p))

            out.append('<p class="track-end">End two-track portion.</p>')
        out.append("</div>")
    out.append("</section>")
    return "".join(out)


def render_workshops(workshops, wsessions):
    by_proposal = {}
    for row in wsessions:
        by_proposal.setdefault(row["proposal_id"], []).append(row)

    out = ['<section class="workshops"><h2 class="section-head">'
           'Pre-symposium workshops</h2>',
           '<p class="section-intro">Hands-on workshops run across %s, ahead of '
           'the main programme. Each meets more than once; sessions repeat or '
           'build on one another as noted. Places may be limited &mdash; check '
           'the web programme to register.</p>'
           % " and ".join(day_label(d) for d in WORKSHOP_DAYS)]

    for p in workshops:
        rows = by_proposal.get(p["id"], [])
        grid = ""
        if rows:
            grid = ('<table class="ws-table"><tbody>'
                    + "".join(
                        '<tr><td class="c-seq">Session %d%s</td>'
                        '<td class="c-wtime">%s</td></tr>'
                        % (r["seq"],
                           (' <span class="ws-note">%s</span>' % esc(r["note"]))
                           if r["note"] else "",
                           time_stack(r["date"], r["start_time"], r["end_time"]))
                        for r in rows)
                    + "</tbody></table>")

        # audience / takeaways / activities are raw proposal-form answers —
        # long, and partly internal (selection criteria, application handling).
        # The brochure carries the workshop's content and its schedule; the web
        # programme remains the place for the full submitted detail.
        facts_html = (
            '<div class="fact"><dt>Capacity</dt><dd>%s</dd></div>'
            % esc(p["max_participants"])) if p["max_participants"] else ""

        bios = "".join(
            '<p class="bio">%s</p>' % esc(b) for b in
            (p["organizer_bio"], p["co_organizer_bio"]) if b)

        out.append("""
<article class="workshop">
  <div class="ws-head">
    <h3 class="ws-title">%s</h3>
    <p class="ws-by">%s</p>
  </div>
  %s
  <div class="ws-abstract">%s</div>
  %s
  %s
</article>
""" % (
            esc(p["title"]), esc(byline(p)), grid, paras(p["abstract"]),
            ('<dl class="facts">%s</dl>' % facts_html) if facts_html else "",
            ('<div class="bios"><p class="bios-head">Hosts</p>%s</div>' % bios)
            if bios else "",
        ))
    out.append("</section>")
    return "".join(out)


def stylesheet(page_size):
    return """
@page {
  size: %(size)s;
  margin: 20mm 18mm 18mm;
  @bottom-center {
    content: counter(page);
    font-family: 'DM Sans', sans-serif; font-size: 8.5pt; color: %(muted)s;
  }
}
@page :first { margin: 0; @bottom-center { content: none; } }

html { font-family: 'DM Sans', 'Helvetica Neue', sans-serif;
       font-size: 9.6pt; line-height: 1.5; color: %(ink)s; }
p { margin: 0 0 0.55em; orphans: 2; widows: 2; }
strong { font-weight: 700; }
.url { font-variant: all-small-caps; letter-spacing: 0.03em; color: %(teal)s; }

/* ── cover ── */
.cover { page: cover; height: 297mm; box-sizing: border-box;
  background: %(cream)s; display: flex; flex-direction: column; }
.cover-art img { display: block; width: 100%%; }
.cover-text { flex: 1 1 auto; display: flex; flex-direction: column;
  justify-content: center; padding: 0 22mm; }
.cover-org { font-size: 10pt; letter-spacing: 0.22em; text-transform: uppercase;
  color: %(teal)s; margin: 0 0 6mm; }
.cover-title { font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 42pt; font-weight: 600; line-height: 1; margin: 0 0 4mm;
  letter-spacing: -0.01em; }
.cover-sub { font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 15pt; color: #555; margin: 0 0 8mm; }
.cover-rule { border-top: 2pt solid %(teal)s; margin: 0 0 4mm; width: 40mm; }
.cover-foot { font-size: 8.6pt; color: %(muted)s; margin: 0;
  letter-spacing: 0.03em; }

/* ── section furniture ── */
.note, .glance, .workshops, .program { break-before: page; }
.section-head { font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 24pt; font-weight: 600; color: %(ink)s;
  margin: 0 0 4mm; padding-bottom: 2.5mm; border-bottom: 2pt solid %(teal)s; }
.section-intro { color: #555; margin-bottom: 6mm; }
.note h2 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22pt;
  font-weight: 600; margin: 0 0 4mm; }
.note p { max-width: 150mm; }
.note .tz { margin-top: 5mm; padding: 3mm 4mm; background: %(cream)s;
  border-left: 2.5pt solid %(teal)s; }

.day-head { font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 15pt; font-weight: 600; color: %(teal)s;
  margin: 6mm 0 2.5mm; break-after: avoid; }
.day-head--major { font-size: 19pt; color: %(ink)s;
  border-bottom: 1pt solid %(rule)s; padding-bottom: 1.5mm;
  margin: 9mm 0 4mm; }
.program-day:first-of-type .day-head--major,
.glance-day:first-of-type .day-head { margin-top: 2mm; }

/* ── time stacks ── */
.t-utc { font-size: 8.4pt; font-weight: 700; color: %(teal)s;
  font-variant-numeric: tabular-nums; white-space: nowrap; }
.t-zone { font-size: 7.2pt; color: %(muted)s; line-height: 1.45;
  font-variant-numeric: tabular-nums; white-space: nowrap; }
.t-day { color: %(teal)s; }

/* ── at a glance ── */
.glance-table, .ws-table { width: 100%%; border-collapse: collapse;
  font-size: 8.8pt; }
.glance-table td, .glance-table th, .ws-table td { vertical-align: top;
  padding: 2.5mm 3mm 2.5mm 0; border-bottom: 0.5pt solid #EFEDE9;
  text-align: left; }
.glance-table tr, .ws-table tr { break-inside: avoid; }
.c-time { white-space: nowrap; width: 27mm; }
.c-seq { width: 30mm; color: %(muted)s; }
.c-wtime { width: 30mm; }
.g-item + .g-item { margin-top: 2mm; padding-top: 2mm;
  border-top: 0.5pt dotted %(rule)s; }
.g-title { display: block; font-weight: 500; }
.g-by { display: block; color: %(muted)s; font-size: 8.2pt; }
.empty { color: %(rule)s; }
.tba { font-size: 7.5pt; color: %(teal)s; letter-spacing: 0.06em; }
.glance-table .dual-head th { font-size: 7.6pt; letter-spacing: 0.1em;
  text-transform: uppercase; color: %(teal)s; font-weight: 500;
  border-bottom: 1pt solid %(teal)s; padding-top: 4mm; }
.glance-table .dual-head .c-time { font-size: 8pt; font-weight: 700;
  color: %(teal)s; border-bottom: 1pt solid %(teal)s; padding-top: 4mm; }
.glance-table .dual-end td { font-size: 7.4pt; letter-spacing: 0.1em;
  text-transform: uppercase; color: %(muted)s; border-bottom: 1pt solid %(teal)s; }

/* ── programme entries ── */
.entry { padding: 3mm 0 3mm 31mm; position: relative;
  border-bottom: 0.5pt solid #EFEDE9; }
.entry-when { position: absolute; left: 0; width: 28mm; padding-top: 0.8mm; }
/* Keep a title with at least the start of what follows it: the head block is
   never split, and never left stranded at the foot of a page. */
.entry-head { break-inside: avoid; break-after: avoid; }
.entry-title { font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 13.5pt; font-weight: 600; line-height: 1.22; margin: 0 0 1mm; }
.entry-by { font-size: 9pt; color: %(muted)s; margin: 0 0 1.5mm; }
.entry-meta { margin: 0 0 1.5mm; }
.entry-body > p:first-of-type { orphans: 3; }
.kind { font-size: 7.4pt; letter-spacing: 0.1em; text-transform: uppercase;
  color: %(muted)s; border: 0.5pt solid %(rule)s; border-radius: 1mm;
  padding: 0.4mm 1.4mm; }

/* ── two-track apparatus ── */
.dual-open { margin: 7mm 0 0; font-size: 7.8pt; letter-spacing: 0.12em;
  text-transform: uppercase; color: %(muted)s; break-after: avoid; }
.track-head { font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 16pt; font-weight: 600; color: %(teal)s; margin: 1mm 0 1mm;
  break-after: avoid; }
.xref { margin: 0 0 3mm; font-size: 8.4pt; break-after: avoid; }
.xref a { color: %(teal)s; text-decoration: none;
  border-bottom: 0.5pt dotted %(teal)s; }
.xref a::after { content: target-counter(attr(href), page); }
.track-end { margin: 4mm 0 7mm; padding-top: 2mm;
  border-top: 1pt solid %(teal)s; font-size: 7.8pt; letter-spacing: 0.12em;
  text-transform: uppercase; color: %(muted)s; }

.session-banner { break-inside: avoid; background: %(cream)s;
  border-left: 2.5pt solid %(teal)s; padding: 3.5mm 4mm; margin: 0 0 3mm; }
.session-kicker { font-size: 7.6pt; letter-spacing: 0.12em;
  text-transform: uppercase; color: %(teal)s; margin: 0 0 1mm; }
.session-name { font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 15pt; font-weight: 600; margin: 0 0 1.5mm; }
.session-banner p { font-size: 9pt; }
.session-agenda { color: %(muted)s; font-style: italic; margin: 0; }
.session-order-note { margin: 2.5mm 0 0; padding-top: 2mm;
  border-top: 0.5pt dotted %(teal)s; font-size: 8.4pt; color: %(teal)s; }

/* ── workshops ── */
/* Each workshop opens on a fresh right-hand page. */
.workshop { break-before: right; padding: 0 0 5mm; }
.ws-head { break-inside: avoid; break-after: avoid; }
.ws-title { font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 18pt; font-weight: 600; margin: 0 0 1mm; line-height: 1.2; }
.ws-by { font-size: 9.2pt; color: %(muted)s; margin: 0; }
.ws-table { margin: 4mm 0 4mm; width: 68mm; }
.ws-note { font-size: 7.4pt; color: %(teal)s; text-transform: uppercase;
  letter-spacing: 0.08em; }
.facts { margin: 3mm 0 0; padding: 3mm 0 0; border-top: 0.5pt dotted %(rule)s; }
.fact { margin: 0 0 1.5mm; break-inside: avoid; }
.fact dt { font-size: 7.6pt; letter-spacing: 0.1em; text-transform: uppercase;
  color: %(muted)s; margin: 0; }
.fact dd { margin: 0; font-size: 9pt; }
.bios { margin: 3mm 0 0; break-inside: avoid; }
.bios-head { font-size: 7.6pt; letter-spacing: 0.1em; text-transform: uppercase;
  color: %(muted)s; margin: 0 0 1mm; break-after: avoid; }
.bio { font-size: 8.8pt; color: #555; }
""" % {"size": page_size, "ink": INK, "teal": TEAL, "muted": MUTED,
       "rule": RULE, "cream": CREAM}


def build_html(page_size):
    proposals, sessions, wsessions = load()
    workshops = [p for p in proposals if p["type"] == "workshop"]
    days, unplaced = build_days(proposals, sessions)

    doc = """<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Protocol Symposium 2026 &mdash; Programme</title>
<style>%s</style><style>%s</style></head><body>
%s%s%s%s%s
</body></html>""" % (
        font_css(), stylesheet(page_size),
        render_cover(cover_art()),
        render_note(days, workshops),
        render_glance(days),
        render_workshops(workshops, wsessions),
        render_program(days),
    )
    return doc, days, workshops, unplaced


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("-o", "--out", default=str(DEFAULT_OUT))
    ap.add_argument("--page-size", default="A4", choices=["A4", "letter"],
                    help="page size (default: A4)")
    ap.add_argument("--html-only", action="store_true",
                    help="write the intermediate HTML and stop")
    args = ap.parse_args()

    print("Reading schedule from D1 ...")
    doc, days, workshops, unplaced = build_html(args.page_size)

    html_path = pathlib.Path(args.out).with_suffix(".html")
    html_path.write_text(doc)

    print("  %d workshops, %d talks/sessions across %d days"
          % (len(workshops), talk_count(days),
             len([d for d in days.values() if d])))
    for iso, segments in days.items():
        for seg in segments:
            if seg["kind"] == "dual":
                print("  two-track %s %s-%s: Track I %d talks, Track II %d (%s)"
                      % (iso, seg["start"], seg["end"], len(seg["track1"]),
                         len(seg["track2"]),
                         seg["session"]["name"] if seg["session"] else "?"))
    if unplaced:
        print("  ! %d talk(s) have no individual time yet and print as "
              "'time TBA':" % len(unplaced))
        for p in unplaced:
            print("      [%s] %s - %s" % (p["session"], p["title"], byline(p)))

    if args.html_only:
        print("Wrote %s" % html_path)
        return

    from weasyprint import HTML
    HTML(string=doc, base_url=str(ROOT)).write_pdf(args.out)
    print("Wrote %s (%.0f KB)" % (args.out, os.path.getsize(args.out) / 1024))


if __name__ == "__main__":
    main()
