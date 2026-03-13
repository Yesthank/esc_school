# 🏫 야자째기 — 선생님을 피해 학교를 탈출하라

## 프로젝트 개요

**야자째기**는 야간자율학습(야자)을 째고 학교를 탈출하는 **1인칭 3D 공포/잠입 게임**이다.
화이트데이: 학교라는 이름의 미궁에서 영감을 받았으며, 미로처럼 구성된 한국 학교 건물 안에서
순찰하는 선생님을 피해 정문 밖으로 탈출하는 것이 목표다.

- **기술 스택**: Three.js (WebGL 3D 렌더링) + Vanilla JavaScript
- **대안 스택**: Babylon.js 또는 PlayCanvas
- **목표 플랫폼**: 데스크탑 브라우저 (Chrome, Firefox)
- **조작**: 키보드(WASD) + 마우스 (1인칭 시점)

---

## 핵심 컨셉

### 게임 한 줄 요약
> 밤 10시, 야자 시간. 교실을 빠져나와 선생님 눈을 피해 학교 밖으로 탈출하라.

### 공포 요소
- **선생님 AI**: 복도를 순찰하며, 플레이어 발견 시 추격. 화이트데이 수위 아저씨 같은 존재감
- **어두운 학교**: 야간이라 대부분 조명 꺼짐. 플레이어는 손전등에 의존
- **소리 시스템**: 뛰면 발소리가 커져서 선생님이 감지. 걸으면 느리지만 안전
- **점프 스케어**: 특정 조건에서 갑작스러운 이벤트 (문 쾅, 형광등 깜빡임)
- **분위기**: 한국 학교 특유의 긴 복도, 철제 사물함, 칠판, 게시판

---

## 맵 설계 — 학교 구조

### 건물 구성
```
┌──────────────────────────────────────────────┐
│  3층: 특별활동실, 과학실, 음악실, 옥상 (잠김)   │
├──────────────────────────────────────────────┤
│  2층: 2학년 교실들, 교무실, 도서관              │
├──────────────────────────────────────────────┤
│  1층: 1학년 교실들, 행정실, 현관 (정문 출구)     │
├──────────────────────────────────────────────┤
│  지하: 급식실, 보일러실, 창고 (비밀 통로?)       │
└──────────────────────────────────────────────┘
```

### 맵 특징
- **미로형 복도**: 직선이 아닌 L자, T자, ㄷ자 복도로 시야 차단
- **잠긴 문**: 열쇠 또는 퍼즐로 해제 (진행 게이트)
- **숨는 장소**: 화장실 칸, 사물함, 교탁 아래, 빈 교실 — 은신 시스템
- **지름길**: 창문 타고 이동, 비상계단, 지하 통로 등 숨겨진 루트
- **계단**: 각 층 양 끝에 계단 배치 (동쪽 계단, 서쪽 계단)
- **최종 목표**: 1층 정문 도달. 단, 정문 열쇠는 교무실에 있음

### 층별 레이아웃 (그리드 기반)
```
각 층은 그리드 맵으로 구성:
█ = 벽
. = 복도 (이동 가능)
D = 문 (열림/잠김)
R = 방 (교실 등)
S = 계단
H = 숨는 장소

예시 - 1층:
█████████████████████████
█R.D.R█...........█R.D.R█
█.....█.....H.....█.....█
█R.D.R█...........█R.D.R█
█████████..D..█████████████
█.................................█
█....S......................S....█
█████████████████████████████████
```

---

## 캐릭터 설계

### 플레이어 (학생)
- **시점**: 1인칭 (FPS 카메라)
- **이동 속도**: 걷기 2m/s, 달리기 5m/s
- **스태미나**: 달리기 시 소모, 시간 경과로 회복
- **손전등**: 켜기/끄기 토글. 배터리 제한 (건전지 아이템으로 충전)
- **인벤토리**: 최대 5칸 (열쇠, 건전지, 퍼즐 아이템 등)
- **HP 없음**: 선생님에게 잡히면 즉시 게임오버 (1히트 킬)

### 선생님 (적 AI)
- **외형**: 화이트데이 수위 아저씨 레퍼런스 — 근엄한 표정, 어두운 옷
- **행동 패턴**:

