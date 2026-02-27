// ============================================================
//  ItemDropManager — gestiona todos los drops del mundo
// ============================================================
import { ItemDrop } from './ItemDrop.js';
import { ITEM_PICKUP_DIST, ITEM_MAGNET_DIST, ITEM_MAGNET_SPEED } from '../utils/Constants.js';

export class ItemDropManager {
  constructor(scene, inventory) {
    this._scene    = scene;
    this._inv      = inventory;
    /** @type {ItemDrop[]} */
    this._drops    = [];
    // Sonido de recolección (visual flash como sustituto)
    this._pickupFlash = 0;
  }

  /**
   * Suelta un item en la posición indicada.
   * @param {number} blockId
   * @param {{x:number,y:number,z:number}} pos  posición del bloque (esquina inferior)
   */
  spawn(blockId, pos) {
    const drop = new ItemDrop(blockId, pos, this._scene);
    this._drops.push(drop);
  }

  /**
   * Actualiza todos los drops: física + magnetismo + recogida.
   * @param {import('../player/Player.js').Player} player
   * @param {number} dt
   * @param {import('../world/World.js').World} world
   */
  update(player, dt, world) {
    const pp   = player.position;
    // El punto de recogida es a la altura de la cintura del jugador
    const px   = pp.x;
    const py   = pp.y + 0.9;
    const pz   = pp.z;

    for (let i = this._drops.length - 1; i >= 0; i--) {
      const drop = this._drops[i];

      // Expiración
      if (drop.update(dt, world)) {
        drop.dispose();
        this._drops.splice(i, 1);
        continue;
      }

      // Distancia al jugador
      const dx = px - drop.position.x;
      const dy = py - drop.position.y;
      const dz = pz - drop.position.z;
      const d2 = dx * dx + dy * dy + dz * dz;
      const d  = Math.sqrt(d2);

      // Magnetismo: se acerca al jugador cuando está cerca
      if (d < ITEM_MAGNET_DIST && d > 0.05) {
        const spd = ITEM_MAGNET_SPEED * (1 - d / ITEM_MAGNET_DIST);
        drop.velocity.x += (dx / d) * spd * dt * 60;
        drop.velocity.y += (dy / d) * spd * dt * 20;
        drop.velocity.z += (dz / d) * spd * dt * 60;
      }

      // Recogida
      if (d < ITEM_PICKUP_DIST) {
        this._inv.addBlock(drop.blockId);
        drop.dispose();
        this._drops.splice(i, 1);
        this._pickupFlash = 0.18; // segundos de flash
      }
    }

    // Flash de pickup
    if (this._pickupFlash > 0) {
      this._pickupFlash -= dt;
      this._showPickupHint(this._pickupFlash > 0);
    }
  }

  _showPickupHint(visible) {
    let el = document.getElementById('pickup-flash');
    if (!el) {
      el = document.createElement('div');
      el.id = 'pickup-flash';
      el.style.cssText = `
        position:fixed; inset:0; pointer-events:none;
        background:rgba(255,255,255,0.07);
        transition:opacity 0.15s;
        z-index:50;
      `;
      document.body.appendChild(el);
    }
    el.style.opacity = visible ? '1' : '0';
  }

  get count() { return this._drops.length; }
}
