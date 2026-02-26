// ============================================================
//  Animal — entidad animal con modelo box (estilo Minecraft)
//  Soporta: vaca, cerdo, oveja, pollo
// ============================================================
import * as THREE from 'three';

// ── Paleta de colores ─────────────────────────────────────────
const C = {
  whiteFur   : 0xf0eeea,
  cowSpot    : 0x222222,
  pinkSkin   : 0xf5a0a0,
  pink2      : 0xe07878,
  woolWhite  : 0xe8e8e0,
  skinLegs   : 0xd89060,
  chickenBody: 0xfdf0e0,
  chickenWat : 0xdd2222,
  chickenBeak: 0xf0c030,
  sheepEar   : 0xd080a0,
  brownLegs  : 0x7a5030,
  darkBrown  : 0x3a2010,
};

function mat(color) {
  return new THREE.MeshLambertMaterial({ color });
}

// ── Builders de modelos ───────────────────────────────────────

function buildCow(group) {
  const body   = mat(0xf2eeea);
  const spots  = mat(C.cowSpot);
  const legs   = mat(C.brownLegs);
  const head   = mat(0xf2eeea);

  // Cuerpo
  addBox(group, body, 0, 0.55, 0, 1.1, 0.72, 0.6);
  // Manchas
  addBox(group, spots, 0.25, 0.7, -0.31, 0.35, 0.25, 0.05);
  addBox(group, spots, -0.2, 0.6, 0.31, 0.4, 0.3, 0.05);
  // Cabeza
  addBox(group, head, 0, 0.95, -0.66, 0.5, 0.45, 0.45);
  // Hocico
  addBox(group, mat(0xddbbaa), 0, 0.82, -0.85, 0.28, 0.18, 0.12);
  // Fosas nasales
  addBox(group, mat(0x888888), -0.07, 0.83, -0.975, 0.045, 0.045, 0.04);
  addBox(group, mat(0x888888),  0.07, 0.83, -0.975, 0.045, 0.045, 0.04);
  // Cuernos
  addBox(group, mat(0xe8d8a0), -0.22, 1.2, -0.55, 0.06, 0.18, 0.06);
  addBox(group, mat(0xe8d8a0),  0.22, 1.2, -0.55, 0.06, 0.18, 0.06);
  // Orejas
  addBox(group, mat(0xeeddcc), -0.32, 1.0, -0.56, 0.1, 0.16, 0.06);
  addBox(group, mat(0xeeddcc),  0.32, 1.0, -0.56, 0.1, 0.16, 0.06);
  // Ojos
  addBox(group, mat(0x111111), -0.19, 1.01, -0.87, 0.06, 0.06, 0.04);
  addBox(group, mat(0x111111),  0.19, 1.01, -0.87, 0.06, 0.06, 0.04);
  // Patas (4)
  for (const [sx, sz] of [[-0.35,-0.22],[ 0.35,-0.22],[-0.35, 0.22],[ 0.35, 0.22]]) {
    addBox(group, legs, sx, 0.24, sz, 0.2, 0.48, 0.2);
    addBox(group, mat(C.darkBrown), sx, 0.02, sz, 0.22, 0.06, 0.22);
  }
  // Ubre
  addBox(group, mat(0xf0c8c0), 0, 0.3, 0.22, 0.3, 0.15, 0.18);
  // Cola
  addBox(group, mat(0xccbbaa), 0, 0.75, 0.34, 0.06, 0.25, 0.06);
}

function buildPig(group) {
  const body = mat(0xf5a8a8);
  const legs  = mat(0xe07878);

  // Cuerpo rechoncho
  addBox(group, body, 0, 0.45, 0, 0.95, 0.65, 0.78);
  // Cabeza
  addBox(group, body, 0, 0.82, -0.52, 0.55, 0.52, 0.52);
  // Hocico rosa
  addBox(group, mat(0xf0b0b0), 0, 0.72, -0.82, 0.32, 0.22, 0.14);
  addBox(group, mat(0xd07070), -0.09, 0.74, -0.96, 0.06, 0.06, 0.04);
  addBox(group, mat(0xd07070),  0.09, 0.74, -0.96, 0.06, 0.06, 0.04);
  // Ojos
  addBox(group, mat(0x111111), -0.17, 0.92, -0.77, 0.05, 0.06, 0.04);
  addBox(group, mat(0x111111),  0.17, 0.92, -0.77, 0.05, 0.06, 0.04);
  // Orejas
  addBox(group, mat(0xee9898), -0.26, 1.06, -0.56, 0.13, 0.11, 0.06);
  addBox(group, mat(0xee9898),  0.26, 1.06, -0.56, 0.13, 0.11, 0.06);
  // Patas  for (const [sx, sz] of [[-0.3,-0.28],[0.3,-0.28],[-0.3,0.28],[0.3,0.28]]) {
  for (const [sx, sz] of [[-0.3,-0.28],[0.3,-0.28],[-0.3,0.28],[0.3,0.28]]) {
    addBox(group, legs, sx, 0.2, sz, 0.18, 0.4, 0.18);
    addBox(group, mat(0xcc5555), sx, 0.02, sz, 0.2, 0.05, 0.2);
  }
  // Cola en espiral (aprox.)
  addBox(group, body, 0, 0.6, 0.43, 0.06, 0.06, 0.12);
  addBox(group, body, 0.05, 0.65, 0.5, 0.06, 0.06, 0.06);
}

