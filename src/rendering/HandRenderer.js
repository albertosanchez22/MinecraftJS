// ============================================================
//  HandRenderer — brazo/bloque en primera persona
//  Hijo de la cámara → se mueve con ella automáticamente.
//  depthTest:false + renderOrder alto → siempre visible sobre el mundo.
// ============================================================
import * as THREE from 'three';
import { getBlockTexKeys } from '../world/BlockTypes.js';
import { getTextureMaterial } from './TextureGenerator.js';

// Posición en espacio de cámara (local)
const HAND_POS = new THREE.Vector3( 0.30, -0.26, -0.48);
const HAND_ROT = new THREE.Euler(-0.08, -0.35, 0.06);

const SKIN_COLOR  = 0xf0c8a0;
const BLOCK_SCALE = 0.26;

function noDepthMat(colorOrTex) {
  if (typeof colorOrTex === 'number') {
    return new THREE.MeshLambertMaterial({
      color: colorOrTex,
      depthTest: false,
      depthWrite: false,
    });
  }
  // Es un material base; lo clonamos y desactivamos depth test
  const m = colorOrTex.clone();
  m.depthTest  = false;
  m.depthWrite = false;
  return m;
}

export class HandRenderer {
  constructor(camera) {
    this._camera = camera;
    this._group  = new THREE.Group();
    this._group.renderOrder = 999;
    this._group.position.copy(HAND_POS);
    this._group.rotation.copy(HAND_ROT);

    // ── Brazo (mano vacía) ───────────────────────────────
    const armGeo  = new THREE.BoxGeometry(0.09, 0.26, 0.09);
    this._armMesh = new THREE.Mesh(armGeo, noDepthMat(SKIN_COLOR));
    this._armMesh.renderOrder = 999;
    this._group.add(this._armMesh);

    // ── Cubo de bloque ───────────────────────────────────
    this._blockMesh = null;
    this._blockId   = -1;

    camera.add(this._group);
  }

  // ── API pública ──────────────────────────────────────────

  update(blockId) {
    if (blockId == null) {
      this._armMesh.visible = true;
      if (this._blockMesh) this._blockMesh.visible = false;
    } else {
      this._armMesh.visible = false;
      if (blockId !== this._blockId) this._rebuildBlock(blockId);
      if (this._blockMesh) this._blockMesh.visible = true;
    }
  }

  // ── Privado ──────────────────────────────────────────────

  _rebuildBlock(blockId) {
    if (this._blockMesh) {
      this._blockMesh.geometry.dispose();
      this._group.remove(this._blockMesh);
    }

    const [texTop, texSide, texBot] = getBlockTexKeys(blockId);

    // BoxGeometry: 6 grupos de caras, orden Three.js: +x,-x,+y,-y,+z,-z
    const geo = new THREE.BoxGeometry(BLOCK_SCALE, BLOCK_SCALE, BLOCK_SCALE);
    const mats = [
      noDepthMat(getTextureMaterial(texSide)), // +X
      noDepthMat(getTextureMaterial(texSide)), // -X
      noDepthMat(getTextureMaterial(texTop)),  // +Y
      noDepthMat(getTextureMaterial(texBot)),  // -Y
      noDepthMat(getTextureMaterial(texSide)), // +Z
      noDepthMat(getTextureMaterial(texSide)), // -Z
    ];

    this._blockMesh = new THREE.Mesh(geo, mats);
    this._blockMesh.renderOrder = 999;
    this._group.add(this._blockMesh);
    this._blockId = blockId;
  }
}

