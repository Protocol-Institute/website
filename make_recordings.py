#!/opt/homebrew/bin/python3
"""Generate the Protocol Symposium 2026 recording pages.

One static page per recorded program item, at
/events/protocol-symposium-2026/recordings/<slug>/, carrying the embedded
video, the item's description and a transcript built from YouTube's
auto-generated captions.

Inputs:
  data/symposium-2026-recordings.json   which video holds which item (hand-edited)
  D1 symposium_proposals                titles, speakers, abstracts, schedule
  YouTube auto-captions (en-orig)       fetched with yt-dlp, cached locally

The transcript is cleaned mechanically only: caption events are joined into
sentences and grouped into timestamped paragraphs, breaking where the captions
mark a change of speaker (">>") or roughly once a minute at a sentence end. The
wording is YouTube's, unedited — the page says so.

    /opt/homebrew/bin/python3 make_recordings.py            # all recordings
    /opt/homebrew/bin/python3 make_recordings.py 99 76      # just these proposal ids
    /opt/homebrew/bin/python3 make_recordings.py --refetch  # ignore the caption cache

The generated pages are committed. Re-run after adding a row to the mapping
file, or after a title/abstract change in D1 that should reach the archive.
Captions are cached in .recordings-cache/ (gitignored); YouTube rate-limits
caption downloads, so a run that hits HTTP 429 writes the page without a
transcript and says so — re-run later and it fills in.
"""

import html
import json
import re
import subprocess
import sys
import time
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DB = "pi-members"
MAPPING = ROOT / "data" / "symposium-2026-recordings.json"
OUT_DIR = ROOT / "events" / "protocol-symposium-2026" / "recordings"
CACHE = ROOT / ".recordings-cache"
PROGRAM_URL = "/events/protocol-symposium-2026/"

# Paragraph shaping. A paragraph closes at the first sentence end after it has
# run PARA_SECONDS, or at a speaker change, or after a silence of GAP_SECONDS.
PARA_SECONDS = 60
GAP_SECONDS = 4


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


def load_proposals(ids):
    rows = d1(
        "SELECT id, type, slug, title, abstract, speaker_name, co_speakers,"
        " organizer_name, co_organizer_name, session, scheduled_date,"
        " scheduled_time_utc, scheduled_end_time_utc"
        " FROM symposium_proposals WHERE id IN (%s)" % ",".join(str(int(i)) for i in ids)
    )
    return {r["id"]: r for r in rows}


# ── Captions ──────────────────────────────────────────────────────────

def caption_file(video_id):
    return CACHE / f"{video_id}.en-orig.json3"


def fetch_captions(video_id, refetch=False):
    """Download YouTube's auto-generated English captions. Returns a path or None."""
    path = caption_file(video_id)
    if path.exists() and not refetch:
        return path
    CACHE.mkdir(exist_ok=True)
    for attempt in range(3):
        subprocess.run(
            ["yt-dlp", "--skip-download", "--write-auto-subs",
             "--sub-langs", "en-orig", "--sub-format", "json3",
             "-o", str(CACHE / "%(id)s.%(ext)s"),
             f"https://www.youtube.com/watch?v={video_id}"],
            capture_output=True, text=True,
        )
        if path.exists():
            return path
        time.sleep(20 * (attempt + 1))  # 429s clear after a short wait
    return None


def words(path):
    """Yield (ms, word) for every captioned word, in time order."""
    events = json.loads(path.read_text())["events"]
    for ev in events:
        base = ev.get("tStartMs", 0)
        for seg in ev.get("segs", []):
            text = seg.get("utf8", "")
            if not text.strip():
                continue
            yield base + seg.get("tOffsetMs", 0), text.strip()


