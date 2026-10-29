import { getFont, ensureFont, fontsFor, prepareFontCss, loadCustomFont } from './fonts.js';
import { LANGUAGES, getLanguage, detectScript } from './languages.js';
import { PAPERS, W, H } from './papers.js';
import { INKS, layoutDocument, renderPage, renderPaperThumb } from './engine.js';
import { buildPdf, buildZip, canvasBlob, crc32, download } from './export.js';
import { importFile } from './import.js';

const SAMPLE = `Hello, I am Raj Chourasiya. Welcome To Our Website Text To Handwriting Converter. Please Paste Your Text Into The Page, Select Your Best Handwriting whatever you Want, Change The Handwriting Size, and Then Click the Generate Image Button. Your Computer Text is Successfully Converted into Human Handwriting.`;

const DEFAULTS = {
  text: SAMPLE,
  lang: 'en',
  font: 'kalam',
  paper: 'classic',
  ink: 'blue',
  inkCustom: '#1b3d93',
  headingInk: 'same',
  highlight: 'yellow',
  penWeight: 0.25,
  size: 1,
  messiness: 0.45,
  slant: 0,
  letterSpacing: 0,
  wordSpacing: 1,
  marginShift: 0,
  mistakes: 0,
  lineMode: 'every',
  plainSpacing: 9,
  headerMode: 'none',
  fields: { name: '', roll: '', cls: '', subject: '', teacher: '', date: '', title: '', institute: '', kind: '' },
  customFields: [],
  pageNumbers: false,
  dateOnPages: false,
  effect: 'none',
  quality: '1.5',
  seed: 1,
};

const STORE = 'tth-settings-v1';
const $ = (id) => document.getElementById(id);

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (saved && typeof saved === 'object') {
      return {
        ...DEFAULTS,
        ...saved,
        fields: { ...DEFAULTS.fields, ...(saved.fields || {}) },
        customFields: Array.isArray(saved.customFields)
          ? saved.customFields.map((c) => ({ title: String(c.title || ''), value: String(c.value || '') }))
          : [],
      };
    }
  } catch {
    /* storage unavailable */
  }
  return structuredClone(DEFAULTS);
}

let state = loadState();
if (!['0.8', '1', '1.5'].includes(state.quality)) state.quality = DEFAULTS.quality;
let customFont = null;
if (state.font === 'custom') state.font = DEFAULTS.font;

// Saving is debounced: serialising a 100-page text on every keystroke is slow.
let saveTimer = 0;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 1000);
}
function saveNow() {
  clearTimeout(saveTimer);
  try {
    localStorage.setItem(STORE, JSON.stringify(state));
  } catch {
    // Too large for storage: keep the settings, drop the text.
    try {
      localStorage.setItem(STORE, JSON.stringify({ ...state, text: '' }));
    } catch {
      /* storage unavailable */
    }
  }
}

// ---------- controls ----------
const SLIDERS = {
  size: (v) => `${Math.round(v * 100)}%`,
  messiness: (v) => `${Math.round(v * 100)}%`,
  slant: (v) => `${v}°`,
  letterSpacing: (v) => `${v}px`,
  wordSpacing: (v) => `${Math.round(v * 100)}%`,
  marginShift: (v) => `${v} mm`,
  mistakes: (v) => (v == 0 ? 'Off' : `${Math.round(v * 100)}%`),
  penWeight: (v) => `${Math.round(v * 100)}%`,
  plainSpacing: (v) => `${v} mm`,
};

const lang = () => getLanguage(state.lang);
const LATIN_LIKE = ['latin', 'latin-ext', 'vietnamese'];
const ARABIC_LIKE = ['arabic', 'urdu', 'persian'];
const HAN_LIKE = ['sc', 'tc', 'ja'];
const sameFamily = (a, b) =>
  a === b || [LATIN_LIKE, ARABIC_LIKE, HAN_LIKE].some((g) => g.includes(a) && g.includes(b));

