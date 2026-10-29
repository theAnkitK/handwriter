# Text to Handwriting Converter

> Convert typed text into realistic handwritten pages — free, private, works offline.  
> A product of [DaFontStyle](https://dafontstyle.io/) · live at <https://text-to-handwriting.dafontstyle.io/>

---

## What it does

Paste text, choose a handwriting font and a paper style, and the app renders A4 pages that look written by hand. Every letter is drawn with randomised size, angle, and ink pressure, so the result looks natural rather than mechanical. Pages can be exported as a **PDF**, a **ZIP of JPEG images**, or sent directly to the **printer**.

Everything runs in the browser — your text never leaves your device.

---

## Features

| Category | Details |
|----------|---------|
| **Handwriting fonts** | 57 fonts across 20+ scripts (Latin, Urdu Nastaliq, Arabic, Persian, Hindi/Devanagari, Bangla, Gurmukhi, Gujarati, Tamil, Telugu, Kannada, Malayalam, Thai, Chinese Simplified/Traditional, Japanese, Korean, Cyrillic, Greek, Hebrew) |
| **Languages** | 37 UI languages with translated assignment-header labels and demo text |
| **Paper styles** | 20 styles: classic notebook, Pakistani register, assignment sheet, college/wide/narrow ruled, spiral, exam answer sheet, practical/lab file, A4 lined, Cornell notes, English 4-line copy, maths squared, graph, engineering, dotted journal, legal pad, vintage, kraft, plain A4 |
| **Ink colours** | Blue ballpoint, royal blue, black gel, pencil, red, green, purple + custom colour picker |
| **Writing adjustments** | Size, messiness, slant, letter spacing, word spacing, left margin gap, cut-outs / mistakes, every-line or alternate-line mode |
| **Assignment header** | Name, roll no, class, subject, teacher, date, title + add multiple custom fields (title & value); on first page, every page, or as a separate cover page |
| **Post-effects** | Clean, scanned, phone-photo look |
| **Export** | PDF (JPEG pages), ZIP of images, print, single-page PNG |
| **Import** | `.txt`, `.md`, `.docx` (headings preserved) |
| **PWA** | Installable; service worker for offline use |

---

## Markup reference

Inside the textarea:

| Syntax | Effect |
|--------|--------|
| `# Title` | Centred heading, underlined |
| `## Sub-heading` | Left sub-heading, underlined |
| `**text**` | Heading / marker ink colour |
| `==text==` | Highlighter |
| `__text__` | Underline |
| `>> text` | Centre a single line |
| `---` on its own line | Start a new page |
| `Tab` key | Jump to the middle column |
| Blank line | Empty line on the page |

---

## Project structure

```
index.html             Single-page app shell
manifest.webmanifest   PWA manifest
README.md              Project README
SKILL.md               AI / developer context (module contracts, conventions, workflow)
doc/
  t2h-analysis.md      Full architecture analysis
css/
  style.css            All UI styles
  fonts.css            @font-face for 20 bundled fonts
js/
  app.js               Orchestrator: state, controls, render scheduling, export
  engine.js            Text layout + canvas drawing + post-effects
  fonts.js             Font registry, metrics, lazy loading, custom-font upload
  papers.js            Paper drawing routines and baseline arrays
  languages.js         Language registry and script detection
  export.js            Hand-written PDF 1.4 and ZIP writers
  import.js            .txt/.docx reader (no dependencies)
  sw.js                Service worker (cache tth-v2, offline support)
fonts/
  <family>/            Self-hosted .woff2 slices (SIL OFL / Apache 2.0)
icons/
  *.png                App icons (192, 512, maskable, apple-touch)
```

---

## Architecture at a glance

```
User input ──► app.js (state + debounce)
                  │
                  ├─► fonts.js      (ensureFont, fontMetrics)
                  ├─► languages.js  (getLanguage, detectScript)
                  ├─► papers.js     (getPaper, baselines)
                  └─► engine.js     (layoutDocument → renderPage)
                            │
                            ├── parseInline / parseLine / wrapBlock
                            ├── IntersectionObserver lazy rendering
                            ├── Mulberry32 PRNG per-line jitter
                            ├── paperImage cache (paper bg drawn once)
                            └── applyEffect (scan / photo)

Export path:
  app.js ──► engine.js (renderPage into temp canvas)
         ──► export.js (buildPdf / buildZip / window.print)
```

---

## Technology

- **Vanilla ES modules** — no build step, no framework, no bundler
- **HTML Canvas 2D** — all rendering; layout measured with `ctx.measureText`
- **CSS Grid** — two-column responsive layout (≤900 px stacks to single column)
- **`FontFace` API** — dynamic font loading, custom font upload
- **`Intl.Segmenter`** — CJK/Thai word breaking (graceful fallback)
- **`DecompressionStream`** — in-browser deflate for .docx import
- **`IntersectionObserver`** — lazy per-frame rendering of pages near the viewport
- **`localStorage`** — settings persistence (debounced 1 s, falls back on quota exceeded)

---

## Development notes

- No build step required. Open `index.html` directly over a local HTTP server (e.g. `python3 -m http.server`) — ES modules do not work from `file://`.
- Non-core fonts (Indic, Arabic/Urdu, CJK, Cyrillic) load their CSS from `/fonts/<id>/font.css` at runtime. These files must be present on the server but are not included here.
- `js/sw.js` (service worker): Implements offline cache (`tth-v2`). Note that `app.js` registers `/sw.js`, so the server must either serve `js/sw.js` at root `/sw.js` or rewrite/redirect it.
- Default quality is `1.5` (HD, 225 DPI equivalent). Canvas size for export: 1860 × 2631 px.

---

## Randomisation & reproducibility

The "Re-write" button increments `state.seed`, which is threaded through the entire render pipeline. The same `seed` always produces the same page. Per-line seeds are derived from `hashStr(rawLine) XOR seed` so editing one paragraph does not change unrelated lines.

---

## License

Font files are used under their respective licenses (SIL OFL 1.1 or Apache 2.0).  
Application source: © DaFontStyle.
