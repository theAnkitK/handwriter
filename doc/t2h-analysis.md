# Text-to-Handwriting — Full Project Analysis

> All details verified directly from source files. No functionality was invented.  
> Source root: `text-to-handwriting.dafontstyle.io/`

---

## 1. Application Purpose

A **client-side PWA** that converts typed text into realistic handwritten pages rendered to an HTML Canvas. Every operation runs entirely in the browser — no backend, no uploads. Target users: students who need "handwritten" assignments.

Key selling points (from meta/HTML content):
- 35+ languages, 57 handwriting fonts (including RTL: Urdu Nastaliq, Arabic, Persian, Hebrew)
- 20 paper styles (classic notebook → graph → Cornell notes → vintage)
- Realistic randomisation: per-letter jitter, line drift, ink bleed, scan/photo post-effects
- Export: PDF, ZIP of images, or direct browser print
- PWA-installable, works offline (via `js/sw.js`)

---

## 2. File Map

```
text-to-handwriting.dafontstyle.io/
├── index.html                 Main SPA document (276 lines)
├── manifest.webmanifest       PWA manifest (categories, icons, theme)
├── README.md                  Project README
├── SKILL.md                   Project skill / AI context file
├── doc/
│   └── t2h-analysis.md        This file
├── css/
│   ├── style.css              All UI styles (267 lines, single file, no preprocessor)
│   └── fonts.css              @font-face for 20 "core" fonts (55 lines)
├── js/
│   ├── app.js                 Entry point / orchestrator (611 lines)
│   ├── engine.js              Layout + canvas rendering (869 lines) ← largest file
│   ├── fonts.js               Font registry + metrics + loading (205 lines)
│   ├── papers.js              Paper definitions + canvas drawing (360 lines)
│   ├── languages.js           Language registry + script detection (161 lines)
│   ├── export.js              PDF/ZIP writers + download helper (124 lines)
│   ├── import.js              .txt/.md/.docx reader (59 lines)
│   └── sw.js                  Service worker (66 lines)
├── fonts/
│   ├── kalam/                 latin.woff2, latin-ext.woff2, devanagari.woff2
│   ├── patrick-hand/          latin.woff2, latin-ext.woff2, vietnamese.woff2
│   ├── handlee/               latin.woff2
│   ├── architects-daughter/   latin.woff2, latin-ext.woff2
│   ├── indie-flower/          latin.woff2, latin-ext.woff2
│   ├── gochi-hand/            latin.woff2
│   ├── annie-use-your-telescope/ latin.woff2, latin-ext.woff2
│   ├── caveat/                latin.woff2, latin-ext.woff2, cyrillic.woff2, cyrillic-ext.woff2
│   ├── shadows-into-light/    latin.woff2, latin-ext.woff2
│   ├── covered-by-your-grace/ latin.woff2, latin-ext.woff2
│   ├── gloria-hallelujah/     latin.woff2, latin-ext.woff2
│   ├── reenie-beanie/         latin.woff2
│   ├── homemade-apple/        latin.woff2
│   ├── cedarville-cursive/    latin.woff2
│   ├── la-belle-aurore/       latin.woff2, latin-ext.woff2
│   ├── dawning-of-a-new-day/  latin.woff2
│   ├── nothing-you-could-do/  latin.woff2
│   ├── zeyada/                latin.woff2, latin-ext.woff2
│   ├── playwrite-gb-s/        fallback.woff2
│   └── <non-core fonts>/      Loaded on-demand via /fonts/<id>/font.css
└── icons/
    ├── favicon-32.png
    ├── icon-192.png, icon-512.png
    ├── apple-touch-icon.png
    └── maskable-192.png, maskable-512.png
```

> **Non-core fonts** (gulzar, noto-nastaliq-urdu, all Indic/CJK/Cyrillic etc.) load their own
> `font.css` dynamically from `/fonts/<id>/font.css`. These files must be present on the server
> at runtime but may not all be in the local repo.

---

## 3. Module Architecture

