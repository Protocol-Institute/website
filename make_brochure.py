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
from datetime import date as _date

DB = "pi-members"
ROOT = pathlib.Path(__file__).resolve().parent
CACHE = ROOT / ".brochure-cache"
DEFAULT_OUT = ROOT / "symposium-2026-program.pdf"

INK = "#1A1A1A"
TEAL = "#2A6B6B"
MUTED = "#8A8A8A"
RULE = "#E0DDD8"
CREAM = "#FAFAF7"

SYMPOSIUM_DAYS = ["2026-09-23", "2026-09-24", "2026-09-25"]
WORKSHOP_DAYS = ["2026-09-21", "2026-09-22"]

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


# ── fonts ─────────────────────────────────────────────────────────────

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

def build_days(proposals, sessions):
    """Group the symposium talks into per-day, per-time-slot blocks.

    A handful of talks belong to a curated special session that has its own
    date and time but whose individual talks have not been given times yet;
    those are attached to their session's slot and shown as TBA, so the
    brochure stays correct before and after those times are assigned.
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

    days = OrderedDict()
    for iso in SYMPOSIUM_DAYS:
        days[iso] = OrderedDict()

    def slot_for(iso, start):
        if iso not in days:
            days[iso] = OrderedDict()
        return days[iso].setdefault(start, {"i": [], "ii": []})

    for p in scheduled:
        slot = slot_for(p["scheduled_date"], hhmm(p["scheduled_time_utc"]))
        slot["ii" if p["schedule_track"] == "ii" else "i"].append(p)

    for p in unplaced:
        s = by_name[p["session"]]
        slot = slot_for(s["date"], hhmm(s["start_time"]))
        p = dict(p, _tba=True)
        slot["i"].append(p)

    for iso in list(days):
        days[iso] = OrderedDict(sorted(days[iso].items()))
    return days, unplaced


def session_banner_points(days, sessions):
    """First (date, slot) at which each special session appears."""
    by_name = {s["name"]: s for s in sessions}
    seen, points = set(), {}
    for iso, slots in days.items():
        for start, slot in slots.items():
            for p in slot["i"] + slot["ii"]:
                name = p["session"]
                if name in by_name and name not in seen:
                    seen.add(name)
                    points[(iso, start)] = by_name[name]
    return points


# ── HTML rendering ────────────────────────────────────────────────────

def render_cover():
    return """
<section class="cover">
  <div class="cover-rule"></div>
  <p class="cover-org">Protocol Institute</p>
  <h1 class="cover-title">Protocol&nbsp;Symposium<br>2026</h1>
  <p class="cover-dates">21&ndash;25 September 2026 &middot; Online</p>
  <p class="cover-sub">Programme of workshops, talks and special sessions</p>
  <div class="cover-rule"></div>
  <p class="cover-foot">All times are UTC &middot; protocol-institute.org</p>
</section>
"""


def render_note(days, workshops):
    talks = sum(len(s["i"]) + len(s["ii"]) for d in days.values() for s in d.values())
    two_track = [iso for iso, slots in days.items()
                 if any(s["ii"] for s in slots.values())]
    two_track_note = ""
    if two_track:
        two_track_note = (
            "<p>On %s the programme runs on <strong>two parallel tracks</strong>. "
            "Track&nbsp;I carries the curated special session of that block; "
            "Track&nbsp;II runs general talks alongside it. Both are listed "
            "against the same time slot throughout.</p>"
            % " and ".join(day_label(iso) for iso in two_track)
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
  %(two)s
  <p class="tz"><strong>All times in this programme are UTC.</strong> Convert to
     your own timezone before planning your day &mdash; the web programme shows
     local times automatically.</p>
</section>
""" % {
        "wdays": " and ".join(day_label(d) for d in WORKSHOP_DAYS),
        "sdays": ", ".join(day_label(d) for d in SYMPOSIUM_DAYS[:-1])
                 + " and " + day_label(SYMPOSIUM_DAYS[-1]),
        "nw": len(workshops),
        "nt": talks,
        "two": two_track_note,
    }


