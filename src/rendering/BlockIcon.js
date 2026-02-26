// ============================================================
//  BlockIcon — icono isométrico 3D de bloque para el inventario
//
//  Dibuja 3 caras paralelas (top, izq, der) usando las mismas
//  texturas 16×16 del TextureGenerator. Devuelve dataURL
//  cacheada por blockId.
//
//  Geometry (28×28):
//      Top   : (0,7)→(14,0)→(28,7)→(14,14)   rhombus
//      Left  : (0,7)→(14,14)→(14,28)→(0,21)   left quad
//      Right : (14,14)→(28,7)→(28,21)→(14,28)  right quad
// ============================================================
import { getBlockTexKeys } from '../world/BlockTypes.js';
import { getTextureMaterial } from './TextureGenerator.js';

/** Cache blockId → dataURL */
const _cache = new Map();

/**
 * Devuelve una dataURL con el icono isométrico del bloque.
 * El resultado es cacheado para toda la vida del juego.
 * @param {number} blockId
 * @returns {string}
 */
export function getBlockIconURL(blockId) {
  if (_cache.has(blockId)) return _cache.get(blockId);
  const url = _buildIcon(blockId);
  _cache.set(blockId, url);
  return url;
}

// ── Helpers ───────────────────────────────────────────────────

function facePath(ctx, x0,y0, x1,y1, x2,y2, x3,y3) {
  ctx.beginPath();
  ctx.moveTo(x0,y0);
  ctx.lineTo(x1,y1);
  ctx.lineTo(x2,y2);
  ctx.lineTo(x3,y3);
  ctx.closePath();
}

function _buildIcon(blockId) {
  const W = 28, H = 28;
  const c   = document.createElement('canvas');
  c.width   = W;
  c.height  = H;
  const ctx = c.getContext('2d');

  const [topKey, sideKey] = getBlockTexKeys(blockId);
  // Acceder al canvas interno de la CanvasTexture de Three.js
  const topImg  = getTextureMaterial(topKey).map.image;
  const sideImg = getTextureMaterial(sideKey).map.image;

  // ── Cara superior ─────────────────────────────────────────
  // Textura (0,0)→screen(0,7), (16,0)→(14,0), (0,16)→(14,14), (16,16)→(28,7)
  // setTransform(a, b, c, d, e, f):  x'=ax+cy+e,  y'=bx+dy+f
  ctx.save();
  facePath(ctx,  0,7,  14,0,  28,7,  14,14);
  ctx.clip();
  ctx.setTransform(0.875, -0.4375,  0.875, 0.4375,  0, 7);
  ctx.drawImage(topImg, 0, 0);
  ctx.restore();

  // ── Cara izquierda (oscurecida 22%) ───────────────────────
  // Textura (0,0)→screen(0,7), (16,0)→(14,14), (0,16)→(0,21)
  ctx.save();
  facePath(ctx,  0,7,  14,14,  14,28,  0,21);
  ctx.clip();
  ctx.setTransform(0.875, 0.4375,  0, 0.875,  0, 7);
  ctx.drawImage(sideImg, 0, 0);
  ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  facePath(ctx,  0,7,  14,14,  14,28,  0,21);
  ctx.fill();
  ctx.restore();

  // ── Cara derecha (oscurecida 40%) ─────────────────────────
  // Textura (0,0)→screen(14,14), (16,0)→(28,7), (0,16)→(14,28)
  ctx.save();
  facePath(ctx,  14,14,  28,7,  28,21,  14,28);
  ctx.clip();
  ctx.setTransform(0.875, -0.4375,  0, 0.875,  14, 14);
  ctx.drawImage(sideImg, 0, 0);
  ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle = 'rgba(0,0,0,0.40)';
  facePath(ctx,  14,14,  28,7,  28,21,  14,28);
  ctx.fill();
  ctx.restore();

  // ── Bordes finos ──────────────────────────────────────────
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth   = 0.6;
  // Silueta exterior
  ctx.beginPath();
  ctx.moveTo(0,7); ctx.lineTo(14,0); ctx.lineTo(28,7);
  ctx.lineTo(28,21); ctx.lineTo(14,28); ctx.lineTo(0,21);
  ctx.closePath();
  ctx.stroke();
  // Aristas internas
  ctx.beginPath(); ctx.moveTo(0,7);  ctx.lineTo(14,14); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(28,7); ctx.lineTo(14,14); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(14,14); ctx.lineTo(14,28); ctx.stroke();

  return c.toDataURL();
}
