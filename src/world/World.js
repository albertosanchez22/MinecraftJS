// ============================================================
//  World — gestiona chunks: creación, caché y acceso a bloques
// ============================================================
import { CHUNK_HEIGHT, RENDER_DISTANCE } from '../utils/Constants.js';
import { worldToChunk, worldToBlock, chunkKey } from '../utils/CoordUtils.js';
import { Chunk } from './Chunk.js';
import { TerrainGenerator } from './TerrainGenerator.js';

export class World {
  constructor() {
    /** @type {Map<string, Chunk>} */
    this._chunks    = new Map();
    this._generator = new TerrainGenerator();
  }

  // ── Acceso a chunks ──────────────────────────────────────

  getChunk(cx, cz) {
    return this._chunks.get(chunkKey(cx, cz)) ?? null;
  }

  getOrCreateChunk(cx, cz) {
    const key = chunkKey(cx, cz);
    if (!this._chunks.has(key)) {
      const chunk = new Chunk(cx, cz);
      this._generator.generate(chunk);
      this._chunks.set(key, chunk);
    }
    return this._chunks.get(key);
  }

  // ── Acceso a bloques por coordenada mundial ──────────────

  /**
   * Devuelve el ID de bloque en (wx, wy, wz).
   * Retorna 0 (AIR) fuera de rango o en chunks no cargados.
   * @param {number} wx
   * @param {number} wy
   * @param {number} wz
   * @returns {number}
   */
  getBlock(wx, wy, wz) {
    if (wy < 0 || wy >= CHUNK_HEIGHT) return 0;
    const { cx, cz, lx, ly, lz } = worldToBlock(wx, wy, wz);
    return this.getChunk(cx, cz)?.getBlock(lx, ly, lz) ?? 0;
  }

  /**
   * Establece el bloque en (wx, wy, wz).
   * Crea el chunk si no existe.
   * @param {number} wx
   * @param {number} wy
   * @param {number} wz
   * @param {number} id
   */
  setBlock(wx, wy, wz, id) {
    if (wy < 0 || wy >= CHUNK_HEIGHT) return;
    const { cx, cz, lx, ly, lz } = worldToBlock(wx, wy, wz);
    this.getOrCreateChunk(cx, cz).setBlock(lx, ly, lz, id);
  }

  // ── Gestión de carga alrededor del jugador ────────────────

  /**
   * Garantiza que los chunks en RENDER_DISTANCE alrededor de (px, pz)
   * existen y están generados. Devuelve los chunks que necesitan rebuild de mesh.
   * @param {number} px
   * @param {number} pz
   * @returns {Chunk[]}
   */
  updateAroundPlayer(px, pz) {
    const { cx: pcx, cz: pcz } = worldToChunk(px, pz);
    const dirty = [];

    for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
      for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
        const chunk = this.getOrCreateChunk(pcx + dx, pcz + dz);
        if (chunk.dirty) dirty.push(chunk);
      }
    }
    return dirty;
  }

  /**
   * Altura del bloque sólido más alto en (wx, wz).
   * Útil para posicionar el spawn del jugador.
   * @param {number} wx
   * @param {number} wz
   * @returns {number}
   */
  surfaceY(wx, wz) {
    const fx = Math.floor(wx);
    const fz = Math.floor(wz);
    for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
      if (this.getBlock(fx, y, fz) !== 0) return y + 1;
    }
    return 1;
  }

  /** Mapa interno de chunks (solo lectura) */
  get chunks() { return this._chunks; }
}

