// ============================================================
//  Game — orquesta todos los sistemas y contiene el game loop
// ============================================================
import * as THREE from 'three';
import { Renderer }        from './rendering/Renderer.js';
import { ChunkMeshBuilder }from './rendering/ChunkMesh.js';
import { BlockHighlight }  from './rendering/BlockHighlight.js';
import { World }           from './world/World.js';
import { Player }          from './player/Player.js';
import { Controls }        from './player/Controls.js';
import { Inventory }       from './player/Inventory.js';
import { Physics }         from './physics/Physics.js';
import { Hotbar }          from './ui/Hotbar.js';
import { InventoryScreen } from './ui/InventoryScreen.js';
import { HandRenderer }    from './rendering/HandRenderer.js';
import { BreakAnimation }  from './rendering/BreakAnimation.js';
import { raycastWorld }    from './world/Raycast.js';
import { BlockDef, BlockID } from './world/BlockTypes.js';
import { CHUNK_SIZE }      from './utils/Constants.js';
import { preloadTextures } from './rendering/TextureGenerator.js';
import { CraftingTableScreen } from './ui/CraftingTableScreen.js';
import { AnimalManager }   from './entities/AnimalManager.js';
import { ItemDropManager } from './entities/ItemDropManager.js';
import { HealthBar }       from './ui/HealthBar.js';
import { Chat }            from './ui/Chat.js';
import { SoundManager }    from './audio/SoundManager.js';
import { FALL_DAMAGE_VEL } from './utils/Constants.js';

const MAX_DT           = 0.05;
const CHUNKS_PER_FRAME = 2;
const REACH            = 5;

export class Game {
  constructor() {
    // Precarga todas las texturas antes de construir meshes
    preloadTextures();

    // ── Sistemas ─────────────────────────────────────────
    this.renderer    = new Renderer();
    this.world       = new World();
    this.player      = new Player(this.renderer.camera);
    this.controls    = new Controls(this.renderer.domElement);
    this.physics     = new Physics();
    this.meshBuilder = new ChunkMeshBuilder(this.renderer.scene);
    this.inventory   = new Inventory();
    this.hotbar      = new Hotbar(this.inventory);
    this.highlight      = new BlockHighlight(this.renderer.scene);
    this.handRenderer   = new HandRenderer(this.renderer.camera);
    this.breakAnim      = new BreakAnimation(this.renderer.scene);
    this.invScreen      = new InventoryScreen(this.inventory);
    this.craftTableScreen = new CraftingTableScreen(this.inventory);
    this.animalManager    = new AnimalManager(this.renderer.scene, this.world);
    this.itemDropManager  = new ItemDropManager(this.renderer.scene, this.inventory);
    this.healthBar        = new HealthBar();
    this.chat             = new Chat();
    this.sounds           = new SoundManager();

    // Comandos de chat
    this.chat.onCommand((cmd) => this._handleCommand(cmd));

    // ── Estado romper bloque ─────────────────────────────
    this._breakTarget  = null;
    this._breakTime    = 0;
    this._breakBlockId = null;

    // ── Estado general ───────────────────────────────────
    this._prevTime  = performance.now();
    this._meshQueue = [];

    // Slots de teclado (1-9)
    this.controls._onSlotKey = (n) => this.inventory.selectSlot(n);

    this._init();
  }

  _init() {
    const initDirty = this.world.updateAroundPlayer(0, 0);
    initDirty.forEach(c => this._meshQueue.push(c));
    this._flushMeshQueue(9999);

    const sy = this.world.surfaceY(8.5, 8.5);
    this.player.spawnAt(8.5, sy + 0.1, 8.5);
    this.animalManager.spawnInitial(this.player.position);
    this.healthBar.update(this.player.health);
    this._updateHUD(null);
  }

  /** Arranca el bucle principal */
  start() {
    requestAnimationFrame(this._loop.bind(this));
  }

  // ── Loop ─────────────────────────────────────────────────

