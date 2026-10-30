#!/opt/homebrew/bin/python3
"""Assemble the Institute overview (/pitch): HTML fragment + PDF, uploaded to R2.

Sources, in one place each:
  - the overview's own text: D1 managed_pages 'pitch/overview' (private; admins edit it at
    /pages/edit?key=pitch/overview). Never in git: this repo is public.
  - public text, e.g. the Core Values page: {{page:static/values}} reads that managed page.
  - team, research groups, roadmap: the site's own public APIs, read live.
The PDF inlines all of it so it stands alone. Output is skipped when the content hash matches
the last build, so the scheduled run (.github/workflows/pitch-build.yml) is cheap.

Directives (alone on a line): {{team}} {{research-leads}} {{research-groups}} {{roadmap-projects}}
{{page:static/<key>}}. Inline: {{group-count}} {{roadmap-count}}.

  python3 scripts/pitch/build_pitch.py                     # build + upload if changed
  python3 scripts/pitch/build_pitch.py --force
  python3 scripts/pitch/build_pitch.py --source-file pitch-private/source.md --no-upload   # local preview

Requires: markdown, weasyprint; wrangler + CLOUDFLARE_API_TOKEN (D1 read, R2 write) unless --source-file/--no-upload.
"""
import argparse, datetime, hashlib, html, json, os, re, subprocess, sys, tempfile, urllib.request
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parents[2]
SITE = os.environ.get("PITCH_SITE", "https://protocol-institute.org")
DB, BUCKET, PREFIX = "pi-members", "pi-assets", "private/pitch"
SOURCE_KEY = "pitch/overview"
ROADMAP_PROGRAM, ROADMAP_YEAR = "research-roadmap", "2027"
# Hosts who are not "leads" for funding purposes: left out of the leads list and of group lead credit.
NOT_FUNDING_LEADS = {"spencernitkeywriting"}

esc = html.escape


def md(text: str) -> str:
    return markdown.markdown(text, extensions=["footnotes", "sane_lists"])