| 상태 | 설명 | 이동 속도 |
|------|------|-----------|
| 순찰(Patrol) | 정해진 경로를 따라 복도 순찰 | 1.5m/s |
| 의심(Suspicious) | 소리 감지, 일정 시간 주변 탐색 | 2m/s |
| 추격(Chase) | 플레이어 발견, 전력 추격 | 4.5m/s |
| 수색(Search) | 시야에서 놓침, 마지막 위치 주변 탐색 | 2.5m/s |
| 복귀(Return) | 수색 실패, 순찰 경로로 복귀 | 1.5m/s |

- **감지 시스템**:
  - 시야(FOV): 전방 90도, 거리 15m. 손전등 비추면 감지 거리 증가
  - 청각: 달리기 소리 반경 10m, 걷기 소리 반경 3m, 웅크리기 무음
  - 문 열림 소리: 반경 5m

### 선생님 복수 (난이도 스케일링)
- **쉬움**: 선생님 1명 (1층만 순찰)
- **보통**: 선생님 2명 (1-2층)
- **어려움**: 선생님 3명 (전 층) + 순찰 속도 증가

---

## 게임 시스템

### 1. 잠입(Stealth) 시스템
```
소리 레벨 계산:
  noiseLevel = baseNoise[action] × surfaceMultiplier × itemMultiplier

  baseNoise:
    웅크려 걷기: 0.0
    걷기: 0.3
    달리기: 0.8
    문 열기: 0.5
    문 쾅 닫기: 1.0
    아이템 떨어뜨리기: 0.6

  surfaceMultiplier:
    카펫/고무: 0.5
    타일 바닥: 1.0
    철제 계단: 1.5

선생님 청각 감지:
  if (noiseLevel × (1 / distance)) > detectionThreshold:
    state = SUSPICIOUS
    moveToward(noiseSource)
```

### 2. 은신(Hide) 시스템
- 숨는 장소에서 E키로 은신 진입
- 은신 중에는 화면이 좁아지고 (엿보기 뷰), 심장 박동 소리
- 선생님이 은신 장소 앞을 지나갈 때 긴장감 연출
- **발각 조건**: 선생님이 같은 방에서 일정 시간 수색 시 확률적 발견

### 3. 아이템 시스템
| 아이템 | 효과 | 위치 |
|--------|------|------|
| 교무실 열쇠 | 교무실 문 해제 | 2층 과학실 서랍 |
| 정문 열쇠 | 정문(최종 탈출) 해제 | 교무실 책상 위 |
| 건전지 | 손전등 충전 | 곳곳에 랜덤 배치 |
| 실내화 | 발소리 감소 (0.7배) | 신발장 |
| 디코이(핸드폰) | 던져서 소리 유인 | 교실 책상 |
| 에너지 드링크 | 스태미나 즉시 회복 | 매점/자판기 |

### 4. 퍼즐 요소
- **교무실 진입**: 비밀번호 자물쇠 (힌트는 칠판에)
- **지하실 열쇠**: 과학실 약품 조합 퍼즐
- **옥상 우회로**: 음악실에서 특정 피아노 건반 연주
- 퍼즐은 선택적 — 메인 루트 외 지름길을 여는 용도

### 5. 이벤트 & 연출
- **형광등 깜빡임**: 선생님 접근 시 근처 형광등이 깜빡
- **문 쾅**: 랜덤으로 빈 교실 문이 닫히는 소리
- **방송**: 선생님이 교내 방송으로 "학생, 어디있는 거야..." 경고
- **CCTV**: 특정 복도에 CCTV — 지나가면 선생님에게 위치 노출
- **심장 박동**: 선생님과의 거리에 비례해 심박수 UI + 효과음

---

## UI / UX 설계

### 인게임 HUD
```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│           [1인칭 3D 뷰]                  │
│                                         │
│                                         │
│  🔦 ████░░░░  (배터리)                   │
│  🏃 ████████░░ (스태미나)                 │
│                                         │
│  [E] 상호작용                 [인벤토리]   │
│  ♥♥♥♥ (심장 박동 표시)        [Tab]       │
└─────────────────────────────────────────┘
```

### 메뉴 화면
- **타이틀**: "야자째기" — 어두운 학교 복도 배경, 형광등 깜빡이는 애니메이션
- **메뉴 항목**: 새 게임, 이어하기, 난이도 선택, 설정, 종료
- **폰트**: 한국 학교 느낌 — 손글씨체 또는 분필체

### 게임오버 화면
- 선생님에게 잡히면 화면 흔들림 → 페이드 아웃
- "방과 후 남으세요." 텍스트 + 교실 배경
- 재도전 / 메뉴로 버튼

