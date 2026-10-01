// Procedural beplain "Mung Bean pH-Balanced Cleansing Foam" tube — code-only, no external meshes or images.
//
// Authoring space is the reference image's pixel space (721x2000, y down). Everything is converted to
// world units at 1 unit = 100 reference px, origin at the floor under the cap centre, +Y up, +Z toward
// the reference camera. The front label is projected planarly in X so it lands on the reference pixels.
import * as THREE from '../vendor/three.module.js';

export const PX = 0.01;
export const CX = 361.5; // reference-image x of the tube's vertical axis
export const FLOOR_Y = 1958; // reference-image y of the cap's bottom edge
const TEX_W = 2048;
const TEX_H = 2560;
const TEX_K = 1.5; // canvas px per reference px
const TEX_X0 = 30;
const TEX_Y0 = 40;

const wy = (yr) => (FLOOR_Y - yr) * PX;
const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;
const sgnpow = (v, p) => Math.sign(v) * Math.pow(Math.abs(v), p);

// ---------------------------------------------------------------------------------------------
// Silhouette data measured from the reference (half-width of the tube body at a given y).
// ---------------------------------------------------------------------------------------------
const BODY_HALF_WIDTH = [
  [44, 323], [110, 323], [200, 309], [400, 288], [700, 265],
  [1000, 246], [1300, 229], [1600, 211], [1640, 207], [1665, 195],
];
function bodyHalfWidth(yr) {
  const t = BODY_HALF_WIDTH;
  if (yr <= t[0][0]) return t[0][1];
  for (let i = 1; i < t.length; i++) {
    if (yr <= t[i][0]) {
      const k = (yr - t[i - 1][0]) / (t[i][0] - t[i - 1][0]);
      return lerp(t[i - 1][1], t[i][1], k);
    }
  }
  return t[t.length - 1][1];
}

const BODY_TOP = 44; // reference y of the crimped top edge
const BODY_BOTTOM = 1666; // reference y where the tube shoulder meets the cap
const CRIMP_START = 118; // reference y where the flat sealed crimp begins

function bodyRow(yr) {
  let a = bodyHalfWidth(yr);
  const t = Math.min(1, (BODY_BOTTOM - yr) / (BODY_BOTTOM - CRIMP_START));
  const bBottom = 200;
  const bCrimp = 12;
  let b = bCrimp + (bBottom - bCrimp) * Math.pow(1 - t, 1.55);
  const n = 2.2 + (7.5 - 2.2) * smoothstep(0.5, 1, t);
  // Rounded top corners and thin rounded top edge of the crimp.
  const rt = 5;
  if (yr < BODY_TOP + rt) {
    const d = BODY_TOP + rt - yr;
    a -= rt - Math.sqrt(Math.max(0, rt * rt - d * d));
  }
  const rd = 12;
  if (yr < BODY_TOP + rd) {
    const d = BODY_TOP + rd - yr;
    b *= Math.sqrt(Math.max(0.0004, 1 - (d / rd) * (d / rd)));
  }
  return { a, b, n, shade: 1 };
}

function sweepRows(ys, rowFn) {
  return ys.map((yr) => ({ yr, ...rowFn(yr) }));
}

function range(from, to, step) {
  const out = [];
  if (from > to) for (let v = from; v >= to; v -= step) out.push(v);
  else for (let v = from; v <= to; v += step) out.push(v);
  return out;
}

