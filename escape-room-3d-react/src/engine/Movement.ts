import * as THREE from 'three';
import { ROOM_CONFIGS, PLAYER_HEIGHT, MOVE_SPEED } from './RoomConfigs';
import type { ControlsState } from './Controls';

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

export function updateMovement(
  delta: number,
  camera: THREE.PerspectiveCamera,
  controls: ControlsState,
  currentRoom: number,
): void {
  velocity.x -= velocity.x * 8 * delta;
  velocity.z -= velocity.z * 8 * delta;

  direction.z = Number(controls.moveForward) - Number(controls.moveBackward);
  direction.x = Number(controls.moveRight) - Number(controls.moveLeft);
  direction.normalize();

  if (controls.moveForward || controls.moveBackward) velocity.z -= direction.z * MOVE_SPEED * delta;
  if (controls.moveLeft || controls.moveRight) velocity.x += direction.x * MOVE_SPEED * delta;

  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();

  const right = new THREE.Vector3();
  right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

  const newPos = camera.position.clone();
  newPos.add(forward.multiplyScalar(-velocity.z * delta));
  newPos.add(right.multiplyScalar(velocity.x * delta));

  // Collision with room bounds
  const rc = ROOM_CONFIGS[currentRoom];
  const [rw, , rd] = rc.size;
  const [ox, , oz] = rc.offset;
  const margin = 0.3;

  newPos.x = Math.max(ox - rw / 2 + margin, Math.min(ox + rw / 2 - margin, newPos.x));
  newPos.z = Math.max(oz - rd / 2 + margin, Math.min(oz + rd / 2 - margin, newPos.z));
  newPos.y = PLAYER_HEIGHT;

  camera.position.copy(newPos);
}

export function resetVelocity(): void {
  velocity.set(0, 0, 0);
}
