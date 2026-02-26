// ============================================================
//  MathUtils — ruido procedural y helpers matemáticos
//  Implementa Perlin-like noise 2D sin dependencias externas
// ============================================================

// ── Permutation table seeded con LCG ──────────────────────
function buildPermTable(seed) {
  const perm = new Uint8Array(512);
  let s = seed >>> 0;
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  // Fisher-Yates shuffle determinista
  for (let i = 255; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  return perm;
}

// ── Gradients 2D ──────────────────────────────────────────
const GRADS2 = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0,  1], [ 0, -1],
];

function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a, b, t) { return a + t * (b - a); }
function dot2(g, x, y) { return g[0] * x + g[1] * y; }

// ── Clase de ruido con seed ────────────────────────────────
export class Noise {
  constructor(seed = 0) {
    this._perm = buildPermTable(seed);
  }

  /** Perlin 2D normalizado [-1, 1] */
  perlin2(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const p = this._perm;
    const aa = p[p[X]     + Y];
    const ab = p[p[X]     + Y + 1];
    const ba = p[p[X + 1] + Y];
    const bb = p[p[X + 1] + Y + 1];
    return lerp(
      lerp(dot2(GRADS2[aa & 7], xf,     yf    ),
           dot2(GRADS2[ba & 7], xf - 1, yf    ), u),
      lerp(dot2(GRADS2[ab & 7], xf,     yf - 1),
           dot2(GRADS2[bb & 7], xf - 1, yf - 1), u),
      v
    );
  }

  /**
   * Octave noise — suma varias frecuencias (FBM)
   * @param {number} x
   * @param {number} y
   * @param {number} octaves   - número de capas (4-6 para terreno)
   * @param {number} persistence - amplitud por octava (0-1)
   * @param {number} lacunarity  - multiplicador de frecuencia (2)
   * @returns {number} valor en [-1, 1]
   */
  octave2(x, y, octaves = 4, persistence = 0.5, lacunarity = 2.0) {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue  = 0;
    for (let i = 0; i < octaves; i++) {
      value    += this.perlin2(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude  *= persistence;
      frequency  *= lacunarity;
    }
    return value / maxValue;
  }
}

// ── Helpers generales ─────────────────────────────────────
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function worldToChunk(wx, wz, chunkSize) {
  return {
    cx: Math.floor(wx / chunkSize),
    cz: Math.floor(wz / chunkSize),
  };
}

export function worldToBlock(wx, wy, wz, chunkSize) {
  const cx = Math.floor(wx / chunkSize);
  const cz = Math.floor(wz / chunkSize);
  return {
    cx, cz,
    lx: ((wx % chunkSize) + chunkSize) % chunkSize,
    ly: wy,
    lz: ((wz % chunkSize) + chunkSize) % chunkSize,
  };
}
