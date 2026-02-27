// ============================================================
//  ItemDrop — cubo pequeño flotante que cae al romper bloques
//  Tiene física de caída, rebote, bobbing y rotación.
// ============================================================
import * as THREE from 'three';
import { getBlockTexKeys } from '../world/BlockTypes.js';
import { getTextureMaterial } from '../rendering/TextureGenerator.js';
import { ITEM_DESPAWN_TIME } from '../utils/Constants.js';

const SIZE        = 0.25;   // tamaño del cubo
const BOB_AMP     = 0.07;   // amplitud del bobbing
const BOB_FREQ    = 2.2;    // Hz del bobbing
const ROT_SPEED   = 1.8;    // rad/s de rotación
const GRAVITY     = -18;
const BOUNCE_DAMP = 0.38;   // energía conservada en rebote

export class ItemDrop {
  /**
   * @param {number} blockId   ID del bloque que se soltó
   * @param {{x,y,z}} pos      posición de origen (centro del bloque)
   * @param {THREE.Scene} scene
   */
  constructor(blockId, pos, scene) {
    this.blockId   = blockId;
    this._scene    = scene;
    this._age      = 0;
    this._bobTime  = Math.random() * Math.PI * 2; // fase aleatoria
    this._onGround = false;
    this._baseY    = pos.y;

    // Velocidad inicial: pequeña explosión aleatoria
    const angle = Math.random() * Math.PI * 2;
    const hspd  = 1.8 + Math.random() * 1.2;
    this.velocity = new THREE.Vector3(
      Math.cos(angle) * hspd,
      3.5 + Math.random() * 2,
      Math.sin(angle) * hspd
    );

    this.position = new THREE.Vector3(
      pos.x + 0.5,
      pos.y + 0.7,
      pos.z + 0.5
    );

    // ── Mesh ──────────────────────────────────────────────
    const [texTop, texSide, texBot] = getBlockTexKeys(blockId);
    const geo  = new THREE.BoxGeometry(SIZE, SIZE, SIZE);
    const mats = [
      getTextureMaterial(texSide).clone(),
      getTextureMaterial(texSide).clone(),
      getTextureMaterial(texTop).clone(),
      getTextureMaterial(texBot).clone(),
      getTextureMaterial(texSide).clone(),
      getTextureMaterial(texSide).clone(),
    ];
    this.mesh        = new THREE.Mesh(geo, mats);
    this.mesh.castShadow = true;
    this.mesh.position.copy(this.position);
    scene.add(this.mesh);

    // Brillo de recogida — contorno blanco semitransparente
    const glowGeo = new THREE.BoxGeometry(SIZE * 1.3, SIZE * 1.3, SIZE * 1.3);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    this.mesh.add(glow);
  }

  /**
   * Actualiza física y animación.
   * @param {number} dt
   * @param {import('../world/World.js').World} world
   * @returns {boolean} true si ya expiró (hay que eliminar)
   */
  update(dt, world) {
    this._age += dt;
    if (this._age > ITEM_DESPAWN_TIME) return true;

    // ── Gravedad ──────────────────────────────────────────
    if (!this._onGround) {
      this.velocity.y += GRAVITY * dt;
    }

    // ── Aplicar velocidad horizontal siempre, vertical si no en suelo ──
    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;
    if (!this._onGround) {
      this.position.y += this.velocity.y * dt;
    }

    // ── Fricción horizontal ───────────────────────────────
    const fric = this._onGround ? 0.85 : 0.992;
    this.velocity.x *= Math.pow(fric, dt * 60);
    this.velocity.z *= Math.pow(fric, dt * 60);

    // ── Colisión con suelo ────────────────────────────────
    const bx = Math.floor(this.position.x);
    const bz = Math.floor(this.position.z);
    this._onGround = false;

    for (let y = Math.floor(this.position.y); y >= Math.floor(this.position.y) - 2; y--) {
      const id = world.getBlock(bx, y, bz);
      if (id > 0 && id !== 5) {
        const top = y + 1;
        if (this.position.y < top) {
          this.position.y = top;
          if (Math.abs(this.velocity.y) > 0.5) {
            // Rebote
            this.velocity.y = -this.velocity.y * BOUNCE_DAMP;
          } else {
            this.velocity.y = 0;
          }
          this._onGround = true;
          this._baseY    = top;
        }
        break;
      }
    }

    // ── Bobbing (solo si está en suelo) ───────────────────
    this._bobTime += dt * BOB_FREQ * Math.PI * 2;
    const bobOffset = this._onGround ? Math.sin(this._bobTime) * BOB_AMP : 0;

    // ── Parpadeo al expirar ───────────────────────────────
    const lastSeconds = ITEM_DESPAWN_TIME - this._age;
    if (lastSeconds < 10) {
      this.mesh.visible = Math.floor(this._age * 6) % 2 === 0;
    }

    // ── Actualizar mesh ───────────────────────────────────
    this.mesh.position.set(
      this.position.x,
      this.position.y + bobOffset + SIZE * 0.5,
      this.position.z
    );
    this.mesh.rotation.y += ROT_SPEED * dt;

    return false; // no expirado
  }

  dispose() {
    this._scene.remove(this.mesh);
    this.mesh.traverse(c => {
      c.geometry?.dispose();
      if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
      else c.material?.dispose();
    });
  }
}