function buildLanguageSelect() {
  const sel = $('lang');
  sel.innerHTML = LANGUAGES.map((l) => `<option value="${l.id}">${l.native === l.name ? l.name : `${l.native} — ${l.name}`}</option>`).join('');
  sel.value = state.lang;
  sel.addEventListener('change', () => setLanguage(sel.value));
}

const SAMPLES = new Set([SAMPLE, ...LANGUAGES.map((l) => l.text).filter(Boolean)]);

function setLanguage(id) {
  const l = getLanguage(id);
  const patch = { lang: l.id };
  const fonts = fontsFor(l.script);
  if (!fonts.some((f) => f.id === state.font) && !(customFont && state.font === 'custom')) patch.font = l.font || fonts[0].id;
  // Swap the demo text for one in the new language, but never the user's own.
  if (SAMPLES.has(state.text.trim())) {
    patch.text = l.text || SAMPLE;
    $('text').value = patch.text;
  }
  $('lang').value = l.id;
  set(patch);
  buildFontGrid();
}

// Suggest the right language when the text is in another script.
function updateLanguageHint() {
  const box = $('lang-hint');
  const found = detectScript(state.text);
  if (!found || sameFamily(found, lang().script)) {
    box.hidden = true;
    return;
  }
  const target = LANGUAGES.find((l) => l.script === found) || LANGUAGES.find((l) => sameFamily(l.script, found));
  if (!target) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  box.innerHTML = '';
  const msg = document.createElement('span');
  msg.textContent = `Your text looks like ${target.name}. `;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'link';
  btn.textContent = `Use ${target.name} handwriting →`;
  btn.addEventListener('click', () => setLanguage(target.id));
  box.append(msg, btn);
}

function buildFontGrid() {
  const grid = $('fonts');
  grid.innerHTML = '';
  const list = fontsFor(lang().script);
  if (customFont) list.unshift(customFont);
  for (const f of list) {
    prepareFontCss(f);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'font-card';
    b.setAttribute('role', 'radio');
    b.dataset.id = f.id;
    b.innerHTML = `<span class="sample"></span><span class="meta"><b></b><small></small></span>`;
    const sample = b.querySelector('.sample');
    sample.textContent = lang().sample;
    sample.dir = 'auto';
    sample.style.fontFamily = `"${f.family}", cursive`;
    b.querySelector('b').textContent = f.name;
    b.querySelector('small').textContent = f.tag;
    b.addEventListener('click', () => set({ font: f.id }));
    grid.appendChild(b);
  }
  syncSelections();
}

function buildPaperGrid() {
  const grid = $('papers');
  for (const p of PAPERS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'paper-card';
    b.setAttribute('role', 'radio');
    b.dataset.id = p.id;
    b.title = p.note;
    const c = document.createElement('canvas');
    c.width = 124;
    c.height = Math.round((124 * H) / W);
    renderPaperThumb(c, p);
    const label = document.createElement('span');
    label.textContent = p.name;
    b.append(c, label);
    b.addEventListener('click', () => set({ paper: p.id }));
    grid.appendChild(b);
  }
}

function buildInks() {
  const box = $('inks');
  for (const [id, ink] of Object.entries(INKS)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.dataset.id = id;
    b.title = ink.name;
    b.setAttribute('aria-label', ink.name);
    b.style.background = ink.color;
    b.addEventListener('click', () => set({ ink: id }));
    box.appendChild(b);
  }
  const custom = document.createElement('label');
  custom.className = 'swatch custom';
  custom.dataset.id = 'custom';
  custom.title = 'Custom colour';
  custom.innerHTML = '<input type="color" aria-label="Custom ink colour">';
  const input = custom.querySelector('input');
  input.value = state.inkCustom;
  input.addEventListener('input', () => set({ ink: 'custom', inkCustom: input.value }));
  box.appendChild(custom);

  const sel = $('headingInk');
  sel.innerHTML = '<option value="same">Same as text</option>' +
    Object.entries(INKS).filter(([id]) => id !== 'pencil').map(([id, i]) => `<option value="${id}">${i.name}</option>`).join('');
}

