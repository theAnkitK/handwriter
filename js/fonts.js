// Handwriting fonts, self-hosted under /fonts/<id>/ (all SIL OFL / Apache
// 2.0, fetched by tools/fetch_fonts.py).
//  - scripts: what the font can write, measured from its glyphs.
//  - cursive: joined-up letters, drawn word by word to keep the joins.
//  - core: declared in css/fonts.css; other fonts load their own stylesheet
//    (fonts/<id>/font.css) the first time they are needed.
const LATIN = ['latin'];
const LATIN_EXT = ['latin', 'latin-ext'];

export const FONTS = [
  // Latin
  { id: 'kalam', family: 'Kalam', name: 'Kalam', tag: 'Neat student', scripts: [...LATIN_EXT, 'devanagari'], core: true },
  { id: 'patrick-hand', family: 'Patrick Hand', name: 'Patrick Hand', tag: 'Clean print', scripts: [...LATIN_EXT, 'vietnamese'], core: true },
  { id: 'handlee', family: 'Handlee', name: 'Handlee', tag: 'Rounded print', scripts: LATIN, core: true },
  { id: 'architects-daughter', family: 'Architects Daughter', name: 'Architects Daughter', tag: 'Engineer print', scripts: LATIN_EXT, core: true },
  { id: 'indie-flower', family: 'Indie Flower', name: 'Indie Flower', tag: 'Friendly', scripts: LATIN_EXT, core: true },
  { id: 'gochi-hand', family: 'Gochi Hand', name: 'Gochi Hand', tag: 'Bold marker', scripts: LATIN, core: true },
  { id: 'annie-use-your-telescope', family: 'Annie Use Your Telescope', name: 'Annie', tag: 'Tall & quick', scripts: LATIN_EXT, core: true },
  { id: 'caveat', family: 'Caveat', name: 'Caveat', tag: 'Fast notes', scripts: [...LATIN_EXT, 'cyrillic'], core: true },
  { id: 'shadows-into-light', family: 'Shadows Into Light', name: 'Shadows Into Light', tag: 'Light & tidy', scripts: LATIN_EXT, core: true },
  { id: 'covered-by-your-grace', family: 'Covered By Your Grace', name: 'Covered By Your Grace', tag: 'Teen casual', scripts: LATIN, core: true },
  { id: 'gloria-hallelujah', family: 'Gloria Hallelujah', name: 'Gloria', tag: 'Bubbly', scripts: LATIN_EXT, core: true },
  { id: 'reenie-beanie', family: 'Reenie Beanie', name: 'Reenie Beanie', tag: 'Ballpoint scribble', scripts: LATIN, core: true },
  { id: 'nanum-pen-script', family: 'Nanum Pen Script', name: 'Nanum Pen', tag: 'Narrow pen', scripts: ['latin', 'ko'] },
  { id: 'homemade-apple', family: 'Homemade Apple', name: 'Homemade Apple', tag: 'Real cursive', cursive: true, scripts: LATIN, core: true },
  { id: 'cedarville-cursive', family: 'Cedarville Cursive', name: 'Cedarville', tag: 'School cursive', cursive: true, scripts: LATIN, core: true },
  { id: 'la-belle-aurore', family: 'La Belle Aurore', name: 'La Belle Aurore', tag: 'Slanted cursive', cursive: true, scripts: LATIN, core: true },
  { id: 'dawning-of-a-new-day', family: 'Dawning of a New Day', name: 'Dawning', tag: 'Loose cursive', cursive: true, scripts: LATIN, core: true },
  { id: 'nothing-you-could-do', family: 'Nothing You Could Do', name: 'Nothing You Could Do', tag: 'Messy cursive', cursive: true, scripts: LATIN, core: true },
  { id: 'zeyada', family: 'Zeyada', name: 'Zeyada', tag: 'Quick signature', cursive: true, scripts: LATIN_EXT, core: true },
  { id: 'playwrite-gb-s', family: 'Playwrite GB S', name: 'Playwrite GB', tag: 'British school', cursive: true, scripts: [...LATIN_EXT, 'vietnamese'], core: true },
  { id: 'playpen-sans', family: 'Playpen Sans', name: 'Playpen Sans', tag: 'Neat print', scripts: [...LATIN_EXT, 'vietnamese', 'cyrillic', 'greek'] },
  // Urdu, Arabic, Persian
  { id: 'gulzar', family: 'Gulzar', name: 'Gulzar', tag: 'Nastaliq', scripts: ['urdu', 'persian', 'arabic'] },
  { id: 'noto-nastaliq-urdu', family: 'Noto Nastaliq Urdu', name: 'Noto Nastaliq', tag: 'Classic Nastaliq', scripts: ['urdu', 'persian', 'arabic'] },
  { id: 'aref-ruqaa', family: 'Aref Ruqaa', name: 'Aref Ruqaa', tag: 'Ruqʿah handwriting', scripts: ['arabic', 'urdu', 'persian'] },
  { id: 'marhey', family: 'Marhey', name: 'Marhey', tag: 'Casual', scripts: ['arabic', 'urdu', 'persian'] },
  // Indic
  { id: 'amita', family: 'Amita', name: 'Amita', tag: 'Calligraphic', scripts: [...LATIN_EXT, 'devanagari'] },
  { id: 'tillana', family: 'Tillana', name: 'Tillana', tag: 'Quick pen', scripts: [...LATIN_EXT, 'devanagari'] },
  { id: 'galada', family: 'Galada', name: 'Galada', tag: 'Flowing', scripts: ['latin', 'bengali'] },
  { id: 'atma', family: 'Atma', name: 'Atma', tag: 'Casual', scripts: [...LATIN_EXT, 'bengali'] },
  { id: 'baloo-da-2', family: 'Baloo Da 2', name: 'Baloo Da', tag: 'Rounded neat', scripts: ['latin', 'bengali'] },
  { id: 'baloo-paaji-2', family: 'Baloo Paaji 2', name: 'Baloo Paaji', tag: 'Rounded neat', scripts: ['latin', 'gurmukhi'] },
  { id: 'farsan', family: 'Farsan', name: 'Farsan', tag: 'Handwritten', scripts: ['latin', 'gujarati'] },
  { id: 'baloo-bhai-2', family: 'Baloo Bhai 2', name: 'Baloo Bhai', tag: 'Rounded neat', scripts: ['latin', 'gujarati'] },
  { id: 'kavivanar', family: 'Kavivanar', name: 'Kavivanar', tag: 'Handwritten', scripts: ['latin', 'tamil'] },
  { id: 'baloo-thambi-2', family: 'Baloo Thambi 2', name: 'Baloo Thambi', tag: 'Rounded neat', scripts: ['latin', 'tamil'] },
  { id: 'gurajada', family: 'Gurajada', name: 'Gurajada', tag: 'Handwritten', scripts: ['latin', 'telugu'] },
  { id: 'baloo-tammudu-2', family: 'Baloo Tammudu 2', name: 'Baloo Tammudu', tag: 'Rounded neat', scripts: ['latin', 'telugu'] },
  { id: 'baloo-tamma-2', family: 'Baloo Tamma 2', name: 'Baloo Tamma', tag: 'Rounded neat', scripts: ['latin', 'kannada'] },
  { id: 'baloo-chettan-2', family: 'Baloo Chettan 2', name: 'Baloo Chettan', tag: 'Rounded neat', scripts: ['latin', 'malayalam'] },
  // Thai
  { id: 'sriracha', family: 'Sriracha', name: 'Sriracha', tag: 'Handwritten', scripts: [...LATIN_EXT, 'vietnamese', 'thai'] },
  { id: 'itim', family: 'Itim', name: 'Itim', tag: 'Neat print', scripts: [...LATIN_EXT, 'vietnamese', 'thai'] },
  { id: 'mali', family: 'Mali', name: 'Mali', tag: 'Rounded', scripts: [...LATIN_EXT, 'vietnamese', 'thai'] },
  // Chinese, Japanese, Korean
  { id: 'long-cang', family: 'Long Cang', name: 'Long Cang', tag: 'Pen handwriting', scripts: ['sc'] },
  { id: 'zhi-mang-xing', family: 'Zhi Mang Xing', name: 'Zhi Mang Xing', tag: 'Quick pen', scripts: ['sc'] },
  { id: 'ma-shan-zheng', family: 'Ma Shan Zheng', name: 'Ma Shan Zheng', tag: 'Brush', scripts: ['sc'] },
  { id: 'lxgw-wenkai-tc', family: 'LXGW WenKai TC', name: 'LXGW WenKai', tag: 'Neat kai', scripts: ['tc', 'sc'] },
  { id: 'klee-one', family: 'Klee One', name: 'Klee One', tag: 'School textbook', scripts: ['ja', 'tc'] },
  { id: 'yomogi', family: 'Yomogi', name: 'Yomogi', tag: 'Casual', scripts: ['ja'] },
  { id: 'zen-kurenaido', family: 'Zen Kurenaido', name: 'Zen Kurenaido', tag: 'Brush pen', scripts: ['ja'] },
  { id: 'gaegu', family: 'Gaegu', name: 'Gaegu', tag: 'Cute', scripts: ['ko'] },
  { id: 'hi-melody', family: 'Hi Melody', name: 'Hi Melody', tag: 'Casual', scripts: ['ko'] },
  { id: 'gamja-flower', family: 'Gamja Flower', name: 'Gamja Flower', tag: 'Rounded', scripts: ['ko'] },
  // Cyrillic, Hebrew
  { id: 'marck-script', family: 'Marck Script', name: 'Marck Script', tag: 'Cursive', cursive: true, scripts: [...LATIN_EXT, 'cyrillic'] },
  { id: 'bad-script', family: 'Bad Script', name: 'Bad Script', tag: 'School cursive', cursive: true, scripts: [...LATIN_EXT, 'vietnamese', 'cyrillic'] },
  { id: 'neucha', family: 'Neucha', name: 'Neucha', tag: 'Print', scripts: ['latin', 'cyrillic'] },
  { id: 'gveret-levin', family: 'Gveret Levin', name: 'Gveret Levin', tag: 'Handwritten', scripts: ['hebrew'] },
  { id: 'amatic-sc', family: 'Amatic SC', name: 'Amatic SC', tag: 'Tall marker', scripts: [...LATIN_EXT, 'cyrillic', 'hebrew'] },
];

