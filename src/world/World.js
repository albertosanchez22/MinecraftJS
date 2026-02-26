// ============================================================
//  World — gestiona chunks: creación, acceso a bloques
// ============================================================
import { CHUNK_SIZE, CHUNK_HEIGHT, RENDER_DISTANCE } from '../utils/Constants.js';
import { Chunk } from './Chunk.js';
import { TerrainGenerator } from './TerrainGenerator.js';
import { worldToChunk, worldToBlock } from '../utils/MathUtils.js';

export class World {
  constructor() {
    /** @type {Map<string, Chunk>} */
    this._chunks = new Map();
    this._generator = new TerrainGenerator();
  }

  // ── Acceso a chunks ──────────────────────────────────────

  chunkKey(cx, cz) { return `${cx},${cz}`; }

  getChunk(cx, cz) {
    return this._chunks.get(this.chunkKey(cx, cz)) ?? null;
  }

  getOrCreateChunk(cx, cz) {
    const key = this.chunkKey(cx, cz);
    if (!this._chunks.has(key)) {
      const chunk = new Chunk(cx, cz);
      this._generator.generate(chunk);
      this._chunks.set(key, chunk);
    }
    return this._chunks.get(key);
  }

  // ── Acceso a bloques por coordenada mundial ──────────────

  getBlock(wx, wy, wz) {
    if (wy < 0 || wy >= CHUNK_HEIGHT) return 0;
    const { cx, cz, lx, ly, lz } = worldToBlock(wx, wy, wz, CHUNK_SIZE);
    const chunk = this.getChunk(cx, cz);
    return chunk ? chunk.getBlock(lx, ly, lz) : 0;
  }

  setBlock(wx, wy, wz, id) {
    if (wy < 0 || wy >= CHUNK_HEIGHT) return;
    const { cx, cz, lx, ly, lz } = worldToBlock(wx, wy, wz, CHUNK_SIZE);
    const chunk = this.getOrCreateChunk(cx, cz);
    chunk.setBlock(lx, ly, lz, id);
  }

  // ── Carga de chunks alrededor del jugador ─────────────────

  /**
   * Asegura que los chunks en un radio de RENDER_DISTANCE alrededor
   * de (px, pz) existen. Devuelve chunks nuevos o dirty.
   * @param {number} px - posición mundial X del jugador
   * @param {number} pz - posición mundial Z del jugador
   * @returns {Chunk[]} chunks que necesitan mesh rebuild
   */
  updateAroundPlayer(px, pz) {
    const { cx: pcx, cz: pcz } = worldToChunk(px, pz, CHUNK_SIZE);
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
   * Altura máxima sólida en una coordenada (wx, wz).
   * Útil para spawn del jugador.
   */
  surfaceY(wx, wz) {
    for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
      if (this.getBlock(Math.floor(wx), y, Math.floor(wz)) !== 0) return y + 1;
    }
    return 1;
  }

  get chunks() { return this._chunks; }
}