function syncSelections() {
  for (const el of document.querySelectorAll('.font-card')) el.setAttribute('aria-checked', el.dataset.id === state.font);
  for (const el of document.querySelectorAll('.paper-card')) el.setAttribute('aria-checked', el.dataset.id === state.paper);
  for (const el of document.querySelectorAll('.swatch')) el.classList.toggle('on', el.dataset.id === state.ink);
  for (const el of document.querySelectorAll('#effect button')) el.setAttribute('aria-checked', el.dataset.value === state.effect);
  $('font-name').textContent = getFont(state.font, customFont).name;
  const paper = PAPERS.find((p) => p.id === state.paper) || PAPERS[0];
  $('paper-name').textContent = paper.name;
  $('plain-row').hidden = !paper.plain;
}

function syncCustomFields() {
  const container = $('custom-fields');
  if (!container) return;
  container.innerHTML = '';
  (state.customFields || []).forEach((field, index) => {
    const row = document.createElement('div');
    row.className = 'custom-field-row';
    row.innerHTML = `
      <label>Field title
        <input type="text" dir="auto" placeholder="e.g. Batch" value="${field.title ? field.title.replace(/"/g, '&quot;') : ''}" data-idx="${index}" data-type="title">
      </label>
      <label>Value
        <input type="text" dir="auto" placeholder="e.g. 2024-2028" value="${field.value ? field.value.replace(/"/g, '&quot;') : ''}" data-idx="${index}" data-type="value">
      </label>
      <button type="button" class="custom-field-remove" title="Remove field" data-idx="${index}">✕</button>
    `;
    const titleInput = row.querySelector('[data-type="title"]');
    const valInput = row.querySelector('[data-type="value"]');
    const removeBtn = row.querySelector('.custom-field-remove');

    titleInput.addEventListener('input', (e) => {
      state.customFields[index].title = e.target.value;
      save();
      scheduleRender();
    });
    valInput.addEventListener('input', (e) => {
      state.customFields[index].value = e.target.value;
      save();
      scheduleRender();
    });
    removeBtn.addEventListener('click', () => {
      state.customFields.splice(index, 1);
      save();
      syncCustomFields();
      scheduleRender();
    });
    container.appendChild(row);
  });
}

function syncInputs() {
  $('text').value = state.text;
  for (const [k, fmt] of Object.entries(SLIDERS)) {
    $(k).value = state[k];
    $(`${k}-out`).textContent = fmt(state[k]);
  }
  for (const k of ['headingInk', 'highlight', 'lineMode', 'headerMode', 'quality']) $(k).value = state[k];
  for (const k of ['pageNumbers', 'dateOnPages']) $(k).checked = state[k];
  for (const el of document.querySelectorAll('[data-field]')) el.value = state.fields[el.dataset.field] || '';
  syncCustomFields();
  syncSelections();
}

function set(patch) {
  Object.assign(state, patch);
  save();
  syncSelections();
  scheduleRender();
}

