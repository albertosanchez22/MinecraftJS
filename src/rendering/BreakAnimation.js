// ============================================================
//  BreakAnimation — overlay de grietas en primera persona
//  Genera 8 texturas canvas con grietas progresivas y las
//  proyecta sobre el bloque que se está rompiendo.
// ============================================================
import * as THREE from 'three';

// ── Generación de texturas de grietas ────────────────────────
const S = 16; // tamaño del canvas

function makeCrackTex(stage) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, S, S);

  const t = stage / 8;
  // Overlay oscuro progresivo
  ctx.fillStyle = `rgba(0,0,0,${0.08 + t * 0.38})`;
  ctx.fillRect(0, 0, S, S);

  if (stage === 0) return finalizeTex(canvas);

  // Cada etapa acumula las líneas de la anterior
  const LINES = [
    [],
    [[8,8, 3,2]],
    [[8,8, 3,2],[8,8, 13,13]],
    [[8,8, 3,2],[8,8, 13,13],[8,8, 4,14]],
    [[8,8, 3,2],[8,8, 13,13],[8,8, 4,14],[8,8, 14,3]],
    [[8,8, 3,2],[8,8, 13,13],[8,8, 4,14],[8,8, 14,3],[3,2, 1,5],[3,2, 5,1]],
    [[8,8, 3,2],[8,8, 13,13],[8,8, 4,14],[8,8, 14,3],[3,2, 1,5],[3,2, 5,1],[13,13, 15,10],[4,14, 2,15]],
    [[8,8, 3,2],[8,8, 13,13],[8,8, 4,14],[8,8, 14,3],[3,2, 1,5],[3,2, 5,1],[13,13, 15,10],[4,14, 2,15],[14,3, 15,1],[14,3, 12,1]],
    [[8,8, 3,2],[8,8, 13,13],[8,8, 4,14],[8,8, 14,3],[3,2, 1,5],[3,2, 5,1],[13,13, 15,10],[4,14, 2,15],[14,3, 15,1],[14,3, 12,1],[2,9, 8,8],[8,8, 10,15]],
  ];

  const lines = LINES[Math.min(stage, 8)];

  // Sombra blanca para dar profundidad
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  for (const [x1,y1,x2,y2] of lines) {
    ctx.beginPath(); ctx.moveTo(x1+0.7, y1+0.7); ctx.lineTo(x2+0.7, y2+0.7); ctx.stroke();
  }

  // Grieta principal oscura
  ctx.strokeStyle = 'rgba(0,0,0,0.9)';
  ctx.lineWidth = 1;
  for (const [x1,y1,x2,y2] of lines) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  return finalizeTex(canvas);
}

function finalizeTex(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

// Pre-genera todas las etapas
const CRACK_TEX = Array.from({ length: 9 }, (_, i) => makeCrackTex(i));

// ── Clase principal ───────────────────────────────────────────
export class BreakAnimation {
  constructor(scene) {
    this._scene = scene;
    this._mesh  = null;
    this._stage = -1;

    const geo = new THREE.BoxGeometry(1.004, 1.004, 1.004);
    const mat = new THREE.MeshBasicMaterial({
      map:          CRACK_TEX[0],
      transparent:  true,
      depthWrite:   false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits:  -2,
    });
    this._mesh = new THREE.Mesh(geo, mat);
    this._mesh.visible = false;
    this._scene.add(this._mesh);
  }

  /**
   * Actualiza la animación.
   * @param {number} progress  0 = nada, 1 = casi roto
   * @param {{x,y,z}|null} blockPos  posición del bloque siendo roto
   */
  update(progress, blockPos) {
    if (progress <= 0 || !blockPos) {
      this._mesh.visible = false;
      this._stage = -1;
      return;
    }

    const stage = Math.min(Math.ceil(progress * 8), 8);

    if (stage !== this._stage) {
      this._mesh.material.map = CRACK_TEX[stage];
      this._mesh.material.needsUpdate = true;
      this._stage = stage;
    }

    this._mesh.position.set(blockPos.x + 0.5, blockPos.y + 0.5, blockPos.z + 0.5);
    this._mesh.visible = true;
  }
}
