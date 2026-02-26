// ============================================================
//  AnimalManager — spawna y gestiona todos los animales
// ============================================================
import { Animal } from './Animal.js';

const SPECIES       = ['cow', 'pig', 'sheep', 'chicken'];
const MAX_PER_TYPE  = 5;
const SPAWN_RADIUS  = 24;
const DESPAWN_RADIUS= 80;
const CHECK_INTERVAL= 4; // segundos entre intentos de spawn

export class AnimalManager {
  constructor(scene, world) {
    this._scene   = scene;
    this._world   = world;
    this._animals = [];
    this._timer   = 0;
  }

  /**
   * Invocado al inicio para poblar el mundo cercano.
   * @param {{x:number,z:number}} playerPos
   */
  spawnInitial(playerPos) {
    for (const species of SPECIES) {
      const count = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        this._trySpawn(species, playerPos);
      }
    }
  }

  /**
   * @param {import('../player/Player.js').Player} player
   * @param {number} dt
   */
  update(player, dt) {
    const pp = player.position;

    // Actualizar animales existentes
    for (let i = this._animals.length - 1; i >= 0; i--) {
      const a = this._animals[i];
      const dx = a.position.x - pp.x;
      const dz = a.position.z - pp.z;

      // Despawnear si muy lejos
      if (dx * dx + dz * dz > DESPAWN_RADIUS * DESPAWN_RADIUS) {
        a.dispose();
        this._animals.splice(i, 1);
        continue;
      }

      a.update(dt, this._world);
    }

    // Intentar spawn periódico
    this._timer -= dt;
    if (this._timer < 0) {
      this._timer = CHECK_INTERVAL + Math.random() * 2;
      for (const species of SPECIES) {
        const count = this._animals.filter(a => a.species === species).length;
        if (count < MAX_PER_TYPE) {
          this._trySpawn(species, pp);
        }
      }
    }
  }

  _trySpawn(species, playerPos) {
    // Elegir posición aleatoria en radio
    for (let attempt = 0; attempt < 12; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist  = 8 + Math.random() * (SPAWN_RADIUS - 8);
      const wx    = Math.round(playerPos.x + Math.cos(angle) * dist);
      const wz    = Math.round(playerPos.z + Math.sin(angle) * dist);

      // Buscar superficie
      let surfY = -1;
      for (let y = 62; y >= 1; y--) {
        const id = this._world.getBlock(wx, y, wz);
        if (id > 0 && id !== 5 /* agua */) {
          surfY = y + 1;
          break;
        }
      }
      if (surfY < 2) continue;

      // No spawnear sobre agua ni en la pared
      const surfId = this._world.getBlock(wx, surfY - 1, wz);
      if (surfId === 5 || surfId === 0) continue;

      // Espacio libre
      if (
        this._world.getBlock(wx, surfY, wz)   !== 0 ||
        this._world.getBlock(wx, surfY + 1, wz) !== 0
      ) continue;

      const animal = new Animal(species, this._scene);
      animal.position.set(wx + 0.5, surfY, wz + 0.5);
      this._animals.push(animal);
      return;
    }
  }

  get animals() { return this._animals; }
}