```
index.html
  └── <script type="module" src="js/app.js">
        ├── js/fonts.js        Font registry · metrics · lazy loading
        ├── js/languages.js    Language registry · script detection
        ├── js/papers.js       Paper definitions · baseline arrays
        ├── js/engine.js       Text layout · canvas rendering · effects
        │     ├── js/papers.js (re-used)
        │     └── js/fonts.js  (re-used)
        ├── js/export.js       PDF 1.4 · ZIP · download
        └── js/import.js       .txt / .docx reader

css/fonts.css   @font-face for 20 core fonts
css/style.css   All UI layout and components

js/sw.js        Service worker (separate scope, registered from root)
```

### Data flow

```
User action → app.js: set(patch)
  → save()            [debounced 1 s to localStorage]
  → syncSelections()  [update UI aria states]
  → scheduleRender()  [debounced 150–600 ms, delay ∝ text length]
    → prepare()         ensureFont() + layoutDocument()
    → renderAll()       build/trim page <figure>s + IntersectionObserver
      → pump()          per-frame renderPage() for visible pages only
```

---

## 4. Service Worker (`js/sw.js`)

Cache name: `tth-v2`.

### Strategy

| Resource category | Strategy |
|-------------------|----------|
| App shell (HTML, all JS, CSS, core icons) | **Network-first**, cached on success, served from cache when offline |
| `/fonts/*` and `/icons/*` | **Cache-first** (fetched once, always served from cache thereafter) |
| All other same-origin GET requests | Network-first with cache fallback |
| Non-GET / cross-origin | Bypassed entirely |

### Shell files pre-cached on install

`/`, `/manifest.webmanifest`, `/css/style.css`, `/css/fonts.css`,  
`/js/app.js`, `/js/engine.js`, `/js/papers.js`, `/js/fonts.js`, `/js/export.js`, `/js/import.js`, `/js/languages.js`,  
`/icons/favicon-32.png`, `/icons/icon-192.png`, `/icons/apple-touch-icon.png`

### Lifecycle

- **install**: Pre-caches shell, calls `skipWaiting()` to activate immediately.
- **activate**: Deletes all caches whose name ≠ `tth-v2`, then calls `clients.claim()`.
- **fetch**: Navigation requests are normalised to `/` for cache put/match.

### ⚠️ Path mismatch

`app.js` registers the service worker at **`/sw.js`** (root path):
```js
navigator.serviceWorker.register('/sw.js')
```
But the file lives at **`js/sw.js`**. On the live server, `sw.js` must be served from the site root (not from `/js/`) for the registration to succeed and for the SW to have scope over all pages. If deployed as-is from the `js/` directory, the SW will fail to register or will have a reduced scope.

---

## 5. Rendering Pipeline (`engine.js`)

### 5a. Text Parsing

| Markup | Effect |
|--------|--------|
| `# Title` | Centred heading (scale 1.28×), underlined |
| `## Sub` | Left heading (scale 1.12×), underlined |
| `**text**` | Heading/marker ink colour |
| `==text==` | Highlighter (multiply blend) |
| `__text__` | Underline (unless in a run of `_____`) |
| `>> text` | Centred line |
| `Tab` | Jump to column midpoint (≈52% of available width) |
| `---` on own line | Page break |

`parseInline(str)` → `[{c, st:{em,hl,ul}}]` per character.  
`parseLine(raw)` → `{type:'text'|'break', level, align, chars[]}`.

### 5b. Word wrapping (`layoutDocument`)

- `charsToWords()` groups chars into words; CJK/Thai run through `splitNoSpace()` (using `Intl.Segmenter` when available).
- `wrapBlock()` measures widths via a hidden canvas Measurer, wraps when `x + wordWidth > avail`.
- Cursive fonts and complex scripts (`COMPLEX` regex) are drawn **word-at-a-time** to preserve ligatures.
- **Wrap cache**: `wrapCache` stores wrapped lines keyed on `[font, px, ls, wordSpacing, mistakes, seed, avail]`. Only changed paragraphs are re-wrapped on each keystroke.

