// ============================================================
//  BlockHighlight — cuadro de selección al apuntar un bloque
// ============================================================
import * as THREE from 'three';

export class BlockHighlight {
  constructor(scene) {
    const geo = new THREE.BoxGeometry(1.002, 1.002, 1.002);
    const edges = new THREE.EdgesGeometry(geo);
    this._mesh = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1, depthTest: true })
    );
    this._mesh.renderOrder = 1;
    this._mesh.visible = false;
    scene.add(this._mesh);
  }

  /**
   * Actualizar posición del highlight
   * @param {{ pos:{x,y,z} } | null} hit - resultado del raycast
   */
  update(hit) {
    if (!hit) {
      this._mesh.visible = false;
      return;
    }
    this._mesh.visible = true;
    this._mesh.position.set(hit.pos.x + 0.5, hit.pos.y + 0.5, hit.pos.z + 0.5);
  }
}