// A language's script -> which font scripts can write it.
const ACCEPTS = {
  latin: ['latin'],
  'latin-ext': ['latin-ext'],
  vietnamese: ['vietnamese'],
};

// Fonts made for another script (Baloo, Sriracha...) also contain Latin
// letters, but they are not offered for English & co.
const NON_LATIN_HOME = ['devanagari', 'bengali', 'gurmukhi', 'gujarati', 'tamil', 'telugu', 'kannada', 'malayalam', 'thai', 'arabic'];

export function fontsFor(script) {
  const want = ACCEPTS[script] || [script];
  return FONTS.filter((f) => {
    if (!want.some((s) => f.scripts.includes(s))) return false;
    if (ACCEPTS[script] && f.id !== 'kalam') return !f.scripts.some((s) => NON_LATIN_HOME.includes(s));
    return true;
  });
}

export function getFont(id, custom) {
  if (custom && id === custom.id) return custom;
  return FONTS.find((f) => f.id === id) ?? FONTS[0];
}

// Fallback for characters the chosen font doesn't have (e.g. English words
// inside Urdu text).
export const FALLBACK = '"Kalam", "Gulzar", sans-serif';
export const fontString = (px, family) => `${px}px "${family}", ${FALLBACK}`;

const cssLoads = new Map();
function loadCss(font) {
  if (font.core || font.custom) return Promise.resolve();
  if (!cssLoads.has(font.id)) {
    cssLoads.set(font.id, new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `/fonts/${font.id}/font.css`;
      link.onload = link.onerror = () => resolve();
      document.head.appendChild(link);
    }));
  }
  return cssLoads.get(font.id);
}