  _loop(now) {
    requestAnimationFrame(this._loop.bind(this));

    const dt = Math.min((now - this._prevTime) / 1000, MAX_DT);
    this._prevTime = now;

    // 1. Input → velocidad horizontal
    this.player.handleInput(this.controls, dt);

    // 1b. Toggle inventario (E / Escape)
    if (this.controls.consumeInventoryKey()) {
      if (this.craftTableScreen.isOpen) this.craftTableScreen.close();
      else this.invScreen.toggle();
    }

    // 1c. Abrir chat (T)
    if (this.controls.consumeChatKey()) {
      if (!this.invScreen.isOpen && !this.craftTableScreen.isOpen) {
        this.chat.open();
      }
    }

    // Si el inventario, la mesa o el chat están abiertos, pausar gameplay
    const paused = this.invScreen.isOpen || this.craftTableScreen.isOpen || this.chat.isOpen;

    // 2. Scroll → cambio de slot
    if (!paused) {
      const scroll = this.controls.consumeScrollSteps();
      if (scroll !== 0) {
        const sel = ((this.inventory.selected + scroll) % 9 + 9) % 9;
        this.inventory.selectSlot(sel);
      }
    }

    // 3. Física (gravedad + colisiones)
    if (!paused) this.physics.update(this.player, this.world, dt);

    // 3b. Daño por caída
    if (!paused) {
      const landVel = this.player.lastLandingVel;
      this.player.lastLandingVel = 0;
      if (landVel < -FALL_DAMAGE_VEL) {
        const dmg = Math.ceil(-landVel - FALL_DAMAGE_VEL);
        const dead = this.player.damage(dmg);
        this.sounds.playHurt();
        this.healthBar.update(this.player.health);
        if (dead) this._respawn();
      }
    }

    // 4. Cámara sigue al jugador
    this.player.updateCamera();

    // 5. Mano en 1ª persona
    this.handRenderer.update(paused ? null : this.inventory.selectedBlock());

    // 6. Raycast
    const hit = !paused ? this._doRaycast() : null;
    this.highlight.update(hit);

    // 6b. Romper bloque
    if (!paused) this._handleBreaking(hit, dt);
    else { this._breakTarget = null; this._breakTime = 0; this._breakBlockId = null; this._setBreakOverlay(0); this.breakAnim.update(0, null); }

    // 6c. Colocar bloque / interactuar
    if (!paused) this._handlePlacing(hit);

    // 6d. Animar grietas 3D
    if (this._breakTarget && this._breakTime > 0 && this._breakBlockId !== null) {
      const bt = BlockDef[this._breakBlockId]?.breakTime ?? 1;
      this.breakAnim.update(
        bt === Infinity ? 0 : Math.min(this._breakTime / bt, 0.99),
        this._breakTarget
      );
    } else {
      this.breakAnim.update(0, null);
    }

    // 7. Cargar chunks cercanos
    const dirty = this.world.updateAroundPlayer(
      this.player.position.x,
      this.player.position.z
    );
    this._meshQueue.push(...dirty);
    this._flushMeshQueue(CHUNKS_PER_FRAME);

    // 8. Render
    this.renderer.render();

    // 9. Drops de items + animalitos
    this.itemDropManager.update(this.player, dt, this.world);
    this.animalManager.update(this.player, dt);

    // 10. HUD
    this._updateHUD(hit);
  }

  // ── Raycast ──────────────────────────────────────────────

  _doRaycast() {
    if (!this.controls.locked) return null;
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(this.renderer.camera.quaternion);
    const eye = this.renderer.camera.position;
    return raycastWorld(
      this.world,
      { x: eye.x, y: eye.y, z: eye.z },
      { x: dir.x, y: dir.y, z: dir.z },
      REACH
    );
  }

  // ── Romper bloque ─────────────────────────────────────────

  _handleBreaking(hit, dt) {
    if (!this.controls.mouseButtons.left || !hit) {
      this._breakTarget  = null;
      this._breakBlockId = null;
      this._breakTime    = 0;
      this._setBreakOverlay(0);
      return;
    }

    // Si apuntamos a un bloque distinto, reiniciar progreso
    if (
      !this._breakTarget ||
      this._breakTarget.x !== hit.pos.x ||
      this._breakTarget.y !== hit.pos.y ||
      this._breakTarget.z !== hit.pos.z
    ) {
      this._breakTarget  = { ...hit.pos };
      this._breakBlockId = hit.blockId;
      this._breakTime    = 0;
    }

    const def       = BlockDef[hit.blockId];
    const breakTime = def?.breakTime ?? 1;
    if (breakTime === Infinity) return;

    this._breakTime += dt;
    this._setBreakOverlay(Math.min(this._breakTime / breakTime, 1));

    if (this._breakTime >= breakTime) {
      const { x, y, z } = hit.pos;
      const droppedId    = def?.drops ?? null;

      this.world.setBlock(x, y, z, BlockID.AIR);
      this._rebuildChunkAt(x, z);
      this.sounds.playBreak();

      if (droppedId !== null) this.itemDropManager.spawn(droppedId, hit.pos);

      this._breakTarget  = null;
      this._breakBlockId = null;
      this._breakTime    = 0;
      this._setBreakOverlay(0);
    }
  }

