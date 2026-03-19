import * as THREE from 'three';

export interface ControlsState {
  moveForward: boolean;
  moveBackward: boolean;
  moveLeft: boolean;
  moveRight: boolean;
  isLocked: boolean;
}

export function createControls(
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  controlsState: ControlsState,
  euler: THREE.Euler,
  isMobile: boolean,
  getPaused: () => boolean,
  onInteract: () => void,
  onPointerLockChange: (locked: boolean) => void,
): () => void {
  const onKeyDown = (e: KeyboardEvent) => {
    if (getPaused()) return;
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': controlsState.moveForward = true; break;
      case 'KeyS': case 'ArrowDown': controlsState.moveBackward = true; break;
      case 'KeyA': case 'ArrowLeft': controlsState.moveLeft = true; break;
      case 'KeyD': case 'ArrowRight': controlsState.moveRight = true; break;
      case 'KeyE': onInteract(); break;
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': controlsState.moveForward = false; break;
      case 'KeyS': case 'ArrowDown': controlsState.moveBackward = false; break;
      case 'KeyA': case 'ArrowLeft': controlsState.moveLeft = false; break;
      case 'KeyD': case 'ArrowRight': controlsState.moveRight = false; break;
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!controlsState.isLocked || getPaused()) return;
    const sensitivity = 0.002;
    euler.setFromQuaternion(camera.quaternion);
    euler.y -= e.movementX * sensitivity;
    euler.x -= e.movementY * sensitivity;
    euler.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, euler.x));
    camera.quaternion.setFromEuler(euler);
  };

  const onClick = () => {
    if (!controlsState.isLocked && !getPaused()) {
      renderer.domElement.requestPointerLock();
    }
  };

  const onPointerLockChangeEvent = () => {
    controlsState.isLocked = !!document.pointerLockElement;
    onPointerLockChange(controlsState.isLocked);
  };

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('mousemove', onMouseMove);
  if (!isMobile) {
    document.addEventListener('click', onClick);
  }
  document.addEventListener('pointerlockchange', onPointerLockChangeEvent);

  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('mousemove', onMouseMove);
    if (!isMobile) {
      document.removeEventListener('click', onClick);
    }
    document.removeEventListener('pointerlockchange', onPointerLockChangeEvent);
  };
}
