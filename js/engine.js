// Layout and rendering of handwritten pages.
//
// Markup understood in the text box:
//   # Title        centred heading, underlined
//   ## Sub heading  left heading, underlined
//   >> text         centred line
//   **text**        written with the heading / marker ink
//   ==text==        highlighter
//   __text__        underlined
//   Tab             jumps to the middle column
//   ---             new page
import { W, H, MM, getPaper, plainBaselines } from './papers.js';
import { fontMetrics, fontString } from './fonts.js';

export const INKS = {
  blue: { name: 'Blue ballpoint', color: '#1b3d93' },
  'dark-blue': { name: 'Royal blue', color: '#142a66' },
  black: { name: 'Black gel', color: '#1c1c21' },
  pencil: { name: 'Pencil', color: '#55565b', pencil: true },
  red: { name: 'Red', color: '#b5131f' },
  green: { name: 'Green', color: '#13653a' },
  purple: { name: 'Purple', color: '#4a2a85' },
};

export const HIGHLIGHTS = {
  yellow: 'rgba(255,232,20,0.55)',
  green: 'rgba(120,235,80,0.45)',
  pink: 'rgba(255,110,190,0.42)',
  blue: 'rgba(80,195,255,0.42)',
  orange: 'rgba(255,165,50,0.48)',
};

const HEADING_SCALE = [1, 1.28, 1.12];

// ---------- random ----------
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const jit = (R, amt) => (R() - 0.5) * 2 * amt;

// ---------- parsing ----------
function parseInline(str) {
  const out = [];
  const st = { em: false, hl: false, ul: false };
  for (let i = 0; i < str.length; ) {
    const two = str.substr(i, 2);
    if (two === '**') { st.em = !st.em; i += 2; continue; }
    if (two === '==') { st.hl = !st.hl; i += 2; continue; }
    // "__" toggles underline, but a run like "______" stays a written blank.
    if (two === '__' && str[i - 1] !== '_' && str[i + 2] !== '_') { st.ul = !st.ul; i += 2; continue; }
    out.push({ c: str[i], st: { ...st } });
    i++;
  }
  return out;
}