### 클리어 화면
- 정문 밖으로 나가는 연출 → 밤하늘 + 자유의 공기
- "탈출 성공!" + 클리어 시간, 발각 횟수 등 통계

---

## 기술 구현 가이드

### 기술 스택 상세
```
Three.js          — 3D 렌더링 엔진
Cannon.js/Rapier  — 물리 엔진 (충돌, 레이캐스팅)
Howler.js         — 3D 공간 오디오
vanilla JS        — 게임 로직, UI
```

### 프로젝트 구조
```
/src
  /core
    Game.js              # 메인 게임 루프 & 상태 관리
    InputManager.js      # 키보드/마우스 입력 처리
    AudioManager.js      # 사운드 시스템 (3D 공간 음향)
    EventSystem.js       # 이벤트 트리거 & 연출
  /world
    SchoolMap.js         # 맵 데이터 & 방 생성
    MapGenerator.js      # 그리드 → 3D 지오메트리 변환
    Door.js              # 문 오브젝트 (열림/잠김/소리)
    HideSpot.js          # 은신 장소 오브젝트
    Interactable.js      # 상호작용 가능 오브젝트 베이스
    LightingSystem.js    # 형광등, 비상등, 깜빡임 효과
  /characters
    Player.js            # 1인칭 컨트롤러, 스태미나, 인벤토리
    Teacher.js           # 선생님 AI (FSM)
    TeacherAI.js         # 순찰 경로, 감지, 추격 로직
    SoundDetection.js    # 소리 기반 감지 시스템
    VisionCone.js        # 시야각 기반 감지 시스템
  /ui
    HUD.js               # 인게임 HUD (배터리, 스태미나)
    Inventory.js         # 인벤토리 UI
    PauseMenu.js         # 일시정지 메뉴
    TitleScreen.js       # 타이틀 화면
    GameOverScreen.js    # 게임오버/클리어 화면
  /utils
    Constants.js         # 게임 상수
    Raycaster.js         # 레이캐스팅 유틸
    GridUtils.js         # 그리드 맵 유틸리티
    SaveSystem.js        # 저장/불러오기
  index.html
  main.js
  style.css
```

### 핵심 알고리즘

#### 선생님 AI — 유한 상태 기계 (FSM)
```javascript
class TeacherAI {
  constructor() {
    this.state = 'PATROL';
    this.patrolPath = [];      // 순찰 웨이포인트
    this.patrolIndex = 0;
    this.lastKnownPlayerPos = null;
    this.suspicionTimer = 0;
    this.searchTimer = 0;
  }

  update(deltaTime, playerInfo) {
    switch (this.state) {
      case 'PATROL':
        this.followPatrolPath();
        if (this.canSeePlayer(playerInfo)) {
          this.state = 'CHASE';
        } else if (this.canHearPlayer(playerInfo)) {
          this.lastKnownPlayerPos = playerInfo.noiseSource;
          this.state = 'SUSPICIOUS';
        }
        break;

      case 'SUSPICIOUS':
        this.moveToward(this.lastKnownPlayerPos);
        this.suspicionTimer += deltaTime;
        if (this.canSeePlayer(playerInfo)) {
          this.state = 'CHASE';
        } else if (this.suspicionTimer > 5) {
          this.suspicionTimer = 0;
          this.state = 'RETURN';
        }
        break;

      case 'CHASE':
        this.moveToward(playerInfo.position);
        if (this.distanceTo(playerInfo.position) < 1.5) {
          this.catchPlayer();  // 게임오버
        }
        if (!this.canSeePlayer(playerInfo)) {
          this.lastKnownPlayerPos = playerInfo.position;
          this.state = 'SEARCH';
        }
        break;

      case 'SEARCH':
        this.searchAround(this.lastKnownPlayerPos);
        this.searchTimer += deltaTime;
        if (this.canSeePlayer(playerInfo)) {
          this.state = 'CHASE';
        } else if (this.searchTimer > 10) {
          this.searchTimer = 0;
          this.state = 'RETURN';
        }
        break;

      case 'RETURN':
        this.moveToward(this.getNearestPatrolPoint());
        if (this.reachedPatrolPath()) {
          this.state = 'PATROL';
        }
        if (this.canSeePlayer(playerInfo) || this.canHearPlayer(playerInfo)) {
          this.state = 'CHASE';
        }
        break;
    }
  }

  canSeePlayer(playerInfo) {
    const dirToPlayer = playerInfo.position.clone().sub(this.position).normalize();
    const forward = this.getForwardVector();
    const angle = forward.angleTo(dirToPlayer);
    const distance = this.distanceTo(playerInfo.position);

    if (angle > FOV_HALF_ANGLE || distance > VISION_RANGE) return false;

    // 레이캐스트로 벽 가림 체크
    return !this.isBlockedByWall(playerInfo.position);
  }

  canHearPlayer(playerInfo) {
    const distance = this.distanceTo(playerInfo.noiseSource);
    const effectiveNoise = playerInfo.noiseLevel / distance;
    return effectiveNoise > HEARING_THRESHOLD;
  }
}
```