def paragraphs(path, start=0, end=None):
    """Group caption words in [start, end) seconds into timestamped paragraphs."""
    lo, hi = start * 1000, (end * 1000 if end is not None else float("inf"))
    paras, cur, cur_start, last_ms = [], [], None, None

    def close():
        nonlocal cur, cur_start
        text = " ".join(cur).strip()
        if text:
            paras.append((cur_start // 1000, text))
        cur, cur_start = [], None

    for ms, w in words(path):
        if ms < lo or ms >= hi:
            continue
        # ">>" is the captioner's speaker-change marker; it opens a paragraph
        # and is not itself reproduced.
        if w.startswith(">>"):
            close()
            w = w[2:].strip()
            if not w:
                last_ms = ms
                continue
        elif last_ms is not None and ms - last_ms >= GAP_SECONDS * 1000 and cur:
            if re.search(r"[.?!]$", cur[-1]):
                close()
        if cur_start is None:
            cur_start = ms
        cur.append(w)
        last_ms = ms
        if ms - cur_start >= PARA_SECONDS * 1000 and re.search(r"[.?!]$", w):
            close()
    close()
    return paras


# ── Rendering ─────────────────────────────────────────────────────────

def esc(s):
    return html.escape(s or "", quote=True)


def clock(sec):
    h, rem = divmod(int(sec), 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def speakers(p):
    if p["type"] == "workshop":
        return " & ".join(n for n in (p["organizer_name"], p["co_organizer_name"]) if n)
    s = p["speaker_name"] or ""
    return s + (f" · {p['co_speakers']}" if p["co_speakers"] else "")


def when(p):
    if not p["scheduled_date"]:
        return ""
    d = date.fromisoformat(p["scheduled_date"])
    out = d.strftime("%A, %B ") + str(d.day) + d.strftime(", %Y")
    if p["scheduled_time_utc"]:
        out += f" · {p['scheduled_time_utc']}"
        if p["scheduled_end_time_utc"]:
            out += f"–{p['scheduled_end_time_utc']}"
        out += " UTC"
    return out


def abstract_html(text):
    blocks = [b.strip() for b in re.split(r"\n\s*\n", text or "") if b.strip()]
    return "\n".join(f"<p>{esc(b)}</p>" for b in blocks)


def embed_src(video_id, start, end, autoplay=False):
    q = ["rel=0"]
    if start:
        q.append(f"start={int(start)}")
    if end:
        q.append(f"end={int(end)}")
    if autoplay:
        q.append("autoplay=1")
    return f"https://www.youtube.com/embed/{video_id}?" + "&".join(q)


def render(p, rec, paras):
    vid, start, end = rec["video_id"], rec.get("start", 0), rec.get("end")
    title = p["title"]
    desc = re.sub(r"\s+", " ", p["abstract"] or "").strip()
    if len(desc) > 200:
        desc = desc[:197].rsplit(" ", 1)[0] + "…"
    watch = f"https://www.youtube.com/watch?v={vid}" + (f"&t={int(start)}s" if start else "")
    session = ""
    if p["session"] and p["session"] != "General":
        session = f'<p class="rec-session">Special session: {esc(p["session"])}</p>'

    if paras:
        body = "\n".join(
            f'<p><a class="ts" href="{esc(watch.split("&t=")[0])}&amp;t={t}s" data-t="{t}">{clock(t)}</a>{esc(text)}</p>'
            for t, text in paras
        )
        transcript = f"""<h2 class="section-label">Transcript</h2>
        <p class="rec-note">Auto-generated by YouTube&rsquo;s speech recognition and not edited, so names and technical terms are often misheard. Click a timestamp to play from that point.</p>
        <div class="transcript">
{body}
        </div>"""
    else:
        transcript = """<h2 class="section-label">Transcript</h2>
        <p class="rec-note">A transcript is not available for this recording yet.</p>"""

    about = ""
    if p["abstract"]:
        about = f"""<h2 class="section-label">About this {'workshop' if p['type'] == 'workshop' else 'session' if p['type'] != 'talk' else 'talk'}</h2>
        <div class="rec-abstract">
{abstract_html(p['abstract'])}
        </div>"""

    return f"""<!DOCTYPE html>
<!-- Generated by make_recordings.py from data/symposium-2026-recordings.json,
     D1 and YouTube captions. Edit those and regenerate; do not hand-edit. -->
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{esc(title)} — Protocol Symposium 2026</title>
  <meta name="description" content="{esc(desc)}">
  <link rel="icon" href="/assets/logo-static.png" type="image/png">
  <link rel="stylesheet" href="/css/style.css">
  <style>
    .event-body .rec-speaker {{ font-size:0.85rem; font-weight:500; color:#5A5A5A; text-transform:uppercase;
      letter-spacing:0.06em; margin:0 0 0.3rem; }}
    .event-body .rec-when, .event-body .rec-session {{ font-size:0.82rem; color:#2A6B6B; font-weight:600; margin:0 0 0.2rem; }}
    .rec-player {{ aspect-ratio:16 / 9; margin:1.25rem 0 0.5rem; background:#1A1A1A;
      border:1px solid #D8D5CF; }}
    .rec-player iframe {{ display:block; width:100%; height:100%; border:0; }}
    .event-body .rec-links {{ font-size:0.85rem; margin:0 0 1.75rem; }}
    .rec-links a {{ color:#2A6B6B; }}
    .event-body .rec-abstract p {{ font-size:0.95rem; line-height:1.65; color:#3A3A3A; }}
    .event-body .rec-note {{ font-size:0.82rem; color:#8A8A8A; font-style:italic; margin-bottom:1rem; }}
    .event-body .transcript p {{ font-size:0.95rem; line-height:1.7; color:#2A2A2A; margin:0 0 0.9rem; }}
    .transcript .ts {{ display:inline-block; min-width:3.6em; margin-right:0.6em;
      font-size:0.75rem; font-weight:600; color:#2A6B6B; text-decoration:none;
      font-variant-numeric:tabular-nums; }}
    .transcript .ts:hover {{ text-decoration:underline; }}
  </style>
</head>
<body>

<div class="interior-wrapper">

  <header id="site-header"></header>

  <main class="interior-main">
    <div class="container">

      <div class="page-header">
        <p class="event-kicker"><a href="{PROGRAM_URL}">Protocol Symposium 2026</a> &mdash; Recording</p>
        <h1>{esc(title)}</h1>
      </div>

      <div class="event-body">
        <p class="rec-speaker">{esc(speakers(p))}</p>
        <p class="rec-when">{esc(when(p))}</p>
        {session}

        <div class="rec-player">
          <iframe id="rec-iframe" src="{esc(embed_src(vid, start, end))}"
                  title="{esc(title)} — recording"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        </div>
        <p class="rec-links"><a href="{esc(watch)}" target="_blank" rel="noopener noreferrer">Watch on YouTube &rarr;</a></p>

        {about}

        {transcript}
      </div>

      <div class="event-back">
        <a href="{PROGRAM_URL}#p-{p['id']}">&larr; Protocol Symposium 2026 program &amp; recordings</a>
      </div>

    </div>
  </main>

  <footer class="site-footer"></footer>

</div>

<script src="/js/main.js"></script>
<script>
// Timestamps re-point the player rather than driving it through the IFrame
// API: that would need youtube.com in script-src, and a reload at ?start= is
// indistinguishable to the reader. Without JS the link opens YouTube instead.
(function () {{
  var frame = document.getElementById('rec-iframe');
  var BASE = {json.dumps(embed_src(vid, None, end, autoplay=True))};
  document.addEventListener('click', function (e) {{
    var a = e.target.closest('a.ts');
    if (!a || !frame) return;
    e.preventDefault();
    frame.src = BASE + '&start=' + a.dataset.t;
    frame.scrollIntoView({{ behavior: 'smooth', block: 'center' }});
  }});
}})();
</script>
</body>
</html>
"""


# ── Main ──────────────────────────────────────────────────────────────

def main(argv):
    refetch = "--refetch" in argv
    only = {int(a) for a in argv if a.isdigit()}
    recs = json.loads(MAPPING.read_text())["recordings"]
    if only:
        recs = [r for r in recs if r["proposal_id"] in only]
    props = load_proposals([r["proposal_id"] for r in recs])

    missing_caps = []
    for rec in recs:
        p = props.get(rec["proposal_id"])
        if not p:
            print(f"! proposal {rec['proposal_id']} not in D1 — skipped")
            continue
        if not p["slug"]:
            print(f"! proposal {p['id']} has no slug — skipped")
            continue
        cap = fetch_captions(rec["video_id"], refetch)
        paras = paragraphs(cap, rec.get("start", 0), rec.get("end")) if cap else []
        if not cap:
            missing_caps.append(p["id"])
        out = OUT_DIR / p["slug"] / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(render(p, rec, paras))
        print(f"  {p['id']:>4}  {len(paras):>3} paras  {out.relative_to(ROOT)}")

    if missing_caps:
        print(f"\nNo captions yet for {missing_caps} — pages written without a "
              "transcript. Re-run later with those ids.")


if __name__ == "__main__":
    main(sys.argv[1:])