// Adds the font's stylesheet so its name can be shown in the picker.
export const prepareFontCss = loadCss;

// Load the font (and only the unicode-range slices this text needs).
export async function ensureFont(font, text = '') {
  await loadCss(font);
  let chars = 'Hello World';
  if (text) {
    const seen = new Set(text.length > 200000 ? text.slice(0, 200000) : text);
    seen.delete('\n');
    chars = [...seen].join('') || chars;
  }
  try {
    await Promise.all([
      document.fonts.load(`40px "${font.family}"`, chars),
      document.fonts.load('40px "Kalam"', chars),
    ]);
  } catch {
    /* fall back to whatever the browser has */
  }
}

// Glyph proportions measured from the real font, so every font sits on the
// ruled lines the same way. Latin-like scripts are sized by x-height; others
// by the height of typical letters (`ratio` of the line spacing).
const SCRIPT_METRIC = {
  devanagari: ['कमलन', 0.5],
  bengali: ['কমলন', 0.5],
  gurmukhi: ['ਕਮਲਨ', 0.5],
  gujarati: ['કમલન', 0.4],
  tamil: ['கமலன', 0.42],
  telugu: ['కమలన', 0.42],
  kannada: ['ಕಮಲನ', 0.42],
  malayalam: ['കമലന', 0.4],
  arabic: ['ا', 0.62],
  urdu: ['ا', 0.62],
  persian: ['ا', 0.62],
  hebrew: ['שמן', 0.4],
  thai: ['กมน', 0.36],
  sc: ['永国书', 0.62],
  tc: ['永國書', 0.62],
  ja: ['永国書', 0.62],
  ko: ['한국어', 0.6],
};

