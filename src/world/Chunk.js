// ============================================================
//  Chunk — almacena los datos de un chunk 16×64×16
//  Cada voxel es un uint8 (BlockID).
// ============================================================
import { CHUNK_SIZE, CHUNK_HEIGHT } from '../utils/Constants.js';

export class Chunk {
  /**
   * @param {number} cx  - coordenada chunk en X
   * @param {number} cz  - coordenada chunk en Z
   */
  constructor(cx, cz) {
    this.cx = cx;
    this.cz = cz;
    // Flat array: índice = lx + lz*CHUNK_SIZE + ly*CHUNK_SIZE*CHUNK_SIZE
    this.data = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);
    this.dirty = true;      // necesita regenerar mesh
    this.mesh  = null;      // referencia al Three.js mesh (gestionado por ChunkMesh)
  }

  /** Convierte coordenadas locales a índice del array */
  static index(lx, ly, lz) {
    return lx + lz * CHUNK_SIZE + ly * CHUNK_SIZE * CHUNK_SIZE;
  }

  getBlock(lx, ly, lz) {
    if (lx < 0 || lx >= CHUNK_SIZE ||
        ly < 0 || ly >= CHUNK_HEIGHT ||
        lz < 0 || lz >= CHUNK_SIZE) return 0;
    return this.data[Chunk.index(lx, ly, lz)];
  }

  setBlock(lx, ly, lz, id) {
    if (lx < 0 || lx >= CHUNK_SIZE ||
        ly < 0 || ly >= CHUNK_HEIGHT ||
        lz < 0 || lz >= CHUNK_SIZE) return;
    this.data[Chunk.index(lx, ly, lz)] = id;
    this.dirty = true;
  }

  /** Coordenadas mundiales del origen (esquina -X, -Z) del chunk */
  get worldX() { return this.cx * CHUNK_SIZE; }
  get worldZ() { return this.cz * CHUNK_SIZE; }
}