### 5c. Page layout

- Paper's `baselines[]` array holds Y coordinates of ruled lines in page-units.
- `lineMode='alternate'` skips every other baseline (`step = 2`).
- Header rows inserted at top of first/every page. Cover page centres content vertically.

### 5d. Canvas rendering (`renderPage`)

1. **Paper background** — drawn once per paper+scale into `paperCache` (max 2 entries). Includes soft paper grain + random fibre strokes.
2. **Ink layer** (`scratch('layer')`) — each word rendered with per-glyph transform (`translate+rotate+skew+scale`) for jitter. RTL lines mirrored via `visualX()`.
3. **Highlights** — drawn onto base canvas before ink, with `multiply` composite.
4. **Underlines / scribble strikes** — drawn via `penLine()` with slight waviness.
5. **Page number / date slots** — small text placed in paper-defined `L.slots.page` / `L.slots.date`.
6. **Pen thickness** — ink layer blitted twice with ±pixel offset (cheap stroke simulation).
7. **Ink texture** — `destination-out` noise to simulate pencil/ballpoint skip.
8. **Ink bleed** — half-res copy of ink layer composited back (`multiply` at 35% alpha).
9. **Post-effect** (`applyEffect`):
   - `scan`: grey background, slight rotation, contrast filter, edge shadow gradients, fine noise.
   - `photo`: dark warm background, rotation, scale, radial light fallout, fine camera noise.

### 5e. Virtual / lazy rendering

`IntersectionObserver` tracks which page `<figure>`s are within 1200 px of the viewport. `pump()` draws one page per animation frame. Pages scrolled far away have their canvas cleared (`c.width = 0`) to free GPU memory.

### 5f. Randomisation

`rng(seed)` — Mulberry32 PRNG. Each line's seed: `hashStr(rawLine) ^ seed * 7919 ^ lineIndex * 131`. "Re-write" changes only `state.seed`.

---

## 6. Font System (`fonts.js`)

**57 fonts** across 20+ scripts.

| Field | Meaning |
|-------|---------|
| `id` | kebab-case identifier |
| `family` | CSS font-family name |
| `scripts[]` | Writing systems the font covers |
| `cursive: true` | Draw word-at-a-time |
| `core: true` | Declared in `css/fonts.css`; non-core fonts load `/fonts/<id>/font.css` on demand |

`fontMetrics(family, script)` — measures real glyph heights using a hidden 100 px canvas so every font sits correctly on ruled lines regardless of its internal metrics.

`loadCustomFont(file)` — uses `FontFace` API; returns a pseudo-entry matching all scripts.

---

## 7. Paper System (`papers.js`)

**Page units**: 1240 × 1754 px (150 DPI equivalent). Scale factor `S` applied at export time.

| Constructor | Papers |
|------------|--------|
| `makeRuled(o)` | classic, register, double-margin, college, wide, narrow, spiral, answer-sheet, lab, a4-lined, legal, aged, kraft |
| `makeGrid(o)` | maths, graph, engineering, dotted |
| `fourLine()` | English 4-line copy |
| `cornell()` | Cornell notes |
| `plain(o)` | Plain A4 |

Each paper exposes `{bg, layout, draw(ctx), plain?}`. Special papers (`register`, `lab`) draw printed field labels and override `L.slots` so page numbers write into the printed blanks.

---

## 8. Language System (`languages.js`)

37 languages, 20+ scripts. Each entry: `{id, name, native, script, labels, sample, text?, font?}`.

`detectScript(text)` — scans first 4000 chars with per-script regexes. Urdu/Persian short-circuit at 2 matches.

Language hint in the UI auto-suggests switching when pasted text doesn't match the current script.

---

## 9. State Management (`app.js`)

