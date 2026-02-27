// ============================================================
//  BlockTypes — registro de todos los tipos de bloque
//
//  Para añadir un bloque nuevo:
//    1. Añade su ID a BlockID (uint8, máximo 255)
//    2. Regístralo con BlockRegistry.register(id, def)
//
//  La definición (BlockDef) centraliza TODAS las propiedades:
//  físicas, visuales y de jugabilidad en un único lugar.
// ============================================================

// ── IDs de bloque ─────────────────────────────────────────────
/** @enum {number} */
export const BlockID = Object.freeze({
  AIR:            0,
  GRASS:          1,
  DIRT:           2,
  STONE:          3,
  SAND:           4,
  WATER:          5,
  WOOD:           6,
  LEAVES:         7,
  SNOW:           8,
  PLANKS:         9,
  CRAFTING_TABLE: 10,
});

// ── Registro central ──────────────────────────────────────────

/**
 * @typedef {Object} BlockDefinition
 * @property {string}  name         - nombre legible del bloque
 * @property {boolean} solid        - si colisiona con el jugador
 * @property {boolean} transparent  - si no oculta caras vecinas
 * @property {number}  color        - color hex de fallback
 * @property {number}  [colorTop]   - color hex de la cara superior (override)
 * @property {number}  [colorSide]  - color hex de las caras laterales (override)
 * @property {number}  [colorBottom]- color hex de la cara inferior (override)
 * @property {number}  breakTime    - segundos hasta romper (Infinity = irrompible)
 * @property {number|null} drops    - BlockID que suelta al romperse (null = nada)
 * @property {[string,string,string]} texKeys - [top, side, bottom] para TextureGenerator
 */

class BlockRegistryClass {
  constructor() {
    /** @type {Map<number, BlockDefinition>} */
    this._map = new Map();
  }

  /**
   * Registra un bloque. Lanza si el ID ya existe.
   * @param {number} id
   * @param {BlockDefinition} def
   */
  register(id, def) {
    if (this._map.has(id)) {
      throw new Error(`[BlockRegistry] ID ${id} ya registrado ("${this._map.get(id).name}")`);
    }
    this._map.set(id, Object.freeze(def));
  }

  /**
   * Obtiene la definición de un bloque. Devuelve undefined si no existe.
   * @param {number} id
   * @returns {BlockDefinition | undefined}
   */
  get(id) {
    return this._map.get(id);
  }

  isSolid(id)       { return this._map.get(id)?.solid       ?? false; }
  isTransparent(id) { return this._map.get(id)?.transparent ?? true;  }

  /**
   * Colores [top, side, bottom] del bloque.
   * @param {number} id
   * @returns {[number, number, number]}
   */
  getColors(id) {
    const d = this._map.get(id);
    if (!d) return [0xff00ff, 0xff00ff, 0xff00ff]; // magenta = bloque desconocido
    return [
      d.colorTop    ?? d.color,
      d.colorSide   ?? d.color,
      d.colorBottom ?? d.color,
    ];
  }

  /**
   * Claves de textura [top, side, bottom] para TextureGenerator.
   * @param {number} id
   * @returns {[string, string, string]}
   */
  getTexKeys(id) {
    return this._map.get(id)?.texKeys ?? ['stone', 'stone', 'stone'];
  }

  /** Iterador sobre todos los bloques registrados. */
  entries() { return this._map.entries(); }
}

export const BlockRegistry = new BlockRegistryClass();

// ── Definiciones de bloques ──────────────────────────────────
// Formato: BlockRegistry.register(BlockID.XXX, { ...def })

BlockRegistry.register(BlockID.AIR, {
  name: 'Air', solid: false, transparent: true, color: 0x000000,
  breakTime: Infinity, drops: null,
  texKeys: ['stone', 'stone', 'stone'],
});
BlockRegistry.register(BlockID.GRASS, {
  name: 'Grass', solid: true, transparent: false,
  color: 0x7a5c3a, colorTop: 0x5a8f3c, colorSide: 0x7a5c3a, colorBottom: 0x7a5c3a,
  breakTime: 0.6, drops: BlockID.DIRT,
  texKeys: ['grass_top', 'grass_side', 'dirt'],
});
BlockRegistry.register(BlockID.DIRT, {
  name: 'Dirt', solid: true, transparent: false, color: 0x7a5c3a,
  breakTime: 0.5, drops: BlockID.DIRT,
  texKeys: ['dirt', 'dirt', 'dirt'],
});
BlockRegistry.register(BlockID.STONE, {
  name: 'Stone', solid: true, transparent: false, color: 0x7a7a7a,
  breakTime: 1.5, drops: BlockID.STONE,
  texKeys: ['stone', 'stone', 'stone'],
});
BlockRegistry.register(BlockID.SAND, {
  name: 'Sand', solid: true, transparent: false, color: 0xdec87a,
  breakTime: 0.5, drops: BlockID.SAND,
  texKeys: ['sand', 'sand', 'sand'],
});
BlockRegistry.register(BlockID.WATER, {
  name: 'Water', solid: false, transparent: true, color: 0x3a7ac8,
  breakTime: Infinity, drops: null,
  texKeys: ['stone', 'stone', 'stone'],
});
BlockRegistry.register(BlockID.WOOD, {
  name: 'Wood', solid: true, transparent: false, color: 0x6b4c1e,
  breakTime: 1.2, drops: BlockID.WOOD,
  texKeys: ['wood_top', 'wood_side', 'wood_top'],
});
BlockRegistry.register(BlockID.LEAVES, {
  name: 'Leaves', solid: true, transparent: false, color: 0x3a7a2a,
  breakTime: 0.3, drops: BlockID.LEAVES,
  texKeys: ['leaves', 'leaves', 'leaves'],
});
BlockRegistry.register(BlockID.SNOW, {
  name: 'Snow', solid: true, transparent: false, color: 0xf0f0f0,
  breakTime: 0.2, drops: BlockID.SNOW,
  texKeys: ['snow', 'grass_side', 'dirt'],
});
BlockRegistry.register(BlockID.PLANKS, {
  name: 'Planks', solid: true, transparent: false, color: 0xc8a460,
  breakTime: 0.8, drops: BlockID.PLANKS,
  texKeys: ['planks', 'planks', 'planks'],
});
BlockRegistry.register(BlockID.CRAFTING_TABLE, {
  name: 'Crafting Table', solid: true, transparent: false, color: 0xa07840,
  breakTime: 0.8, drops: BlockID.CRAFTING_TABLE,
  texKeys: ['crafting_table_top', 'crafting_table_side', 'planks'],
});

// ── Aliases para compatibilidad (serán eliminados en v2) ──────
// Código nuevo debe usar BlockRegistry directamente.

/** @deprecated Usa BlockRegistry.get(id) */
export const BlockDef = new Proxy({}, {
  get(_, prop) { return BlockRegistry.get(Number(prop)); },
});

/** @deprecated Usa BlockRegistry.isSolid(id) */
export function isSolid(id)       { return BlockRegistry.isSolid(id); }

/** @deprecated Usa BlockRegistry.isTransparent(id) */
export function isTransparent(id) { return BlockRegistry.isTransparent(id); }

/** @deprecated Usa BlockRegistry.getColors(id) */
export function getBlockColors(id) { return BlockRegistry.getColors(id); }

/** @deprecated Usa BlockRegistry.getTexKeys(id) */
export function getBlockTexKeys(id) { return BlockRegistry.getTexKeys(id); }

