// 게임 밸런스 상수
export const CONFIG = {
  // 플레이어
  WALK_SPEED: 2.0,
  RUN_SPEED: 5.0,
  CROUCH_SPEED: 1.0,
  STAMINA_MAX: 100,
  STAMINA_DRAIN: 20,
  STAMINA_RECOVER: 10,
  FLASHLIGHT_BATTERY_MAX: 100,
  FLASHLIGHT_DRAIN: 2,
  BATTERY_RECHARGE: 50,
  PLAYER_HEIGHT: 1.7,
  PLAYER_CROUCH_HEIGHT: 1.0,
  PLAYER_RADIUS: 0.3,
  INVENTORY_MAX: 5,

  // 선생님
  TEACHER_PATROL_SPEED: 1.5,
  TEACHER_SUSPICIOUS_SPEED: 2.0,
  TEACHER_CHASE_SPEED: 4.5,
  TEACHER_SEARCH_SPEED: 2.5,
  TEACHER_FOV: Math.PI / 2,
  TEACHER_VISION_RANGE: 15,
  TEACHER_HEARING_THRESHOLD: 0.05,
  TEACHER_SUSPICION_TIME: 5,
  TEACHER_SEARCH_TIME: 10,
  TEACHER_CATCH_DISTANCE: 1.5,

  // 소리
  NOISE_WALK: 0.3,
  NOISE_RUN: 0.8,
  NOISE_CROUCH: 0.0,
  NOISE_DOOR_OPEN: 0.5,
  NOISE_DOOR_SLAM: 1.0,
  NOISE_SURFACE_CARPET: 0.5,
  NOISE_SURFACE_TILE: 1.0,
  NOISE_SURFACE_METAL: 1.5,

  // 맵
  CELL_SIZE: 3,
  WALL_HEIGHT: 3,
  WALL_THICKNESS: 0.2,
};

// 타일 타입
export const TILE = {
  WALL: '#',
  FLOOR: '.',
  DOOR: 'D',
  LOCKED_DOOR: 'L',
  ROOM: 'R',
  STAIRS_UP: 'U',
  STAIRS_DOWN: 'W',
  HIDE: 'H',
  SPAWN: 'P',
  EXIT: 'X',
  ITEM: 'I',
  TEACHER_SPAWN: 'T',
  CLASSROOM: 'C',
};

// 선생님 상태
export const TEACHER_STATE = {
  PATROL: 'PATROL',
  SUSPICIOUS: 'SUSPICIOUS',
  CHASE: 'CHASE',
  SEARCH: 'SEARCH',
  RETURN: 'RETURN',
};

// 게임 상태
export const GAME_STATE = {
  TITLE: 'TITLE',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAMEOVER: 'GAMEOVER',
  CLEAR: 'CLEAR',
  HIDING: 'HIDING',
};

// 아이템 정의
export const ITEMS = {
  OFFICE_KEY: {
    id: 'office_key',
    name: '교무실 열쇠',
    icon: '🔑',
    description: '교무실 문을 열 수 있는 열쇠',
  },
  GATE_KEY: {
    id: 'gate_key',
    name: '정문 열쇠',
    icon: '🗝️',
    description: '정문을 열어 탈출할 수 있는 열쇠',
  },
  BATTERY: {
    id: 'battery',
    name: '건전지',
    icon: '🔋',
    description: '손전등 배터리를 충전한다',
  },
  INDOOR_SHOES: {
    id: 'indoor_shoes',
    name: '실내화',
    icon: '👟',
    description: '발소리가 줄어든다',
  },
  DECOY: {
    id: 'decoy',
    name: '핸드폰(디코이)',
    icon: '📱',
    description: '던져서 소리로 선생님을 유인한다',
  },
  ENERGY_DRINK: {
    id: 'energy_drink',
    name: '에너지 드링크',
    icon: '🥫',
    description: '스태미나를 즉시 회복한다',
  },
};

// 난이도 설정
export const DIFFICULTY = {
  EASY: {
    name: '쉬움',
    teacherCount: 1,
    teacherSpeedMultiplier: 0.9,
    visionMultiplier: 0.8,
  },
  NORMAL: {
    name: '보통',
    teacherCount: 2,
    teacherSpeedMultiplier: 1.0,
    visionMultiplier: 1.0,
  },
  HARD: {
    name: '어려움',
    teacherCount: 3,
    teacherSpeedMultiplier: 1.2,
    visionMultiplier: 1.3,
  },
};
