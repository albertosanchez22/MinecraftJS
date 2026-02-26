// ============================================================
//  ChunkMesh — convierte Chunk en geometría Three.js
//  Solo genera caras expuestas; cada cara usa UVs + textura
// ============================================================
import * as THREE from 'three';
import { CHUNK_SIZE, CHUNK_HEIGHT } from '../utils/Constants.js';
import { BlockID, getBlockTexKeys, isSolid } from '../world/BlockTypes.js';
import { getTextureMaterial } from './TextureGenerator.js';

// Cara: [normal, vértices (CCW desde fuera), faceIdx(0=top,1=side,2=bot)]
const FACES = [
  // TOP   (+Y)
  { dir: [0,1,0], corners: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]], faceIdx: 0 },
  // BOTTOM (-Y)
  { dir: [0,-1,0], corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]], faceIdx: 2 },
  // NORTH (+Z)
  { dir: [0,0,1], corners: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]], faceIdx: 1 },
  // SOUTH (-Z)
  { dir: [0,0,-1], corners: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]], faceIdx: 1 },
  // EAST  (+X)
  { dir: [1,0,0], corners: [[1,0,1],[1,0,0],[1,1,0],[1,1,1]], faceIdx: 1 },
  // WEST  (-X)
  { dir: [-1,0,0], corners: [[0,0,0],[0,0,1],[0,1,1],[0,1,0]], faceIdx: 1 },
];

// UVs para cada vértice del quad (en el mismo orden que corners)
const FACE_UVS = [
  [0,0], [1,0], [1,1], [0,1],
];

export class ChunkMeshBuilder {
  constructor(scene) {
    this._scene = scene;
  }

  /**
   * Construye (o reconstruye) el mesh de un chunk.
   * @param {import('../world/Chunk.js').Chunk} chunk
   * @param {import('../world/World.js').World} world
   */
  build(chunk, world) {
    // Eliminar mesh anterior
    if (chunk.mesh) {
      this._scene.remove(chunk.mesh);
      chunk.mesh.traverse(child => { if (child.geometry) child.geometry.dispose(); });
      chunk.mesh = null;
    }

    // Acumulamos por clave de textura → { positions, normals, uvs, indices, count }
    const texBuckets = new Map();

    const getOrAdd = (key) => {
      if (!texBuckets.has(key)) {
        texBuckets.set(key, { positions: [], normals: [], uvs: [], indices: [], count: 0 });
      }
      return texBuckets.get(key);
    };

    for (let ly = 0; ly < CHUNK_HEIGHT; ly++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
          const id = chunk.getBlock(lx, ly, lz);
          if (id === BlockID.AIR) continue;

          const [texTop, texSide, texBot] = getBlockTexKeys(id);

          for (const face of FACES) {
            const nx = lx + face.dir[0];
            const ny = ly + face.dir[1];
            const nz = lz + face.dir[2];

            let neighborId;
            if (nx >= 0 && nx < CHUNK_SIZE && ny >= 0 && ny < CHUNK_HEIGHT && nz >= 0 && nz < CHUNK_SIZE) {
              neighborId = chunk.getBlock(nx, ny, nz);
            } else {
              const wx = chunk.worldX + nx;
              const wy = ny;
              const wz = chunk.worldZ + nz;
              neighborId = world.getBlock(wx, wy, wz);
            }

            if (isSolid(neighborId)) continue;

            // Elegir textura según cara
            let texKey;
            if (face.faceIdx === 0) texKey = texTop;
            else if (face.faceIdx === 2) texKey = texBot;
            else texKey = texSide;

            const bucket = getOrAdd(texKey);
            const base = bucket.count;

            for (let vi = 0; vi < 4; vi++) {
              const [cx, cy, cz] = face.corners[vi];
              bucket.positions.push(lx + cx, ly + cy, lz + cz);
              bucket.normals.push(...face.dir);
              bucket.uvs.push(...FACE_UVS[vi]);
            }
            bucket.indices.push(base, base+1, base+2, base, base+2, base+3);
            bucket.count += 4;
          }
        }
      }
    }

    if (texBuckets.size === 0) {
      chunk.dirty = false;
      return;
    }

    const group = new THREE.Group();
    group.position.set(chunk.worldX, 0, chunk.worldZ);

    for (const [texKey, b] of texBuckets) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(b.positions, 3));
      geo.setAttribute('normal',   new THREE.Float32BufferAttribute(b.normals, 3));
      geo.setAttribute('uv',       new THREE.Float32BufferAttribute(b.uvs, 2));
      geo.setIndex(b.indices);

      const mat  = getTextureMaterial(texKey);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    this._scene.add(group);
    chunk.mesh  = group;
    chunk.dirty = false;
  }

  /** Elimina el mesh de un chunk de la escena. */
  remove(chunk) {
    if (chunk.mesh) {
      this._scene.remove(chunk.mesh);
      chunk.mesh.traverse(c => { if (c.geometry) c.geometry.dispose(); });
      chunk.mesh = null;
    }
  }
}

