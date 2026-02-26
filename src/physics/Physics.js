// ============================================================
//  Physics — AABB + gravedad + colisiones con el mundo
// ============================================================
import * as THREE from 'three';
import { GRAVITY, PLAYER_HEIGHT, PLAYER_WIDTH } from '../utils/Constants.js';
import { isSolid } from '../world/BlockTypes.js';
import { clamp } from '../utils/MathUtils.js';

export class Physics {
  /**
   * Aplica gravedad y mueve el AABB del jugador con resolución de colisiones.
   * @param {import('./Player.js').Player} player
   * @param {import('../world/World.js').World} world
   * @param {number} dt  - delta time en segundos
   */
  update(player, world, dt) {
    // En modo vuelo no hay gravedad
    if (!player.flyMode) {
      player.velocity.y += GRAVITY * dt;
    }

    // ── Mover eje a eje (separación de ejes) ────────────
    this._moveAxis(player, world, 'x', player.velocity.x * dt);
    this._moveAxis(player, world, 'y', player.velocity.y * dt);
    this._moveAxis(player, world, 'z', player.velocity.z * dt);
  }

  _moveAxis(player, world, axis, delta) {
    const pos = player.position;
    const hw = PLAYER_WIDTH / 2;

    // Nueva posición candidata en este eje
    const next = pos[axis] + delta;

    // Construir AABB candidato
    const minX = (axis === 'x' ? next : pos.x) - hw;
    const maxX = (axis === 'x' ? next : pos.x) + hw;
    const minY =  axis === 'y' ? next : pos.y;
    const maxY = (axis === 'y' ? next : pos.y) + PLAYER_HEIGHT;
    const minZ = (axis === 'z' ? next : pos.z) - hw;
    const maxZ = (axis === 'z' ? next : pos.z) + hw;

    if (this._aabbOverlapWorld(world, minX, maxX, minY, maxY, minZ, maxZ)) {
      // Colisión: no mover en este eje
      if (axis === 'y') {
        if (player.velocity.y < 0) {
          // Registrar velocidad de impacto para cálculo de daño por caída
          player.lastLandingVel = player.velocity.y;
          player.onGround = true;
        }
        player.velocity.y = 0;
      } else {
        player.velocity[axis] = 0;
      }
    } else {
      pos[axis] = next;
      if (axis === 'y') player.onGround = false;
    }
  }

  _aabbOverlapWorld(world, minX, maxX, minY, maxY, minZ, maxZ) {
    // Iterar todos los bloques dentro del AABB
    const x0 = Math.floor(minX), x1 = Math.floor(maxX);
    const y0 = Math.floor(minY), y1 = Math.floor(maxY);
    const z0 = Math.floor(minZ), z1 = Math.floor(maxZ);

    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        for (let z = z0; z <= z1; z++) {
          if (isSolid(world.getBlock(x, y, z))) return true;
        }
      }
    }
    return false;
  }
}