function buildSheep(group) {
  const wool = mat(0xe8e8e0);
  const skin = mat(0xc8b890);
  const legs  = mat(0x888878);

  // Lana del cuerpo (más grande que el cuerpo real)
  addBox(group, wool, 0, 0.52, 0, 1.05, 0.78, 0.68);
  // Cabeza sin lana
  addBox(group, skin, 0, 0.9, -0.58, 0.42, 0.42, 0.44);
  // Lana en cabeza (toca frente y cabeza)
  addBox(group, wool, 0, 0.97, -0.52, 0.38, 0.38, 0.25);
  // Hocico
  addBox(group, mat(0xddd8c0), 0, 0.8, -0.82, 0.22, 0.16, 0.1);
  // Ojos
  addBox(group, mat(0x222222), -0.14, 0.93, -0.8, 0.05, 0.06, 0.04);
  addBox(group, mat(0x222222),  0.14, 0.93, -0.8, 0.05, 0.06, 0.04);
  // Orejas
  addBox(group, mat(0xddccaa), -0.25, 0.98, -0.56, 0.1, 0.14, 0.05);
  addBox(group, mat(0xddccaa),  0.25, 0.98, -0.56, 0.1, 0.14, 0.05);
  // Patas sin lana (visibles bajo la lana)
  for (const [sx, sz] of [[-0.33,-0.22],[0.33,-0.22],[-0.33,0.22],[0.33,0.22]]) {
    addBox(group, legs, sx, 0.2, sz, 0.16, 0.4, 0.16);
  }
}

function buildChicken(group) {
  const body = mat(0xf8f0e0);
  const legs  = mat(0xf0c030);

  // Cuerpo
  addBox(group, body, 0, 0.35, 0, 0.42, 0.5, 0.56);
  // Cabeza
  addBox(group, body, 0, 0.72, -0.3, 0.28, 0.28, 0.28);
  // Pico amarillo
  addBox(group, mat(C.chickenBeak), 0, 0.72, -0.46, 0.1, 0.07, 0.1);
  // Cresta roja
  addBox(group, mat(C.chickenWat), 0, 0.86, -0.3, 0.12, 0.12, 0.06);
  addBox(group, mat(C.chickenWat), 0.06, 0.79, -0.35, 0.06, 0.08, 0.05);
  // Barbilla roja
  addBox(group, mat(C.chickenWat), 0, 0.64, -0.38, 0.09, 0.08, 0.05);
  // Ojos
  addBox(group, mat(0x111111), -0.12, 0.75, -0.44, 0.04, 0.04, 0.03);
  addBox(group, mat(0x111111),  0.12, 0.75, -0.44, 0.04, 0.04, 0.03);
  // Patas amarillas
  for (const [sx] of [[-0.12],[0.12]]) {
    addBox(group, legs, sx, 0.14, -0.02, 0.06, 0.28, 0.06);
    addBox(group, legs, sx, 0.02, -0.18, 0.06, 0.06, 0.2);  // dedo delantero
    addBox(group, legs, sx, 0.02,  0.1,  0.06, 0.06, 0.1);  // dedo trasero
  }
  // Alas
  addBox(group, mat(0xe8e0cc), -0.24, 0.48, 0, 0.06, 0.36, 0.42);
  addBox(group, mat(0xe8e0cc),  0.24, 0.48, 0, 0.06, 0.36, 0.42);
}

/** Añade una caja centrada en (cx, cy, cz) con dimensiones (w, h, d) */
function addBox(group, material, cx, cy, cz, w, h, d) {
  const geo  = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(cx, cy, cz);
  mesh.castShadow = true;
  group.add(mesh);
}

// ── Clase Animal ─────────────────────────────────────────────