```js
DEFAULTS = {
  text, lang:'en', font:'kalam', paper:'classic', ink:'blue', inkCustom:'#1b3d93',
  headingInk:'same', highlight:'yellow', penWeight:0.25, size:1, messiness:0.45,
  slant:0, letterSpacing:0, wordSpacing:1, marginShift:0, mistakes:0,
  lineMode:'every', plainSpacing:9, headerMode:'none',
  fields:{name,roll,cls,subject,teacher,date,title,institute,kind},
  customFields:[],
  pageNumbers:false, dateOnPages:false, effect:'none', quality:'1.5', seed:1
}
```

- Persisted to `localStorage['tth-settings-v1']`.
- Saved with 1 s debounce; `pagehide` triggers an immediate save.
- On quota exceeded: saves settings without text body.

---

## 10. Export System (`export.js`)

| Format | Notes |
|--------|-------|
| **PDF** | Hand-written PDF 1.4. Pages as DCT (JPEG) XObjects. A4 media box 595.28 × 841.89 pt. No external library. |
| **ZIP** | Stored (no compression — JPEGs are already compressed). CRC-32 computed per page. |
| **Print** | JPEG blobs → `<img>` tags in `#print-root` → `window.print()`. CSS `@media print` hides everything else. |
| **Single PNG** | Per-page "Download PNG" renders at `state.quality` scale. |

Memory: pages are rendered one-at-a-time into a single canvas and kept as `Blob`s; final `new Blob(parts)` assembles without copying into a single buffer.

---

## 11. Import System (`import.js`)

- `.txt` / `.md` — read as text, normalise CRLF.
- `.docx` — minimal ZIP parser → `word/document.xml` → `DOMParser`. `Title`/`Heading1` → `# `, `Heading2+` → `## `.

---

## 12. PWA Summary

| Component | Status |
|-----------|--------|
| `manifest.webmanifest` | Present — standalone display, any orientation, theme `#1b3d93` |
| `js/sw.js` | Present — cache `tth-v2`, network-first shell, cache-first fonts/icons |
| SW registration | `app.js` registers `/sw.js`; file is at `js/sw.js` — **path must be resolved by server config** |
| Install prompt | `beforeinstallprompt` / "Install app" button fully implemented |

---

## 13. Known Limitations

| Area | Limitation |
|------|-----------|
| SW path | `app.js` registers `/sw.js` but file is at `js/sw.js` — server must serve it from root or registration fails |
| Non-core font CSS | Expected at `/fonts/<id>/font.css` at runtime; may not all be present locally |
| Mistakes feature | Only works on pure ASCII words ≥5 letters |
| `wrapCache` | Global singleton not keyed by language/script — potential stale-wrap edge case when rapidly switching languages |
| PDF | JPEG only; no text layer — inaccessible, unsearchable |
| RTL | `visualX()` handles bidi inside a line but no full paragraph-level bidi algorithm |
| Paper cache | Max 2 entries; switching papers repeatedly redraws |
| `canFilter` | CSS `filter` on Canvas context is Chrome-only; scan/photo effects degraded on Firefox |
| `DecompressionStream` | Not in old Safari — .docx import fails |
| Storage | Very long texts may exceed localStorage quota; text silently dropped |

---

## 14. Refactoring Opportunities

| Priority | Opportunity |
|----------|-------------|
| 🔴 High | Resolve SW path: either move `sw.js` to root or configure server to serve `js/sw.js` at `/sw.js` |
| 🔴 High | Bundle or version the non-core font CSS files for reliable local dev |
| 🟡 Medium | Split `engine.js` (869 lines) into `layout.js` + `draw.js` + `effects.js` |
| 🟡 Medium | Extract `rng()` and noise utilities into a `utils.js` module |
| 🟡 Medium | Key `wrapCache` to include `lang` / `script` |
| 🟡 Medium | Move `DEFAULTS`, `STORE`, state persistence into a dedicated `state.js` |
| 🟢 Low | Replace `scratchCanvases` object with a `Map` |
| 🟢 Low | Increase `paperCache` LRU limit from 2 to 4 |
| 🟢 Low | Add max-size guard to `fontMetrics` cache |
| 🟢 Low | Consider `OffscreenCanvas` for `pump()` to move rendering off the main thread |