def render_glance(days):
    out = ['<section class="glance"><h2 class="section-head">Programme at a glance</h2>']
    for iso, slots in days.items():
        if not slots:
            continue
        two_track = any(slot["ii"] for slot in slots.values())
        out.append('<div class="glance-day">')
        out.append('<h3 class="day-head">%s</h3>' % esc(day_label(iso)))
        out.append('<table class="glance-table">')
        if two_track:
            out.append('<thead><tr><th class="c-time">UTC</th>'
                       '<th>Track I</th><th>Track II</th></tr></thead>')
        out.append("<tbody>")
        for start, slot in slots.items():
            def cell(items):
                if not items:
                    return '<td class="empty">&mdash;</td>'
                bits = []
                for p in items:
                    tba = ' <span class="tba">time TBA</span>' if p.get("_tba") else ""
                    bits.append(
                        '<div class="g-item"><span class="g-title">%s</span>%s'
                        '<span class="g-by">%s</span></div>'
                        % (esc(p["title"]), tba, esc(byline(p)))
                    )
                return "<td>" + "".join(bits) + "</td>"

            out.append('<tr><td class="c-time">%s</td>%s%s</tr>' % (
                esc(start), cell(slot["i"]),
                cell(slot["ii"]) if two_track else "",
            ))
        out.append("</tbody></table></div>")
    out.append("</section>")
    return "".join(out)


def render_entry(p, track=None):
    meta = []
    if track:
        meta.append('<span class="track-tag">%s</span>' % esc(track))
    label = kind_label(p)
    if label:
        meta.append('<span class="kind">%s</span>' % esc(label))
    when = ("time TBA" if p.get("_tba")
            else time_range(p["scheduled_time_utc"], p["scheduled_end_time_utc"]))
    return """
<article class="entry">
  <div class="entry-when">%s</div>
  <div class="entry-body">
    <h4 class="entry-title">%s</h4>
    <p class="entry-by">%s</p>
    %s
    %s
  </div>
</article>
""" % (
        when,
        esc(p["title"]),
        esc(byline(p)) or "&nbsp;",
        ('<p class="entry-meta">%s</p>' % " ".join(meta)) if meta else "",
        paras(p["abstract"]),
    )


