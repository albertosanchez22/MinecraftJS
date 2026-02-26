// ============================================================
//  Raycast — DDA voxel traversal
//  Devuelve el bloque más cercano que toca el rayo
// ============================================================
import { isSolid } from '../world/BlockTypes.js';

/**
 * Lanza un rayo desde `origin` en `direction` y devuelve
 * el primer bloque sólido encontrado.
 *
 * @param {import('../world/World.js').World} world
 * @param {{x,y,z}} origin     - posición del ojo del jugador
 * @param {{x,y,z}} direction  - dirección normalizada
 * @param {number}  maxDist    - distancia máxima en bloques
 * @returns {{ pos:{x,y,z}, normal:{x,y,z}, distance:number } | null}
 */
export function raycastWorld(world, origin, direction, maxDist = 6) {
  // Posición actual (float)
  let x = origin.x;
  let y = origin.y;
  let z = origin.z;

  // Bloque actual
  let bx = Math.floor(x);
  let by = Math.floor(y);
  let bz = Math.floor(z);

  const dx = direction.x;
  const dy = direction.y;
  const dz = direction.z;

  // Paso por eje
  const stepX = dx >= 0 ? 1 : -1;
  const stepY = dy >= 0 ? 1 : -1;
  const stepZ = dz >= 0 ? 1 : -1;

  // Distancia a cruzar 1 bloque en cada eje
  const tDeltaX = dx !== 0 ? Math.abs(1 / dx) : Infinity;
  const tDeltaY = dy !== 0 ? Math.abs(1 / dy) : Infinity;
  const tDeltaZ = dz !== 0 ? Math.abs(1 / dz) : Infinity;

  // Distancia hasta el primer cruce de eje en cada dirección
  let tMaxX = dx !== 0 ? (dx > 0 ? (Math.ceil(x) - x) : (x - Math.floor(x))) / Math.abs(dx) : Infinity;
  let tMaxY = dy !== 0 ? (dy > 0 ? (Math.ceil(y) - y) : (y - Math.floor(y))) / Math.abs(dy) : Infinity;
  let tMaxZ = dz !== 0 ? (dz > 0 ? (Math.ceil(z) - z) : (z - Math.floor(z))) / Math.abs(dz) : Infinity;

  let lastNormal = { x: 0, y: 0, z: 0 };

  while (true) {
    // Avanzar al siguiente cruce (el más cercano)
    let t;
    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      t = tMaxX;
      tMaxX += tDeltaX;
      bx += stepX;
      lastNormal = { x: -stepX, y: 0, z: 0 };
    } else if (tMaxY < tMaxZ) {
      t = tMaxY;
      tMaxY += tDeltaY;
      by += stepY;
      lastNormal = { x: 0, y: -stepY, z: 0 };
    } else {
      t = tMaxZ;
      tMaxZ += tDeltaZ;
      bz += stepZ;
      lastNormal = { x: 0, y: 0, z: -stepZ };
    }

    if (t > maxDist) return null;

    const id = world.getBlock(bx, by, bz);
    if (isSolid(id)) {
      return {
        pos: { x: bx, y: by, z: bz },
        normal: lastNormal,
        distance: t,
        blockId: id,
      };
    }
  }
}