const GRAVITY      = -18;
const WALK_SPEED   = 1.4;
const IDLE_TICKS   = () => 2 + Math.random() * 4;  // segundos en idle
const WANDER_TICKS = () => 2 + Math.random() * 5;  // segundos en wander
const SPAWN_HEIGHT_OFFSET = 0.05;

const SPECIES_DEF = {
  cow:     { build: buildCow,     height: 1.28, width: 0.65 },
  pig:     { build: buildPig,     height: 1.08, width: 0.6  },
  sheep:   { build: buildSheep,   height: 1.2,  width: 0.55 },
  chicken: { build: buildChicken, height: 0.74, width: 0.3  },
};

export class Animal {
  /**
   * @param {string} species  'cow'|'pig'|'sheep'|'chicken'
   * @param {THREE.Scene} scene
   */
  constructor(species, scene) {
    this.species  = species;
    this._scene   = scene;

    const def = SPECIES_DEF[species] ?? SPECIES_DEF.pig;
    this.height = def.height;
    this.width  = def.width;

    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this._onGround = false;

    // AI
    this._state      = 'idle';
    this._stateTimer  = IDLE_TICKS();
    this._target      = null;
    this._heading     = 0; // radianes

    // Animación de patas
    this._legPhase = 0;

    // Modelo 3D
    this.mesh = new THREE.Group();
    def.build(this.mesh);
    scene.add(this.mesh);

    this._legMeshes = this._findLegs();
  }

  _findLegs() {
    // Busca los hijos índice 7+ que suelen ser las patas
    const legs = [];
    this.mesh.children.forEach((c, i) => {
      if (c.geometry) {
        const h = c.geometry.parameters?.height ?? 0;
        const y = c.position.y;
        if (y < 0.4 && h > 0.2 && h < 0.7) legs.push(c);
      }
    });
    return legs;
  }

  /**
   * @param {import('../world/World.js').World} world
   */
  update(dt, world) {
    this._stateTimer -= dt;

    // ── Máquina de estados ────────────────────────────────
    if (this._stateTimer <= 0) {
      if (this._state === 'idle') {
        this._state = 'wander';
        this._stateTimer = WANDER_TICKS();
        // Elegir un destino aleatorio en radio de 8 bloques
        const angle = Math.random() * Math.PI * 2;
        const dist  = 3 + Math.random() * 6;
        this._target = new THREE.Vector3(
          this.position.x + Math.cos(angle) * dist,
          this.position.y,
          this.position.z + Math.sin(angle) * dist
        );
        this._heading = angle;
      } else {
        this._state = 'idle';
        this._stateTimer = IDLE_TICKS();
        this._target = null;
      }
    }

    // ── Movimiento ────────────────────────────────────────
    if (this._state === 'wander' && this._target) {
      const dx = this._target.x - this.position.x;
      const dz = this._target.z - this.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.4) {
        this._heading = Math.atan2(dx, dz);
        this.velocity.x = (dx / dist) * WALK_SPEED;
        this.velocity.z = (dz / dist) * WALK_SPEED;
      } else {
        this.velocity.x = 0;
        this.velocity.z = 0;
        this._state = 'idle';
        this._stateTimer = IDLE_TICKS();
        this._target = null;
      }
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    // ── Gravedad ──────────────────────────────────────────
    this.velocity.y += GRAVITY * dt;

    // ── Aplicar movimiento ────────────────────────────────
    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;
    this.position.y += this.velocity.y * dt;

    // ── Colisión con suelo ────────────────────────────────
    const bx = Math.floor(this.position.x + 0.5);
    const bz = Math.floor(this.position.z + 0.5);
    this._onGround = false;

    for (let y = Math.floor(this.position.y) + 1; y >= Math.floor(this.position.y) - 1; y--) {
      const id = world.getBlock(bx, y, bz);
      if (id > 0 && id !== 5) { // no agua
        const top = y + 1;
        if (this.position.y < top) {
          this.position.y = top;
          this.velocity.y = 0;
          this._onGround = true;
          break;
        }
      }
    }

    // ── Animación de patas ────────────────────────────────
    const moving = this._state === 'wander';
    if (moving) {
      this._legPhase += dt * 6;
    }
    const swing = moving ? Math.sin(this._legPhase) * 0.35 : 0;
    for (let i = 0; i < this._legMeshes.length; i++) {
      const sign = (i % 2 === 0) ? 1 : -1;
      this._legMeshes[i].rotation.x = swing * sign;
    }

    // ── Actualizar posición y rotación del mesh ───────────
    this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    this.mesh.rotation.y = this._heading + Math.PI;
  }

  dispose() {
    this._scene.remove(this.mesh);
    this.mesh.traverse(c => { c.geometry?.dispose(); });
  }
}
