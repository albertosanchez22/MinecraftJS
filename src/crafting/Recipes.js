// ============================================================
//  Recipes — sistema de crafteo 2×2 y 3×3
// ============================================================
import { BlockID } from '../world/BlockTypes.js';

/**
 * Recetas shapeless: solo importa qué items y cuántos.
 * Recetas shaped (exact:true): todos los slots deben coincidir en orden.
 */
const RECIPES_2x2 = [
  // 1 Madera → 4 Tablones (slot único, igual que Minecraft)
  {
    shapeless: true,
    ingredients: { [BlockID.WOOD]: 1 },
    output: { id: BlockID.PLANKS, count: 4 },
  },
  // 4 Tablones exactos (2×2) → Mesa de crafteo
  {
    exact: true,
    pattern: [BlockID.PLANKS, BlockID.PLANKS, BlockID.PLANKS, BlockID.PLANKS],
    output: { id: BlockID.CRAFTING_TABLE, count: 1 },
  },
];

const RECIPES_3x3 = [
  // 1 Madera → 4 Tablones (igual que Minecraft vanilla)
  {
    shapeless: true,
    ingredients: { [BlockID.WOOD]: 1 },
    output: { id: BlockID.PLANKS, count: 4 },
  },
  // 4 Tablones → Mesa de crafteo
  {
    shapeless: true,
    ingredients: { [BlockID.PLANKS]: 4 },
    output: { id: BlockID.CRAFTING_TABLE, count: 1 },
  },
];

// ── Evaluadores ───────────────────────────────────────────────

function evalShapeless(craftSlots, recipes) {
  const counts = {};
  let total = 0;
  for (const slot of craftSlots) {
    if (slot?.count > 0) {
      counts[slot.id] = (counts[slot.id] ?? 0) + 1;
      total++;
    }
  }
  if (total === 0) return null;

  for (const recipe of recipes) {
    if (recipe.exact) {
      // Comparación posicional exacta
      if (craftSlots.length !== recipe.pattern.length) continue;
      let match = true;
      for (let i = 0; i < recipe.pattern.length; i++) {
        const expected = recipe.pattern[i];
        const got      = craftSlots[i]?.id ?? null;
        if (expected !== got) { match = false; break; }
      }
      if (match) return { ...recipe.output };
      continue;
    }

    if (!recipe.shapeless) continue;

    const needed     = recipe.ingredients;
    const neededKeys = Object.keys(needed);
    if (neededKeys.length !== Object.keys(counts).length) continue;

    let match = true;
    for (const key of neededKeys) {
      if ((counts[key] ?? 0) !== needed[key]) { match = false; break; }
    }
    if (match) return { ...recipe.output };
  }
  return null;
}

/**
 * Crafteo 2×2 (inventario normal).
 * @param {Array} craftSlots — 4 elementos
 */
export function evaluateRecipe(craftSlots) {
  return evalShapeless(craftSlots, RECIPES_2x2);
}

/**
 * Crafteo 3×3 (mesa de crafteo).
 * @param {Array} craftSlots — 9 elementos
 */
export function evaluateRecipe3x3(craftSlots) {
  return evalShapeless(craftSlots, RECIPES_3x3);
}