def get_json(path: str):
    req = urllib.request.Request(SITE + path, headers={"User-Agent": "pitch-build"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def d1(sql: str):
    out = subprocess.run(["npx", "wrangler", "d1", "execute", DB, "--remote", "--json", "--command", sql],
                         cwd=ROOT, check=True, capture_output=True, text=True).stdout
    return json.loads(out)[0]["results"]


def r2(*args: str):
    return subprocess.run(["npx", "wrangler", "r2", "object", *args, "--remote"], cwd=ROOT, check=True, capture_output=True, text=True)


# ── Blocks ─────────────────────────────────────────────────────────────────

def abstract(text, limit=420) -> str:
    first = re.split(r"\n\s*\n", (text or "").strip())[0]
    plain = re.sub(r"\s+", " ", re.sub(r"[*_`#>]", "", re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", first))).strip()
    if len(plain) <= limit:
        return plain
    cut = plain[:limit]
    return cut[: max(cut.rfind(" "), 0)] + "…"


def names(xs):
    return xs[0] if len(xs) == 1 else " and ".join(xs) if len(xs) == 2 else ", ".join(xs[:-1]) + ", and " + xs[-1]


def who(m) -> str:
    return f'<strong><a href="{SITE}/members/profile?slug={m["slug"]}">{esc(m["name"])}</a></strong>'


def team(d):
    core = sorted((m for m in d["members"] if m["team_core"]), key=lambda m: m["team_sort"] or 99)
    items = []
    for m in core:
        bio = abstract(m["bio"], 320)
        items.append(f'<li>{who(m)}{" — " + esc(m["team_title"]) if m["team_title"] else ""}{"<br>" + esc(bio) if bio else ""}</li>')
    return f'<ul class="people">{"".join(items)}</ul>'


def leads(d):
    items = []
    for m in d["members"]:
        if m["tier"] != "community_lead" or m["slug"] in NOT_FUNDING_LEADS:
            continue
        gs = [g["title"] for g in d["groups"] if any(h["slug"] == m["slug"] for h in g["hosts"])]
        bio = abstract(m["bio"], 320)
        items.append(f'<li>{who(m)}{" — " + esc(names(gs)) if gs else ""}{"<br>" + esc(bio) if bio else ""}</li>')
    return f'<ul class="people">{"".join(items)}</ul>'


def groups(d):
    items = []
    for g in d["groups"]:
        ls = [h["name"] for h in g["hosts"] if h["slug"] not in NOT_FUNDING_LEADS]
        lead = f' <em>(lead{"s" if len(ls) > 1 else ""}: {esc(names(ls))})</em>' if ls else ""
        items.append(f'<li><strong><a href="{SITE}{g["href"]}">{esc(g["title"])}</a>:</strong> {esc(abstract(g["description"], 600))}{lead}</li>')
    return f'<ol class="groups">{"".join(items)}</ol>'


def roadmap(d):
    items = []
    for p in d["roadmap"]:
        gs = [a["title"] for a in p["programs"] if a["kind"] == "sig" and a["status"] == "approved"]
        meta = [x for x in (esc(names(gs)) if gs else "", f'lead: {esc(p["lead_name"])}' if p.get("lead_name") else "") if x]
        items.append(f'<li><strong><a href="{SITE}/projects/project/?slug={p["slug"]}">{esc(p["title"])}</a></strong>'
                     f'{" <span class=meta>(" + "; ".join(meta) + ")</span>" if meta else ""}<br>{esc(abstract(p["description"], 300))}</li>')
    return f'<ul class="roadmap">{"".join(items)}</ul>'


BLOCKS = {"team": team, "research-leads": leads, "research-groups": groups, "roadmap-projects": roadmap}
# Name lists go to appendices so the main text reads cleanly; the directive leaves a reference in place.
# The research-group list stays inline. Lettered in order of first appearance.
APPENDIX_TITLES = {"team": "The core team", "research-leads": "Research leads", "roadmap-projects": "Research Roadmap projects"}
# Used when the source gives a bare {{key}} line; prose in the source can instead say {{appendix:key}} inline.
APPENDIX_SENTENCES = {"team": "Biographies of the core team can be found in {ref}.",
                      "research-leads": "Biographies of the research leads, with the groups they lead, can be found in {ref}.",
                      "roadmap-projects": "The proposed Research Roadmap projects are listed in {ref}."}


def live_data():
    programs = get_json("/api/programs?detail=1")["programs"]
    return {
        "groups": [p for p in programs if p["kind"] == "sig" and p["status"] == "active"],
        "members": get_json("/api/members")["members"],
        "roadmap": [p for p in get_json("/api/projects")["projects"]
                    if any(a["slug"] == ROADMAP_PROGRAM and a["status"] == "approved" and (a.get("edition") or {}).get("slug") == ROADMAP_YEAR
                           for a in p["programs"])],
    }


def assemble(source: str) -> str:
    d = live_data()
    source = source.replace("{{group-count}}", str(len(d["groups"]))).replace("{{roadmap-count}}", str(len(d["roadmap"])))
    out, appendices = [], []
    # Appendices are numbered in order of first mention, inline ({{appendix:key}}) or as a bare {{key}} line.
    order = []
    for m in re.finditer(r"\{\{(?:appendix:)?(team|research-leads|roadmap-projects)\}\}", source):
        if m.group(1) not in order:
            order.append(m.group(1))
    ref = lambda k: f'<a class="appx" href="#appendix-{k}">Appendix {order.index(k) + 1}</a>'
    source = re.sub(r"\{\{appendix:([\w-]+)\}\}", lambda m: ref(m.group(1)) if m.group(1) in order else m.group(0), source)
    parts = re.split(r"^\{\{([\w:/.-]+)\}\}[ \t]*$", source, flags=re.M)  # text, name, text, name, ...
    for i, seg in enumerate(parts):
        if i % 2 == 0:
            out.append(seg)
            continue
        if seg.startswith("page:"):
            key = seg[5:]
            if not key.startswith("static/"):
                raise SystemExit(f"{{{{page:{key}}}}}: only public static/* pages can be inlined")
            out.append(get_json(f"/api/pages/{key}")["content_md"])
        elif seg in APPENDIX_TITLES:
            out.append("\n" + APPENDIX_SENTENCES[seg].format(ref=ref(seg)) + "\n")
        elif seg in BLOCKS:
            out.append(f"\n{BLOCKS[seg](d)}\n")  # raw HTML block; python-markdown passes it through
        else:
            raise SystemExit(f"unknown directive {{{{{seg}}}}}")
    # Footnote definitions must sit in one markdown run, so render once, not per segment.
    body = md("\n".join(out))
    if not order:
        return body
    app = '<section class="appendices">' + "".join(
        f'<section class="appendix" id="appendix-{key}"><h2>Appendix {i + 1}: {APPENDIX_TITLES[key]}</h2>{BLOCKS[key](d)}</section>'
        for i, key in enumerate(order)) + "</section>"
    i = body.find('<div class="footnote">')
    return body + app if i < 0 else body[:i] + app + body[i:]


# ── Print document ─────────────────────────────────────────────────────────

PRINT_CSS = """
@page{size:Letter;margin:24mm 24mm 26mm;
  @bottom-left{content:"Protocol Institute";font:7.5pt 'DM Sans',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#9a9a94}
  @bottom-right{content:counter(page);font:8pt 'DM Sans',sans-serif;color:#9a9a94}}
body{background:#fff;margin:0}
.pitch-doc{font-size:10.2pt;line-height:1.62}
.masthead{display:flex;align-items:center;justify-content:space-between;padding-bottom:9mm;margin-bottom:11mm;border-bottom:.5pt solid #cfcfc8}
.masthead .brand{display:flex;align-items:center;gap:4mm}
.masthead img{height:13mm;width:auto}
.masthead .org{font:500 8.5pt 'DM Sans',sans-serif;letter-spacing:.2em;text-transform:uppercase}
.masthead .stamp{font:7.5pt 'DM Sans',sans-serif;letter-spacing:.06em;color:#9a9a94}
.pitch-doc h1{font-size:34pt;margin:0 0 3mm}
.appendices{break-before:page}
.appendix h2{break-after:avoid}
.appendices .appendix:first-child h2{border-top:0;margin-top:0;padding-top:0}
a.appx::after{content:" (p. " target-counter(attr(href),page) ")";color:#77776f}
.pitch-doc h1 + p{font-size:9.5pt;color:#77776f;margin:0 0 9mm}
.pitch-doc h2{font-size:19pt;margin:11mm 0 3mm;padding-top:5mm;break-after:avoid}
.pitch-doc h3{break-after:avoid}
.pitch-doc p{margin:0 0 3.2mm;orphans:3;widows:3}
.pitch-doc a{border-bottom:.4pt solid #2A6B6B}
.pitch-doc ul.people li,.pitch-doc ul.roadmap li,.pitch-doc li{break-inside:avoid}
.pitch-doc .footnote{margin-top:12mm;font-size:8.6pt}
"""


def print_document(fragment: str) -> str:
    stamp = f"Live lists as of {datetime.date.today().isoformat()}"
    css = (ROOT / "css" / "pitch.css").read_text() + PRINT_CSS
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Protocol Institute Overview</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
<style>{css}</style></head><body><article class="pitch-doc">
<header class="masthead"><div class="brand"><img src="{SITE}/assets/logo-static.png" alt=""><span class="org">Protocol Institute</span></div><span class="stamp">{stamp}</span></header>
{fragment}</article></body></html>"""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--no-upload", action="store_true")
    ap.add_argument("--source-file", help="read the overview text from a local file instead of D1")
    args = ap.parse_args()

    if args.source_file:
        source = Path(args.source_file).read_text()
    else:
        rows = d1(f"SELECT content_md FROM managed_pages WHERE page_key='{SOURCE_KEY}' AND is_published=1")
        if not rows:
            sys.exit(f"no managed page {SOURCE_KEY}: seed it first (see CLAUDE.md, Institute overview)")
        source = rows[0]["content_md"]

    fragment = assemble(source)
    digest = hashlib.sha256(fragment.encode()).hexdigest()[:24]

    out = ROOT / "pitch-private" / "build"
    out.mkdir(parents=True, exist_ok=True)
    if not args.force and not args.no_upload:
        with tempfile.TemporaryDirectory() as tmp:
            try:
                r2("get", f"{BUCKET}/{PREFIX}/meta.json", f"--file={tmp}/meta.json")
                if json.loads(Path(tmp, "meta.json").read_text()).get("hash") == digest:
                    print(f"current ({digest}); nothing to do")
                    return 0
            except subprocess.CalledProcessError:
                pass  # no previous build

    from weasyprint import HTML
    (out / "overview.html").write_text(fragment)
    HTML(string=print_document(fragment), base_url=SITE + "/").write_pdf(out / "overview.pdf")
    (out / "meta.json").write_text(json.dumps({"hash": digest, "built_at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")}))
    print(f"built {out}/overview.pdf ({(out / 'overview.pdf').stat().st_size // 1024} KB, {digest})")
    if args.no_upload:
        return 0
    for name, ctype in (("overview.html", "text/html; charset=utf-8"), ("overview.pdf", "application/pdf"), ("meta.json", "application/json")):  # meta last
        r2("put", f"{BUCKET}/{PREFIX}/{name}", f"--file={out / name}", f"--content-type={ctype}")
    print("uploaded")
    return 0


if __name__ == "__main__":
    sys.exit(main())
