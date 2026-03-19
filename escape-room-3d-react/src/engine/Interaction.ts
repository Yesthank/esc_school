import * as THREE from 'three';
import type { InteractableEntry, InteractableUserData } from '../types/game';
import type { GameStateData } from './GameState';

export function updateInteraction(
  camera: THREE.PerspectiveCamera,
  raycaster: THREE.Raycaster,
  interactables: InteractableEntry[],
  state: GameStateData,
  onPromptChange: (text: string) => void,
): void {
  raycaster.set(camera.position, camera.getWorldDirection(new THREE.Vector3()));

  const roomInteractables = interactables
    .filter((i) => i.room === state.currentRoom)
    .map((i) => i.mesh);

  const hits = raycaster.intersectObjects(roomInteractables, false);

  // Reset previous hover
  if (state.interactTarget) {
    const mat = state.interactTarget.material as THREE.MeshStandardMaterial & {
      _origEmissive?: number;
      _origEmissiveInt?: number;
    };
    if (mat._origEmissive !== undefined) {
      mat.emissive.setHex(mat._origEmissive);
      mat.emissiveIntensity = mat._origEmissiveInt || 0;
    }
  }

  if (hits.length > 0) {
    const obj = hits[0].object as THREE.Mesh;
    const data = obj.userData as InteractableUserData;
    if (data.prompt) {
      onPromptChange(data.prompt);
      state.interactTarget = obj;

      // Hover glow
      const mat = obj.material as THREE.MeshStandardMaterial & {
        _origEmissive?: number;
        _origEmissiveInt?: number;
      };
      if (mat._origEmissive === undefined) {
        mat._origEmissive = mat.emissive.getHex();
        mat._origEmissiveInt = mat.emissiveIntensity;
      }
      mat.emissive.setHex(0x00e5ff);
      mat.emissiveIntensity = 0.3;
    }
  } else {
    onPromptChange('');
    state.interactTarget = null;
  }
}

export function updateDoorVisuals(
  interactables: InteractableEntry[],
  inventory: string[],
): void {
  interactables.forEach(({ mesh }) => {
    const data = mesh.userData as InteractableUserData;
    if (data.type === 'door') {
      const req = data.requires;
      if (req && inventory.includes(req)) {
        const mat = mesh.material as THREE.MeshStandardMaterial & {
          _origEmissive?: number;
          _origEmissiveInt?: number;
        };
        mat.emissive.setHex(0x005500);
        mat.emissiveIntensity = 0.3;
        mat._origEmissive = 0x005500;
        mat._origEmissiveInt = 0.3;
      }
    }
  });
}