function bindControls() {
  $('text').addEventListener('input', (e) => set({ text: e.target.value }));
  for (const [k, fmt] of Object.entries(SLIDERS)) {
    $(k).addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      $(`${k}-out`).textContent = fmt(v);
      set({ [k]: v });
    });
  }
  for (const k of ['headingInk', 'highlight', 'lineMode', 'headerMode', 'quality']) {
    $(k).addEventListener('change', (e) => set({ [k]: e.target.value }));
  }
  for (const k of ['pageNumbers', 'dateOnPages']) {
    $(k).addEventListener('change', (e) => set({ [k]: e.target.checked }));
  }
  for (const el of document.querySelectorAll('[data-field]')) {
    el.addEventListener('input', () => set({ fields: { ...state.fields, [el.dataset.field]: el.value } }));
  }
  const addFieldBtn = $('add-field');
  if (addFieldBtn) {
    addFieldBtn.addEventListener('click', () => {
      if (!Array.isArray(state.customFields)) state.customFields = [];
      state.customFields.push({ title: '', value: '' });
      save();
      syncCustomFields();
      const rows = document.querySelectorAll('.custom-field-row');
      if (rows.length) {
        const lastInput = rows[rows.length - 1].querySelector('input');
        if (lastInput) lastInput.focus();
      }
    });
  }
  for (const b of document.querySelectorAll('#effect button')) {
    b.addEventListener('click', () => set({ effect: b.dataset.value }));
  }
  for (const b of document.querySelectorAll('#markup button')) {
    b.addEventListener('click', () => insertMarkup(b.dataset.wrap));
  }
  $('text').addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      insertMarkup('\t|');
    }
  });
  $('font-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      customFont = await loadCustomFont(file);
      buildFontGrid();
      set({ font: 'custom' });
    } catch {
      alert('Sorry, this font file could not be loaded. Please try a .ttf or .otf file.');
    }
  });
  $('regen').addEventListener('click', () => set({ seed: Math.floor(Math.random() * 1e6) + 1 }));
  $('reset').addEventListener('click', () => {
    state = structuredClone({ ...DEFAULTS, text: state.text });
    save();
    syncInputs();
    scheduleRender();
  });
  $('import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await importFile(file);
      $('text').value = text;
      set({ text });
    } catch {
      alert('Sorry, this file could not be read. Please use a .txt or .docx file.');
    }
  });
  // No confirm() popup: in-app browsers (WhatsApp, Instagram...) block it,
  // which made Clear do nothing. Clear at once and offer Undo instead.
  let undoText = null;
  let undoTimer = 0;
  $('clear').addEventListener('click', () => {
    const btn = $('clear');
    clearTimeout(undoTimer);
    if (undoText !== null) {
      $('text').value = undoText;
      set({ text: undoText });
      undoText = null;
      btn.textContent = 'Clear';
      return;
    }
    if (!state.text) return;
    undoText = state.text;
    $('text').value = '';
    set({ text: '' });
    $('text').focus();
    btn.textContent = 'Undo';
    undoTimer = setTimeout(() => {
      undoText = null;
      btn.textContent = 'Clear';
    }, 8000);
  });
  $('cancel').addEventListener('click', () => { cancelExport = true; });
  window.addEventListener('pagehide', saveNow);
  $('pdf').addEventListener('click', () => exportAll('pdf'));
  $('zip').addEventListener('click', () => exportAll('zip'));
  $('print').addEventListener('click', () => exportAll('print'));
}

// Wrap the selection with markup; "|" marks where the selection goes.
function insertMarkup(wrap) {
  const ta = $('text');
  const [before, after] = wrap.split('|');
  const { selectionStart: s, selectionEnd: e, value } = ta;
  const sel = value.slice(s, e);
  ta.value = value.slice(0, s) + before + sel + after + value.slice(e);
  const pos = s + before.length + sel.length + (sel ? after.length : 0);
  ta.focus();
  ta.setSelectionRange(pos, pos);
  set({ text: ta.value });
}

// ---------- rendering ----------
// Only the pages near the screen are drawn, at screen resolution. Pages that
// scroll far away give their canvas memory back, so a 100-page document
// costs about as much as a 5-page one.
let timer = 0;
let doc = null;
let version = 0;
let docVersion = 0;
let previewScale = 0.5;
const near = new Set();
let observer = null;
let pumping = false;

function scheduleRender() {
  clearTimeout(timer);
  // Wait a little longer between keystrokes when the document is long.
  const delay = Math.min(600, 150 + (state.text.length / 1000) * 2);
  timer = setTimeout(renderAll, delay);
}

const frame = () => new Promise((r) => requestAnimationFrame(() => r()));