function parseLine(raw) {
  const line = raw.replace(/\s+$/, '');
  if (/^\s*(---+|\[page\])\s*$/i.test(line)) return { type: 'break' };
  let m;
  if ((m = line.match(/^\s*(#{1,2})\s+(.*)$/))) {
    const level = m[1].length;
    return { type: 'text', level, align: level === 1 ? 'center' : 'left', chars: parseInline(m[2]) };
  }
  if ((m = line.match(/^\s*>>\s?(.*)$/))) return { type: 'text', level: 0, align: 'center', chars: parseInline(m[1]) };
  return { type: 'text', level: 0, align: 'left', chars: parseInline(line) };
}

function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const styleKey = (st) => `${+st.em}${+st.hl}${+st.ul}`;

// ---------- scripts & direction ----------
const RTL = /[֐-ࣿיִ-﷿ﹰ-﻿]/;
const LTR = /[A-Za-zÀ-ɏḀ-ỿͰ-ԯऀ-෿฀-໿ᄀ-ᇿ぀-ヿ㐀-鿿豈-﫿가-힯]/;
// Letters that join or combine (Arabic, Indic, Thai...) are drawn a whole
// word at a time so the browser can shape them; per-letter drawing would
// break them apart.
const COMPLEX = /[֐-ࣿऀ-෿฀-໿ༀ-࿿က-႟ក-៿יִ-﷿ﹰ-﻿‌‍]|\p{M}/u;
// Scripts written without spaces between words.
const NOSPACE = /[฀-໿က-႟ក-៿　-ヿ㐀-鿿豈-﫿＀-￯]/;

function strongDir(text) {
  for (const ch of text) {
    if (RTL.test(ch)) return 'rtl';
    if (LTR.test(ch)) return 'ltr';
  }
  return null;
}

const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'word' }) : null;

// Break a run of Thai / Chinese / Japanese text into words that may wrap
// separately. Pieces after the first are glued on without a space.
function splitNoSpace(word) {
  const text = word.segs.map((s) => s.t).join('');
  if (!NOSPACE.test(text)) return [word];
  const styles = [];
  for (const s of word.segs) for (let i = 0; i < s.t.length; i++) styles.push(s.st);
  let pieces = [];
  if (segmenter) {
    for (const p of segmenter.segment(text)) pieces.push({ start: p.index, end: p.index + p.segment.length, word: p.isWordLike });
  } else {
    let i = 0;
    for (const ch of text) { pieces.push({ start: i, end: i + ch.length, word: true }); i += ch.length; }
  }
  // Punctuation stays with the word before it, so no line starts with "。".
  const merged = [];
  for (const p of pieces) {
    if (!p.word && merged.length) merged[merged.length - 1].end = p.end;
    else merged.push(p);
  }
  return merged.map((p, n) => {
    const segs = [];
    for (let i = p.start; i < p.end; i++) {
      const last = segs[segs.length - 1];
      if (last && last.st === styles[i]) last.t += text[i];
      else segs.push({ t: text[i], st: styles[i] });
    }
    return { segs, tab: n === 0 && word.tab, join: n > 0 };
  });
}

function charsToWords(chars) {
  let indent = 0;
  while (indent < chars.length && chars[indent].c === ' ') indent++;
  const words = [];
  let cur = null;
  let tabNext = false;
  for (let i = indent; i < chars.length; i++) {
    const { c, st } = chars[i];
    if (c === ' ' || c === '\t') {
      if (cur) { words.push(cur); cur = null; }
      if (c === '\t') tabNext = true;
      continue;
    }
    if (!cur) { cur = { segs: [], tab: tabNext }; tabNext = false; }
    const last = cur.segs[cur.segs.length - 1];
    if (last && styleKey(last.st) === styleKey(st)) last.t += c;
    else cur.segs.push({ t: c, st });
  }
  if (cur) words.push(cur);
  return { words: words.flatMap(splitNoSpace), indent };
}

// ---------- measuring ----------
function makeMeasurer(family, px, ls, cursive) {
  const ctx = document.createElement('canvas').getContext('2d');
  const cache = new Map();
  return {
    cursive,
    space(scale = 1) {
      ctx.font = fontString(px * scale, family);
      return Math.max(ctx.measureText(' ').width, px * scale * 0.34);
    },
    // Letter spacing only applies to words drawn letter by letter.
    text(t, scale = 1, whole = cursive) {
      const k = scale + (whole ? '|w|' : '|') + t;
      if (cache.has(k)) return cache.get(k);
      ctx.font = fontString(px * scale, family);
      const w = ctx.measureText(t).width + (whole ? 0 : [...t].length * ls * scale);
      cache.set(k, w);
      return w;
    },
    word(word, scale = 1) {
      let x = 0;
      for (const s of word.segs) {
        s.ox = x;
        s.w = this.text(s.t, scale, word.whole);
        x += s.w;
      }
      word.w = x;
      return x;
    },
  };
}

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
function makeMistake(word, R) {
  const t = word.segs.map((s) => s.t).join('');
  const letters = t.replace(/[^a-z]/gi, '');
  if (letters.length < 5 || letters.length !== t.length) return null;
  const k = 2 + Math.floor(R() * Math.min(3, t.length - 3));
  let part = t.slice(0, k);
  if (R() < 0.6) part = part.slice(0, -1) + LETTERS[Math.floor(R() * 26)];
  return { segs: [{ t: part, st: word.segs[0].st }], strike: true };
}

function wrapBlock(block, M, avail, opts, R, allowMistakes) {
  const level = block.level;
  const scale = HEADING_SCALE[level];
  const { words: raw, indent } = charsToWords(block.chars);
  const words = [];
  for (const w of raw) {
    if (allowMistakes && level === 0 && opts.mistakes > 0 && R() < opts.mistakes * 0.035) {
      const m = makeMistake(w, R);
      if (m) words.push(m);
    }
    words.push(w);
  }
  const dir = strongDir(block.chars.map((c) => c.c).join('')) || 'ltr';
  for (const w of words) {
    const text = w.segs.map((s) => s.t).join('');
    w.whole = M.cursive || COMPLEX.test(text);
    w.dir = strongDir(text);
  }
  const spaceW = M.space(scale);
  const lines = [];
  let line = { words: [], level, align: block.align, dir, w: 0 };
  let x = indent * spaceW;
  const push = () => { lines.push(line); line = { words: [], level, align: block.align, dir, w: 0 }; x = 0; };

  for (const w of words) {
    let ww = M.word(w, scale);
    // A single word wider than the line is split over several lines.
    if (ww > avail && w.segs.length === 1) {
      const t = w.segs[0].t;
      let cut = t.length;
      while (cut > 1 && M.text(t.slice(0, cut), scale) > avail * 0.95) cut--;
      const rest = { segs: [{ t: t.slice(cut), st: w.segs[0].st }], whole: w.whole, dir: w.dir, join: true };
      w.segs[0].t = t.slice(0, cut);
      ww = M.word(w, scale);
      words.splice(words.indexOf(w) + 1, 0, rest);
    }
    const gap = line.words.length && !w.join ? spaceW * opts.wordSpacing * (0.82 + R() * 0.36) : 0;
    let nx = x + gap;
    if (w.tab) nx = Math.max(nx, avail * 0.52);
    if (line.words.length && nx + ww > avail) {
      push();
      nx = 0;
    }
    w.x = nx;
    line.words.push(w);
    x = nx + ww;
    line.w = x;
  }
  lines.push(line);
  return lines;
}

// ---------- header / cover ----------
// Header rows: two "Label: value" pairs per line, or one per line when a
// pair doesn't fit in its half of the page.
function headerRows(f, t) {
  const pairs = [
    [t.name, f.name], [t.roll, f.roll], [t.cls, f.cls], [t.subject, f.subject],
    [t.date, f.date], [t.teacher, f.teacher],
  ].filter(([, v]) => v && v.trim()).map(([k, v]) => `**${k}:** ${v.trim()}`);
  const rows = [];
  for (let i = 0; i < pairs.length; i += 2) rows.push(pairs.slice(i, i + 2));
  return rows;
}

function coverText(f, t) {
  const v = (k) => (f[k] || '').trim();
  const out = [];
  if (v('institute')) out.push(`# ${v('institute')}`, '');
  out.push(`# ${v('kind') || t.assignment}`);
  if (v('title')) out.push(`>> ${v('title')}`);
  out.push('');
  if (v('subject')) out.push(`>> **${t.subject}:** ${v('subject')}`, '');
  if (v('name') || v('roll') || v('cls')) {
    out.push(`>> **${t.by}:**`);
    if (v('name')) out.push(`>> ${v('name')}`);
    if (v('roll')) out.push(`>> ${t.roll}: ${v('roll')}`);
    if (v('cls')) out.push(`>> ${v('cls')}`);
    out.push('');
  }
  if (v('teacher')) out.push(`>> **${t.to}:**`, `>> ${v('teacher')}`, '');
  if (v('date')) out.push(`>> **${t.date}:** ${v('date')}`);
  return out.join('\n');
}

// ---------- document layout ----------
let wrapCache = { key: '', M: null, map: new Map() };

const LATIN_LIKE = { latin: 1, 'latin-ext': 1, vietnamese: 1 };

export function layoutDocument(opts, font, lang) {
  const paper = getPaper(opts.paper);
  const L = paper.layout;
  let baselines = L.baselines;
  let pitch = L.pitch;
  let sizePitch = L.sizePitch;
  if (paper.plain) {
    ({ baselines, pitch } = plainBaselines(paper, opts.plainSpacing));
    sizePitch = pitch;
  }
  const script = LATIN_LIKE[lang.script] ? 'latin' : lang.script;
  const fm = fontMetrics(font.family, script);
  // 4-line copy: lowercase fills the middle band, capitals reach the top line.
  let px;
  if (fm.body) px = sizePitch / fm.body;
  else if (L.xHeight) px = Math.min((L.xHeight * 1.2) / fm.xh, (L.xHeight * 2) / Math.max(fm.cap, fm.asc));
  else px = Math.min((sizePitch * 0.36) / fm.xh, (sizePitch * 0.88) / Math.max(fm.cap, fm.asc));
  px *= opts.size;

  const left = L.left + opts.marginShift * MM;
  const right = L.right;
  const avail = right - left;
  const cursive = !!font.cursive;
  const ls = cursive ? 0 : opts.letterSpacing;

  // Wrapped lines are cached per source line, so typing in one paragraph of a
  // 100-page document only re-wraps that paragraph. Each line gets its own
  // random stream (from its text) so cached lines stay identical.
  const key = [font.family, px, ls, opts.wordSpacing, opts.mistakes, opts.seed, avail].join('|');
  const fresh = wrapCache.key !== key;
  const M = fresh ? makeMeasurer(font.family, px, ls, cursive) : wrapCache.M;
  const prev = fresh ? new Map() : wrapCache.map;
  const next = new Map();
  const seen = new Map();
  const wrapLine = (raw, mistakes) => {
    const id = (mistakes ? 'm' : 'h') + raw;
    const n = (seen.get(id) || 0) + 1;
    seen.set(id, n);
    const k = n + '\u0000' + id;
    let lines = prev.get(k);
    if (!lines) {
      const b = parseLine(raw);
      lines = b.type === 'break'
        ? [{ pageBreak: true }]
        : wrapBlock(b, M, avail, opts, rng(hashStr(raw) ^ Math.imul(opts.seed, 7919) ^ Math.imul(n, 131)), mistakes);
    }
    next.set(k, lines);
    return lines;
  };
  const wrapAll = (text, mistakes) => {
    const out = [];
    for (const raw of text.replace(/\r/g, '').split('\n')) for (const l of wrapLine(raw, mistakes)) out.push(l);
    return out;
  };

  const step = opts.lineMode === 'alternate' ? 2 : 1;
  const pages = [];
  let page = null;
  let idx = 0;
  const f = opts.fields || {};
  const headerLines = [];
  if (opts.headerMode === 'first' || opts.headerMode === 'every') {
    for (const [a, b] of headerRows(f, lang.labels)) {
      const both = b ? wrapAll(`${a}\t${b}`, false) : [];
      if (both.length === 1 && both[0].w <= avail) headerLines.push(...both);
      else headerLines.push(...wrapAll(a, false), ...(b ? wrapAll(b, false) : []));
    }
    if (f.title && f.title.trim()) headerLines.push(...wrapAll(`# ${f.title.trim()}`, false));
    if (headerLines.length) headerLines.push(...wrapAll('', false));
  }

  const newPage = () => {
    page = { lines: [] };
    pages.push(page);
    idx = 0;
    const withHeader = opts.headerMode === 'every' || (opts.headerMode === 'first' && pages.length === 1);
    if (withHeader) for (const l of headerLines) place(l, true);
  };
  const place = (line, force) => {
    if (idx >= baselines.length) {
      if (force) return;
      newPage();
    }
    // Don't start a page with an empty line that only came from overflow.
    if (!force && idx === 0 && !line.words.length) return;
    page.lines.push({ ...line, bi: idx });
    idx += step;
  };

  if (opts.headerMode === 'cover') {
    const cover = wrapAll(coverText(f, lang.labels), false).filter((l) => !l.pageBreak);
    const coverStep = cover.length * 2 <= baselines.length ? 2 : 1;
    const start = Math.max(0, Math.floor((baselines.length - cover.length * coverStep) / 2.4));
    const cp = { lines: [], cover: true };
    cover.forEach((l, i) => {
      const bi = start + i * coverStep;
      if (bi < baselines.length) cp.lines.push({ ...l, bi });
    });
    pages.push(cp);
  }

  newPage();
  for (const line of wrapAll(opts.text || '', true)) {
    if (line.pageBreak) {
      if (page.lines.length) newPage();
      continue;
    }
    place(line, false);
  }
  // Drop trailing empty pages (e.g. a final "---").
  while (pages.length > 1 && !pages[pages.length - 1].lines.some((l) => l.words.length)) pages.pop();

  wrapCache = { key, M, map: next };
  return { pages, paper, L, baselines, pitch, px, fm, font, left, right, avail, M, cursive };
}

// ---------- textures & effects ----------
const noiseTiles = {};
function getNoise(kind) {
  if (noiseTiles[kind]) return noiseTiles[kind];
  const c = document.createElement('canvas');
  c.width = c.height = 160;
  const g = c.getContext('2d');
  const img = g.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    if (kind === 'alpha') {
      img.data[i + 3] = Math.random() ** 2.2 * 255;
    } else if (kind === 'fine') {
      const v = 205 + Math.random() * 50;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    } else {
      const v = 222 + Math.random() * 33;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  if (kind === 'grey') {
    // Paper grain is soft, not per-pixel static (which also bloats JPEGs):
    // upscale a quarter-size patch with smoothing.
    const soft = document.createElement('canvas');
    soft.width = soft.height = 160;
    const sg = soft.getContext('2d');
    sg.imageSmoothingQuality = 'high';
    sg.drawImage(c, 0, 0, 40, 40, 0, 0, 160, 160);
    noiseTiles[kind] = soft;
    return soft;
  }
  noiseTiles[kind] = c;
  return c;
}

// kinds: 'grey' soft paper grain, 'fine' per-pixel camera/scanner noise,
// 'alpha' specks erased out of the ink.
function noise(ctx, alpha, op = 'multiply', kind = op === 'destination-out' ? 'alpha' : 'grey') {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = op;
  ctx.fillStyle = ctx.createPattern(getNoise(kind), 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function paperTexture(ctx, R) {
  noise(ctx, 0.22);
  ctx.save();
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 140; i++) {
    const x = R() * W;
    const y = R() * H;
    const len = 4 + R() * 14;
    const a = R() * Math.PI;
    ctx.strokeStyle = R() < 0.5 ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + jit(R, 2), y + Math.sin(a) * len * 0.5 + jit(R, 2), x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.restore();
}

// Full-page scratch canvases are reused between pages instead of allocating
// two new 8 MB canvases per page.
const scratchCanvases = {};
function scratch(name, S) {
  let c = scratchCanvases[name];
  if (!c) c = scratchCanvases[name] = document.createElement('canvas');
  const w = Math.round(W * S);
  const h = Math.round(H * S);
  if (c.width !== w || c.height !== h) {
    c.width = w;
    c.height = h;
  }
  return c;
}

// The printed paper (lines + grain) is the same on every page, so it is drawn
// once per paper style and scale and then copied.
const paperCache = new Map();
function paperImage(paper, S) {
  const k = paper.id + '|' + S;
  let c = paperCache.get(k);
  if (!c) {
    if (paperCache.size >= 2) paperCache.delete(paperCache.keys().next().value);
    c = document.createElement('canvas');
    c.width = W * S;
    c.height = H * S;
    const ctx = c.getContext('2d');
    ctx.setTransform(S, 0, 0, S, 0, 0);
    paper.draw(ctx);
    paperTexture(ctx, rng(hashStr(paper.id)));
    paperCache.set(k, c);
  }
  return c;
}

const canFilter = (() => {
  try {
    const c = document.createElement('canvas').getContext('2d');
    c.filter = 'blur(1px)';
    return c.filter === 'blur(1px)';
  } catch {
    return false;
  }
})();

function applyEffect(target, src, effect, scale, R) {
  target.width = src.width;
  target.height = src.height;
  const c = target.getContext('2d');
  const w = src.width;
  const h = src.height;
  if (effect === 'scan') {
    c.fillStyle = '#d9d9d5';
    c.fillRect(0, 0, w, h);
    c.save();
    c.translate(w / 2, h / 2);
    c.rotate(jit(R, 0.0045));
    if (canFilter) c.filter = 'contrast(1.07) brightness(1.02) saturate(0.9)';
    c.drawImage(src, -w / 2 + jit(R, 4) * scale, -h / 2 + jit(R, 4) * scale);
    c.restore();
    c.setTransform(scale, 0, 0, scale, 0, 0);
    noise(c, 0.6, 'multiply', 'fine');
    const edge = (x0, y0, x1, y1) => {
      const g = c.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, 'rgba(0,0,0,0.10)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    };
    edge(0, 0, 18, 0);
    edge(0, 0, 0, 14);
  } else if (effect === 'photo') {
    c.fillStyle = '#5c5145';
    c.fillRect(0, 0, w, h);
    c.save();
    c.translate(w / 2, h / 2);
    c.rotate(jit(R, 0.008));
    c.scale(1.035, 1.035);
    if (canFilter) c.filter = `saturate(0.88) sepia(0.10) brightness(0.98) blur(${0.45 * scale}px)`;
    c.drawImage(src, -w / 2, -h / 2);
    c.restore();
    c.setTransform(scale, 0, 0, scale, 0, 0);
    const lx = W * (0.25 + R() * 0.3);
    const ly = H * (0.2 + R() * 0.2);
    const g = c.createRadialGradient(lx, ly, H * 0.05, lx, ly, H * 1.05);
    g.addColorStop(0, 'rgba(255,252,240,0)');
    g.addColorStop(1, 'rgba(70,58,45,0.42)');
    c.save();
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    const s = c.createLinearGradient(W, H, W * 0.55, H * 0.55);
    s.addColorStop(0, 'rgba(40,35,30,0.20)');
    s.addColorStop(1, 'rgba(40,35,30,0)');
    c.fillStyle = s;
    c.fillRect(0, 0, W, H);
    c.restore();
    noise(c, 0.7, 'multiply', 'fine');
  } else {
    c.drawImage(src, 0, 0);
  }
}

// ---------- drawing ----------
function rgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgba = ([r, g, b], a, k = 1) =>
  `rgba(${Math.round(Math.min(255, r * k))},${Math.round(Math.min(255, g * k))},${Math.round(Math.min(255, b * k))},${a.toFixed(3)})`;

function penLine(ctx, pts, width, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
  }
  const l = pts[pts.length - 1];
  ctx.lineTo(l[0], l[1]);
  ctx.stroke();
  ctx.restore();
}

function underline(ctx, x0, x1, y, px, color, R) {
  const pts = [];
  const n = Math.max(3, Math.round((x1 - x0) / 60));
  for (let i = 0; i <= n; i++) pts.push([x0 + ((x1 - x0) * i) / n + jit(R, 2), y + jit(R, px * 0.035) + (i / n) * jit(R, px * 0.08)]);
  penLine(ctx, pts, Math.max(1.4, px * 0.05), color);
}

function scribble(ctx, x0, x1, y, px, color, R) {
  const top = y - px * 0.5;
  const bot = y - px * 0.02;
  if (R() < 0.5) {
    const pts = [];
    let up = true;
    for (let x = x0 - 3; x <= x1 + 3; x += px * (0.1 + R() * 0.06)) {
      pts.push([x, (up ? top : bot) + jit(R, px * 0.06)]);
      up = !up;
    }
    penLine(ctx, pts, Math.max(1.4, px * 0.055), color);
  } else {
    for (let k = 0; k < 2; k++) {
      const yy = y - px * (0.22 + k * 0.14);
      penLine(ctx, [[x0 - 4, yy + jit(R, 3)], [(x0 + x1) / 2, yy + jit(R, 3)], [x1 + 4, yy + jit(R, 3)]], Math.max(1.4, px * 0.05), color);
    }
  }
}

function highlight(ctx, x0, x1, y, px, color, R) {
  const top = y - px * 0.66;
  const bot = y + px * 0.14;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x0 - 3 + jit(R, 2), top + jit(R, 3));
  ctx.lineTo(x1 + 3 + jit(R, 2), top + jit(R, 3));
  ctx.lineTo(x1 + 5 + jit(R, 2), bot + jit(R, 3));
  ctx.lineTo(x0 - 1 + jit(R, 2), bot + jit(R, 3));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Offset of a segment inside its word as drawn (right-to-left words run
// their segments from the right).
const segX = (w, s) => (w.dir === 'rtl' && w.whole ? w.w - s.ox - s.w : s.ox);

// Visual x of every word in a line. Lines are laid out in reading order;
// right-to-left lines are mirrored, and runs of the other direction inside a
// line (English words in Urdu, Urdu words in English) keep their own order.
function visualX(line) {
  const ws = line.words;
  const n = ws.length;
  const pd = line.dir || 'ltr';
  const dirs = ws.map((w) => w.dir);
  for (let i = 0; i < n; i++) {
    if (ws[i].dir) continue;
    let p = i - 1;
    while (p >= 0 && !ws[p].dir) p--;
    let q = i + 1;
    while (q < n && !ws[q].dir) q++;
    const before = p >= 0 ? ws[p].dir : pd;
    const after = q < n ? ws[q].dir : pd;
    dirs[i] = before === after ? before : pd;
  }
  const xs = ws.map((w) => w.x);
  for (let i = 0; i < n; ) {
    if (dirs[i] === pd) { i++; continue; }
    let j = i;
    while (j + 1 < n && dirs[j + 1] !== pd) j++;
    const a = ws[i].x;
    const b = ws[j].x + ws[j].w;
    for (let k = i; k <= j; k++) xs[k] = a + b - (ws[k].x + ws[k].w);
    i = j + 1;
  }
  return pd === 'rtl' ? xs.map((x, k) => line.w - (x + ws[k].w)) : xs;
}

function spans(words, xs, test, joinGap) {
  const raw = [];
  words.forEach((w, k) => {
    for (const s of w.segs) {
      if (!test(s.st)) continue;
      const a = xs[k] + segX(w, s);
      raw.push([a, a + s.w]);
    }
  });
  raw.sort((p, q) => p[0] - q[0]);
  const out = [];
  for (const [a, b] of raw) {
    const last = out[out.length - 1];
    if (last && a - last[1] < joinGap) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}

export function renderPage(target, doc, pageIndex, opts, scale = 1) {
  const { paper, baselines, pitch, px, fm, font, left, avail, M } = doc;
  const L = paper.layout;
  const page = doc.pages[pageIndex];
  const S = scale;

  // With no effect the page is drawn straight into the target canvas.
  const base = opts.effect === 'none' ? target : scratch('base', S);
  if (base === target) {
    target.width = W * S;
    target.height = H * S;
  }
  const ctx = base.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(paperImage(paper, S), 0, 0);
  ctx.setTransform(S, 0, 0, S, 0, 0);

  const layer = scratch('layer', S);
  const t = layer.getContext('2d');
  t.setTransform(1, 0, 0, 1, 0, 0);
  t.clearRect(0, 0, layer.width, layer.height);
  t.textBaseline = 'alphabetic';

  const inkDef = INKS[opts.ink] || INKS.blue;
  const ink = rgb(opts.ink === 'custom' ? opts.inkCustom : inkDef.color);
  const head = opts.headingInk === 'same' ? ink : rgb(opts.headingInk === 'custom' ? opts.headingCustom : (INKS[opts.headingInk] || inkDef).color);
  const pencil = !!inkDef.pencil && opts.ink !== 'custom';
  const messy = opts.messiness;
  const slant = Math.tan((opts.slant * Math.PI) / 180);
  const weight = opts.penWeight * px * 0.035;
  const hlColor = HIGHLIGHTS[opts.highlight] || HIGHLIGHTS.yellow;
  const family = font.family;
  const plainDrift = paper.plain ? 2.2 : 1;

  // translate(x, y) . rotate(rot) . skew(slant) . scale(sx, sy), page scale included.
  const place = (x, y, rot, sx, sy) => {
    const c = Math.cos(rot);
    const n = Math.sin(rot);
    t.setTransform(S * c * sx, S * n * sx, S * (-c * slant - n) * sy, S * (c - n * slant) * sy, S * x, S * y);
  };
  const glyph = (str, col, a, shade) => {
    t.fillStyle = rgba(col, a, shade);
    t.fillText(str, 0, 0);
  };

  const drawWord = (w, x, y, level, R, flow) => {
    const scale = HEADING_SCALE[level];
    const size = px * scale;
    const dyW = jit(R, messy * px * 0.05);
    const rotW = jit(R, messy * 0.012);
    const sW = 1 + jit(R, messy * 0.03);
    const shade = 1 + jit(R, 0.08);
    t.direction = w.dir === 'rtl' ? 'rtl' : 'ltr';
    t.textAlign = 'left';
    t.font = fontString(size, family);
    for (const s of w.segs) {
      const col = s.st.em || level > 0 ? head : ink;
      const baseA = pencil ? 0.72 : 0.9;
      if (w.whole) {
        place(x + segX(w, s), y + dyW, rotW, sW, sW + jit(R, messy * 0.02));
        const a = Math.min(1, baseA + R() * 0.1) * flow;
        glyph(s.t, col, a, shade);
      } else {
        let prefix = '';
        for (const ch of s.t) {
          const cx = s.ox + (prefix ? M.text(prefix, scale, false) : 0) + jit(R, messy * px * 0.02);
          prefix += ch;
          if (ch === ' ') continue;
          const sc = sW + jit(R, messy * 0.05);
          place(x + cx, y + dyW + jit(R, messy * px * 0.045), rotW + jit(R, messy * 0.07), sc, sc + jit(R, messy * 0.04));
          const a = Math.min(1, baseA + R() * 0.12) * flow;
          glyph(ch, col, a, shade);
        }
      }
    }
    t.setTransform(S, 0, 0, S, 0, 0);
    if (w.strike) scribble(t, x, x + w.w, y, px, rgba(ink, 0.9), R);
  };

  for (const line of page.lines) {
    if (!line.words.length) continue;
    const R = rng(opts.seed * 101 + pageIndex * 7717 + line.bi * 131 + 1);
    const rule = baselines[line.bi];
    const y0 = rule - fm.base * px * HEADING_SCALE[line.level] - (L.exactBaseline ? 0 : pitch * 0.045);
    const slope = jit(R, messy * 0.011 * plainDrift);
    const freq = 0.6 + R() * 1.4;
    const phase = R() * Math.PI * 2;
    const amp = messy * pitch * 0.028 * plainDrift;
    let off = jit(R, messy * px * 0.35);
    if (line.align === 'center') off = (avail - line.w) / 2 + jit(R, messy * px * 0.6);
    else if (line.dir === 'rtl') off = avail - line.w - Math.abs(off);
    const yAt = (x) => y0 + slope * x + Math.sin((x / avail) * Math.PI * 2 * freq + phase) * amp;
    const x0 = left + off;
    const xs = visualX(line);

    const sp = M.space(HEADING_SCALE[line.level]) * 2;
    for (const [a, b] of spans(line.words, xs, (st) => st.hl, sp)) highlight(ctx, x0 + a, x0 + b, yAt(a), px, hlColor, R);

    const flowPhase = R() * Math.PI * 2;
    line.words.forEach((w, k) => {
      const flow = 0.93 + 0.07 * Math.sin(w.x / 140 + flowPhase);
      drawWord(w, x0 + xs[k], yAt(xs[k]), line.level, R, flow);
    });

    const ulCol = line.level > 0 ? rgba(head, 0.88) : rgba(ink, 0.88);
    if (line.level > 0) {
      const a = Math.min(...xs);
      const b = Math.max(...line.words.map((w, k) => xs[k] + w.w));
      underline(t, x0 + a - 4, x0 + b + 6, yAt(a) + px * 0.2, px, ulCol, R);
    } else {
      for (const [a, b] of spans(line.words, xs, (st) => st.ul, sp)) underline(t, x0 + a - 2, x0 + b + 3, yAt(a) + px * 0.18, px, ulCol, R);
    }
  }

  // Page number and date in the header band.
  if (!page.cover) {
    const R = rng(opts.seed * 53 + pageIndex * 11);
    const number = pageIndex + 1 - (doc.pages[0].cover ? 1 : 0);
    const small = (str, slot) => {
      const w = { segs: [{ t: str, st: {} }] };
      M.word(w, 0.9);
      drawWord(w, slot.x + jit(R, 4), slot.y + jit(R, 2), 0, R, 1);
    };
    if (opts.pageNumbers) small(String(number), L.slots.page);
    const date = (opts.fields?.date || '').trim();
    if (opts.dateOnPages && date) small(date, L.slots.date);
  }

  // Pen thickness: spread the whole ink layer by a fraction of a pixel. Much
  // cheaper than stroking every glyph.
  if (weight > 0) {
    const d = weight * S * 0.7;
    t.setTransform(1, 0, 0, 1, 0, 0);
    t.globalAlpha = 0.55;
    t.drawImage(layer, d, 0);
    t.drawImage(layer, 0, d * 0.8);
    t.globalAlpha = 1;
  }

  // Ink texture: grain for pencil, a light ballpoint skip otherwise.
  t.setTransform(S, 0, 0, S, 0, 0);
  noise(t, pencil ? 0.85 : 0.3, 'destination-out');

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'multiply';
  // Ink bleed: a soft copy made by halving the resolution and scaling back up
  // (a blur filter on a full page is several times slower).
  const bleed = scratch('bleed', S / 2);
  const b = bleed.getContext('2d');
  b.clearRect(0, 0, bleed.width, bleed.height);
  b.drawImage(layer, 0, 0, bleed.width, bleed.height);
  ctx.globalAlpha = 0.35;
  ctx.drawImage(bleed, 0, 0, layer.width, layer.height);
  ctx.globalAlpha = 1;
  ctx.drawImage(layer, 0, 0);
  ctx.restore();

  if (base !== target) applyEffect(target, base, opts.effect, S, rng(opts.seed * 3 + pageIndex));
  return target;
}

// Small paper thumbnail for the picker.
export function renderPaperThumb(canvas, paper) {
  const s = canvas.width / W;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(s, 0, 0, s, 0, 0);
  paper.draw(ctx);
}