  // ── Colocar bloque / interactuar con mesa ─────────────────────────

  _handlePlacing(hit) {
    if (!this.controls.consumeRightClick()) return;
    if (!hit) return;

    // Interacción con mesa de crafteo: abrir pantalla 3×3
    if (hit.blockId === BlockID.CRAFTING_TABLE) {
      this.craftTableScreen.open();
      return;
    }

    const blockId = this.inventory.selectedBlock();
    if (blockId === null) return;

    // La posición de colocación = bloque apuntado + normal de la cara
    const px = hit.pos.x + hit.normal.x;
    const py = hit.pos.y + hit.normal.y;
    const pz = hit.pos.z + hit.normal.z;

    // No colocar dentro del jugador
    const pp = this.player.position;
    const hw = 0.35;
    const ph = 1.8;
    if (
      px + 1 > pp.x - hw && px < pp.x + hw &&
      py + 1 > pp.y       && py < pp.y + ph &&
      pz + 1 > pp.z - hw && pz < pp.z + hw
    ) return;

    this.world.setBlock(px, py, pz, blockId);
    this.inventory.consumeSelected();
    this._rebuildChunkAt(px, pz);
  }

  _setBreakOverlay(progress) {
    const el = document.getElementById('break-progress');
    if (!el) return;
    if (progress <= 0) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    el.style.width   = `${Math.round(progress * 100)}%`;
  }

  // ── Rebuild de chunks ─────────────────────────────────────

  _rebuildChunkAt(wx, wz) {
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const chunk = this.world.getChunk(cx, cz);
    if (chunk) { chunk.dirty = true; this.meshBuilder.build(chunk, this.world); }

    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const neighbors = [];
    if (lx === 0)              neighbors.push([cx - 1, cz]);
    if (lx === CHUNK_SIZE - 1) neighbors.push([cx + 1, cz]);
    if (lz === 0)              neighbors.push([cx, cz - 1]);
    if (lz === CHUNK_SIZE - 1) neighbors.push([cx, cz + 1]);
    for (const [ncx, ncz] of neighbors) {
      const nc = this.world.getChunk(ncx, ncz);
      if (nc) { nc.dirty = true; this.meshBuilder.build(nc, this.world); }
    }
  }

  // ── Construcción incremental de meshes ───────────────────

  _flushMeshQueue(limit) {
    const todo = this._meshQueue.splice(0, limit);
    for (const chunk of todo) {
      if (chunk.dirty) this.meshBuilder.build(chunk, this.world);
    }
  }

  // ── HUD debug ────────────────────────────────────────────

  _updateHUD(hit) {
    const hud = document.getElementById('hud');
    if (!hud) return;
    const p = this.player.position;
    const blockName = hit ? (BlockDef[hit.blockId]?.name ?? '?') : '-';
    const flyTag = this.player.flyMode ? '  | ✈ VUELO' : '';
    hud.textContent =
      `XYZ: ${p.x.toFixed(1)} / ${p.y.toFixed(1)} / ${p.z.toFixed(1)}` +
      `  |  Apuntando: ${blockName}` +
      `  |  Chunks: ${this.world.chunks.size}` +
      flyTag;

    const flyInd = document.getElementById('fly-indicator');
    if (flyInd) flyInd.style.display = this.player.flyMode ? 'block' : 'none';
  }

  // ── Comandos de chat ──────────────────────────────────

  _handleCommand(cmd) {
    const lower = cmd.toLowerCase().trim();
    if (lower === '/fly') {
      this.player.flyMode = !this.player.flyMode;
      // Al desactivar vuelo: velocidad vertical a 0 para caída suave
      if (!this.player.flyMode) this.player.velocity.y = 0;
    }
    this._updateHUD(null);
  }

  // ── Respawn tras muerte ───────────────────────────────

  _respawn() {
    const sy = this.world.surfaceY(8.5, 8.5);
    this.player.spawnAt(8.5, sy + 1, 8.5);
    this.player.flyMode = false;
    this.healthBar.update(this.player.health);
  }
}
