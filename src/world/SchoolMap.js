import { TILE, CONFIG } from '../utils/Constants.js';

// 학교 맵 데이터 — 각 층의 그리드 맵
// # = 벽, . = 복도, D = 문, L = 잠긴 문, H = 숨는 곳
// P = 플레이어 스폰, X = 출구, T = 선생님 스폰, I = 아이템
// C = 교실 내부, U = 위층 계단, W = 아래층 계단

export const FLOOR_MAPS = {
  // 1층 — 1학년 교실들, 행정실, 정문 출구
  0: {
    name: '1층',
    grid: [
      '###################################',
      '#C.C.C#.........H.........#C.C.C.C#',
      '#.....#...................#........#',
      '#C.C.C#...................#C.C.C.C#',
      '###D####.................####D#####',
      '#..............................H..#',
      '#.U................................#',
      '#............................W....#',
      '#...H..............................#',
      '###D####.................####D#####',
      '#C.C.C#...................#C.C.I.C#',
      '#.....#...................#........#',
      '#C.C.C#.........P.........#C.C.C.C#',
      '########....D....D....D....########',
      '#CCCCCC#...................#CCCCCC#',
      '#CCCCCC#...................#CCCCCC#',
      '########...................########',
      '#..............................X..#',
      '###################################',
    ],
    items: [
      { type: 'battery', gridX: 29, gridZ: 10 },
      { type: 'decoy', gridX: 3, gridZ: 3 },
      { type: 'indoor_shoes', gridX: 31, gridZ: 17 },
    ],
    teacherSpawns: [
      { gridX: 18, gridZ: 5 },
    ],
    doors: [
      // 교실 문들
      { gridX: 4, gridZ: 4, locked: false },
      { gridX: 4, gridZ: 9, locked: false },
      { gridX: 28, gridZ: 4, locked: false },
      { gridX: 28, gridZ: 9, locked: false },
      // 정문 (잠김 — 정문 열쇠 필요)
      { gridX: 31, gridZ: 17, locked: true, keyRequired: 'gate_key', isExit: true },
      // 중앙 통로 문들
      { gridX: 13, gridZ: 13, locked: false },
      { gridX: 18, gridZ: 13, locked: false },
      { gridX: 23, gridZ: 13, locked: false },
    ],
    hideSpots: [
      { gridX: 18, gridZ: 1, type: 'locker' },
      { gridX: 31, gridZ: 5, type: 'desk' },
      { gridX: 4, gridZ: 8, type: 'locker' },
    ],
  },

  // 2층 — 2학년 교실들, 교무실, 도서관
  1: {
    name: '2층',
    grid: [
      '###################################',
      '#C.C.C#.........H.........#C.C.C.C#',
      '#.....#...................#........#',
      '#C.C.C#...................#C.C.C.C#',
      '###D####.................####D#####',
      '#.....H............................#',
      '#.W................................#',
      '#............................U....#',
      '#..................................#',
      '###D####.................####L#####',
      '#C.C.C#...................#I.....C#',
      '#.....#...................#........#',
      '#C.C.C#...................#C.C.C.C#',
      '###################################',
    ],
    items: [
      { type: 'gate_key', gridX: 28, gridZ: 10 },
      { type: 'battery', gridX: 5, gridZ: 5 },
      { type: 'energy_drink', gridX: 20, gridZ: 7 },
    ],
    teacherSpawns: [
      { gridX: 18, gridZ: 3 },
    ],
    doors: [
      { gridX: 4, gridZ: 4, locked: false },
      { gridX: 4, gridZ: 9, locked: false },
      { gridX: 28, gridZ: 4, locked: false },
      // 교무실 (잠김 — 교무실 열쇠 필요)
      { gridX: 28, gridZ: 9, locked: true, keyRequired: 'office_key' },
    ],
    hideSpots: [
      { gridX: 18, gridZ: 1, type: 'locker' },
      { gridX: 6, gridZ: 5, type: 'desk' },
    ],
  },

  // 3층 — 특별활동실, 과학실
  2: {
    name: '3층',
    grid: [
      '###################################',
      '#C.C.C#..........H........#C.I.C.C#',
      '#.....#...................#........#',
      '#C.C.C#...................#C.C.C.C#',
      '###D####.................####D#####',
      '#..............................H..#',
      '#.W................................#',
      '#..................................#',
      '#..................................#',
      '###D####.................####D#####',
      '#C.C.C#...................#C.C.C.C#',
      '#.....#...................#........#',
      '#C.C.C#...................#C.C.C.C#',
      '###################################',
    ],
    items: [
      { type: 'office_key', gridX: 30, gridZ: 1 },
      { type: 'battery', gridX: 15, gridZ: 7 },
      { type: 'decoy', gridX: 3, gridZ: 11 },
    ],
    teacherSpawns: [
      { gridX: 18, gridZ: 7 },
    ],
    doors: [
      { gridX: 4, gridZ: 4, locked: false },
      { gridX: 4, gridZ: 9, locked: false },
      { gridX: 28, gridZ: 4, locked: false },
      { gridX: 28, gridZ: 9, locked: false },
    ],
    hideSpots: [
      { gridX: 19, gridZ: 1, type: 'locker' },
      { gridX: 31, gridZ: 5, type: 'desk' },
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
  if (gridX < 0 || gridX >= map.grid[gridZ].length) return true;
  return map.grid[gridZ][gridX] === TILE.WALL;
}

// 이동 가능한 셀인지 확인
export function isWalkable(floor, gridX, gridZ) {
  const map = FLOOR_MAPS[floor];
  if (!map) return false;
  if (gridZ < 0 || gridZ >= map.grid.length) return false;
  if (gridX < 0 || gridX >= map.grid[gridZ].length) return false;
  const cell = map.grid[gridZ][gridX];
  return cell !== TILE.WALL;
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
  return gridToWorld(18, 12, 0);
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

  // 복도의 주요 지점들을 순찰 경로로 사용
  for (let z = 0; z < grid.length; z++) {
    for (let x = 0; x < grid[z].length; x++) {
      const cell = grid[z][x];
      if (cell === '.' || cell === 'H') {
        // 교차로나 코너를 웨이포인트로 선택
        const neighbors = [
          isWalkable(floor, x - 1, z),
          isWalkable(floor, x + 1, z),
          isWalkable(floor, x, z - 1),
          isWalkable(floor, x, z + 1),
        ];
        const walkableCount = neighbors.filter(Boolean).length;
        // T자 교차로, 코너, 또는 넓은 구역의 포인트
        if (walkableCount >= 3 || (walkableCount === 2 && x % 5 === 0 && z % 4 === 0)) {
          path.push(gridToWorld(x, z, floor));
        }
      }
    }
  }

  // 경로가 없으면 기본 경로
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
