#!/usr/bin/env python3
"""Build the Passport Seva static site.

Pages live in src/pages/*.html. Each page starts with a metadata comment:

    <!--meta {"title": "...", "description": "...", "nav": "apply",
              "breadcrumbs": [["Home", "index.html"], ["Apply", null]]} -->

The page body is wrapped in src/_layout.html, ``{{icon:name}}`` tokens are
replaced with inline SVG, and the result is written to docs/ (served by
GitHub Pages). Standard library only: run ``python3 build.py``.
"""

from __future__ import annotations

import html
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
OUT = ROOT / "docs"
SITE_NAME = "Passport Seva"

NAV = [
    ("apply", "Apply or renew", "apply.html"),
    ("tatkaal", "Tatkaal (urgent)", "tatkaal.html"),
    ("fees", "Fees", "fees.html"),
    ("documents", "Documents", "documents.html"),
    ("track", "Track application", "track.html"),
    ("offices", "Passport offices", "offices.html"),
    ("help", "Help", "help.html"),
]

# 24×24, 2px stroke, round caps — one visual family (Lucide geometry).
_ICON_PATHS = {
    "arrow-right": '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    "chevron-down": '<path d="m6 9 6 6 6-6"/>',
    "chevron-up": '<path d="m18 15-6-6-6 6"/>',
    "search": '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    "phone": '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    "alert": '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    "alert-circle": '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
    "info": '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    "external": '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    "passport": '<rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="10" r="3.5"/><path d="M8.5 10h7"/><path d="M9 17h6"/>',
    "calendar": '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>',
    "route": '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    "message": '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8"/><path d="M8 13h5"/>',
    "map-pin": '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    "clock": '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    "rupee": '<path d="M6 3h12"/><path d="M6 8h12"/><path d="m6 13 8.5 8"/><path d="M6 13h3"/><path d="M9 13c6.7 0 6.7-10 0-10"/>',
    "file-check": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="m9 15 2 2 4-4"/>',
    "printer": '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    "smartphone": '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
    "globe": '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    "shield": '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    "arrow-up": '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
    "menu": '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
}


def icon(name: str, size: int = 24, cls: str = "") -> str:
    paths = _ICON_PATHS[name]
    class_attr = f' class="{cls}"' if cls else ""
    return (
        f'<svg{class_attr} width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" '
        'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" '
        f'aria-hidden="true" focusable="false">{paths}</svg>'
    )


ICON_TOKEN = re.compile(r"\{\{icon:([a-z-]+)(?::(\d+))?(?::([a-z_-]+))?\}\}")
EXTERNAL_TOKEN = "{{ext}}"
EXTERNAL_HTML = (
    icon("external", 16, "external-icon")
    + '<span class="visually-hidden"> (opens the official Passport Seva website)</span>'
)
META = re.compile(r"\A\s*<!--meta\s+(\{.*?\})\s*-->", re.S)


def render_icons(text: str) -> str:
    text = text.replace(EXTERNAL_TOKEN, EXTERNAL_HTML)
    return ICON_TOKEN.sub(
        lambda m: icon(m.group(1), int(m.group(2) or 24), m.group(3) or ""), text
    )


def render_nav(active: str) -> str:
    items = []
    for key, label, href in NAV:
        current = ' aria-current="page"' if key == active else ""
        items.append(
            f'<li class="nav__item"><a class="nav__link" href="{href}"{current}>{label}</a></li>'
        )
    return "\n".join(items)


def render_breadcrumbs(crumbs: list) -> str:
    if not crumbs:
        return ""
    items = []
    for label, href in crumbs:
        label = html.escape(label)
        if href:
            items.append(f'<li class="breadcrumbs__item"><a href="{href}">{label}</a></li>')
        else:
            items.append(f'<li class="breadcrumbs__item" aria-current="page">{label}</li>')
    return (
        '<nav class="breadcrumbs" aria-label="Breadcrumb"><ol class="breadcrumbs__list">'
        + "".join(items)
        + "</ol></nav>"
    )


def text_content(fragment: str) -> str:
    fragment = re.sub(r"<(script|style|svg)\b.*?</\1>", " ", fragment, flags=re.S)
    fragment = re.sub(r"<[^>]+>", " ", fragment)
    return re.sub(r"\s+", " ", html.unescape(fragment)).strip()


def build() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(SRC / "assets", OUT / "assets")
    layout = (SRC / "_layout.html").read_text(encoding="utf-8")

    search_index = []
    pages = sorted((SRC / "pages").glob("*.html"))
    for page in pages:
        raw = page.read_text(encoding="utf-8")
        match = META.match(raw)
        if not match:
            raise SystemExit(f"{page.name}: missing <!--meta {{...}} --> header")
        meta = json.loads(match.group(1))
        body = raw[match.end():]

        title = meta["title"]
        full_title = SITE_NAME if page.stem == "index" else f"{title} – {SITE_NAME}"
        scripts = "".join(
            f'\n  <script src="assets/js/{s}" defer></script>' for s in meta.get("scripts", [])
        )
        out = (
            layout.replace("{{title}}", html.escape(full_title))
            .replace("{{description}}", html.escape(meta["description"], quote=True))
            .replace("{{nav}}", render_nav(meta.get("nav", "")))
            .replace("{{breadcrumbs}}", render_breadcrumbs(meta.get("breadcrumbs", [])))
            .replace("{{main_class}}", meta.get("main_class", ""))
            .replace("{{scripts}}", scripts)
            .replace("{{content}}", body.strip())
        )
        out = render_icons(out)
        (OUT / page.name).write_text(out, encoding="utf-8")

        if not meta.get("noindex"):
            headings = [text_content(h) for h in re.findall(r"<h[23][^>]*>(.*?)</h[23]>", body, re.S)]
            search_index.append(
                {
                    "url": page.name,
                    "title": title,
                    "description": meta["description"],
                    "headings": headings,
                    "text": text_content(body)[:4000],
                }
            )

    (OUT / "assets" / "js" / "search-index.js").write_text(
        "window.SEARCH_INDEX = " + json.dumps(search_index, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )
    (OUT / ".nojekyll").write_text("", encoding="utf-8")
    print(f"Built {len(pages)} pages into {OUT.relative_to(ROOT)}/")


if __name__ == "__main__":
    build()
