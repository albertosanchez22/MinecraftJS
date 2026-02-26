// ============================================================
//  TerrainGenerator — rellena chunks con terreno procedural
// ============================================================
import { CHUNK_SIZE, CHUNK_HEIGHT, SEA_LEVEL,
         TERRAIN_AMPLITUDE, TERRAIN_SCALE, WORLD_SEED } from '../utils/Constants.js';
import { Noise } from '../utils/MathUtils.js';
import { BlockID } from './BlockTypes.js';

export class TerrainGenerator {
  constructor(seed = WORLD_SEED) {
    this._noise = new Noise(seed);
  }

  /**
   * Popula todos los bloques de un Chunk.
   * @param {import('./Chunk.js').Chunk} chunk
   */
  generate(chunk) {
    const { cx, cz } = chunk;

    // 1. Terreno base
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = cx * CHUNK_SIZE + lx;
        const wz = cz * CHUNK_SIZE + lz;
        const h = this._surfaceHeight(wx, wz);
        for (let ly = 0; ly < CHUNK_HEIGHT; ly++) {
          const id = this._blockAt(ly, h);
          if (id !== BlockID.AIR) chunk.setBlock(lx, ly, lz, id);
        }
      }
    }

    // 2. Árboles
    this._generateTrees(chunk);

    chunk.dirty = true;
  }

  _generateTrees(chunk) {
    const { cx, cz } = chunk;
    // RNG determinista por chunk
    let rng = (cx * 73856093) ^ (cz * 19349663);
    const rand = () => { rng = (rng * 1664525 + 1013904223) & 0x7fffffff; return rng / 0x7fffffff; };

    const numTrees = Math.floor(rand() * 4); // 0-3 árboles por chunk

    for (let t = 0; t < numTrees; t++) {
      const lx = 2 + Math.floor(rand() * (CHUNK_SIZE - 4));
      const lz = 2 + Math.floor(rand() * (CHUNK_SIZE - 4));
      const wx = cx * CHUNK_SIZE + lx;
      const wz = cz * CHUNK_SIZE + lz;

      // Solo en superficie de hierba
      const h = this._surfaceHeight(wx, wz);
      if (h < SEA_LEVEL || h > SEA_LEVEL + TERRAIN_AMPLITUDE - 3) continue;
      if (chunk.getBlock(lx, h, lz) !== BlockID.GRASS) continue; // h es el bloque de hierba

      const trunkH = 4 + Math.floor(rand() * 2); // 4-5 bloques de tronco

      // Tronco — empieza en h+1 para no reemplazar la hierba
      for (let y = 1; y <= trunkH; y++) {
        chunk.setBlock(lx, h + y, lz, BlockID.WOOD);
      }

      // Copa de hojas — centrada en la punta del tronco
      const top = h + trunkH + 1;
      for (let dy = -1; dy <= 2; dy++) {
        const radius = dy >= 1 ? 1 : 2;
        for (let dx = -radius; dx <= radius; dx++) {
          for (let dz = -radius; dz <= radius; dz++) {
            if (Math.abs(dx) === radius && Math.abs(dz) === radius) continue; // esquinas
            const lx2 = lx + dx;
            const lz2 = lz + dz;
            const ly2 = top + dy;
            if (lx2 < 0 || lx2 >= CHUNK_SIZE || lz2 < 0 || lz2 >= CHUNK_SIZE) continue;
            if (chunk.getBlock(lx2, ly2, lz2) === BlockID.AIR) {
              chunk.setBlock(lx2, ly2, lz2, BlockID.LEAVES);
            }
          }
        }
      }
    }
  }

  // ── PRIVADOS ────────────────────────────────────────────

  _surfaceHeight(wx, wz) {
    const n = this._noise.octave2(
      wx * TERRAIN_SCALE,
      wz * TERRAIN_SCALE,
      5, 0.5, 2.0
    );
    // n ∈ [-1, 1] → altura ∈ [SEA_LEVEL-AMP, SEA_LEVEL+AMP]
    return Math.round(SEA_LEVEL + n * TERRAIN_AMPLITUDE);
  }

  _blockAt(ly, surfaceHeight) {
    if (ly === 0) return BlockID.STONE; // bedrock

    if (ly > surfaceHeight) return BlockID.AIR;

    if (ly === surfaceHeight) {
      if (surfaceHeight > SEA_LEVEL + 6) return BlockID.SNOW;
      if (surfaceHeight < SEA_LEVEL - 1) return BlockID.SAND;
      return BlockID.GRASS;
    }

    if (ly >= surfaceHeight - 3) return BlockID.DIRT;

    return BlockID.STONE;
  }
}
