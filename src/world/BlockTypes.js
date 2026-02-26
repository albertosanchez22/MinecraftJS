// ============================================================
//  BlockTypes — definición de todos los tipos de bloque
//  Para añadir un bloque nuevo: agrega una entrada al mapa.
// ============================================================

/** IDs de bloque (uint8, 0 = aire) */
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

/**
 * Propiedades de cada bloque.
 * color: hex para renderizado procedural (sin texturas por ahora)
 * solid: si colisiona
 * transparent: si deja pasar la luz / no oculta caras vecinas
 */
/**
 * breakTime: segundos aguantando clic hasta romper el bloque
 * drops: qué BlockID da al romperlo (null = nada)
 */
export const BlockDef = {
  [BlockID.AIR]:    { name: 'Air',    solid: false, transparent: true,  color: 0x000000,   breakTime: Infinity, drops: null },
  [BlockID.GRASS]:  { name: 'Grass',  solid: true,  transparent: false, colorTop: 0x5a8f3c, colorSide: 0x7a5c3a, colorBottom: 0x7a5c3a, breakTime: 0.6, drops: BlockID.DIRT },
  [BlockID.DIRT]:   { name: 'Dirt',   solid: true,  transparent: false, color: 0x7a5c3a,   breakTime: 0.5, drops: BlockID.DIRT },
  [BlockID.STONE]:  { name: 'Stone',  solid: true,  transparent: false, color: 0x7a7a7a,   breakTime: 1.5, drops: BlockID.STONE },
  [BlockID.SAND]:   { name: 'Sand',   solid: true,  transparent: false, color: 0xdec87a,   breakTime: 0.5, drops: BlockID.SAND },
  [BlockID.WATER]:  { name: 'Water',  solid: false, transparent: true,  color: 0x3a7ac8,   breakTime: Infinity, drops: null },
  [BlockID.WOOD]:   { name: 'Wood',   solid: true,  transparent: false, color: 0x6b4c1e,   breakTime: 1.2, drops: BlockID.WOOD },
  [BlockID.LEAVES]: { name: 'Leaves', solid: true,  transparent: false, color: 0x3a7a2a,   breakTime: 0.3, drops: BlockID.LEAVES },
  [BlockID.SNOW]:   { name: 'Snow',   solid: true,  transparent: false, color: 0xf0f0f0,   breakTime: 0.2, drops: BlockID.SNOW },
  [BlockID.PLANKS]:         { name: 'Planks',          solid: true, transparent: false, color: 0xc8a460, breakTime: 0.8, drops: BlockID.PLANKS },
  [BlockID.CRAFTING_TABLE]: { name: 'Crafting Table',  solid: true, transparent: false, color: 0xa07840, breakTime: 0.8, drops: BlockID.CRAFTING_TABLE },
};

/** Helper: ¿el bloque bloquea caras vecinas? */
export function isSolid(id) {
  const def = BlockDef[id];
  return def ? def.solid : false;
}

export function isTransparent(id) {
  const def = BlockDef[id];
  return def ? def.transparent : true;
}

/**
 * Devuelve los colores [top, side, bottom] de un bloque.
 * Si el bloque tiene un solo color, se aplica a todas las caras.
 */
export function getBlockColors(id) {
  const def = BlockDef[id];
  if (!def) return [0xff00ff, 0xff00ff, 0xff00ff];
  return [
    def.colorTop    ?? def.color,
    def.colorSide   ?? def.color,
    def.colorBottom ?? def.color,
  ];
}

/**
 * Devuelve las claves de textura [top, side, bottom] de un bloque.
 * Usadas por ChunkMeshBuilder y HandRenderer para obtener materiales.
 * @param {number} id
 * @returns {[string, string, string]}
 */
export function getBlockTexKeys(id) {
  switch (id) {
    case BlockID.GRASS:  return ['grass_top',  'grass_side', 'dirt'];
    case BlockID.DIRT:   return ['dirt',        'dirt',       'dirt'];
    case BlockID.STONE:  return ['stone',       'stone',      'stone'];
    case BlockID.SAND:   return ['sand',        'sand',       'sand'];
    case BlockID.WOOD:   return ['wood_top',    'wood_side',  'wood_top'];
    case BlockID.LEAVES: return ['leaves',      'leaves',     'leaves'];
    case BlockID.SNOW:   return ['snow',        'grass_side', 'dirt'];
    case BlockID.PLANKS:         return ['planks',             'planks',             'planks'];
    case BlockID.CRAFTING_TABLE: return ['crafting_table_top', 'crafting_table_side', 'planks'];
    default:                     return ['stone',              'stone',               'stone'];
  }
}
