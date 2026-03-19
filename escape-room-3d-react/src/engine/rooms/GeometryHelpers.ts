import * as THREE from 'three';
import type { BoxOpts, RoomConfig } from '../../types/game';

export function makeBox(
  w: number, h: number, d: number, color: number,
  x: number, y: number, z: number, opts: BoxOpts = {},
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.7,
    metalness: opts.metalness ?? 0.1,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (opts.name) mesh.name = opts.name;
  if (opts.rotation) mesh.rotation.set(opts.rotation[0], opts.rotation[1], opts.rotation[2]);
  return mesh;
}

export function makeRoom(
  cfg: RoomConfig,
  index: number,
  scene: THREE.Scene,
  rooms: THREE.Group[],
): THREE.Group {
  const g = new THREE.Group();
  const [w, h, d] = cfg.size;
  const [ox, oy, oz] = cfg.offset;
  g.position.set(ox, oy, oz);

  // Floor
  const floor = makeBox(w, 0.1, d, 0x333333, 0, 0, 0, { roughness: 0.9 });
  floor.receiveShadow = true;
  g.add(floor);

  // Ceiling
  g.add(makeBox(w, 0.1, d, cfg.color, 0, h, 0, { roughness: 0.8 }));

  // Walls
  g.add(makeBox(w, h, 0.15, cfg.color, 0, h / 2, -d / 2, { roughness: 0.8 }));
  g.add(makeBox(w, h, 0.15, cfg.color, 0, h / 2, d / 2, { roughness: 0.8 }));
  g.add(makeBox(0.15, h, d, cfg.color, -w / 2, h / 2, 0, { roughness: 0.8 }));
  g.add(makeBox(0.15, h, d, cfg.color, w / 2, h / 2, 0, { roughness: 0.8 }));

  // Ambient light
  const amb = new THREE.AmbientLight(cfg.ambient, 0.4);
  g.add(amb);

  // Point light
  const pl = new THREE.PointLight(cfg.light, 1.2, w * 2);
  pl.position.set(0, h - 0.3, 0);
  pl.castShadow = true;
  pl.shadow.mapSize.set(512, 512);
  g.add(pl);

  scene.add(g);
  rooms[index] = g;
  return g;
}
