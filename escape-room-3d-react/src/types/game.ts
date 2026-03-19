import type * as THREE from 'three';

export interface RoomConfig {
  name: string;
  size: [number, number, number];
  offset: [number, number, number];
  color: number;
  ambient: number;
  light: number;
}

export interface PuzzleHints {
  answer: string;
  hints: [string, string, string];
}

export interface Puzzles {
  drawer: PuzzleHints;
  safe: PuzzleHints;
  exit: PuzzleHints;
}

export type PuzzleId = keyof Puzzles;

export interface BoxOpts {
  roughness?: number;
  metalness?: number;
  emissive?: number;
  emissiveIntensity?: number;
  name?: string;
  rotation?: [number, number, number];
}

export interface SpawnLocal {
  x: number;
  z: number;
}

export interface InteractableUserData {
  type: 'examine' | 'puzzle' | 'door';
  prompt?: string;
  puzzleId?: PuzzleId;
  lockedMsg?: string;
  unlockedMsg?: string;
  dialog?: { title: string; content: string };
  targetRoom?: number;
  requires?: string | null;
  spawnLocal?: SpawnLocal;
  faceY?: number;
}

export interface InteractableEntry {
  mesh: THREE.Mesh;
  room: number;
}

export type ItemId = 'keycard' | 'note_fragment' | 'master_key' | 'torn_photo2';

export interface GameStateData {
  currentRoom: number;
  inventory: ItemId[];
  solvedPuzzles: Set<PuzzleId>;
  discoveredClues: Set<string>;
  startTime: number;
  elapsed: number;
  hintsUsed: number;
  paused: boolean;
  codeTarget: PuzzleId | null;
  codeBuffer: string;
  codeLength: number;
  interactTarget: THREE.Mesh | null;
}

export type GameScreen = 'title' | 'playing' | 'paused';

// Events the engine emits to React
export interface GameEvents {
  screenChange: (screen: GameScreen) => void;
  roomChange: (name: string) => void;
  timerUpdate: (display: string) => void;
  inventoryChange: (items: ItemId[]) => void;
  interactPrompt: (text: string) => void;
  showDialog: (title: string, content: string) => void;
  closeDialog: () => void;
  showCodePanel: (title: string, subtitle: string) => void;
  codeDisplayUpdate: (display: string) => void;
  codeResult: (text: string, color: string) => void;
  closeCodePanel: () => void;
  flashMessage: (text: string) => void;
  showHint: (text: string) => void;
  hideHint: () => void;
  fadeIn: () => void;
  fadeOut: (duration?: number) => void;
  triggerEnding: (elapsed: number, hintsUsed: number, discoveredClues: number) => void;
}