#### 맵 생성 — 그리드 → 3D
```javascript
const CELL_SIZE = 3;  // 미터
const WALL_HEIGHT = 3;
const TILE_TYPES = {
  WALL: '█',
  FLOOR: '.',
  DOOR: 'D',
  ROOM: 'R',
  STAIRS: 'S',
  HIDE: 'H',
  SPAWN: 'P',
  EXIT: 'X',
};

function generateFloor(gridData, floorY) {
  for (let z = 0; z < gridData.length; z++) {
    for (let x = 0; x < gridData[z].length; x++) {
      const cell = gridData[z][x];
      
      if (cell === TILE_TYPES.WALL) {
        createWallBlock(x * CELL_SIZE, floorY, z * CELL_SIZE);
      } else {
        createFloorTile(x * CELL_SIZE, floorY, z * CELL_SIZE);
        
        if (cell === TILE_TYPES.DOOR) {
          createDoor(x * CELL_SIZE, floorY, z * CELL_SIZE);
        }
        if (cell === TILE_TYPES.HIDE) {
          createHideSpot(x * CELL_SIZE, floorY, z * CELL_SIZE);
        }
      }
    }
  }
}
```

#### 1인칭 카메라 컨트롤
```javascript
class PlayerController {
  constructor(camera) {
    this.camera = camera;
    this.velocity = new THREE.Vector3();
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.speed = { walk: 2, run: 5, crouch: 1 };
    this.stamina = 100;
    this.isRunning = false;
    this.isCrouching = false;
    this.noiseLevel = 0;
  }

  update(deltaTime, input) {
    // 마우스 회전
    this.euler.y -= input.mouseDX * 0.002;
    this.euler.x -= input.mouseDY * 0.002;
    this.euler.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.euler.x));
    this.camera.quaternion.setFromEuler(this.euler);

    // 이동
    const direction = new THREE.Vector3();
    if (input.forward)  direction.z -= 1;
    if (input.backward) direction.z += 1;
    if (input.left)     direction.x -= 1;
    if (input.right)    direction.x += 1;
    direction.normalize();
    direction.applyQuaternion(this.camera.quaternion);
    direction.y = 0;

    // 속도 결정 & 소리
    let currentSpeed;
    if (this.isCrouching) {
      currentSpeed = this.speed.crouch;
      this.noiseLevel = 0;
    } else if (this.isRunning && this.stamina > 0) {
      currentSpeed = this.speed.run;
      this.stamina -= 20 * deltaTime;
      this.noiseLevel = 0.8;
    } else {
      currentSpeed = this.speed.walk;
      this.noiseLevel = 0.3;
    }

    // 스태미나 회복
    if (!this.isRunning) {
      this.stamina = Math.min(100, this.stamina + 10 * deltaTime);
    }

    this.camera.position.addScaledVector(direction, currentSpeed * deltaTime);
  }

  getNoiseInfo() {
    return {
      position: this.camera.position.clone(),
      noiseSource: this.camera.position.clone(),
      noiseLevel: this.noiseLevel
    };
  }
}
```

#### 3D 공간 오디오
```javascript
// Howler.js 공간 오디오 설정
const teacherFootsteps = new Howl({
  src: ['sounds/footsteps_heavy.mp3'],
  loop: true,
  volume: 0.8,
  pannerAttr: {
    panningModel: 'HRTF',
    distanceModel: 'inverse',
    refDistance: 1,
    maxDistance: 20,
    rolloffFactor: 1,
  }
});

// 매 프레임 선생님 위치로 업데이트
function updateTeacherAudio(teacherPos) {
  teacherFootsteps.pos(teacherPos.x, teacherPos.y, teacherPos.z);
}
```

### 3D 학교 구현 방식