def render_program(days, sessions):
    banners = session_banner_points(days, sessions)
    out = ['<section class="program"><h2 class="section-head">The programme</h2>']
    for iso, slots in days.items():
        if not slots:
            continue
        out.append('<div class="program-day">')
        out.append('<h3 class="day-head day-head--major">%s</h3>' % esc(day_label(iso)))
        for start, slot in slots.items():
            s = banners.get((iso, start))
            if s:
                out.append(
                    '<div class="session-banner">'
                    '<p class="session-kicker">Special session &middot; %s&ndash;%s UTC</p>'
                    '<h4 class="session-name">%s</h4>%s%s%s</div>'
                    % (esc(hhmm(s["start_time"])), esc(hhmm(s["end_time"])),
                       esc(s["name"]), paras(s["description"]),
                       ('<p class="session-agenda">%s</p>' % esc(s["agenda"]))
                       if s["agenda"] and s["agenda"] != "TBD" else "",
                       ('<p class="session-order-note">%s</p>'
                        % esc(s["running_order_note"]))
                       if s.get("running_order_note") else "")
                )
            two_track = bool(slot["ii"])
            for p in slot["i"]:
                out.append(render_entry(p, "Track I" if two_track else None))
            for p in slot["ii"]:
                out.append(render_entry(p, "Track II"))
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
            grid = ('<table class="ws-table"><thead><tr><th>Session</th>'
                    '<th>Date</th><th>Time (UTC)</th></tr></thead><tbody>'
                    + "".join(
                        '<tr><td class="c-seq">%d%s</td><td>%s</td><td>%s</td></tr>'
                        % (r["seq"],
                           (' <span class="ws-note">%s</span>' % esc(r["note"]))
                           if r["note"] else "",
                           esc(day_label(r["date"], short=True)),
                           time_range(r["start_time"], r["end_time"]))
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
  <h3 class="ws-title">%s</h3>
  <p class="ws-by">%s</p>
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
.cover {
  page: cover; height: 297mm; box-sizing: border-box;
  padding: 38mm 22mm; background: %(cream)s;
  display: flex; flex-direction: column; justify-content: center;
}
.cover-rule { border-top: 2.5pt solid %(teal)s; margin: 0 0 8mm; }
.cover-rule + .cover-rule, .cover-rule:last-of-type { margin: 8mm 0 6mm; }
.cover-org { font-family: 'DM Sans', sans-serif; font-size: 11pt;
  letter-spacing: 0.22em; text-transform: uppercase; color: %(teal)s;
  margin: 0 0 14mm; }
.cover-title { font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 46pt; font-weight: 600; line-height: 1.05; margin: 0 0 9mm;
  letter-spacing: -0.01em; }
.cover-dates { font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 17pt; color: %(ink)s; margin: 0 0 2mm; }
.cover-sub { font-size: 10.5pt; color: %(muted)s; margin: 0; }
.cover-foot { font-size: 9pt; color: %(muted)s; margin: 0;
  letter-spacing: 0.04em; }

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

/* ── at a glance ── */
.glance-table, .ws-table { width: 100%%; border-collapse: collapse;
  font-size: 8.8pt; }
.glance-table th, .ws-table th { text-align: left; font-weight: 500;
  font-size: 7.6pt; letter-spacing: 0.1em; text-transform: uppercase;
  color: %(muted)s; border-bottom: 1pt solid %(rule)s;
  padding: 0 3mm 1.5mm 0; }
.glance-table td, .ws-table td { vertical-align: top;
  padding: 2mm 3mm 2mm 0; border-bottom: 0.5pt solid #EFEDE9; }
.glance-table tr, .ws-table tr { break-inside: avoid; }
.c-time { white-space: nowrap; font-variant-numeric: tabular-nums;
  color: %(teal)s; font-weight: 500; width: 16mm; }
.c-seq { width: 22mm; color: %(muted)s; }
.g-item + .g-item { margin-top: 2mm; padding-top: 2mm;
  border-top: 0.5pt dotted %(rule)s; }
.g-title { display: block; font-weight: 500; }
.g-by { display: block; color: %(muted)s; font-size: 8.2pt; }
.empty { color: %(rule)s; }
.tba { font-size: 7.5pt; color: %(teal)s; letter-spacing: 0.06em; }

/* ── programme entries ── */
.entry { padding: 3mm 0 3mm 28mm; position: relative;
  border-bottom: 0.5pt solid #EFEDE9; }
.entry-when { position: absolute; left: 0; width: 24mm; font-size: 8.6pt;
  color: %(teal)s; font-weight: 500; font-variant-numeric: tabular-nums;
  padding-top: 0.6mm; }
.entry-body { }
.entry-title { font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 13.5pt; font-weight: 600; line-height: 1.22; margin: 0 0 1mm;
  break-after: avoid; }
.entry-by { font-size: 9pt; color: %(muted)s; margin: 0 0 1.5mm;
  break-after: avoid; }
.entry-meta { margin: 0 0 1.5mm; }
.track-tag, .kind { font-size: 7.4pt; letter-spacing: 0.1em;
  text-transform: uppercase; color: %(teal)s; border: 0.5pt solid %(teal)s;
  border-radius: 1mm; padding: 0.4mm 1.4mm; }
.kind { color: %(muted)s; border-color: %(rule)s; }

.session-banner { break-inside: avoid; background: %(cream)s;
  border-left: 2.5pt solid %(teal)s; padding: 3.5mm 4mm; margin: 6mm 0 3mm; }
.session-kicker { font-size: 7.6pt; letter-spacing: 0.12em;
  text-transform: uppercase; color: %(teal)s; margin: 0 0 1mm; }
.session-name { font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 15pt; font-weight: 600; margin: 0 0 1.5mm; }
.session-banner p { font-size: 9pt; }
.session-agenda { color: %(muted)s; font-style: italic; margin: 0; }
.session-order-note { margin: 2.5mm 0 0; padding-top: 2mm;
  border-top: 0.5pt dotted %(teal)s; font-size: 8.4pt; color: %(teal)s; }

/* ── workshops ── */
/* Workshop entries are routinely taller than a page, so they must be allowed
   to break; only the small units inside them are kept whole. */
.workshop { padding: 0 0 5mm; margin: 0 0 6mm;
  border-bottom: 0.5pt solid %(rule)s; }
.ws-title { font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 16pt; font-weight: 600; margin: 0 0 1mm; line-height: 1.2;
  break-after: avoid; }
.ws-by { font-size: 9.2pt; color: %(muted)s; margin: 0 0 3mm;
  break-after: avoid; }
.ws-table { margin: 0 0 3.5mm; width: 78mm; }
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
        render_cover(),
        render_note(days, workshops),
        render_glance(days),
        render_workshops(workshops, wsessions),
        render_program(days, sessions),
    )
    return doc, days, workshops, unplaced


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("-o", "--out", default=str(DEFAULT_OUT))
    ap.add_argument("--page-size", default="A4",
                    choices=["A4", "letter"],
                    help="page size (default: A4)")
    ap.add_argument("--html-only", action="store_true",
                    help="write the intermediate HTML and stop")
    args = ap.parse_args()

    print("Reading schedule from D1 ...")
    doc, days, workshops, unplaced = build_html(args.page_size)

    html_path = pathlib.Path(args.out).with_suffix(".html")
    html_path.write_text(doc)

    talks = sum(len(s["i"]) + len(s["ii"]) for d in days.values() for s in d.values())
    print("  %d workshops, %d talks/sessions across %d days"
          % (len(workshops), talks, len([d for d in days.values() if d])))
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
    size_kb = os.path.getsize(args.out) / 1024
    print("Wrote %s (%.0f KB)" % (args.out, size_kb))


if __name__ == "__main__":
    main()
