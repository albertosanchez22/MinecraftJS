// ============================================================
//  Player — posición, velocidad, cámara en primera persona
// ============================================================
import * as THREE from 'three';
import { PLAYER_SPEED, PLAYER_SPRINT, PLAYER_HEIGHT, JUMP_FORCE, FLY_SPEED } from '../utils/Constants.js';
import { clamp } from '../utils/MathUtils.js';

const MOUSE_SENSITIVITY = 0.002; // rad / pixel
const PITCH_LIMIT       = Math.PI / 2 - 0.05;

export class Player {
  /**
   * @param {THREE.Camera} camera
   */
  constructor(camera) {
    this.camera   = camera;
    this.position = new THREE.Vector3(8, 40, 8);
    this.velocity = new THREE.Vector3();
    this.onGround = false;

    // Salud
    this.health = 20;
    this.maxHealth = 20;

    // Modo vuelo
    this.flyMode = false;

    // Velocidad vertical justo antes de aterrizar (para daño caída)
    this.lastLandingVel = 0;

    // Euler ángulos (yaw/pitch) separados del camera.rotation
    this._yaw   = 0;
    this._pitch = 0;

    this._eulerHelper = new THREE.Euler(0, 0, 0, 'YXZ');
    this._qHelper     = new THREE.Quaternion();
    this._frontXZ     = new THREE.Vector3();
    this._rightXZ     = new THREE.Vector3();
  }

  /**
   * Procesa input del controlador y actualiza velocidad horizontal.
   * La física (gravedad/colisiones) la aplica Physics.update().
   * @param {import('../player/Controls.js').Controls} controls
   * @param {number} dt
   */
  handleInput(controls, dt) {
    if (!controls.locked) return;

    // ── Look ─────────────────────────────────────────────
    const { x: dx, y: dy } = controls.consumeMouseDelta();
    this._yaw   -= dx * MOUSE_SENSITIVITY;
    this._pitch  = clamp(this._pitch - dy * MOUSE_SENSITIVITY, -PITCH_LIMIT, PITCH_LIMIT);

    // ── Movimiento horizontal ─────────────────────────────

    // Dirección "adelante" proyectada en XZ
    // La cámara mira hacia -Z en Three.js, por eso los negativos
    this._frontXZ.set(
      -Math.sin(this._yaw),
      0,
      -Math.cos(this._yaw)
    ).normalize();

    // cross con (0,1,0) = UP → da el vector derecha correcto
    this._rightXZ.crossVectors(this._frontXZ, new THREE.Vector3(0, 1, 0)).normalize();

    const isSprinting = controls.keys.sprint;
    const speed = isSprinting ? PLAYER_SPRINT : PLAYER_SPEED;

    const move = new THREE.Vector3();
    if (controls.keys.forward)  move.add(this._frontXZ);
    if (controls.keys.backward) move.sub(this._frontXZ);
    if (controls.keys.right)    move.add(this._rightXZ);
    if (controls.keys.left)     move.sub(this._rightXZ);

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed);
    }

    this.velocity.x = move.x;
    this.velocity.z = move.z;

    // ── Vertical: salto normal o control de vuelo ────────
    if (this.flyMode) {
      if      (controls.keys.jump)      this.velocity.y =  FLY_SPEED;
      else if (controls.keys.shiftHeld) this.velocity.y = -FLY_SPEED; // solo Shift físico
      else                              this.velocity.y *= 0.75; // frenado suave
    } else {
      // Salto normal
      if (controls.keys.jump && this.onGround) {
        this.velocity.y = JUMP_FORCE;
        this.onGround = false;
      }
    }
  }

  /** Actualiza la posición y rotación de la cámara según el estado del jugador */
  updateCamera() {
    // La cámara está a la altura de los ojos (1.62 del suelo)
    this.camera.position.set(
      this.position.x,
      this.position.y + PLAYER_HEIGHT - 0.18,
      this.position.z
    );

    this._eulerHelper.set(this._pitch, this._yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(this._eulerHelper);
  }

  /** Aplica daño al jugador. Devuelve true si muere. */
  damage(hp) {
    this.health = Math.max(0, this.health - hp);
    return this.health === 0;
  }

  /** Cura al jugador hasta el máximo. */
  heal(hp) {
    this.health = Math.min(this.maxHealth, this.health + hp);
  }

  /** Teletransporta al jugador a un punto seguro */
  spawnAt(x, y, z) {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.health = this.maxHealth;
  }
}
