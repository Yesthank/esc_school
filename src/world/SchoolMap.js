import { TILE, CONFIG } from '../utils/Constants.js';

// 한국 학교 맵 데이터 — 실제 학교 구조 참고
// # = 벽, . = 복도, D = 문, L = 잠긴 문, H = 숨는 곳
// P = 플레이어 스폰, X = 출구, T = 선생님 스폰, I = 아이템
// C = 교실 내부, U = 위층 계단, W = 아래층 계단

// 한국 학교 전형적 구조:
// - 중앙 긴 복도 + 양쪽 교실
// - 한쪽 끝 계단실
// - 1층: 행정실/교무실, 현관(신발장)
// - 2층: 교실들, 교무실
// - 3층: 특별실(과학실, 음악실 등)

export const FLOOR_MAPS = {
  // 1층 — 현관, 행정실, 1학년 교실
  0: {
    name: '1층',
    grid: [
        '#####################################',  // 0
        '#CCCCC#CCCCC#CCCCC#.....#CCCCC#CCCCC#',  // 1
        '#CCCCC#CCCCC#CCCCC#.....#CCCCC#CCCCC#',  // 2
        '#CCCCC#CCCCC#CCCCC#.....#CCCCC#CCCCC#',  // 3
        '###D####D####D#####.U.W.##D####D#####',  // 4
        '#...............H...H...............#',  // 5
        '#...................................#',  // 6
        '#...................................#',  // 7
        '###D####D####D#####.....##D####D#####',  // 8
        '#CCCCC#CCCCC#CCCCC#.....#CCCCC#CCCCC#',  // 9
        '#CCCCC#CCCCC#CCCCC#..P..#CCCCC#CCCCC#',  // 10
        '#CCCCC#CCCCC#CCCCC#.....#CCCCC#CCCCC#',  // 11
        '###################.....#############',  // 12
        '###################.....#############',  // 13
        '###################..X..#############',  // 14
        '#####################################',  // 15
    ],
    items: [
      { type: 'battery', gridX: 3, gridZ: 2 },
      { type: 'decoy', gridX: 33, gridZ: 2 },
      { type: 'indoor_shoes', gridX: 20, gridZ: 14 },
    ],
    teacherSpawns: [
      { gridX: 10, gridZ: 6 },
    ],
    doors: [
      // 위쪽 교실 문
      { gridX: 3, gridZ: 4, locked: false },
      { gridX: 8, gridZ: 4, locked: false },
      { gridX: 13, gridZ: 4, locked: false },
      { gridX: 26, gridZ: 4, locked: false },
      { gridX: 31, gridZ: 4, locked: false },
      // 아래쪽 교실 문
      { gridX: 3, gridZ: 8, locked: false },
      { gridX: 8, gridZ: 8, locked: false },
      { gridX: 13, gridZ: 8, locked: false },
      { gridX: 26, gridZ: 8, locked: false },
      { gridX: 31, gridZ: 8, locked: false },
      // 현관 정문 (잠김)
      { gridX: 20, gridZ: 14, locked: true, keyRequired: 'gate_key', isExit: true },
    ],
    hideSpots: [
      { gridX: 16, gridZ: 5, type: 'locker' },
      { gridX: 20, gridZ: 5, type: 'locker' },
    ],
  },

  // 2층 — 2학년 교실, 교무실
  1: {
    name: '2층',
    grid: [
        '#####################################',  // 0
        '#CCCCC#CCCCC#CCCCC#.....#CCCCC#CCCCC#',  // 1
        '#CCCCC#CCCCC#CCCCC#.....#CCCCC#CCCCC#',  // 2
        '#CCCCC#CCCCC#CCCCC#.....#CCCCC#CCCCC#',  // 3
        '###D####D####D#####.W.U.##D####D#####',  // 4
        '#..................H................#',  // 5
        '#...................................#',  // 6
        '#...................................#',  // 7
        '###D####D####D#####.....##L####D#####', // 8
        '#CCCCC#CCCCC#CCCCC#.....#ICCCCC#CCCC#', // 9
        '#CCCCC#CCCCC#CCCCC#.....#CCCCCC#CCCC#', // 10
        '#CCCCC#CCCCC#CCCCC#.....#CCCCCC#CCCC#', // 11
        '#####################################',  // 12
    ],
    items: [
      { type: 'gate_key', gridX: 25, gridZ: 9 },
      { type: 'battery', gridX: 3, gridZ: 2 },
      { type: 'energy_drink', gridX: 33, gridZ: 2 },
    ],
    teacherSpawns: [
      { gridX: 18, gridZ: 6 },
    ],
    doors: [
      { gridX: 3, gridZ: 4, locked: false },
      { gridX: 8, gridZ: 4, locked: false },
      { gridX: 13, gridZ: 4, locked: false },
      { gridX: 26, gridZ: 4, locked: false },
      { gridX: 31, gridZ: 4, locked: false },
      { gridX: 3, gridZ: 8, locked: false },
      { gridX: 8, gridZ: 8, locked: false },
      { gridX: 13, gridZ: 8, locked: false },
      // 교무실 (잠김)
      { gridX: 26, gridZ: 8, locked: true, keyRequired: 'office_key' },
      { gridX: 31, gridZ: 8, locked: false },
    ],
    hideSpots: [
      { gridX: 19, gridZ: 5, type: 'locker' },
    ],
  },

  // 3층 — 특별실 (과학실, 음악실, 미술실)
  2: {
    name: '3층',
    grid: [
        '#####################################',  // 0
        '#CCCCC#CCCCC#CCCCC#.....#CCCCC#CCCCC#',  // 1
        '#CCCCC#CCCCC#CCCCC#.....#CCCCC#CICCC#',  // 2
        '#CCCCC#CCCCC#CCCCC#.....#CCCCC#CCCCC#',  // 3
        '###D####D####D#####.W...##D####D#####',  // 4
        '#..............H..................H.#',  // 5
        '#...................................#',  // 6
        '#...................................#',  // 7
        '###D####D####D#####.....##D####D#####',  // 8
        '#CCCCC#CCCCC#CCCCC#.....#CCCCC#CCCCC#',  // 9
        '#CCCCC#CCCCC#CCCCC#.....#CCCCC#CCCCC#',  // 10
        '#CCCCC#CCCCC#CCCCC#.....#CCCCC#CCCCC#',  // 11
        '#####################################',  // 12
    ],
    items: [
      { type: 'office_key', gridX: 31, gridZ: 2 },
      { type: 'battery', gridX: 3, gridZ: 10 },
      { type: 'decoy', gridX: 15, gridZ: 6 },
    ],
    teacherSpawns: [
      { gridX: 20, gridZ: 6 },
    ],
    doors: [
      { gridX: 3, gridZ: 4, locked: false },
      { gridX: 8, gridZ: 4, locked: false },
      { gridX: 13, gridZ: 4, locked: false },
      { gridX: 26, gridZ: 4, locked: false },
      { gridX: 31, gridZ: 4, locked: false },
      { gridX: 3, gridZ: 8, locked: false },
      { gridX: 8, gridZ: 8, locked: false },
      { gridX: 13, gridZ: 8, locked: false },
      { gridX: 26, gridZ: 8, locked: false },
      { gridX: 31, gridZ: 8, locked: false },
    ],
    hideSpots: [
      { gridX: 15, gridZ: 5, type: 'locker' },
      { gridX: 34, gridZ: 5, type: 'desk' },
    ],
  },
};

