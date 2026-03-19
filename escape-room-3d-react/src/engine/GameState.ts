import type { GameStateData, ItemId, PuzzleId } from '../types/game';

export function createGameState(): GameStateData {
  return {
    currentRoom: 0,
    inventory: [],
    solvedPuzzles: new Set<PuzzleId>(),
    discoveredClues: new Set<string>(),
    startTime: 0,
    elapsed: 0,
    hintsUsed: 0,
    paused: true,
    codeTarget: null,
    codeBuffer: '',
    codeLength: 4,
    interactTarget: null,
  };
}

export type { GameStateData, ItemId, PuzzleId };
