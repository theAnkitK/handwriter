---
name: t2h-project
description: >
  Context and working knowledge for the text-to-handwriting.dafontstyle.io project.
  Activates when working on features, refactors, or bug fixes for this codebase.
  Provides architecture, module contracts, rendering pipeline details, conventions,
  and a workflow for reference-APK-guided feature additions.
---

# T2H Project Skill

## Project identity

**Root**: `text-to-handwriting.dafontstyle.io/`  
**Live URL**: https://text-to-handwriting.dafontstyle.io/  
**Purpose**: Client-side PWA — converts typed text into realistic handwritten Canvas pages.  
**Stack**: Vanilla ES Modules · HTML Canvas 2D · no framework · no build step.

---

## File map (paths relative to project root)

```
index.html                     SPA shell — 7 collapsible <details> panels
manifest.webmanifest           PWA manifest
README.md                      Project README
SKILL.md                       This file
doc/
  t2h-analysis.md              Full architecture analysis
css/style.css                  All UI styles (CSS variables, Grid, responsive)
css/fonts.css                  @font-face for 20 "core" fonts (self-hosted woff2)
js/app.js          ← ENTRY    State · controls · render scheduling · export
js/engine.js       ← LARGEST  Text layout + canvas rendering + post-effects (869 lines)
js/fonts.js                    Font registry + metrics + lazy CSS loading
js/papers.js                   Paper drawing + baseline arrays (20 paper styles)
js/languages.js                37 languages, script detection
js/export.js                   PDF 1.4 + ZIP writers, download helper
js/import.js                   .txt / .docx reader (no deps)
js/sw.js                       Service worker (cache tth-v2)
fonts/<family>/                Self-hosted .woff2 unicode-range slices
icons/                         PNG icons (192, 512, maskable variants)
```

> ⚠️ `app.js` registers the SW at `/sw.js` (root); the file is at `js/sw.js`.
> The server must serve `js/sw.js` at the root path for offline/install to work.

---

## Module contracts

### `js/app.js`
- Owns `state` object (all user settings). Single source of truth.
- `set(patch)` — merge patch → save (debounced 1 s) → sync UI → schedule render.
- `scheduleRender()` — debounced 150–600 ms (scales with text length).
- `exportAll(kind)` — renders all pages at `state.quality` scale, calls `buildPdf`/`buildZip`/`printPages`.
- PWA: registers `/sw.js`; handles `beforeinstallprompt`.

### `js/engine.js` — exports

| Export | Signature | Notes |
|--------|-----------|-------|
| `INKS` | `{id: {name, color, pencil?}}` | 7 preset inks |
| `HIGHLIGHTS` | `{id: rgba string}` | 5 highlighter colours |
| `rng(seed)` | `() => 0..1` | Mulberry32 PRNG |
| `layoutDocument(opts, font, lang)` | `→ doc` | Pure (no canvas side effects). Wraps text, builds page list. Uses `wrapCache`. |
| `renderPage(target, doc, pageIndex, opts, scale)` | `→ canvas` | Draws into `target` canvas. Uses scratch canvases (reused). |
| `renderPaperThumb(canvas, paper)` | void | Draws paper preview at canvas scale. |

`doc` object shape:
```js
{ pages, paper, L, baselines, pitch, px, fm, font, left, right, avail, M, cursive }
// pages[i] = { lines[], cover? }
// lines[i] = { words[], level, align, dir, w, bi (baseline index) }
```

### `js/fonts.js` — exports

| Export | Notes |
|--------|-------|
| `FONTS[]` | 57 font descriptors `{id, family, name, tag, scripts[], core?, cursive?, custom?}` |
| `fontsFor(script)` | Filter by script; excludes non-Latin-home fonts from Latin results |
| `getFont(id, custom)` | Returns font descriptor or `FONTS[0]` |
| `fontMetrics(family, script)` | Returns `{xh, cap, asc, base}` (Latin) or `{body, base}` (non-Latin) |
| `ensureFont(font, text)` | Loads CSS + waits for `document.fonts.load()` |
| `loadCustomFont(file)` | Returns custom font descriptor |
| `prepareFontCss(font)` | Injects `<link>` for non-core font; idempotent |
| `fontString(px, family)` | CSS font string with Kalam+Gulzar fallbacks |
| `FALLBACK` | `'"Kalam", "Gulzar", sans-serif'` |

### `js/papers.js` — exports

| Export | Notes |
|--------|-------|
| `W`, `H` | 1240, 1754 (page units at 150 DPI) |
| `MM` | `W / 210` — mm→px conversion |
| `PAPERS[]` | 20 paper objects `{id, name, note, bg, layout, draw(ctx), plain?}` |
| `getPaper(id)` | Returns paper or `PAPERS[0]` |
| `plainBaselines(paper, spacingMm)` | Generates baselines for plain paper |

`layout` shape:
```js
{ baselines[], pitch, sizePitch, left, right,
  slots: { page:{x,y}, date:{x,y} },
  marginX, xHeight?, exactBaseline? }
```

### `js/languages.js` — exports

| Export | Notes |
|--------|-------|
| `LANGUAGES[]` | 37 entries `{id, name, native, script, sample, text?, font?, labels}` |
| `getLanguage(id)` | Returns language or `LANGUAGES[0]` |
| `detectScript(text)` | Returns script string or null |