// 맵 그리드에서 월드 좌표로 변환
export function gridToWorld(gridX, gridZ, floor = 0) {
  return {
    x: gridX * CONFIG.CELL_SIZE,
    y: floor * CONFIG.WALL_HEIGHT + CONFIG.PLAYER_HEIGHT,
    z: gridZ * CONFIG.CELL_SIZE,
  };
}

// 월드 좌표에서 그리드 좌표로 변환
export function worldToGrid(x, z) {
  return {
    gridX: Math.round(x / CONFIG.CELL_SIZE),
    gridZ: Math.round(z / CONFIG.CELL_SIZE),
  };
}

// 특정 그리드 셀이 벽인지 확인
export function isWall(floor, gridX, gridZ) {
  const map = FLOOR_MAPS[floor];
  if (!map) return true;
  if (gridZ < 0 || gridZ >= map.grid.length) return true;
  const row = map.grid[gridZ];
  if (gridX < 0 || gridX >= row.length) return true;
  return row[gridX] === TILE.WALL || row[gridX] === ' ';
}

// 이동 가능한 셀인지 확인
export function isWalkable(floor, gridX, gridZ) {
  const map = FLOOR_MAPS[floor];
  if (!map) return false;
  if (gridZ < 0 || gridZ >= map.grid.length) return false;
  const row = map.grid[gridZ];
  if (gridX < 0 || gridX >= row.length) return false;
  const cell = row[gridX];
  return cell !== TILE.WALL && cell !== ' ';
}

// 플레이어 스폰 위치 찾기
export function findSpawnPosition() {
  const map = FLOOR_MAPS[0];
  for (let z = 0; z < map.grid.length; z++) {
    for (let x = 0; x < map.grid[z].length; x++) {
      if (map.grid[z][x] === 'P') {
        return gridToWorld(x, z, 0);
      }
    }
  }
  return gridToWorld(20, 10, 0);
}

// 출구 위치 찾기
export function findExitPosition() {
  const map = FLOOR_MAPS[0];
  for (let z = 0; z < map.grid.length; z++) {
    for (let x = 0; x < map.grid[z].length; x++) {
      if (map.grid[z][x] === 'X') {
        return gridToWorld(x, z, 0);
      }
    }
  }
  return null;
}

// 순찰 경로 생성 (복도를 따라가는 웨이포인트)
export function generatePatrolPath(floor) {
  const map = FLOOR_MAPS[floor];
  if (!map) return [];
  const path = [];
  const grid = map.grid;

  for (let z = 0; z < grid.length; z++) {
    for (let x = 0; x < grid[z].length; x++) {
      const cell = grid[z][x];
      if (cell === '.' || cell === 'H') {
        const neighbors = [
          isWalkable(floor, x - 1, z),
          isWalkable(floor, x + 1, z),
          isWalkable(floor, x, z - 1),
          isWalkable(floor, x, z + 1),
        ];
        const walkableCount = neighbors.filter(Boolean).length;
        if (walkableCount >= 3 || (walkableCount === 2 && x % 5 === 0 && z % 4 === 0)) {
          path.push(gridToWorld(x, z, floor));
        }
      }
    }
  }

  if (path.length === 0) {
    const spawn = map.teacherSpawns[0];
    if (spawn) {
      path.push(gridToWorld(spawn.gridX, spawn.gridZ, floor));
      path.push(gridToWorld(spawn.gridX + 5, spawn.gridZ, floor));
      path.push(gridToWorld(spawn.gridX + 5, spawn.gridZ + 3, floor));
      path.push(gridToWorld(spawn.gridX, spawn.gridZ + 3, floor));
    }
  }

  return path;
}
