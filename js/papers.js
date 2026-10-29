// Paper styles. Everything is drawn in "page units": an A4 sheet 1240 x 1754
// (150 DPI). The renderer scales the context for HD output.
export const W = 1240;
export const H = 1754;
export const MM = W / 210;

const PRINT_FONT = '"Helvetica Neue", Arial, sans-serif';

function hlines(ctx, ys, x0, x1, color, w = 1.3) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  for (const y of ys) {
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
  }
  ctx.stroke();
}

function vline(ctx, x, y0, y1, color, w = 1.4) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x, y0);
  ctx.lineTo(x, y1);
  ctx.stroke();
}

function range(start, step, end) {
  const out = [];
  for (let v = start; v <= end + 0.01; v += step) out.push(v);
  return out;
}

function fill(ctx, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
}

function printed(ctx, text, x, y, color, size = 19, align = 'left') {
  ctx.font = `${size}px ${PRINT_FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

// Printed "Label ______" field; returns where handwriting should go.
function field(ctx, label, x, y, len, color) {
  printed(ctx, label, x, y, color);
  ctx.font = `19px ${PRINT_FONT}`;
  const lw = ctx.measureText(label).width + 8;
  hlines(ctx, [y + 3], x + lw, x + lw + len, color, 1.2);
  return { x: x + lw + 10, y: y - 2 };
}

function spiralHoles(ctx) {
  for (let y = 14 * MM; y < H - 8 * MM; y += 9.5 * MM) {
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.beginPath();
    ctx.ellipse(9 * MM + 2, y + 3, 2.6 * MM, 2.6 * MM, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3b3f46';
    ctx.beginPath();
    ctx.ellipse(9 * MM, y, 2.4 * MM, 2.4 * MM, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1d2026';
    ctx.beginPath();
    ctx.ellipse(9 * MM + 2, y + 2, 1.7 * MM, 1.7 * MM, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Generic ruled sheet. Measurements in mm.
function makeRuled(o) {
  const pitch = o.pitch * MM;
  const top = (o.top ?? 28) * MM;
  const bottom = H - (o.bottom ?? 12) * MM;
  const rules = range(top + pitch, pitch, bottom);
  const mx = o.margin != null ? o.margin * MM : null;
  const rmx = o.rightMargin != null ? W - o.rightMargin * MM : null;
  const left = mx != null ? mx + 3.2 * MM : (o.leftPad ?? 14) * MM;
  const right = (rmx ?? W - 10 * MM) - 3 * MM;
  const ink = o.printInk ?? o.line;
  const mcol = o.marginColor ?? '#e8838f';

  const layout = {
    baselines: rules.slice(o.skip ?? 0),
    pitch,
    sizePitch: pitch,
    left,
    right,
    slots: {
      page: { x: right - 22 * MM, y: top - 4 * MM },
      date: { x: right - 70 * MM, y: top - 4 * MM },
    },
    marginX: mx,
  };

  return {
    bg: o.bg,
    layout,
    draw(ctx) {
      fill(ctx, o.bg);
      if (o.decorate) o.decorate(ctx);
      const x0 = o.lineFrom != null ? o.lineFrom * MM : 0;
      hlines(ctx, rules, x0, W, o.line, o.lineW ?? 1.3);
      if (o.headerLine) hlines(ctx, [top - 3, top + 3], 0, W, mcol, 1.4);
      if (mx != null) {
        vline(ctx, mx, 0, H, mcol, 1.6);
        if (o.doubleMargin) vline(ctx, mx + 6, 0, H, mcol, 1.2);
      }
      if (rmx != null) vline(ctx, rmx, 0, H, mcol, 1.6);
      if (o.holes) spiralHoles(ctx);
      if (o.fields) o.fields(ctx, layout, ink);
    },
  };
}

function makeGrid(o) {
  const sq = o.square * MM;
  const top = (o.top ?? 20) * MM;
  const every = o.every ?? 2;
  const cols = range(0, sq, W);
  const rows = range(0, sq, H);
  const mx = o.margin != null ? o.margin * MM : null;
  const baselines = rows.filter((y, i) => y >= top + sq * every - 1 && y <= H - 12 * MM && i % every === 0);
  const left = mx != null ? mx + 3.2 * MM : 14 * MM;
  const right = W - 10 * MM;
  const layout = {
    baselines,
    pitch: sq * every,
    sizePitch: (o.sizePitch ?? 8.2) * MM,
    left,
    right,
    slots: {
      page: { x: right - 22 * MM, y: top - 2 * MM },
      date: { x: right - 70 * MM, y: top - 2 * MM },
    },
    marginX: mx,
  };
  return {
    bg: o.bg,
    layout,
    draw(ctx) {
      fill(ctx, o.bg);
      if (o.dots) {
        ctx.fillStyle = o.line;
        for (const y of rows) for (const x of cols) {
          ctx.beginPath();
          ctx.arc(x, y, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.strokeStyle = o.line;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        for (const x of cols) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
        for (const y of rows) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
        ctx.stroke();
        if (o.major) {
          ctx.strokeStyle = o.major;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          const step = sq * 5;
          for (let x = 0; x <= W; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
          for (let y = 0; y <= H; y += step) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
          ctx.stroke();
        }
      }
      if (mx != null) vline(ctx, mx, 0, H, o.marginColor ?? '#e8838f', 1.6);
      if (o.after) o.after(ctx, layout);
    },
  };
}

function fourLine() {
  const g = 2.9 * MM;
  const gap = 4.6 * MM;
  const top = 26 * MM;
  const mx = 22 * MM;
  const groups = range(top, 3 * g + gap, H - 12 * MM - 3 * g);
  const layout = {
    baselines: groups.map((y) => y + 2 * g),
    pitch: 3 * g + gap,
    sizePitch: 3 * g + gap,
    xHeight: g,
    exactBaseline: true,
    left: mx + 3.2 * MM,
    right: W - 13 * MM,
    slots: {
      page: { x: W - 35 * MM, y: top - 6 * MM },
      date: { x: W - 83 * MM, y: top - 6 * MM },
    },
    marginX: mx,
  };
  return {
    bg: '#ffffff',
    layout,
    draw(ctx) {
      fill(ctx, '#ffffff');
      for (const y of groups) {
        hlines(ctx, [y, y + 3 * g], 0, W, '#8fb0d8', 1.2);
        hlines(ctx, [y + g, y + 2 * g], 0, W, '#e57f8a', 1.2);
      }
      vline(ctx, mx, 0, H, '#e8838f', 1.6);
    },
  };
}

function cornell() {
  const pitch = 7.1 * MM;
  const top = 32 * MM;
  const summaryY = H - 52 * MM;
  const cue = 62 * MM;
  const rules = range(top + pitch, pitch, summaryY - 4 * MM);
  const layout = {
    baselines: rules,
    pitch,
    sizePitch: pitch,
    left: cue + 4 * MM,
    right: W - 10 * MM,
    slots: {
      page: { x: W - 32 * MM, y: top - 6 * MM },
      date: { x: W - 80 * MM, y: top - 6 * MM },
    },
    marginX: cue,
  };
  return {
    bg: '#ffffff',
    layout,
    draw(ctx) {
      fill(ctx, '#ffffff');
      hlines(ctx, rules, 0, W, '#9db6d6', 1.2);
      hlines(ctx, [top], 0, W, '#3b5f8f', 2);
      hlines(ctx, [summaryY], 0, W, '#3b5f8f', 2);
      vline(ctx, cue, top, summaryY, '#3b5f8f', 2);
      printed(ctx, 'CUES / QUESTIONS', 8 * MM, top + 6 * MM, '#6c86ad', 15);
      printed(ctx, 'NOTES', cue + 4 * MM, top - 3 * MM, '#6c86ad', 15);
      printed(ctx, 'SUMMARY', 8 * MM, summaryY + 7 * MM, '#6c86ad', 15);
      printed(ctx, 'Topic:', 8 * MM, 14 * MM, '#6c86ad', 17);
      hlines(ctx, [14 * MM + 3], 26 * MM, W - 90 * MM, '#9db6d6', 1.2);
    },
  };
}

function plain(o = {}) {
  const left = 18 * MM;
  const right = W - 16 * MM;
  return {
    bg: o.bg ?? '#ffffff',
    plain: true,
    layout: {
      baselines: null, // generated from line spacing
      top: 26 * MM,
      bottom: H - 18 * MM,
      left,
      right,
      slots: {
        page: { x: right - 18 * MM, y: 14 * MM },
        date: { x: right - 66 * MM, y: 14 * MM },
      },
      marginX: null,
    },
    draw(ctx) {
      fill(ctx, o.bg ?? '#ffffff');
      if (o.decorate) o.decorate(ctx);
    },
  };
}

function agedStains(ctx) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.75);
  g.addColorStop(0, 'rgba(255,248,225,0)');
  g.addColorStop(1, 'rgba(150,110,55,0.28)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const spots = [[0.78, 0.12, 90], [0.2, 0.82, 130], [0.62, 0.66, 60]];
  for (const [sx, sy, r] of spots) {
    const s = ctx.createRadialGradient(sx * W, sy * H, 0, sx * W, sy * H, r);
    s.addColorStop(0, 'rgba(160,120,60,0.10)');
    s.addColorStop(0.8, 'rgba(160,120,60,0.06)');
    s.addColorStop(1, 'rgba(160,120,60,0)');
    ctx.fillStyle = s;
    ctx.fillRect(0, 0, W, H);
  }
}

const registerFields = (ctx, L, ink) => {
  const y = L.slots.page.y + 2;
  const d = field(ctx, 'Date:', W - 118 * MM, y, 34 * MM, ink);
  const p = field(ctx, 'Page No.', W - 62 * MM, y, 24 * MM, ink);
  L.slots.date = { x: d.x, y: d.y, fixed: true };
  L.slots.page = { x: p.x, y: p.y, fixed: true };
};

const labFields = (ctx, L, ink) => {
  const y = L.slots.page.y + 2;
  field(ctx, 'Expt. No.', L.left, y, 20 * MM, ink);
  const d = field(ctx, 'Date:', W - 118 * MM, y, 34 * MM, ink);
  const p = field(ctx, 'Page No.', W - 62 * MM, y, 24 * MM, ink);
  L.slots.date = { x: d.x, y: d.y, fixed: true };
  L.slots.page = { x: p.x, y: p.y, fixed: true };
};

const answerSheetFields = (ctx, L, ink) => {
  printed(ctx, 'Q. No.', L.marginX / 2, L.slots.page.y + 2, ink, 17, 'center');
};

export const PAPERS = [
  { id: 'classic', name: 'Classic Notebook', note: 'Red margin, top header line',
    ...makeRuled({ bg: '#ffffff', line: '#a9b8cc', pitch: 7.4, top: 22, margin: 26, headerLine: true, skip: 1 }) },
  { id: 'register', name: 'Pakistani Register', note: 'Date & Page No. box',
    ...makeRuled({ bg: '#ffffff', line: '#9fb4d3', pitch: 7.6, top: 26, margin: 24, fields: registerFields, printInk: '#6f86ab' }) },
  { id: 'double-margin', name: 'Assignment Sheet', note: 'Margins on both sides',
    ...makeRuled({ bg: '#ffffff', line: '#a8b9d0', pitch: 7.6, top: 26, margin: 24, rightMargin: 14, headerLine: true }) },
  { id: 'college', name: 'College Ruled', note: '7.1 mm lines, pink margin',
    ...makeRuled({ bg: '#ffffff', line: '#86aee0', pitch: 7.1, top: 24, margin: 32, marginColor: '#f19aa7' }) },
  { id: 'wide', name: 'Wide Ruled', note: '8.7 mm lines (school)',
    ...makeRuled({ bg: '#ffffff', line: '#86aee0', pitch: 8.7, top: 26, margin: 32, marginColor: '#f19aa7' }) },
  { id: 'narrow', name: 'Narrow Ruled', note: '6 mm lines, more text',
    ...makeRuled({ bg: '#ffffff', line: '#9cb8de', pitch: 6.0, top: 20, margin: 22, marginColor: '#f19aa7' }) },
  { id: 'spiral', name: 'Spiral Notebook', note: 'Ring holes on the left',
    ...makeRuled({ bg: '#fdfdfb', line: '#93b2da', pitch: 7.4, top: 24, margin: 30, holes: true, lineFrom: 15 }) },
  { id: 'answer-sheet', name: 'Exam Answer Sheet', note: 'Board style Q. No. margin',
    ...makeRuled({ bg: '#ffffff', line: '#9aa9bd', pitch: 8.0, top: 24, margin: 24, rightMargin: 12, doubleMargin: true, marginColor: '#555f6e', fields: answerSheetFields, printInk: '#555f6e' }) },
  { id: 'lab', name: 'Practical / Lab File', note: 'Expt. No., Date, Page No.',
    ...makeRuled({ bg: '#ffffff', line: '#a3b6cf', pitch: 7.6, top: 26, margin: 24, fields: labFields, printInk: '#6f86ab' }) },
  { id: 'a4-lined', name: 'A4 Lined Printer Paper', note: 'Light grey lines, no margin',
    ...makeRuled({ bg: '#ffffff', line: '#c3c7cd', pitch: 8.0, top: 20, leftPad: 16, lineW: 1.1 }) },
  { id: 'cornell', name: 'Cornell Notes', note: 'Cue column & summary', ...cornell() },
  { id: 'four-line', name: 'English 4-Line Copy', note: 'Handwriting practice', ...fourLine() },
  { id: 'maths', name: 'Maths Squared Copy', note: '5 mm squares with margin',
    ...makeGrid({ bg: '#ffffff', line: 'rgba(110,150,205,0.45)', square: 5, margin: 24, every: 2 }) },
  { id: 'graph', name: 'Graph Paper', note: '1 mm style major/minor grid',
    ...makeGrid({ bg: '#ffffff', line: 'rgba(90,160,140,0.35)', major: 'rgba(60,140,115,0.55)', square: 5, every: 2 }) },
  { id: 'engineering', name: 'Engineering Paper', note: 'Green computation pad',
    ...makeGrid({ bg: '#eef5df', line: 'rgba(90,150,90,0.30)', major: 'rgba(70,130,70,0.45)', square: 5, every: 2, margin: 20, marginColor: '#6b9a62' }) },
  { id: 'dotted', name: 'Dotted Journal', note: '5 mm dot grid',
    ...makeGrid({ bg: '#fffdf8', line: 'rgba(120,120,130,0.55)', square: 5, every: 2, dots: true }) },
  { id: 'legal', name: 'Yellow Legal Pad', note: 'Double red margin',
    ...makeRuled({ bg: '#fbf3a4', line: '#7fa6cf', pitch: 8.7, top: 30, margin: 32, doubleMargin: true, marginColor: '#d9606c' }) },
  { id: 'aged', name: 'Old / Vintage Paper', note: 'Ivory, faded lines',
    ...makeRuled({ bg: '#f2e6c8', line: 'rgba(130,110,80,0.45)', pitch: 7.6, top: 24, margin: 26, marginColor: 'rgba(190,90,80,0.55)', decorate: agedStains }) },
  { id: 'kraft', name: 'Recycled Brown Paper', note: 'Kraft notebook',
    ...makeRuled({ bg: '#d8c3a1', line: 'rgba(110,80,50,0.45)', pitch: 7.6, top: 24, margin: 26, marginColor: 'rgba(160,60,50,0.6)' }) },
  { id: 'plain', name: 'Plain A4 (Blank)', note: 'No lines, natural drift', ...plain() },
];

export function getPaper(id) {
  return PAPERS.find((p) => p.id === id) ?? PAPERS[0];
}

// Baselines for unlined paper, from a spacing in mm.
export function plainBaselines(paper, spacingMm) {
  const L = paper.layout;
  const pitch = spacingMm * MM;
  return { pitch, baselines: range(L.top + pitch * 0.6, pitch, L.bottom) };
}