async function prepare(opts = state) {
  const font = getFont(opts.font, customFont);
  const l = getLanguage(opts.lang);
  const f = opts.fields || {};
  const cf = (opts.customFields || []).map((c) => (c.title || '') + (c.value || '')).join('');
  await ensureFont(font, opts.text + Object.values(f).join('') + cf + Object.values(l.labels).join(''));
  return layoutDocument(opts, font, l);
}

function makeObserver() {
  observer?.disconnect();
  const box = $('pages');
  const scrolls = getComputedStyle(box).overflowY !== 'visible';
  observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = Number(e.target.dataset.index);
      if (e.isIntersecting) near.add(i);
      else {
        near.delete(i);
        release(e.target);
      }
    }
    pump();
  }, { root: scrolls ? box : null, rootMargin: '1200px 0px' });
  near.clear();
  for (const el of box.children) observer.observe(el);
}

function release(fig) {
  const c = fig.querySelector('canvas');
  if (c.width) {
    c.width = 0;
    c.height = 0;
  }
  fig.dataset.version = '';
}

function makePage(i) {
  const fig = document.createElement('figure');
  fig.className = 'page';
  fig.dataset.index = i;
  fig.innerHTML = '<canvas width="0" height="0"></canvas><figcaption><span></span><button type="button" class="link">Download PNG</button></figcaption>';
  fig.querySelector('button').addEventListener('click', () => exportPage(Number(fig.dataset.index)));
  return fig;
}

async function renderAll() {
  const v = ++version;
  const d = await prepare();
  if (v !== version) return;
  doc = d;
  docVersion++;
  const box = $('pages');
  const n = d.pages.length;
  const frag = document.createDocumentFragment();
  for (let i = box.children.length; i < n; i++) frag.appendChild(makePage(i));
  box.appendChild(frag);
  while (box.children.length > n) {
    observer?.unobserve(box.lastChild);
    near.delete(box.children.length - 1);
    box.lastChild.remove();
  }
  for (let i = 0; i < n; i++) {
    const fig = box.children[i];
    observer?.observe(fig);
    fig.querySelector('span').textContent = d.pages[i].cover ? 'Cover page' : `Page ${i + 1} of ${n}`;
    fig.querySelector('canvas').setAttribute('aria-label', `Handwritten page ${i + 1}`);
  }
  const cssWidth = box.firstElementChild?.clientWidth || 600;
  previewScale = Math.min(1, Math.max(0.3, Math.round(((cssWidth * (window.devicePixelRatio || 1)) / W) * 10) / 10));
  updateStats();
  updateLanguageHint();
  pump();
}

// Draw outdated pages that are near the screen, one per frame.
async function pump() {
  if (pumping || !doc) return;
  pumping = true;
  try {
    const box = $('pages');
    for (;;) {
      const v = docVersion;
      const todo = [...near].sort((a, b) => a - b).find((i) => i < doc.pages.length && box.children[i]?.dataset.version !== String(v));
      if (todo === undefined) break;
      const fig = box.children[todo];
      renderPage(fig.querySelector('canvas'), doc, todo, state, previewScale);
      fig.dataset.version = v;
      await frame();
    }
  } finally {
    pumping = false;
  }
}

function updateStats() {
  const words = (state.text.match(/\S+/g) || []).length;
  const pages = doc ? doc.pages.length : 0;
  const t = `${words.toLocaleString()} words · ${pages} page${pages === 1 ? '' : 's'}`;
  $('stats').textContent = t;
  if (!exporting) $('status').textContent = t;
}

// ---------- export ----------
let exporting = false;
let cancelExport = false;

const baseName = () => {
  const t = (state.fields.title || state.fields.subject || 'handwriting').trim().toLowerCase();
  return t.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'handwriting';
};

async function exportPage(i) {
  const d = doc || (await prepare());
  const c = renderPage(document.createElement('canvas'), d, i, state, Number(state.quality));
  download(await canvasBlob(c, 'image/png'), `${baseName()}-page-${i + 1}.png`);
}