// ---------------------------------------------------------------------------------------------
// Generic superelliptic sweep with split front/back halves (so a planar front UV never wraps).
// ---------------------------------------------------------------------------------------------
export function buildSweep({ rows, seg, uvFn, displace, closeBottom, closeTop }) {
  const positions = [];
  const uvs = [];
  const colors = [];
  const index = [];
  const per = seg + 1;
  const vid = (r, h, j) => (r * 2 + h) * per + j;

  rows.forEach((row) => {
    for (let h = 0; h < 2; h++) {
      for (let j = 0; j <= seg; j++) {
        const phi = (h === 0 ? 0 : Math.PI) + (Math.PI * j) / seg;
        const e = 2 / row.n;
        let x = row.a * sgnpow(Math.cos(phi), e) * PX;
        let z = row.b * sgnpow(Math.sin(phi), e) * PX;
        const y = wy(row.yr);
        let ao = 1;
        if (displace) {
          const d = displace(x, y, z, row, h);
          z = d.z;
          ao = d.shade;
        }
        positions.push(x, y, z);
        const uv = uvFn(x, y, z, h);
        uvs.push(uv[0], uv[1]);
        const s = (row.shade ?? 1) * ao;
        colors.push(s, s, s);
      }
    }
  });

  for (let r = 0; r < rows.length - 1; r++) {
    for (let h = 0; h < 2; h++) {
      for (let j = 0; j < seg; j++) {
        const A = vid(r, h, j);
        const B = vid(r, h, j + 1);
        const C = vid(r + 1, h, j);
        const D = vid(r + 1, h, j + 1);
        index.push(A, C, B, B, C, D);
      }
    }
  }

  // Area-weighted normals, welded across the front/back seam so the side edges shade smoothly.
  const normals = new Float32Array(positions.length);
  for (let i = 0; i < index.length; i += 3) {
    const [ia, ib, ic] = [index[i] * 3, index[i + 1] * 3, index[i + 2] * 3];
    const ux = positions[ib] - positions[ia];
    const uy = positions[ib + 1] - positions[ia + 1];
    const uz = positions[ib + 2] - positions[ia + 2];
    const vx = positions[ic] - positions[ia];
    const vy = positions[ic + 1] - positions[ia + 1];
    const vz = positions[ic + 2] - positions[ia + 2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    for (const k of [ia, ib, ic]) {
      normals[k] += nx;
      normals[k + 1] += ny;
      normals[k + 2] += nz;
    }
  }
  const weld = new Map();
  const key = (i) =>
    `${Math.round(positions[i] * 2000)},${Math.round(positions[i + 1] * 2000)},${Math.round(positions[i + 2] * 2000)}`;
  for (let i = 0; i < positions.length; i += 3) {
    const k = key(i);
    const acc = weld.get(k) ?? [0, 0, 0];
    acc[0] += normals[i];
    acc[1] += normals[i + 1];
    acc[2] += normals[i + 2];
    weld.set(k, acc);
  }
  for (let i = 0; i < positions.length; i += 3) {
    const acc = weld.get(key(i));
    const len = Math.hypot(acc[0], acc[1], acc[2]) || 1;
    normals[i] = acc[0] / len;
    normals[i + 1] = acc[1] / len;
    normals[i + 2] = acc[2] / len;
  }

  // Flat end caps with their own normals (never welded to the wall).
  const nrm = Array.from(normals);
  const addCap = (r, up) => {
    const ring = [];
    for (let j = 0; j <= seg; j++) ring.push(vid(r, 0, j));
    for (let j = 1; j <= seg; j++) ring.push(vid(r, 1, j));
    const base = positions.length / 3;
    let cy = 0;
    ring.forEach((id) => {
      positions.push(positions[id * 3], positions[id * 3 + 1], positions[id * 3 + 2]);
      uvs.push(0.01, 0.995);
      colors.push(colors[id * 3], colors[id * 3 + 1], colors[id * 3 + 2]);
      nrm.push(0, up ? 1 : -1, 0);
      cy = positions[id * 3 + 1];
    });
    const c = positions.length / 3;
    positions.push(0, cy, 0);
    uvs.push(0.01, 0.995);
    colors.push(1, 1, 1);
    nrm.push(0, up ? 1 : -1, 0);
    for (let k = 0; k < ring.length; k++) {
      const p0 = base + k;
      const p1 = base + ((k + 1) % ring.length);
      if (up) index.push(c, p1, p0);
      else index.push(c, p0, p1);
    }
  };
  if (closeBottom) addCap(0, false);
  if (closeTop) addCap(rows.length - 1, true);

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.setIndex(index);
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

// ---------------------------------------------------------------------------------------------
// Front label, drawn straight into reference-pixel space.
// ---------------------------------------------------------------------------------------------
export const LABEL_COLORS = {
  body: '#9ac14d',
  discLight: '#b9d484',
  discDark: '#78ac14',
  white: '#ffffff',
};

function fitGlyph(ctx, ch, box, baseline, fontSize, font) {
  ctx.font = `${font.replace('SIZE', fontSize.toFixed(2))}`;
  const m = ctx.measureText(ch);
  const ink = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  if (ink <= 0) return;
  const sx = (box[1] - box[0] + 1) / ink;
  ctx.save();
  ctx.translate(box[0], baseline);
  ctx.scale(sx, 1);
  ctx.fillText(ch, m.actualBoundingBoxLeft, 0);
  ctx.restore();
}

function capFontSize(ctx, fontTemplate, capHeight) {
  ctx.font = fontTemplate.replace('SIZE', '100');
  const m = ctx.measureText('H');
  return (capHeight / m.actualBoundingBoxAscent) * 100;
}

export function drawWordmark(ctx, white = LABEL_COLORS.white) {
  const W = 6; // stroke width
  ctx.strokeStyle = white;
  ctx.fillStyle = white;
  ctx.lineWidth = W;
  ctx.lineCap = 'butt';
  const baseline = 460.5;
  const xTop = 419;
  const xh = baseline - xTop;
  const r = xh / 2 - W / 2; // bowl centre-line radius
  const cy = (baseline + xTop) / 2;
  const stem = (x, y0, y1) => ctx.fillRect(x - W / 2, y0, W, y1 - y0);
  const ring = (cx, rr = r) => {
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.stroke();
  };

  // b
  stem(239, 397, baseline);
  ring(256.5);
  // e
  const ex = 304.5;
  ctx.beginPath();
  ctx.arc(ex, cy, r - 0.5, 0, (42 * Math.PI) / 180, true);
  ctx.stroke();
  ctx.fillRect(ex - r + 0.5, cy - W / 2 + 0.5, 2 * r - 1, W - 1);
  // p
  stem(335, xTop, 485);
  ring(352.5);
  // l
  stem(382.5, 397, baseline);
  // a
  ring(414.5);
  stem(431, xTop, baseline);
  // i
  stem(447, xTop, baseline);
  ctx.beginPath();
  ctx.arc(447, 401.5, 4.5, 0, Math.PI * 2);
  ctx.fill();
  // n
  stem(463, xTop, baseline);
  stem(496.5, xTop + 16, baseline);
  ctx.beginPath();
  ctx.arc(479.75, xTop + W / 2 + 14, 16.75, Math.PI, Math.PI * 2);
  ctx.stroke();
}

function drawLabelText(ctx) {
  ctx.fillStyle = LABEL_COLORS.white;
  ctx.textBaseline = 'alphabetic';
  const family = '"Segoe UI", "Helvetica Neue", Arial, sans-serif';

  const heavy = `700 SIZEpx ${family}`;
  const light = `600 SIZEpx ${family}`;

  const mung = [[201, 243], [252, 282], [292, 324], [332, 370], null, [392, 420], [428, 449], [457, 491], [499, 531]];
  const s1 = capFontSize(ctx, heavy, 41.5);
  'MUNG BEAN'.split('').forEach((ch, i) => mung[i] && fitGlyph(ctx, ch, mung[i], 1321, s1, heavy));

  const ph = [[224, 243], [250, 270], null, [298, 316], [322, 343], [350, 361], [367, 387], [395, 414], [422, 445], [453, 465], [473, 494]];
  const s2 = capFontSize(ctx, light, 26.5);
  'pH-BALANCED'.split('').forEach((ch, i) => {
    if (ch === '-') ctx.fillRect(279, 1363, 12, 3.4);
    else if (ph[i]) fitGlyph(ctx, ch, ph[i], 1378.5, s2, light);
  });

  const cl = [[193, 215], [223, 234], [241, 253], [260, 281], [288, 308], [316, 332], [340, 342], [350, 370], [377, 401], null, [418, 431], [437, 462], [468, 488], [495, 521]];
  const s3 = capFontSize(ctx, light, 26.5);
  'CLEANSING FOAM'.split('').forEach((ch, i) => cl[i] && fitGlyph(ctx, ch, cl[i], 1422, s3, light));
}

// Fine vertical ridges of the heat-sealed crimp, plus the slightly raised lip where the tube body starts.
function drawCrimpRidges(ctx) {
  for (let x = 40; x < 684; x += 6.4) {
    ctx.fillStyle = 'rgba(40,70,0,0.10)';
    ctx.fillRect(x, 46, 2.4, 58);
    ctx.fillStyle = 'rgba(255,255,230,0.05)';
    ctx.fillRect(x + 3, 46, 1.6, 58);
  }
  ctx.fillStyle = 'rgba(255,255,220,0.10)';
  ctx.fillRect(38, 103, 646, 3);
}

function drawEmblem(ctx, whiteOnly) {
  if (!whiteOnly) {
  // Soft two-tone disc, offset below the ring.
  const disc = ctx.createLinearGradient(205, 760, 520, 1080);
  disc.addColorStop(0, LABEL_COLORS.discLight);
  disc.addColorStop(0.5, '#94be4a');
  disc.addColorStop(1, LABEL_COLORS.discDark);
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(368.5, 910, 173, 0, Math.PI * 2);
  ctx.fill();
  }

  ctx.strokeStyle = LABEL_COLORS.white;
  ctx.lineWidth = 6.5;
  ctx.beginPath();
  ctx.arc(366.5, 794.5, 170.8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = LABEL_COLORS.white;
  ctx.beginPath();
  ctx.arc(300, 637.5, 15.5, 0, Math.PI * 2);
  ctx.fill();
}

export function drawLabelCanvas(canvas, whiteOnly = false) {
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = whiteOnly ? '#000' : LABEL_COLORS.body;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  ctx.save();
  ctx.scale(TEX_K, TEX_K);
  ctx.translate(-TEX_X0, -TEX_Y0);
  if (!whiteOnly) drawCrimpRidges(ctx);
  drawEmblem(ctx, whiteOnly);
  drawWordmark(ctx);
  drawLabelText(ctx);
  ctx.restore();
  return canvas;
}

function labelUv(x, y, _z, half) {
  const xr = CX + x / PX;
  const yr = FLOOR_Y - y / PX;
  const u = ((xr - TEX_X0) * TEX_K) / TEX_W + (half === 0 ? 0 : 0.5);
  const v = 1 - ((yr - TEX_Y0) * TEX_K) / TEX_H;
  return [u, v];
}

// ---------------------------------------------------------------------------------------------
// Cap: base ring + flip lid with a thumb recess on the front.
// ---------------------------------------------------------------------------------------------
const CAP_A = 194.5;
const CAP_B = 188;
const CAP_N = 2.6;
const SEAM_Y = 1852;
const NOTCH = { cx: 365, top: 1738, bottom: 1844, depth: 24, r: 50, rBottom: 30 };

function notchMask(xr, yr) {
  const hw = 84 + Math.max(0, yr - 1745) * 0.2;
  const dx = Math.abs(xr - NOTCH.cx);
  const corner = (r, edgeDist) => {
    const q1 = dx - (hw - r);
    return q1 > 0 && edgeDist < r ? r - Math.hypot(q1, r - edgeDist) : Math.min(hw - dx, edgeDist);
  };
  const d = Math.min(corner(NOTCH.r, yr - NOTCH.top), corner(NOTCH.rBottom, NOTCH.bottom - yr));
  return smoothstep(0, 12, d);
}

function capBaseRows() {
  const ys = [...range(FLOOR_Y, FLOOR_Y - 24, 1.5), ...range(FLOOR_Y - 26, SEAM_Y + 8, 14), SEAM_Y + 6, SEAM_Y + 3, SEAM_Y];
  const r = 21;
  return sweepRows(ys, (yr) => {
    const d = FLOOR_Y - yr;
    let inset = 0;
    if (d < r) inset = r - Math.sqrt(Math.max(0, r * r - (r - d) * (r - d)));
    let a = CAP_A - inset;
    let b = CAP_B - inset;
    let shade = 1;
    if (yr < SEAM_Y + 7) {
      // narrow neck above the seam gives the dark groove line
      const k = smoothstep(SEAM_Y + 7, SEAM_Y + 1, yr);
      a -= 5 * k;
      b -= 5 * k;
      shade = 1 - 0.55 * k;
    }
    return { a, b: Math.max(b, 1), n: CAP_N, shade };
  });
}

function capLidRows() {
  const top = 1648;
  const ys = [...range(SEAM_Y, 1668, 2), ...range(1666, top, 3)];
  const r = 14;
  return sweepRows(ys, (yr) => {
    let inset = 0;
    if (yr < top + r) {
      const d = top + r - yr;
      inset = r - Math.sqrt(Math.max(0, r * r - d * d));
    }
    const dBottom = SEAM_Y - yr;
    let shade = 1;
    let a = CAP_A;
    let b = CAP_B;
    if (dBottom < 4) {
      const k = 1 - dBottom / 4;
      a -= 3 * k;
      b -= 3 * k;
      shade = 1 - 0.6 * k;
    }
    return { a: a - inset, b: b - inset, n: CAP_N, shade };
  });
}

function notchDisplace(x, y, z, _row, half) {
  if (half !== 0 || z <= 0) return { z, shade: 1 };
  const xr = CX + x / PX;
  const yr = FLOOR_Y - y / PX;
  if (yr < NOTCH.top - 2 || yr > NOTCH.bottom + 2) return { z, shade: 1 };
  const m = notchMask(xr, yr);
  // ambient occlusion baked into vertex colour: deep shadow under the recess's upper lip, fading downward
  const ao = lerp(0.66, 0.92, smoothstep(0, 45, yr - NOTCH.top));
  return { z: z - m * NOTCH.depth * PX, shade: lerp(1, ao, m) };
}

// ---------------------------------------------------------------------------------------------
// Public factory
// ---------------------------------------------------------------------------------------------
export function createBeplainTubeModel({ anisotropy = 8 } = {}) {
  const group = new THREE.Group();
  group.name = 'beplain-mung-bean-tube';

  const canvas = document.createElement('canvas');
  drawLabelCanvas(canvas);
  const labelTex = new THREE.CanvasTexture(canvas);
  labelTex.colorSpace = THREE.SRGBColorSpace;
  labelTex.anisotropy = anisotropy;
  labelTex.generateMipmaps = true;
  labelTex.minFilter = THREE.LinearMipmapLinearFilter;

  const maskCanvas = document.createElement('canvas');
  drawLabelCanvas(maskCanvas, true);
  const maskTex = new THREE.CanvasTexture(maskCanvas);
  maskTex.colorSpace = THREE.SRGBColorSpace;
  maskTex.anisotropy = anisotropy;

  const bodyMat = new THREE.MeshPhysicalMaterial({
    map: labelTex,
    emissiveMap: maskTex, // printed white ink is nearly self-lit in the reference photo
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.2,
    color: 0xffffff,
    roughness: 0.5,
    metalness: 0,
    clearcoat: 0.12,
    clearcoatRoughness: 0.5,
    sheen: 0.12,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color(0xe6f2c0),
  });
  const lidMat = new THREE.MeshPhysicalMaterial({
    color: 0xa6c55e,
    vertexColors: true,
    roughness: 0.46,
    clearcoat: 0.12,
    clearcoatRoughness: 0.4,
  });
  const baseMat = new THREE.MeshPhysicalMaterial({
    color: 0x93b840,
    vertexColors: true,
    roughness: 0.46,
    clearcoat: 0.12,
    clearcoatRoughness: 0.4,
  });

  // Tube body (shoulder → crimp). Rows are denser where curvature is high.
  const bodyYs = [
    ...range(BODY_BOTTOM, BODY_BOTTOM - 40, 2),
    ...range(BODY_BOTTOM - 44, CRIMP_START + 60, 12),
    ...range(CRIMP_START + 56, BODY_TOP + 20, 4),
    ...range(BODY_TOP + 18, BODY_TOP, 1),
  ];
  const bodyGeo = buildSweep({
    rows: sweepRows(bodyYs, bodyRow).map((r) => {
      // bottom shoulder tucks into the cap
      const d = BODY_BOTTOM - r.yr;
      const rb = 22;
      if (d < rb) {
        const inset = rb - Math.sqrt(Math.max(0, rb * rb - (rb - d) * (rb - d)));
        return { ...r, a: r.a - inset * 0.6, b: Math.max(1, r.b - inset * 0.4) };
      }
      return r;
    }),
    seg: 96,
    uvFn: labelUv,
    closeBottom: true,
    closeTop: false,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.name = 'tube-body';
  body.userData = { partId: 'tube-body', label: '튜브 본체', explode: 2.6 };

  const lid = new THREE.Mesh(
    buildSweep({
      rows: capLidRows(),
      seg: 180,
      uvFn: () => [0.01, 0.995],
      displace: notchDisplace,
      closeBottom: true,
      closeTop: true,
    }),
    lidMat,
  );
  lid.name = 'cap-lid';
  lid.userData = { partId: 'cap-lid', label: '플립 캡', explode: 1.3 };

  const base = new THREE.Mesh(
    buildSweep({
      rows: capBaseRows(),
      seg: 120,
      uvFn: () => [0.01, 0.995],
      closeBottom: true,
      closeTop: true,
    }),
    baseMat,
  );
  base.name = 'cap-base';
  base.userData = { partId: 'cap-base', label: '캡 베이스', explode: 0 };

  for (const m of [body, lid, base]) {
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
  }

  group.userData.parts = [body, lid, base];
  group.userData.bounds = { height: wy(BODY_TOP), halfWidth: 3.23 };
  group.userData.setExplode = (amount) => {
    for (const m of group.userData.parts) m.position.y = (m.userData.explode ?? 0) * amount;
  };
  return group;
}
