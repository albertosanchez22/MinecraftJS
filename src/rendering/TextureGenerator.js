// ============================================================
//  TextureGenerator — genera texturas 16×16 en canvas (pixel-art)
//  Sin archivos externos. Estilo Minecraft clásico.
// ============================================================
import * as THREE from 'three';

const TEX_SIZE = 16;

// ── LCG determinista (seed por textura) ──────────────────────
function lcg(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}

// ── Helper: rect de pixel ─────────────────────────────────────
function px(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

// ── Crear CanvasTexture de 16×16 ─────────────────────────────
function makeCanvas(drawFn, seed = 0) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = TEX_SIZE;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, lcg(seed));
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ── Helpers de color ─────────────────────────────────────────
function rgb(r, g, b) { return `rgb(${r},${g},${b})`; }
function vary(r, g, b, rnd, range) {
  const v = Math.floor((rnd() - 0.5) * range);
  return rgb(
    Math.max(0, Math.min(255, r + v)),
    Math.max(0, Math.min(255, g + v)),
    Math.max(0, Math.min(255, b + v))
  );
}

// ─────────────────────────────────────────────────────────────
//  Definiciones de cada textura
// ─────────────────────────────────────────────────────────────

function grassTop(ctx, rnd) {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const v = Math.floor(rnd() * 3);
    const r = 78  + v * 6;
    const g = 130 + v * 8;
    const b = 55  + v * 4;
    px(ctx, x, y, rgb(r, g, b));
  }
  // Algunas manchas más oscuras
  for (let i = 0; i < 10; i++) {
    const x = Math.floor(rnd() * 16), y = Math.floor(rnd() * 16);
    px(ctx, x, y, rgb(55, 95, 38));
  }
}

function grassSide(ctx, rnd) {
  // Tierra base
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    px(ctx, x, y, vary(120, 85, 52, rnd, 18));
  }
  // Franja verde arriba (3px)
  for (let y = 0; y < 3; y++) for (let x = 0; x < 16; x++) {
    const v = Math.floor(rnd() * 3);
    px(ctx, x, y, rgb(78 + v * 6, 130 + v * 8, 55 + v * 4));
  }
  // Separador oscuro
  for (let x = 0; x < 16; x++) px(ctx, x, 3, rgb(60, 100, 40));
}

function dirt(ctx, rnd) {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    px(ctx, x, y, vary(120, 85, 52, rnd, 22));
  }
  // Pequeños guijarros
  for (let i = 0; i < 4; i++) {
    const x = Math.floor(rnd() * 15), y = Math.floor(rnd() * 15);
    px(ctx, x, y, rgb(95, 68, 42));
    px(ctx, x+1, y, rgb(95, 68, 42));
    px(ctx, x, y+1, rgb(95, 68, 42));
  }
}

function stone(ctx, rnd) {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    px(ctx, x, y, vary(120, 120, 120, rnd, 28));
  }
  // Grietas
  const cx = 2 + Math.floor(rnd() * 10), cy = 2 + Math.floor(rnd() * 10);
  for (let i = 0; i < 4; i++) { px(ctx, cx + i, cy, rgb(85, 85, 85)); }
  for (let i = 0; i < 3; i++) { px(ctx, cx + 3, cy + i, rgb(85, 85, 85)); }
}

function sand(ctx, rnd) {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    px(ctx, x, y, vary(218, 196, 110, rnd, 18));
  }
  // Puntitos oscuros
  for (let i = 0; i < 8; i++) {
    const x = Math.floor(rnd() * 16), y = Math.floor(rnd() * 16);
    px(ctx, x, y, rgb(180, 160, 85));
  }
}

function woodSide(ctx, rnd) {
  // Base marrón con vetas verticales
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const vein = Math.sin(x * 1.1 + rnd() * 0.4) * 12;
    const r = Math.round(Math.max(0, Math.min(255, 108 + vein + (rnd() - 0.5) * 10)));
    const g = Math.round(Math.max(0, Math.min(255, 74  + vein * 0.6 + (rnd() - 0.5) * 8)));
    const b = Math.round(Math.max(0, Math.min(255, 30  + vein * 0.3 + (rnd() - 0.5) * 5)));
    px(ctx, x, y, rgb(r, g, b));
  }
  // Bordes oscuros (corteza)
  for (let y = 0; y < 16; y++) {
    px(ctx, 0,  y, rgb(70, 45, 18));
    px(ctx, 15, y, rgb(70, 45, 18));
  }
}

function woodTop(ctx, rnd) {
  // Anillos concéntricos
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const dx = x - 7.5, dy = y - 7.5;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const ring = Math.floor(dist * 1.2) % 2;
    const base = ring === 0 ? 105 : 88;
    px(ctx, x, y, vary(base, base * 0.68, base * 0.28, rnd, 10));
  }
  // Corteza circular
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const dx = x - 7.5, dy = y - 7.5;
    if (Math.sqrt(dx*dx + dy*dy) > 7) px(ctx, x, y, rgb(70, 45, 18));
  }
}

function leaves(ctx, rnd) {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const v = Math.floor(rnd() * 4);
    // Variación de verde, sin huecos transparentes
    const dark = rnd() < 0.12;
    if (dark) {
      px(ctx, x, y, rgb(28, 70, 20));
    } else {
      px(ctx, x, y, rgb(38 + v * 8, 100 + v * 10, 28 + v * 5));
    }
  }
  // Venas claras
  for (let i = 0; i < 3; i++) {
    const sx = Math.floor(rnd() * 14) + 1;
    const sy = Math.floor(rnd() * 14) + 1;
    px(ctx, sx, sy, rgb(95, 155, 55));
    px(ctx, sx+1, sy, rgb(95, 155, 55));
  }
}