#### 방법 1: 코드 기반 프로시저럴 생성 (추천 — MVP용)
- 박스 지오메트리로 벽/바닥/천장 구성
- MeshStandardMaterial + 텍스처로 학교 느낌
- 간단하지만 즉시 실행 가능

#### 방법 2: Blender 모델링 후 glTF 임포트
- 정교한 학교 모델 가능
- 교실 가구, 사물함 등 디테일
- 개발 시간 더 필요

#### 텍스처 & 머티리얼
```javascript
// 한국 학교 느낌 머티리얼
const materials = {
  wall:    new MeshStandardMaterial({ color: 0xE8E0D0, roughness: 0.9 }),  // 베이지 벽
  floor:   new MeshStandardMaterial({ color: 0x8B7355, roughness: 0.7 }),  // 갈색 타일
  ceiling: new MeshStandardMaterial({ color: 0xF5F5F0, roughness: 0.8 }),  // 흰 천장
  door:    new MeshStandardMaterial({ color: 0x654321, roughness: 0.6 }),  // 나무 문
  locker:  new MeshStandardMaterial({ color: 0x556B2F, metalness: 0.3 }),  // 초록 사물함
};
```

---

## 조명 설계

### 학교 야간 조명
```javascript
// 전체 앰비언트 — 매우 어둡게
const ambient = new THREE.AmbientLight(0x111122, 0.1);

// 형광등 — 특정 복도에만 (불안정하게 깜빡임)
function createFluorescent(x, y, z) {
  const light = new THREE.RectAreaLight(0xCCFFCC, 2, 1.2, 0.1);
  light.position.set(x, y, z);

  // 깜빡임 효과
  setInterval(() => {
    light.intensity = Math.random() > 0.1 ? 2 : 0;
  }, 100 + Math.random() * 200);

  return light;
}

// 비상등 — 복도 끝, 계단에 빨간 빛
const emergencyLight = new THREE.PointLight(0xFF2200, 0.5, 8);

// 플레이어 손전등
const flashlight = new THREE.SpotLight(0xFFFFDD, 1.5, 20, Math.PI / 6, 0.3);
flashlight.target = flashlightTarget;
```

### 분위기 연출
- 기본: 거의 칠흑 + 형광등 소수만 켜짐
- 선생님 접근 시: 가장 가까운 형광등 깜빡임 심화
- 특정 구역: 완전 암흑 (손전등 필수)
- 비상구 표시등: 초록색 약한 글로우

---

## 사운드 설계

### 사운드 목록
| 카테고리 | 사운드 | 용도 |
|---------|--------|------|
| 플레이어 | 걷기 발소리 (타일) | 이동 피드백 |
| 플레이어 | 달리기 발소리 | 이동 + 선생님 감지 |
| 플레이어 | 심장 박동 | 선생님 근접 시 |
| 플레이어 | 숨참기 | 은신 중 |
| 선생님 | 무거운 발소리 | 선생님 위치 힌트 (공간 오디오) |
| 선생님 | "거기 누구야!" | 의심 상태 진입 |
| 선생님 | "이리 와!" / "안 서?" | 추격 시작 |
| 선생님 | 열쇠 딸랑이 소리 | 순찰 중 위치 힌트 |
| 환경 | 형광등 지직거림 | 분위기 |
| 환경 | 문 삐걱/쾅 | 상호작용 + 랜덤 이벤트 |
| 환경 | 시계 초침 | 조용한 교실 분위기 |
| 환경 | 교내 방송 잡음 | 이벤트 연출 |
| BGM | 저음 앰비언스 드론 | 탐색 중 |
| BGM | 긴박한 추격 BGM | 추격 상태 |

### 오디오 구현 원칙
- 선생님 발소리/목소리: **반드시 3D 공간 오디오** — 방향과 거리 느껴져야 함
- BGM: 게임 상태(탐색/긴장/추격)에 따라 크로스페이드
- 모든 사운드는 Web Audio API 또는 Howler.js로 처리

---

## 개발 마일스톤

### Phase 1: 프로토타입 (1인칭 이동 + 맵)
- [ ] Three.js 기본 씬 셋업
- [ ] 1인칭 카메라 컨트롤러 (WASD + 마우스 포인터 락)
- [ ] 그리드 기반 맵 → 3D 벽/바닥 생성
- [ ] 1개 층 프로토타입 맵
- [ ] 충돌 처리 (벽 통과 방지)
- [ ] 기본 조명 (어두운 환경 + 손전등)

