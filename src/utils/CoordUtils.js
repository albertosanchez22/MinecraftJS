// ============================================================
//  CoordUtils — conversiones entre sistemas de coordenadas
//
//  Tres sistemas de coordenadas en el juego:
//    · Mundo (wx, wy, wz): enteros absolutos, espacio global
//    · Chunk (cx, cz):     índice del chunk en la cuadrícula
//    · Local (lx, ly, lz): coordenadas dentro del chunk [0, CHUNK_SIZE)
// ============================================================
import { CHUNK_SIZE } from './Constants.js';

/**
 * Convierte coordenada mundial X o Z al índice de chunk.
 * @param {number} w  - coordenada mundial (puede ser negativa)
 * @returns {number}  - índice de chunk
 */
export function worldToChunkAxis(w) {
  return Math.floor(w / CHUNK_SIZE);
}

/**
 * Convierte coordenada mundial al índice de chunk (cx, cz).
 * @param {number} wx
 * @param {number} wz
 * @returns {{ cx: number, cz: number }}
 */
export function worldToChunk(wx, wz) {
  return {
    cx: worldToChunkAxis(wx),
    cz: worldToChunkAxis(wz),
  };
}

/**
 * Convierte coordenada mundial a coordenada LOCAL dentro del chunk.
 * Maneja correctamente coordenadas negativas.
 * @param {number} w
 * @returns {number}  - valor en [0, CHUNK_SIZE)
 */
export function worldToLocal(w) {
  return ((w % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
}

/**
 * Descomposición completa: coordenada mundial → chunk + local.
 * @param {number} wx
 * @param {number} wy
 * @param {number} wz
 * @returns {{ cx: number, cz: number, lx: number, ly: number, lz: number }}
 */
export function worldToBlock(wx, wy, wz) {
  return {
    cx: worldToChunkAxis(wx),
    cz: worldToChunkAxis(wz),
    lx: worldToLocal(wx),
    ly: wy,
    lz: worldToLocal(wz),
  };
}

/**
 * Origen en mundo (esquina mínima) del chunk (cx, cz).
 * @param {number} cx
 * @param {number} cz
 * @returns {{ wx: number, wz: number }}
 */
export function chunkOrigin(cx, cz) {
  return { wx: cx * CHUNK_SIZE, wz: cz * CHUNK_SIZE };
}

/**
 * Clave de mapa para un chunk.
 * @param {number} cx
 * @param {number} cz
 * @returns {string}
 */
export function chunkKey(cx, cz) {
  return `${cx},${cz}`;
}