function snow(ctx, rnd) {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const v = Math.floor(rnd() * 4);
    px(ctx, x, y, rgb(235 + v, 238 + v, 248 + v));
  }
  // Reflejos de luz
  for (let i = 0; i < 5; i++) {
    const x = Math.floor(rnd() * 16), y = Math.floor(rnd() * 16);
    px(ctx, x, y, rgb(255, 255, 255));
  }
  // Sombras sutiles
  for (let i = 0; i < 4; i++) {
    const x = Math.floor(rnd() * 16), y = Math.floor(rnd() * 16);
    px(ctx, x, y, rgb(195, 210, 230));
  }
}

function planks(ctx, rnd) {
  // Tablón base (4px de alto cada tablón)
  for (let y = 0; y < 16; y++) {
    const plankRow = Math.floor(y / 4);
    const isSeam   = (y % 4 === 0);
    const offset   = (plankRow % 2) * 8; // desfase en X por tablón

    for (let x = 0; x < 16; x++) {
      if (isSeam) {
        px(ctx, x, y, rgb(88, 62, 24));
        continue;
      }
      // Separador vertical (cada 8px, alternado)
      const lx = (x + offset) % 16;
      if (lx === 0) { px(ctx, x, y, rgb(88, 62, 24)); continue; }

      const v = Math.floor(rnd() * 4);
      px(ctx, x, y, rgb(188 + v, 148 + v, 88 + v));
    }
  }
  // Veta de madera sutil
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (rnd() < 0.04) px(ctx, x, y, rgb(148, 110, 55));
  }
}

function craftingTableTop(ctx, rnd) {
  // Base de madera
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    px(ctx, x, y, vary(148, 105, 58, rnd, 12));
  }
  // Cuadrícula 3×3 en la superficie
  for (let i of [4, 9, 14]) {
    for (let j = 1; j < 15; j++) {
      px(ctx, i, j, rgb(80, 52, 18));
      px(ctx, j, i, rgb(80, 52, 18));
    }
  }
  // Borde exterior oscuro
  for (let i = 0; i < 16; i++) {
    px(ctx, i, 0, rgb(60, 38, 12));
    px(ctx, i, 15, rgb(60, 38, 12));
    px(ctx, 0, i, rgb(60, 38, 12));
    px(ctx, 15, i, rgb(60, 38, 12));
  }
}

function craftingTableSide(ctx, rnd) {
  // Mitad inferior: tablones
  for (let y = 8; y < 16; y++) for (let x = 0; x < 16; x++) {
    const v = Math.floor(rnd() * 4);
    px(ctx, x, y, rgb(188 + v, 148 + v, 88 + v));
  }
  // Separador horizontal entre mitades
  for (let x = 0; x < 16; x++) px(ctx, x, 8, rgb(70, 45, 15));

  // Mitad superior: herramientas grabadas
  for (let y = 0; y < 8; y++) for (let x = 0; x < 16; x++) {
    px(ctx, x, y, vary(130, 92, 50, rnd, 10));
  }
  // Hacha izquierda (gris)
  for (const [x, y] of [[3,1],[4,1],[3,2],[4,2],[3,3],[3,4],[3,5]]) px(ctx, x, y, rgb(70, 70, 70));
  // Pico derecho (gris)
  for (const [x, y] of [[9,1],[10,1],[11,1],[10,2],[10,3],[10,4],[10,5]]) px(ctx, x, y, rgb(70, 70, 70));
  // Mangos marrones
  for (const [x, y] of [[3,4],[3,5],[3,6],[10,4],[10,5],[10,6]]) px(ctx, x, y, rgb(120, 80, 30));
}

// ─────────────────────────────────────────────────────────────
//  Mapa de texturas — exportado
//  Cada entrada: función de dibujo + seed
// ─────────────────────────────────────────────────────────────

const TEXTURE_DEFS = {
  grass_top:           [grassTop,          1001],
  grass_side:          [grassSide,         1002],
  dirt:                [dirt,              1003],
  stone:               [stone,             1004],
  sand:                [sand,              1005],
  wood_side:           [woodSide,          1006],
  wood_top:            [woodTop,           1007],
  leaves:              [leaves,            1008],
  snow:                [snow,              1009],
  planks:              [planks,            1010],
  crafting_table_top:  [craftingTableTop,  1011],
  crafting_table_side: [craftingTableSide, 1012],
};

/** Cache de materiales por clave de textura */
const _cache = new Map();

/**
 * Devuelve un THREE.MeshLambertMaterial con la textura indicada.
 * Resultado cacheado.
 * @param {string} key
 * @returns {THREE.MeshLambertMaterial}
 */
export function getTextureMaterial(key) {
  if (_cache.has(key)) return _cache.get(key);

  const def = TEXTURE_DEFS[key];
  if (!def) {
    // Fallback: magenta
    const mat = new THREE.MeshLambertMaterial({ color: 0xff00ff });
    _cache.set(key, mat);
    return mat;
  }

  const [drawFn, seed] = def;
  const tex = makeCanvas(drawFn, seed);
  const mat = new THREE.MeshLambertMaterial({ map: tex });
  _cache.set(key, mat);
  return mat;
}

/**
 * Carga (lazy) todas las texturas para evitar picos en el primer frame.
 */
export function preloadTextures() {
  for (const key of Object.keys(TEXTURE_DEFS)) getTextureMaterial(key);
}