### `js/export.js` — exports
`buildPdf(pages)`, `buildZip(files)`, `canvasBlob(canvas, type, quality)`, `crc32(Uint8Array)`, `download(blob, filename)`

### `js/import.js` — exports
`importFile(file)` — returns `Promise<string>`

### `js/sw.js` (service worker scope)

Cache: `tth-v2`

| Resource | Strategy |
|----------|----------|
| App shell (all JS/CSS/root HTML) | Network-first, cache on success, fallback to cache |
| `/fonts/*`, `/icons/*` | Cache-first |
| Other same-origin GET | Network-first with cache fallback |
| Non-GET / cross-origin | Pass-through (not handled) |

Navigation requests are normalised to `/` for put/match.

---

## Rendering coordinate system

- Page canvas: **1240 × 1754 px** (page units).
- `scale S` (preview ≈ 0.3–1.0; export = quality `0.8`/`1.0`/`1.5`) multiplies canvas dimensions.
- `ctx.setTransform(S, 0, 0, S, 0, 0)` set before drawing so paper-unit coordinates work everywhere.
- Per-glyph transform: `translate(x,y) · rotate(rot) · skew(slant) · scale(sx,sy)`.

---

## Conventions

1. **No external dependencies** in JS modules — keep it that way.
2. **No build step** — ES module imports use relative paths.
3. **Scratch canvases** (`scratchCanvases` in `engine.js`) are reused between pages; never allocate full-page canvases inside a render loop.
4. **`wrapCache`** is a global singleton in `engine.js`. Its key covers all layout-affecting parameters. Do not bypass it.
5. **Per-line PRNG**: seed = `hashStr(rawLine) ^ seed * 7919 ^ lineIndex * 131`. Stable across re-renders; "Re-write" only changes `state.seed`.
6. **RTL**: `strongDir()` detects direction per-word. `visualX()` mirrors RTL runs within lines. Always test Urdu and Hebrew when touching layout code.
7. **Cursive fonts** and complex scripts (`COMPLEX` regex) are drawn word-at-a-time. Do not change to per-character for these.

---

## Markup tokens

```
parseInline(str) → [{c, st:{em, hl, ul}}]   per character
parseLine(raw)   → {type:'text'|'break', level:0|1|2, align:'left'|'center', chars[]}
```

Heading levels: 0 = body, 1 = `#` (1.28×, centred, underlined), 2 = `##` (1.12×, left, underlined).

---

## State defaults

```js
{ text, lang:'en', font:'kalam', paper:'classic', ink:'blue', inkCustom:'#1b3d93',
  headingInk:'same', highlight:'yellow', penWeight:0.25, size:1, messiness:0.45,
  slant:0, letterSpacing:0, wordSpacing:1, marginShift:0, mistakes:0,
  lineMode:'every', plainSpacing:9, headerMode:'none',
  fields:{name,roll,cls,subject,teacher,date,title,institute,kind},
  customFields:[],
  pageNumbers:false, dateOnPages:false, effect:'none', quality:'1.5', seed:1 }
```

Persisted to `localStorage['tth-settings-v1']`.

---

## Workflow: adding a feature from a reference APK

When given a JADX-decompiled APK as reference, follow this process:

1. **Locate the feature in the reference** — search class/method names, UI strings, asset patterns.
2. **Understand the algorithm** — note parameters and edge cases (RTL, script differences, etc.).
3. **Map to this project's architecture**:
   - New markup syntax → `parseInline` / `parseLine` in `engine.js`
   - New paper style → `papers.js` (`PAPERS[]` + `makeRuled`/`makeGrid`/custom)
   - New font → `fonts.js` (`FONTS[]`) + `css/fonts.css` + woff2 file
   - New language → `languages.js` (`LANGUAGES[]`)
   - New ink/effect → `engine.js` (`INKS` / `applyEffect`)
   - New export format → `export.js`
   - New UI control → `index.html` + `app.js` (`DEFAULTS`, `bindControls`, `syncInputs`)
4. **Implement using existing patterns** — reuse `makeRuled`, `rng`, `penLine`, `scratch`, etc.
5. **Test for regressions** (see checklist below).
6. **Update docs** — `doc/t2h-analysis.md` and `README.md` for user-facing changes.

---

## Known issues

| Issue | Impact |
|-------|--------|
| SW registered at `/sw.js`, file at `js/sw.js` | Offline/install fails unless server remaps the path |
| Non-core font CSS not local | Cannot test non-Latin fonts without a connected server |
| Mistakes only on ASCII words ≥5 chars | Limited cut-out simulation |
| `canFilter` Chrome-only | Scan/photo effects degraded on Firefox |
| `DecompressionStream` not in old Safari | .docx import fails |
| PDF has no text layer | Inaccessible, not searchable |

---

## Quick regression checklist

- [ ] Default English text renders on Classic Notebook with Kalam font
- [ ] `# Title` is centred and underlined
- [ ] `**bold**` renders in heading ink colour
- [ ] `==highlight==` renders with yellow multiply highlight
- [ ] Urdu text renders RTL on the correct baseline
- [ ] "Re-write" changes jitter but not layout
- [ ] PDF download opens correctly in a viewer
- [ ] Settings survive a page reload (localStorage round-trip)
- [ ] Custom font upload appears in the font grid and renders