### Phase 2: 선생님 AI
- [ ] 선생님 3D 모델 (박스 기반이라도 OK)
- [ ] FSM 기반 AI (순찰 → 의심 → 추격 → 수색 → 복귀)
- [ ] 시야각 감지 시스템
- [ ] 청각 감지 시스템 (달리기/걷기 소리)
- [ ] 추격 시 경로 탐색 (A* 또는 NavMesh)
- [ ] 잡히면 게임오버

### Phase 3: 잠입 & 상호작용
- [ ] 웅크리기 (소리 감소)
- [ ] 달리기 & 스태미나 시스템
- [ ] 문 열기/닫기 (소리 발생)
- [ ] 은신 장소 시스템 (사물함, 교탁 아래)
- [ ] 아이템 줍기 & 인벤토리
- [ ] 열쇠 & 잠긴 문 시스템

### Phase 4: 완성도 & 연출
- [ ] 다층 맵 (1층~3층 + 지하)
- [ ] HUD UI (배터리, 스태미나, 심박수)
- [ ] 사운드 시스템 (3D 공간 오디오)
- [ ] 형광등 깜빡임, 분위기 연출
- [ ] 타이틀 화면, 게임오버 화면, 클리어 화면
- [ ] 퍼즐 요소 (비밀번호, 아이템 조합)

### Phase 5: 폴리시 & 확장
- [ ] 난이도 설정 (선생님 수, 감지 범위)
- [ ] CCTV 시스템
- [ ] 교내 방송 이벤트
- [ ] 점프 스케어 이벤트
- [ ] 저장/불러오기
- [ ] 추가 맵 (다른 학교 건물)
- [ ] 리더보드 (클리어 시간 기록)

---

## 게임 밸런스 상수

```javascript
const CONFIG = {
  // 플레이어
  WALK_SPEED: 2.0,
  RUN_SPEED: 5.0,
  CROUCH_SPEED: 1.0,
  STAMINA_MAX: 100,
  STAMINA_DRAIN: 20,        // /초
  STAMINA_RECOVER: 10,      // /초
  FLASHLIGHT_BATTERY_MAX: 100,
  FLASHLIGHT_DRAIN: 2,      // /초
  BATTERY_RECHARGE: 50,     // 건전지 1개당

  // 선생님
  TEACHER_PATROL_SPEED: 1.5,
  TEACHER_SUSPICIOUS_SPEED: 2.0,
  TEACHER_CHASE_SPEED: 4.5,
  TEACHER_SEARCH_SPEED: 2.5,
  TEACHER_FOV: Math.PI / 2,     // 90도
  TEACHER_VISION_RANGE: 15,
  TEACHER_HEARING_THRESHOLD: 0.05,
  TEACHER_SUSPICION_TIME: 5,     // 초
  TEACHER_SEARCH_TIME: 10,       // 초
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
  CELL_SIZE: 3,              // 미터
  WALL_HEIGHT: 3,            // 미터
  MAP_GRID_SIZE: 40,         // 40×40 그리드/층
};
```

---

## 코딩 컨벤션

### 일반
- **언어**: JavaScript (ES2020+), 필요 시 TypeScript
- **3D 엔진**: Three.js (r160+)
- **오디오**: Howler.js 또는 Web Audio API
- **모듈**: ES Modules
- **네이밍**: camelCase (변수), PascalCase (클래스), UPPER_SNAKE (상수)
- **주석**: 한국어 OK. AI 관련 로직에는 반드시 상세 주석

### 성능 원칙
- Frustum Culling 활용 (Three.js 기본 지원)
- 보이지 않는 방의 오브젝트는 렌더링에서 제외 (Room Culling)
- 선생님 AI 업데이트는 물리 틱 (30fps), 렌더링은 가변 프레임
- 텍스처 아틀라스 사용으로 draw call 최소화

### 분위기 최우선 원칙
> **모든 구현 결정에서 "이게 더 무섭나?"를 기준으로 판단한다.**
> 기술적 완성도보다 공포 분위기가 우선이다.

---

## 참고 자료
- 화이트데이: 학교라는 이름의 미궁 — 게임플레이 영상
- Three.js 공식 문서 & 예제
- Three.js PointerLockControls 예제 (1인칭 FPS)
- Howler.js 공간 오디오 문서
- A* Pathfinding 알고리즘
- [Red Blob Games — A* 가이드](https://www.redblobgames.com/pathfinding/a-star/)
- 한국 학교 건물 도면/사진 레퍼런스