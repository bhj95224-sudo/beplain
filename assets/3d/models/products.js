// beplain Mung Bean line — five more procedural products (code-only, no images/meshes imported).
// Same authoring convention as tube-model.js: reference-image pixel space (y down), 1 unit = 100 px,
// origin under the product's centre on the floor, +Z toward the reference camera, front label projected in X.
import * as THREE from '../vendor/three.module.js';
import { buildSweep, drawWordmark, PX } from './tube-model.js';

const TUBE_FLOOR = 1958; // buildSweep converts row.yr with this constant; we offset rows to our own floor
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ----- small drawing helpers (reference px space) -----
function fitLine(ctx, str, x0, x1, baseline, capH, weight, color, family = '"Segoe UI","Helvetica Neue",Arial,sans-serif') {
  ctx.fillStyle = color;
  ctx.font = `${weight} 100px ${family}`;
  const asc = ctx.measureText('H').actualBoundingBoxAscent;
  const size = (capH / asc) * 100;
  ctx.font = `${weight} ${size}px ${family}`;
  const m = ctx.measureText(str);
  const ink = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  ctx.save();
  ctx.translate(x0, baseline);
  ctx.scale((x1 - x0) / ink, 1);
  ctx.fillText(str, m.actualBoundingBoxLeft, 0);
  ctx.restore();
}
// Text running downward (rotated 90° clockwise); baseX = baseline x, glyph tops point to +x.
function fitLineDown(ctx, str, y0, y1, baseX, capH, weight, color) {
  ctx.save();
  ctx.translate(baseX, y0);
  ctx.rotate(Math.PI / 2);
  fitLine(ctx, str, 0, y1 - y0, 0, capH, weight, color);
  ctx.restore();
}
function wordmark(ctx, x0, baseline, scale, color) {
  ctx.save();
  ctx.translate(x0, baseline);
  ctx.scale(scale, scale);
  ctx.translate(-236, -460.5);
  drawWordmark(ctx, color);
  ctx.restore();
}
function wordmarkDown(ctx, baseX, y0, scale, color) {
  ctx.save();
  ctx.translate(baseX, y0);
  ctx.rotate(Math.PI / 2);
  ctx.scale(scale, scale);
  ctx.translate(-236, -460.5);
  drawWordmark(ctx, color);
  ctx.restore();
}
function ringDot(ctx, cx, cy, rOuter, stroke, color, dot, dotR) {
  ctx.strokeStyle = color;
  ctx.lineWidth = stroke;
  ctx.beginPath();
  ctx.arc(cx, cy, rOuter - stroke / 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(dot[0], dot[1], dotR, 0, Math.PI * 2);
  ctx.fill();
}
function roundRect(ctx, x0, y0, x1, y1, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x0, y0, x1 - x0, y1 - y0, r);
  ctx.fill();
}
function seeded(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ----- product specs -----
const GREEN_TEXT = '#5d9530';
const INK = '#161616';

const SPECS = {
  pad: {
    name: 'Mung Bean Pore Clearing Filter Pad', W: 1338, H: 1176, cx: 668.5, floor: 1138,
    parts: [
      { id: 'lid', label: '뚜껑', y0: 37, y1: 338, a: 559, depth: 0.94, n: 2.5, rTop: 42, rBot: 6, color: '#8db447', rough: 0.4 },
      { id: 'jar', label: '용기', y0: 338, y1: 1138, a: 559, depth: 0.94, n: 2.5, rTop: 4, rBot: 18, color: '#93bb52', rough: 0.35 },
    ],
    tabs: [{ part: 'lid', x0: 478, x1: 866, y0: 125, y1: 258, r: 22, color: '#86ad42' }],
    draw(ctx) {
      ctx.fillStyle = '#7fa83c';
      ctx.fillRect(0, 144, 1338, 5); // lid step line
      roundRect(ctx, 198, 467, 1142, 1013, 8, '#ffffff');
      roundRect(ctx, 1143, 769, 1222, 1013, 4, '#5a8f2a');
      wordmark(ctx, 275, 640, 1.04, INK);
      fitLine(ctx, 'MUNG BEAN', 275, 675, 786, 49, 800, GREEN_TEXT);
      fitLine(ctx, 'PORE CLEARING', 275, 607, 857, 34, 700, INK);
      fitLine(ctx, 'FILTER PAD', 275, 500, 905, 34, 700, INK);
      ringDot(ctx, 906.5, 742, 171, 8, '#6a9f2e', [839, 592], 19);
      fitLineDown(ctx, 'RECYCLE', 797, 938, 1171, 26, 600, '#fff');
    },
  },
  balm: {
    name: 'Mung Bean Pore Cleansing Milk Balm', W: 1429, H: 1100, cx: 714, floor: 1032,
    parts: [
      { id: 'lid', label: '뚜껑', y0: 17, y1: 410, a: 681, depth: 0.8, n: 3.3, rTop: 40, rBot: 6, color: '#8fb64a', rough: 0.4 },
      { id: 'jar', label: '용기', y0: 413, y1: 1032, a: 681, depth: 0.8, n: 3.3, rTop: 8, rBot: 40, color: '#86ae42', rough: 0.4 },
    ],
    tabs: [{ part: 'lid', x0: 528, x1: 918, y0: 62, y1: 255, r: 40, color: '#82aa40' }],
    draw(ctx) {
      ctx.fillStyle = '#76a038';
      ctx.fillRect(0, 124, 1429, 5);
      roundRect(ctx, 175, 495, 1237, 917, 8, '#ffffff');
      roundRect(ctx, 1240, 640, 1322, 918, 4, '#5f8f33');
      wordmark(ctx, 318, 615, 0.98, INK);
      fitLine(ctx, 'MUNG BEAN', 318, 763, 730, 47, 800, GREEN_TEXT);
      fitLine(ctx, 'PORE CLEANSING', 318, 698, 800, 35, 700, INK);
      fitLine(ctx, 'MILK BALM', 318, 550, 852, 35, 700, INK);
      ringDot(ctx, 981.5, 704.5, 153.5, 8, '#6a9f2e', [919, 566], 17);
      fitLineDown(ctx, 'RECYCLE', 673, 830, 1268, 28, 600, '#fff');
    },
  },
  grind: {
    name: 'Mung Bean Pore Grinding Cleansing Balm', W: 1185, H: 1327, cx: 592.5, floor: 1282,
    parts: [
      { id: 'lid', label: '뚜껑', y0: 39, y1: 297, a: 523.5, depth: 1, n: 2.2, rTop: 22, rBot: 3, color: '#7ba649', rough: 0.45 },
      {
        id: 'body', label: '용기 상단', y0: 297, y1: 893, depth: 1, n: 2.2, rTop: 2, rBot: 3, color: '#79a346', rough: 0.45,
        aFn: (y) => 487.5 + 36 * (1 - smooth(297, 395, y)),
      },
      {
        id: 'base', label: '용기 하단', y0: 893, y1: 1282, depth: 1, n: 2.2, rTop: 2, rBot: 0, color: '#f1f1f2', rough: 0.7,
        aFn: (y) => 487.5 - Math.max(0, y - 1196) * 0.92,
      },
    ],
    draw(ctx) {
      ctx.fillStyle = '#6a9438';
      ctx.fillRect(0, 205, 1185, 4);
      ctx.fillRect(0, 295, 1185, 4);
      const rnd = seeded(7);
      for (let i = 0; i < 650; i++) {
        const x = 100 + rnd() * 990, y = 900 + rnd() * 380, r = 1.2 + rnd() * rnd() * 5;
        ctx.fillStyle = `rgba(160,196,95,${0.25 + rnd() * 0.4})`;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      wordmark(ctx, 232, 542, 0.9, '#fff');
      fitLine(ctx, 'MUNG BEAN', 232, 630, 655, 43, 800, '#fff');
      fitLine(ctx, 'PORE GRINDING', 232, 542, 713, 30, 600, '#fff');
      fitLine(ctx, 'CLEANSING BALM', 232, 573, 760, 30, 600, '#fff');
      ringDot(ctx, 836, 625, 139, 7, '#fff', [783, 497], 12);
    },
  },
  serum: {
    name: 'Mung Bean Pore Tight-Up Serum', W: 838, H: 1876, cx: 419, floor: 1838,
    parts: [
      { id: 'cap', label: '캡', y0: 37, y1: 410, a: 217, depth: 1, n: 2.3, rTop: 55, rBot: 4, color: '#bccd58', rough: 0.25 },
      { id: 'neck', label: '목', y0: 410, y1: 676, a: 218, depth: 1, n: 2.1, rTop: 0, rBot: 0, color: '#ffffff', rough: 0.4 },
      { id: 'body', label: '병', y0: 676, y1: 1838, a: 340, depth: 0.62, n: 4, rTop: 46, rBot: 62, color: '#ffffff', rough: 0.35 },
    ],
    draw(ctx) {
      roundRect(ctx, 237, 110, 560, 312, 6, '#78ad2b');
      ctx.fillStyle = '#d7e68f';
      ctx.fillRect(210, 318, 420, 40);
      wordmarkDown(ctx, 607, 785, 1.08, INK);
      fitLineDown(ctx, 'MUNG BEAN', 782, 1285, 449, 62, 800, '#5d9a1d');
      fitLineDown(ctx, 'PORE TIGHT-UP SERUM', 782, 1285, 378, 36, 700, INK);
      fitLineDown(ctx, 'A daily pore serum with Mung Bean', 782, 1385, 256, 26, 500, INK);
      fitLineDown(ctx, 'Peptide™ that helpe effectively tighten', 782, 1430, 214, 26, 500, INK);
      fitLineDown(ctx, 'the look of pores.', 782, 1085, 169, 26, 500, INK);
      fitLineDown(ctx, '30 ml / 1.01 fl. oz.', 1493, 1745, 169, 26, 500, INK);
      ringDot(ctx, 486, 1571, 174, 7, '#68a024', [640, 1498], 20);
    },
  },
  toner: {
    name: 'Mung Bean Pore Clearing LHA Toner', W: 722, H: 2000, cx: 360.5, floor: 1954,
    parts: [
      { id: 'cap', label: '캡', y0: 38, y1: 312, a: 165, depth: 1, n: 2.2, rTop: 28, rBot: 3, color: '#92c92f', rough: 0.3 },
      { id: 'body', label: '병', y0: 312, y1: 1954, a: 329.5, depth: 0.52, n: 3.2, rTop: 34, rBot: 36, color: '#ffffff', rough: 0.4 },
    ],
    draw(ctx) {
      fitLineDown(ctx, 'MUNG BEAN', 522, 958, 497, 48, 800, '#5d9a1d');
      fitLineDown(ctx, 'PORE CLEARING LHA TONER', 522, 1070, 418, 25, 700, INK);
      fitLineDown(ctx, 'A pore clearing daily water toner with', 522, 1065, 318, 20, 500, INK);
      fitLineDown(ctx, 'Mung Bean Peptide* and LHA to help care', 522, 1175, 272, 20, 500, INK);
      fitLineDown(ctx, 'for dead skin cells and sebum.', 522, 955, 235, 20, 500, INK);
      fitLineDown(ctx, '265 ml / 8.96 fl. oz.', 522, 775, 162, 20, 500, INK);
      ringDot(ctx, 350, 1419, 187, 8, '#68a024', [517, 1342], 20);
      wordmark(ctx, 212, 1830, 1.09, INK);
    },
  },
};

// ----- builder -----
function partRows(p, floor) {
  const ys = new Set();
  for (let y = p.y1; y >= p.y0; y -= 14) ys.add(y);
  ys.add(p.y0);
  ys.add(p.y1);
  for (let y = p.y1; y > p.y1 - p.rBot; y -= 2) ys.add(y);
  for (let y = p.y0; y < p.y0 + p.rTop; y += 2) ys.add(y);
  return [...ys].sort((a, b) => b - a).map((yr) => {
    let a = p.aFn ? p.aFn(yr) : p.a;
    let inset = 0;
    if (p.rTop && yr - p.y0 < p.rTop) {
      const d = p.rTop - (yr - p.y0);
      inset = Math.max(inset, p.rTop - Math.sqrt(Math.max(0, p.rTop * p.rTop - d * d)));
    }
    if (p.rBot && p.y1 - yr < p.rBot) {
      const d = p.rBot - (p.y1 - yr);
      inset = Math.max(inset, p.rBot - Math.sqrt(Math.max(0, p.rBot * p.rBot - d * d)));
    }
    a = Math.max(2, a - inset);
    const bBase = (p.aFn ? p.aFn(yr) : p.a) * p.depth;
    return { yr: yr + (TUBE_FLOOR - floor), a, b: Math.max(1, bBase - inset), n: p.n, shade: 1 };
  });
}

function makeCanvas(spec, k) {
  const Wc = Math.floor(spec.W * k), Hc = Math.floor(spec.H * k);
  const cv = document.createElement('canvas');
  cv.width = Wc * 2;
  cv.height = Hc;
  const ctx = cv.getContext('2d');
  for (let half = 0; half < 2; half++) {
    ctx.save();
    ctx.translate(half * Wc, 0);
    ctx.scale(k, k);
    ctx.beginPath(); ctx.rect(0, 0, spec.W, spec.H); ctx.clip();
    ctx.fillStyle = spec.parts[0].color; ctx.fillRect(0, 0, spec.W, spec.H); // end caps sample this
    for (const p of spec.parts) { ctx.fillStyle = p.color; ctx.fillRect(0, p.y0 - 1, spec.W, p.y1 - p.y0 + 2); }
    if (half === 0) spec.draw(ctx);
    ctx.restore();
  }
  return { cv, Wc, Hc };
}

export const PRODUCT_IDS = Object.keys(SPECS);
export const productSpec = (id) => SPECS[id];

export function createProduct(id, { anisotropy = 8 } = {}) {
  const spec = SPECS[id];
  const k = Math.min(1536 / spec.W, 2400 / spec.H);
  const { cv, Wc, Hc } = makeCanvas(spec, k);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  const uvFn = (x, y, _z, half) => {
    const xr = spec.cx + x / PX;
    const yr = spec.floor - y / PX;
    return [(xr * k) / (Wc * 2) + (half ? 0.5 : 0), 1 - (yr * k) / Hc];
  };

  const group = new THREE.Group();
  group.name = `beplain-${id}`;
  group.userData.parts = [];
  for (const p of spec.parts) {
    const mat = new THREE.MeshPhysicalMaterial({
      map: tex, color: 0xffffff, roughness: p.rough ?? 0.45, clearcoat: 0.12, clearcoatRoughness: 0.4,
      sheen: 0.1, sheenColor: new THREE.Color(0xe6f2c0),
      emissive: new THREE.Color(0xffffff), emissiveMap: tex, emissiveIntensity: 0.09, // lifts whites like the studio photo
    });
    const mesh = new THREE.Mesh(
      buildSweep({ rows: partRows(p, spec.floor), seg: 128, uvFn, closeBottom: true, closeTop: true }), mat,
    );
    mesh.name = p.id;
    mesh.userData = { partId: p.id, label: p.label, partSpec: p, explode: 0 };
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    group.userData.parts.push(mesh);
  }
  // raised thumb tabs on lids
  for (const t of spec.tabs ?? []) {
    const p = spec.parts.find((q) => q.id === t.part);
    const w = (t.x1 - t.x0) * PX, h = (t.y1 - t.y0) * PX;
    const shape = new THREE.Shape();
    const r = Math.min(t.r * PX, h / 2, w / 2), x0 = -w / 2, y0 = -h / 2, x1 = w / 2, y1 = h / 2;
    shape.moveTo(x0 + r, y0);
    shape.lineTo(x1 - r, y0); shape.quadraticCurveTo(x1, y0, x1, y0 + r);
    shape.lineTo(x1, y1 - r); shape.quadraticCurveTo(x1, y1, x1 - r, y1);
    shape.lineTo(x0 + r, y1); shape.quadraticCurveTo(x0, y1, x0, y1 - r);
    shape.lineTo(x0, y0 + r); shape.quadraticCurveTo(x0, y0, x0 + r, y0);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3 });
    const mesh = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: t.color, roughness: 0.45, clearcoat: 0.12 }));
    const zFront = p.a * p.depth * PX;
    mesh.position.set(((t.x0 + t.x1) / 2 - spec.cx) * PX, (spec.floor - (t.y0 + t.y1) / 2) * PX, zFront - 0.06);
    mesh.name = `${t.part}-tab`;
    mesh.userData = { partId: mesh.name, label: '개폐 탭', explode: 0 };
    mesh.castShadow = true;
    group.add(mesh);
    group.userData.parts.push(mesh);
  }
  // explode: lowest part stays, each upper part rises further
  const order = [...spec.parts].reverse();
  const rank = new Map(order.map((p, i) => [p.id, i]));
  for (const m of group.userData.parts) m.userData.explode = (rank.get(m.userData.partId) ?? rank.get(m.userData.partId.split('-')[0]) ?? 0) * 1.4;
  group.userData.setExplode = (amount) => { for (const m of group.userData.parts) m.position.y = (m.userData.base ??= m.position.y) + m.userData.explode * amount; };
  group.userData.spec = { id, name: spec.name, W: spec.W, H: spec.H, cx: spec.cx, floor: spec.floor };
  group.userData.bounds = { height: (spec.floor - spec.parts[0].y0) * PX, halfWidth: Math.max(...spec.parts.map((p) => p.a ?? 500)) * PX };
  return group;
}
