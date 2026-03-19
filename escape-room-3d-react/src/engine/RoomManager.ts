import * as THREE from 'three';
import { ROOM_CONFIGS, PLAYER_HEIGHT, FOG_COLORS } from './RoomConfigs';
import type { SpawnLocal } from '../types/game';

export function transitionToRoom(
  roomIndex: number,
  spawnLocal: SpawnLocal | undefined,
  faceY: number | undefined,
  rooms: THREE.Group[],
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  euler: THREE.Euler,
  isMobile: boolean,
  setCurrentRoom: (room: number) => void,
  setPaused: (paused: boolean) => void,
  onFadeIn: () => void,
  onFadeOut: () => void,
  onRoomChange: (name: string) => void,
): void {
  onFadeIn();
  setPaused(true);

  setTimeout(() => {
    rooms.forEach((r, i) => { r.visible = i === roomIndex; });
    setCurrentRoom(roomIndex);

    const rc = ROOM_CONFIGS[roomIndex];
    const [ox, , oz] = rc.offset;
    const sx = ox + (spawnLocal ? spawnLocal.x : 0);
    const sz = oz + (spawnLocal ? spawnLocal.z : 0);
    camera.position.set(sx, PLAYER_HEIGHT, sz);

    if (faceY !== undefined) {
      euler.set(0, faceY, 0, 'YXZ');
      camera.quaternion.setFromEuler(euler);
    }

    onRoomChange(rc.name);

    scene.fog!.color.setHex(FOG_COLORS[roomIndex]);
    (scene.background as THREE.Color).setHex(FOG_COLORS[roomIndex]);

    setTimeout(() => {
      onFadeOut();
      setPaused(false);
      if (!isMobile && !document.pointerLockElement) {
        renderer.domElement.requestPointerLock();
      }
    }, 600);
  }, 800);
}
