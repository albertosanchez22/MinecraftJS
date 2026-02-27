// ============================================================
//  HandRenderer — brazo/bloque en primera persona (estilo Minecraft)
//  Un único bloque rectangular de brazo con textura pixel-art de Steve,
//  asomando desde la esquina inferior derecha, igual que en Minecraft.
// ============================================================
import * as THREE from 'three';
import { getBlockTexKeys } from '../world/BlockTypes.js';
import { getTextureMaterial } from './TextureGenerator.js';

// ── Posición base del brazo en espacio de cámara ─────────────
// El brazo asoma desde el borde inferior derecho, la parte alta fuera de pantalla
const HAND_POS  = new THREE.Vector3(0.40, -0.14, -0.40);
const HAND_ROT  = new THREE.Euler(0.04,  -0.58,  0.22);

// Posición del bloque en mano (esquina inferior derecha, igual que MC)
const BLOCK_POS = new THREE.Vector3(0.30, -0.22, -0.46);
const BLOCK_ROT = new THREE.Euler(0.20,  -0.50,  0.20);

const BLOCK_SCALE = 0.26;

// ── Textura pixel-art de piel (cara frontal/lateral del brazo) ─
function makeSkinTexture(faceType) {
  // faceType: 'front' | 'side' | 'top' | 'bottom'
  const S = 16;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d');

  // Paleta base de Steve (brazo)
  const palettes = {
    front:  { base: [198, 132, 66],  hi: [212, 148, 80],  lo: [174, 110, 48]  }, // cara frontal (más clara)
    side:   { base: [182, 116, 54],  hi: [196, 130, 68],  lo: [160,  96, 38]  }, // laterales
    top:    { base: [162, 100, 42],  hi: [176, 114, 56],  lo: [148,  88, 32]  }, // arriba (más oscuro)
    bottom: { base: [140,  86, 32],  hi: [154, 100, 46],  lo: [126,  74, 24]  }, // abajo (más oscuro aún)
  };
  const { base, hi, lo } = palettes[faceType] || palettes.side;

  // Fondo base con ligera variación pixel a pixel (aspecto pixel-art)
  let seed = faceType.charCodeAt(0) * 31;
  function rng() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0xffffffff; }

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const t = rng();
      const col = t < 0.25 ? lo : t < 0.75 ? base : hi;
      const jit = Math.floor((rng() - 0.5) * 12);
      ctx.fillStyle = `rgb(${col[0]+jit},${col[1]+jit},${col[2]+jit})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // Líneas de "pliegue" sutiles que dan volumen al brazo
  if (faceType === 'front' || faceType === 'side') {
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    for (let y = 4; y < S; y += 5) ctx.fillRect(0, y, S, 1);
  }
  // Borde inferior oscuro (muñeca)
  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.fillRect(0, S - 2, S, 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Pre-genera las 4 texturas de las caras
const SKIN_TEXTURES = {
  front:  makeSkinTexture('front'),
  side:   makeSkinTexture('side'),
  top:    makeSkinTexture('top'),
  bottom: makeSkinTexture('bottom'),
};

function armMat(face) {
  return new THREE.MeshBasicMaterial({
    map:       SKIN_TEXTURES[face],
    depthTest: false,
    depthWrite: false,
  });
}

function noDepthMat(colorOrTex) {
  if (typeof colorOrTex === 'number') {
    return new THREE.MeshLambertMaterial({ color: colorOrTex, depthTest: false, depthWrite: false });
  }
  const m = colorOrTex.clone();
  m.depthTest  = false;
  m.depthWrite = false;
  return m;
}

export class HandRenderer {
  constructor(camera) {
    this._camera = camera;

    // Grupo raíz (hijo de la cámara)
    this._group = new THREE.Group();
    this._group.renderOrder = 999;
    this._group.position.copy(HAND_POS);
    this._group.rotation.copy(HAND_ROT);

    // ── Pivot para la animación de swing ──────────────────
    this._armPivot = new THREE.Group();
    this._group.add(this._armPivot);

    // ── BRAZO — proporciones de Steve: 4×12×4 px → ratio 1:3:1 (fino y alto)
    //    Solo el tercio inferior es visible; el resto sale por debajo de pantalla.
    //    Orden de materiales BoxGeometry: +X, -X, +Y, -Y, +Z, -Z
    const armW = 0.095;  // anchura (≈ 4/16 bloque) — fino como Steve
    const armH = 0.58;   // altura total (la mayoría queda fuera de pantalla)
    const armD = 0.095;  // profundidad igual que anchura

    const armGeo = new THREE.BoxGeometry(armW, armH, armD);
    const armMats = [
      armMat('side'),    // +X  (derecha)
      armMat('side'),    // -X  (izquierda)
      armMat('top'),     // +Y  (arriba / hombro)
      armMat('bottom'),  // -Y  (punta / nudillos)
      armMat('front'),   // +Z  (frente, cara visible)
      armMat('side'),    // -Z  (dorso)
    ];

    this._armMesh = new THREE.Mesh(armGeo, armMats);
    this._armMesh.renderOrder = 999;
    // El pivote está en el extremo superior: desplazamos el mesh hacia abajo
    // para que rotar el pivot = balancear el brazo desde el hombro
    this._armMesh.position.set(0, -armH * 0.5, 0);
    this._armPivot.add(this._armMesh);

    // ── Grupo separado para el bloque en mano ──────────────────
    this._blockGroup = new THREE.Group();
    this._blockGroup.renderOrder = 999;
    this._blockGroup.position.copy(BLOCK_POS);
    this._blockGroup.rotation.copy(BLOCK_ROT);
    camera.add(this._blockGroup);

    // ── Cubo de bloque ───────────────────────────────────
    this._blockMesh = null;
    this._blockId   = -1;

    // ── Estado de animación ──────────────────────────────
    this._idleTime  = 0;
    this._swingTime = 0;

    camera.add(this._group);
  }

  // ── API pública ──────────────────────────────────────────

  /**
   * @param {number|null} blockId  bloque seleccionado (null = mano vacía)
   * @param {boolean}     isMining true mientras se mantiene click izquierdo
   * @param {number}      dt       delta time en segundos
   */
  update(blockId, isMining = false, dt = 0.016) {
    this._idleTime += dt;

    if (blockId == null) {
      // ── Mano vacía: mostrar brazo ────────────────────
      this._armPivot.visible   = true;
      this._group.visible      = true;
      this._blockGroup.visible = false;
      if (this._blockMesh) this._blockMesh.visible = false;
      this._animateArm(isMining, dt);
    } else {
      // ── Bloque en mano ───────────────────────────────
      this._armPivot.visible = false;
      this._group.visible    = false;
      if (blockId !== this._blockId) this._rebuildBlock(blockId);
      if (this._blockMesh) this._blockMesh.visible = true;
      this._blockGroup.visible = true;
      this._animateBlock(isMining, dt);
    }
  }

  // ── Privado ──────────────────────────────────────────────

  _animateArm(isMining, dt) {
    // Bob suave continuo
    const bob    = Math.sin(this._idleTime * 1.4) * 0.004;
    const sway   = Math.sin(this._idleTime * 0.9) * 0.003;

    if (isMining) {
      // Balanceo de picar: pivote rota en X con onda sinusoidal rápida
      this._swingTime += dt * 9;
      const swing  = Math.sin(this._swingTime) * 0.40;
      const liftY  = Math.max(0, Math.sin(this._swingTime)) * 0.05;

      this._armPivot.rotation.x += (swing - this._armPivot.rotation.x) * 0.35;
      this._group.position.y    += (HAND_POS.y + liftY - this._group.position.y) * 0.3;
    } else {
      this._swingTime = 0;
      // Suavemente volver a reposo
      this._armPivot.rotation.x += (0 - this._armPivot.rotation.x) * 0.12;
      this._group.position.y    += (HAND_POS.y + bob - this._group.position.y) * 0.12;
    }

    this._group.position.x = HAND_POS.x + sway;
  }

  _animateBlock(isMining, dt) {
    if (isMining) {
      this._swingTime += dt * 9;
      const swing = Math.sin(this._swingTime) * 0.45;
      const liftY = Math.max(0, Math.sin(this._swingTime)) * 0.05;

      if (this._blockMesh) {
        this._blockMesh.rotation.x += (swing * 0.55 - this._blockMesh.rotation.x) * 0.3;
      }
      this._blockGroup.position.y += (BLOCK_POS.y + liftY - this._blockGroup.position.y) * 0.3;
      this._blockGroup.rotation.z += (BLOCK_ROT.z + Math.sin(this._swingTime) * 0.06 - this._blockGroup.rotation.z) * 0.3;
    } else {
      this._swingTime = 0;
      if (this._blockMesh) {
        this._blockMesh.rotation.x *= 0.85;
      }
      this._blockGroup.position.y += (BLOCK_POS.y - this._blockGroup.position.y) * 0.12;
      this._blockGroup.rotation.z += (BLOCK_ROT.z  - this._blockGroup.rotation.z) * 0.12;
    }
  }

  _rebuildBlock(blockId) {
    if (this._blockMesh) {
      this._blockMesh.geometry.dispose();
      this._blockGroup.remove(this._blockMesh);
    }

    const [texTop, texSide, texBot] = getBlockTexKeys(blockId);

    const geo = new THREE.BoxGeometry(BLOCK_SCALE, BLOCK_SCALE, BLOCK_SCALE);
    const mats = [
      noDepthMat(getTextureMaterial(texSide)),
      noDepthMat(getTextureMaterial(texSide)),
      noDepthMat(getTextureMaterial(texTop)),
      noDepthMat(getTextureMaterial(texBot)),
      noDepthMat(getTextureMaterial(texSide)),
      noDepthMat(getTextureMaterial(texSide)),
    ];

    this._blockMesh = new THREE.Mesh(geo, mats);
    this._blockMesh.renderOrder = 999;
    this._blockGroup.add(this._blockMesh);
    this._blockId = blockId;
  }
}