function pageRange(n) {
  const from = Math.min(n, Math.max(1, parseInt($('from').value, 10) || 1));
  const to = Math.min(n, Math.max(from, parseInt($('to').value, 10) || n));
  return [from - 1, to - 1];
}

function progress(done, total, started) {
  const box = $('progress');
  box.hidden = false;
  $('progress-bar').style.width = `${(done / total) * 100}%`;
  let text = `Page ${Math.min(done + 1, total)} of ${total}`;
  if (done >= 2) {
    const left = ((performance.now() - started) / done) * (total - done) / 1000;
    text += left > 60 ? ` · about ${Math.ceil(left / 60)} min left` : ` · about ${Math.ceil(left)} s left`;
  }
  $('progress-text').textContent = text;
}

// Pages are rendered one at a time into a single canvas and kept only as
// compressed JPEG blobs, so memory stays low even for 100+ pages.
async function exportAll(kind) {
  if (exporting) return;
  exporting = true;
  cancelExport = false;
  const buttons = ['pdf', 'zip', 'print'].map($);
  buttons.forEach((b) => (b.disabled = true));
  const status = $('status');
  try {
    const opts = structuredClone(state);
    const d = await prepare(opts);
    const [first, last] = pageRange(d.pages.length);
    const total = last - first + 1;
    // Printing 100 HD images can exhaust a phone's memory.
    const scale = kind === 'print' && total > 30 ? Math.min(1, Number(opts.quality)) : Number(opts.quality);
    const canvas = document.createElement('canvas');
    const out = [];
    const started = performance.now();
    for (let i = first; i <= last; i++) {
      if (cancelExport) {
        status.textContent = 'Cancelled';
        return;
      }
      progress(i - first, total, started);
      await frame();
      renderPage(canvas, d, i, opts, scale);
      const blob = await canvasBlob(canvas, 'image/jpeg', scale < 1 ? 0.78 : 0.85);
      const page = { blob, width: canvas.width, height: canvas.height, name: `${baseName()}-page-${i + 1}.jpg` };
      if (kind === 'zip') page.crc = crc32(new Uint8Array(await blob.arrayBuffer()));
      out.push(page);
    }
    canvas.width = canvas.height = 0;
    progress(total, total, started);
    if (kind === 'pdf') download(buildPdf(out), `${baseName()}.pdf`);
    else if (kind === 'zip') download(buildZip(out), `${baseName()}.zip`);
    else await printPages(out.map((p) => p.blob));
    status.textContent = `Done ✓ ${total} page${total === 1 ? '' : 's'}`;
  } catch (err) {
    console.error(err);
    status.textContent = 'Something went wrong, please try again';
  } finally {
    exporting = false;
    $('progress').hidden = true;
    buttons.forEach((b) => (b.disabled = false));
  }
}

async function printPages(blobs) {
  const root = $('print-root');
  root.innerHTML = '';
  const urls = blobs.map((b) => URL.createObjectURL(b));
  await Promise.all(urls.map((u) => new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = resolve;
    img.src = u;
    root.appendChild(img);
  })));
  const cleanup = () => {
    root.innerHTML = '';
    urls.forEach((u) => URL.revokeObjectURL(u));
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
}

// ---------- init ----------
$('year').textContent = new Date().getFullYear();
buildInks();
buildLanguageSelect();
buildFontGrid();
buildPaperGrid();
syncInputs();
bindControls();
// ---------- PWA ----------
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
let installPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
  $('install').hidden = false;
});
$('install').addEventListener('click', async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice.catch(() => {});
  installPrompt = null;
  $('install').hidden = true;
});
window.addEventListener('appinstalled', () => { $('install').hidden = true; });

makeObserver();
window.matchMedia('(max-width: 900px)').addEventListener('change', makeObserver);
renderAll();
document.fonts.ready.then(() => scheduleRender());
