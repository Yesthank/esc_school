import type { RoomConfig } from '../types/game';

export const ROOM_CONFIGS: RoomConfig[] = [
  { name: '격리실', size: [6, 3, 6], offset: [0, 0, 0], color: 0xe8e8e8, ambient: 0x404050, light: 0xffffff },
  { name: '연구실', size: [8, 3.5, 8], offset: [20, 0, 0], color: 0xd0d8e0, ambient: 0x203040, light: 0x88aaff },
  { name: '관찰실', size: [10, 4, 10], offset: [45, 0, 0], color: 0x1a1a2e, ambient: 0x101020, light: 0x334455 },
];

export const PLAYER_HEIGHT = 1.6;
export const MOVE_SPEED = 35;
export const FOG_COLORS = [0x0a0a0a, 0x050510, 0x020208];