const metricsCache = new Map();

export function fontMetrics(family, script = 'latin') {
  const key = family + '|' + script;
  if (metricsCache.has(key)) return metricsCache.get(key);
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.font = `100px "${family}"`;
  const m = (s) => ctx.measureText(s);
  let out;
  if (SCRIPT_METRIC[script]) {
    const [sample, ratio] = SCRIPT_METRIC[script];
    const asc = Math.max(m(sample).actualBoundingBoxAscent, 1) / 100;
    out = { body: asc / ratio, base: 0 };
  } else {
    // Letters without ascenders or loops in any handwriting style.
    const xs = script === 'cyrillic' ? 'хнпш' : script === 'greek' ? 'ανυω' : 'xvwz';
    const xh = Math.max(m(xs).actualBoundingBoxAscent, 1) / 100;
    const cap = Math.max(m('HEFT').actualBoundingBoxAscent, 1) / 100;
    const asc = Math.max(m('bdfhklt').actualBoundingBoxAscent, 1) / 100;
    const base = m('acemnorsuvwxz').actualBoundingBoxDescent / 100;
    out = { xh, cap, asc, base: Math.max(-0.2, Math.min(base, 0.4)) };
  }
  // Only remember measurements taken with the real font, not a fallback that
  // was used because the font was still loading.
  if (document.fonts.check(`100px "${family}"`, SCRIPT_METRIC[script]?.[0] || 'xvwz')) metricsCache.set(key, out);
  return out;
}

export async function loadCustomFont(file) {
  const family = 'Custom ' + file.name.replace(/\.[^.]+$/, '').replace(/[^\w\s-]/g, '').slice(0, 40);
  const face = new FontFace(family, await file.arrayBuffer());
  await face.load();
  document.fonts.add(face);
  return {
    id: 'custom', family, name: file.name.replace(/\.[^.]+$/, ''), tag: 'Your font', custom: true,
    scripts: ['latin', 'latin-ext', 'vietnamese', 'cyrillic', 'greek', 'hebrew', 'arabic', 'urdu', 'persian', 'devanagari',
      'bengali', 'gurmukhi', 'gujarati', 'tamil', 'telugu', 'kannada', 'malayalam', 'thai', 'sc', 'tc', 'ja', 'ko'],
  };
}
