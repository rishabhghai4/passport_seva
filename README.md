# passport_seva

A redesign concept for the Indian Passport Seva website ([passportindia.gov.in](https://www.passportindia.gov.in/psp)), modelled on the clarity of GOV.UK, Canada.ca and France Titres.

> **Prototype.** This is not the official service. Every page carries a "Concept" banner, and all "Start now" buttons hand off to the official website.

## Pages

| Page | What it shows |
| --- | --- |
| `index.html` | Home: task cards, service directory, fraud warning, 2025 statistics, notices |
| `apply.html` | Apply or renew: GOV.UK content page, start button, 6 numbered steps, children, lost/damaged |
| `tatkaal.html` | Urgent passports: summary, eligibility, the 13 accepted documents, fee table |
| `fees.html` | Fees from 1 July 2026 with an **interactive fee calculator** (rebates, Tatkaal, PCC) |
| `documents.html` | Document requirements in an accordion, plus a **printable checklist** that remembers ticks |
| `track.html` | Track form with GOV.UK error-summary validation, and what each status means |
| `offices.html` | All 37 Regional Passport Offices with **live search** (handles Kochi/Cochin, Trichy and so on) |
| `help.html` | Contact, FAQs, police verification, ePassports, accessibility statement |
| `search.html` | Client-side site search over an index generated at build time |

Fees, document lists and rules were checked against passportindia.gov.in in October 2026.

## Run it locally

You only need Python 3. There are no packages to install.

```bash
python3 build.py                        # builds src/ into docs/
python3 -m http.server -d docs 8000     # then open http://localhost:8000
```

Edit the files in `src/`, not `docs/`, because `docs/` is regenerated on every build.

## Publish it

`docs/` is ready for GitHub Pages: go to **Settings → Pages**, choose **Deploy from a branch**, then pick this branch and the `/docs` folder.

## Project layout

```
build.py                  # stdlib-only builder: layout, nav, breadcrumbs, icons, search index
src/_layout.html          # shared header, accessibility bar, footer and feedback component
src/pages/*.html          # page bodies; each starts with a <!--meta {...} --> JSON header
src/assets/css/main.css   # the whole design system (tokens + components)
src/assets/js/            # main.js (shared) + fees.js, offices.js, track.js, search.js
src/assets/fonts/         # Atkinson Hyperlegible, self-hosted (SIL OFL)
docs/                     # built site (committed so GitHub Pages can serve it)
```

## Design system

- **Type:** Atkinson Hyperlegible, designed by the Braille Institute for low-vision readers. Its slashed zero keeps file numbers unambiguous. Body text is 19px on desktop and 17px on mobile.
- **Colour:** navy `#0b2149` header, a saffron/white/green tricolour rule as the single national-identity flourish, green `#0f6b2e` start buttons, and the GOV.UK yellow focus style. Every text pair is at least 4.5:1, and most are at least 7:1.
- **Patterns borrowed on purpose:** the GOV.UK start button, inset text, warning text, error summary and "Is this page useful?"; the Canada.ca title accent, alert rail and link-plus-description grid; the France Titres numbered steps and "documents to bring" callout.
- **Not used:** the State Emblem of India, whose use is restricted by law. The logo is a generic passport mark.

## Accessibility (WCAG 2.2 AA, GIGW 3.0)

- A− / A / A+ text size and a high-contrast theme, both remembered between visits
- A skip link, a visible focus style on every control, and keyboard operation throughout
- Every page works without JavaScript: the menu stays open, the official tracker form still submits, and the fee table is always shown
- Respects `prefers-reduced-motion`, and has no horizontal scrolling down to 320px
- Checked with axe-core on all 9 pages at 1280px and 375px, in both normal and high-contrast modes: no violations
