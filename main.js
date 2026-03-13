import * as THREE from 'three';
import { InputManager } from './src/core/InputManager.js';
import { AudioManager } from './src/core/AudioManager.js';
import { MapGenerator } from './src/world/MapGenerator.js';
import { findSpawnPosition, FLOOR_MAPS, gridToWorld } from './src/world/SchoolMap.js';
import { Player } from './src/characters/Player.js';
import { Teacher } from './src/characters/Teacher.js';
import { CONFIG, GAME_STATE, TEACHER_STATE, DIFFICULTY } from './src/utils/Constants.js';

// ─── 게임 매니저 ────────────────────────────────────────
class Game {
  constructor() {
    this.state = GAME_STATE.TITLE;
    this.difficulty = DIFFICULTY.NORMAL;
    this.canvas = document.getElementById('game-canvas');

    // 모바일 감지
    this.isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || ('ontouchstart' in window && window.innerWidth < 1024);

    // Three.js 초기화 (모바일 성능 최적화 포함)
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !this.isMobile, // 모바일에서 AA 끄기
      powerPreference: this.isMobile ? 'low-power' : 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(this.isMobile ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isMobile; // 모바일에서 그림자 끄기
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.4; // 어둡게

    this.scene = null;
    this.camera = null;
    this.player = null;
    this.teachers = [];
    this.mapGen = null;
    this.input = new InputManager();
    this.audio = new AudioManager();

    this.clock = new THREE.Clock();
    this.isInventoryOpen = false;
    this.messageTimer = 0;
    this.messageText = '';
    this.heartbeatTimer = 0;
    this.randomEventTimer = 0;
    this.objectiveStage = 0; // 0: 교무실열쇠, 1: 정문열쇠, 2: 탈출

    // 은신 상태
    this.nearHideSpot = null;
    this.hideVignette = null;

    this._setupUI();
    this._bindInput();
    if (this.isMobile) this._setupMobileButtons();
    this._animate();
  }

  // ─── UI 연결 ──────────────────────────────
  _setupUI() {
    // 타이틀 버튼
    document.getElementById('btn-easy').onclick = () => this.startGame('EASY');
    document.getElementById('btn-normal').onclick = () => this.startGame('NORMAL');
    document.getElementById('btn-hard').onclick = () => this.startGame('HARD');

    // 게임오버 버튼
    document.getElementById('btn-retry').onclick = () => this.startGame(this._currentDifficultyKey);
    document.getElementById('btn-menu').onclick = () => this.showTitle();

    // 클리어 버튼
    document.getElementById('btn-clear-menu').onclick = () => this.showTitle();

    // 일시정지 버튼
    document.getElementById('btn-resume').onclick = () => this.resume();
    document.getElementById('btn-quit').onclick = () => this.showTitle();

    // 포인터 락
    document.getElementById('pointer-lock-overlay').onclick = () => {
      this.input.requestPointerLock(this.canvas);
      document.getElementById('pointer-lock-overlay').style.display = 'none';
    };

    // 윈도우 리사이즈
    window.addEventListener('resize', () => {
      if (this.camera) {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
      }
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  _bindInput() {
    this.input.onInteract = () => this._handleInteract();
    this.input.onFlashlight = () => {
      if (this.state === GAME_STATE.PLAYING && this.player) {
        this.player.toggleFlashlight();
      }
    };
    this.input.onInventory = () => {
      if (this.state === GAME_STATE.PLAYING || this.state === GAME_STATE.HIDING) {
        this._toggleInventory();
      }
    };
    this.input.onPause = () => {
      if (this.state === GAME_STATE.PLAYING) {
        this.pause();
      } else if (this.state === GAME_STATE.PAUSED) {
        this.resume();
      }
    };
    this.input.onCrouch = () => {
      if (this.state === GAME_STATE.PLAYING && this.player) {
        this.player.toggleCrouch();
      }
    };
    this.input.onUseItem = () => {
      if (this.state === GAME_STATE.PLAYING && this.player) {
        // Q키로 첫 번째 사용 가능한 아이템 사용
        for (let i = 0; i < this.player.inventory.length; i++) {
          const result = this.player.useItem(i);
          if (result) {
            this._handleItemUse(result);
            break;
          }
        }
      }
    };

    // 데스크탑 전용: 포인터 락 처리
    if (!this.isMobile) {
      document.addEventListener('pointerlockchange', () => {
        if (!document.pointerLockElement && this.state === GAME_STATE.PLAYING) {
          document.getElementById('pointer-lock-overlay').style.display = 'flex';
        }
      });

      this.canvas.addEventListener('click', () => {
        if (this.state === GAME_STATE.PLAYING && !document.pointerLockElement) {
          this.input.requestPointerLock(this.canvas);
          document.getElementById('pointer-lock-overlay').style.display = 'none';
        }
      });
    }
  }

  // ─── 모바일 버튼 연결 ──────────────────────────
  _setupMobileButtons() {
    const btn = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); fn(); }, { passive: false });
    };

    btn('mbtn-interact', () => this.input.triggerInteract());
    btn('mbtn-flashlight', () => this.input.triggerFlashlight());
    btn('mbtn-crouch', () => this.input.triggerCrouch());
    btn('mbtn-inventory', () => this.input.triggerInventory());
    btn('mbtn-pause', () => this.input.triggerPause());
    btn('mbtn-useitem', () => this.input.triggerUseItem());
  }

  // ─── 게임 시작 ──────────────────────────────
  startGame(difficultyKey) {
    this._currentDifficultyKey = difficultyKey;
    this.difficulty = DIFFICULTY[difficultyKey];

    // 오디오 초기화
    this.audio.init();
    this.audio.stopAll();

    // 씬 초기화
    if (this.scene) {
      this.scene.clear();
    }
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050510);
    this.scene.fog = new THREE.FogExp2(0x050510, this.isMobile ? 0.06 : 0.04);

    // 카메라
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);

    // 앰비언트 라이트 (매우 어둡게)
    const ambient = new THREE.AmbientLight(0x111122, 0.15);
    this.scene.add(ambient);

    // 맵 생성
    this.mapGen = new MapGenerator(this.scene);
    this.mapGen.generateAllFloors();

    // 플레이어 생성
    this.player = new Player(this.camera, this.scene);
    const spawn = findSpawnPosition();
    this.player.spawn(spawn);

    // 선생님 생성
    this.teachers = [];
    let teacherCount = this.difficulty.teacherCount;
    const floors = Object.keys(FLOOR_MAPS);

    for (let i = 0; i < teacherCount; i++) {
      const floorIdx = Math.min(i, floors.length - 1);
      const floorNum = parseInt(floors[floorIdx]);
      const map = FLOOR_MAPS[floorNum];
      const spawnData = map.teacherSpawns[0];
      if (spawnData) {
        const spawnPos = gridToWorld(spawnData.gridX, spawnData.gridZ, floorNum);
        const teacher = new Teacher(this.scene, i, floorNum, spawnPos, this.difficulty);
        this.teachers.push(teacher);
      }
    }

    // 상태 초기화
    this.objectiveStage = 0;
    this.isInventoryOpen = false;
    this.randomEventTimer = 0;
    this.heartbeatTimer = 0;

    // UI 전환
    document.getElementById('title-screen').style.display = 'none';
    document.getElementById('gameover-screen').style.display = 'none';
    document.getElementById('clear-screen').style.display = 'none';
    document.getElementById('pause-screen').style.display = 'none';
    document.getElementById('inventory-screen').style.display = 'none';
    document.getElementById('hud').style.display = 'block';

    if (this.isMobile) {
      // 모바일: 포인터 락 불필요, 바로 시작
      document.getElementById('pointer-lock-overlay').style.display = 'none';
      document.getElementById('mobile-controls').style.display = 'block';
      this.input.isPointerLocked = true;
    } else {
      document.getElementById('pointer-lock-overlay').style.display = 'flex';
      document.getElementById('mobile-controls').style.display = 'none';
    }

    this.state = GAME_STATE.PLAYING;

    // BGM 시작
    this.audio.startAmbientDrone();

    this._updateObjectiveDisplay();
    this._showMessage('야자 시간... 교실을 빠져나와 학교 밖으로 탈출하라.');
  }

  // ─── 메인 루프 ──────────────────────────────
  _animate() {
    requestAnimationFrame(() => this._animate());

    const deltaTime = Math.min(this.clock.getDelta(), 0.05);

    if (this.state === GAME_STATE.PLAYING || this.state === GAME_STATE.HIDING) {
      this._update(deltaTime);
    }

    if (this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  _update(deltaTime) {
    if (!this.player || !this.mapGen) return;

    // 플레이어 업데이트
    const playerResult = this.player.update(deltaTime, this.input, this.mapGen.colliders);
    if (playerResult === 'footstep') {
      this.audio.playFootstep(this.player.noiseLevel, false);
    }

    // 선생님 AI 업데이트
    const playerInfo = this.player.getNoiseInfo();
    const teacherPositions = [];
    let isBeingChased = false;
    let closestTeacherDist = Infinity;

    for (const teacher of this.teachers) {
      const result = teacher.update(deltaTime, playerInfo, this.mapGen.colliders);
      teacherPositions.push(teacher.getPosition());

      // 선생님과의 거리
      const dist = teacher.position.distanceTo(this.player.position);
      if (dist < closestTeacherDist) closestTeacherDist = dist;

      if (result === 'CAUGHT') {
        this.gameOver();
        return;
      }

      if (result === 'FOOTSTEP') {
        this.audio.playFootstep(0.5, true);
      }

      // 상태 전환 사운드
      if (result === `STATE_${TEACHER_STATE.CHASE}`) {
        this.audio.playAlert();
        this.audio.stopAmbientDrone();
        this.audio.startChaseBGM();
        this.player.detectionCount++;
        this._showMessage('⚠ 발견되었다! 도망쳐!');
      } else if (result === `STATE_${TEACHER_STATE.SUSPICIOUS}`) {
        this.audio.playAlert();
      } else if (result === `STATE_${TEACHER_STATE.RETURN}` || result === `STATE_${TEACHER_STATE.PATROL}`) {
        this.audio.stopChaseBGM();
        this.audio.startAmbientDrone();
      }

      if (teacher.state === TEACHER_STATE.CHASE) {
        isBeingChased = true;
      }
    }

    // 형광등 업데이트
    this.mapGen.updateLights(deltaTime, teacherPositions);

    // 아이템 애니메이션
    this.mapGen.updateItems(deltaTime);

    // 심장 박동 (선생님 거리 비례)
    this._updateHeartbeat(deltaTime, closestTeacherDist);

    // 선생님 경고
    this._updateTeacherWarning(closestTeacherDist, isBeingChased);

    // 상호작용 가능 객체 탐지
    this._checkInteractables();

    // 계단 자동 감지
    this._checkStairs();

    // 탈출 감지
    this._checkExit();

    // 랜덤 이벤트
    this._updateRandomEvents(deltaTime);

    // HUD 업데이트
    this._updateHUD();

    // 메시지 타이머
    if (this.messageTimer > 0) {
      this.messageTimer -= deltaTime;
      if (this.messageTimer <= 0) {
        this.messageText = '';
      }
    }
  }

  // ─── 상호작용 처리 ──────────────────────────
  _handleInteract() {
    if (this.state === GAME_STATE.HIDING) {
      // 은신 해제
      this.player.exitHiding();
      this.state = GAME_STATE.PLAYING;
      this._removeHidingVignette();
      this._showMessage('은신 해제');
      return;
    }

    if (this.state !== GAME_STATE.PLAYING) return;

    const pos = this.player.position;

    // 아이템 줍기
    for (const item of this.mapGen.items) {
      if (item.collected) continue;
      if (item.floor !== this.player.currentFloor) continue;
      const dist = pos.distanceTo(item.position);
      if (dist < 3) {
        if (this.player.addItem(item)) {
          this.mapGen.collectItem(item);
          this.audio.playPickup();
          this._showMessage(`${item.icon} ${item.name}을(를) 획득했다!`);
          this._checkObjectiveProgress();
          return;
        } else {
          this._showMessage('인벤토리가 가득 찼다!');
          return;
        }
      }
    }

    // 문 열기
    for (const door of this.mapGen.doors) {
      if (door.isOpen) continue;
      if (door.floor !== this.player.currentFloor) continue;
      const dist = pos.distanceTo(door.position);
      if (dist < 3.5) {
        if (door.locked) {
          if (door.keyRequired && this.player.hasKey(door.keyRequired)) {
            this.mapGen.openDoor(door);
            this.audio.playDoorOpen();
            this._showMessage('문을 열었다!');

            // 출구 문이면 탈출 가능
            if (door.isExit) {
              this._showMessage('정문이 열렸다! 빠져나가자!');
            }
            return;
          } else {
            this._showMessage('잠겨있다... 열쇠가 필요하다.');
            return;
          }
        } else {
          this.mapGen.openDoor(door);
          this.audio.playDoorOpen();
          // 문 열기 소리는 선생님에게 감지됨
          return;
        }
      }
    }

    // 은신
    for (const hs of this.mapGen.hideSpots) {
      if (hs.floor !== this.player.currentFloor) continue;
      const dist = pos.distanceTo(hs.position);
      if (dist < 3) {
        this.player.enterHiding();
        this.state = GAME_STATE.HIDING;
        this._addHidingVignette();
        this._showMessage('숨었다... [E]로 나오기');
        return;
      }
    }
  }

  _handleItemUse(result) {
    if (result.type === 'decoy') {
      // 디코이: 선생님들에게 소리 유인
      for (const teacher of this.teachers) {
        if (teacher.floor === this.player.currentFloor) {
          teacher.reactToDecoy(result.position);
        }
      }
    }
    this._showMessage(result.message);
    this.audio.playPickup();
  }

  // ─── 상호작용 가능 객체 감지 ──────────────────
  _checkInteractables() {
    const pos = this.player.position;
    let prompt = null;

    // 아이템
    for (const item of this.mapGen.items) {
      if (item.collected || item.floor !== this.player.currentFloor) continue;
      if (pos.distanceTo(item.position) < 3) {
        prompt = `${item.icon} ${item.name} 줍기`;
        break;
      }
    }

    // 문
    if (!prompt) {
      for (const door of this.mapGen.doors) {
        if (door.isOpen || door.floor !== this.player.currentFloor) continue;
        if (pos.distanceTo(door.position) < 3.5) {
          if (door.locked) {
            const keyName = door.keyRequired === 'office_key' ? '교무실 열쇠' :
                           door.keyRequired === 'gate_key' ? '정문 열쇠' : '열쇠';
            prompt = this.player.hasKey(door.keyRequired)
              ? `🔓 문 열기 (${keyName})`
              : `🔒 잠김 (${keyName} 필요)`;
          } else {
            prompt = '🚪 문 열기';
          }
          break;
        }
      }
    }

    // 은신 장소
    if (!prompt && this.state !== GAME_STATE.HIDING) {
      for (const hs of this.mapGen.hideSpots) {
        if (hs.floor !== this.player.currentFloor) continue;
        if (pos.distanceTo(hs.position) < 3) {
          prompt = '🫣 숨기';
          break;
        }
      }
    }

    // 은신 중일 때
    if (this.state === GAME_STATE.HIDING) {
      prompt = '나오기';
    }

    const promptEl = document.getElementById('interaction-prompt');
    if (prompt) {
      promptEl.style.display = 'block';
      document.getElementById('interaction-text').textContent = prompt;
    } else {
      promptEl.style.display = 'none';
    }
  }

  // ─── 계단 감지 ──────────────────────────────
  _checkStairs() {
    const pos = this.player.position;

    // 올라가는 계단
    for (const stair of this.mapGen.stairsUp) {
      if (stair.floor !== this.player.currentFloor) continue;
      const dist = Math.sqrt(
        (pos.x - stair.position.x) ** 2 + (pos.z - stair.position.z) ** 2
      );
      if (dist < 2) {
        if (FLOOR_MAPS[stair.targetFloor]) {
          this.player.changeFloor(stair.targetFloor, stair.position);
          this._showMessage(`${FLOOR_MAPS[stair.targetFloor].name}으로 올라갔다`);
          // 철제 계단 소리 (더 시끄러움)
          this.audio.playFootstep(0.8, true);
        }
        return;
      }
    }

    // 내려가는 계단
    for (const stair of this.mapGen.stairsDown) {
      if (stair.floor !== this.player.currentFloor) continue;
      const dist = Math.sqrt(
        (pos.x - stair.position.x) ** 2 + (pos.z - stair.position.z) ** 2
      );
      if (dist < 2) {
        if (FLOOR_MAPS[stair.targetFloor]) {
          this.player.changeFloor(stair.targetFloor, stair.position);
          this._showMessage(`${FLOOR_MAPS[stair.targetFloor].name}으로 내려갔다`);
          this.audio.playFootstep(0.8, true);
        }
        return;
      }
    }
  }

  // ─── 탈출 감지 ──────────────────────────────
  _checkExit() {
    if (!this.mapGen.exitPosition) return;
    if (this.player.currentFloor !== 0) return;

    const dist = this.player.position.distanceTo(this.mapGen.exitPosition);

    // 정문에 도착하면 — 열쇠로 문이 열려있어야 함
    const exitDoor = this.mapGen.doors.find(d => d.isExit);
    if (exitDoor && exitDoor.isOpen && dist < 3) {
      this.gameClear();
    }
  }

  // ─── 목표 진행 ──────────────────────────────
  _checkObjectiveProgress() {
    if (this.objectiveStage === 0 && this.player.hasKey('office_key')) {
      this.objectiveStage = 1;
      this._showMessage('교무실 열쇠를 찾았다! 2층 교무실로 가자.');
    }
    if (this.objectiveStage === 1 && this.player.hasKey('gate_key')) {
      this.objectiveStage = 2;
      this._showMessage('정문 열쇠를 찾았다! 1층 정문으로 가자!');
    }
    this._updateObjectiveDisplay();
  }

  _updateObjectiveDisplay() {
    const el = document.getElementById('objective-text');
    switch (this.objectiveStage) {
      case 0:
        el.textContent = '목표: 3층에서 교무실 열쇠를 찾아라';
        break;
      case 1:
        el.textContent = '목표: 2층 교무실에서 정문 열쇠를 찾아라';
        break;
      case 2:
        el.textContent = '목표: 1층 정문으로 탈출하라!';
        break;
    }
  }

  // ─── 심장 박동 ──────────────────────────────
  _updateHeartbeat(deltaTime, closestDist) {
    const container = document.getElementById('heartbeat-container');
    const heartEl = document.getElementById('heartbeat');

    if (closestDist < 15) {
      const intensity = 1 - (closestDist / 15);
      container.style.opacity = intensity;

      this.heartbeatTimer += deltaTime;
      const interval = 1.5 - intensity * 1.0; // 가까울수록 빠르게
      if (this.heartbeatTimer >= interval) {
        this.heartbeatTimer = 0;
        this.audio.playHeartbeat(intensity);
      }

      // 하트 개수 표시
      const hearts = Math.ceil(intensity * 4);
      heartEl.textContent = '♥'.repeat(hearts);
      heartEl.style.animationDuration = `${interval}s`;
    } else {
      container.style.opacity = 0;
    }
  }

  // ─── 선생님 경고 ──────────────────────────────
  _updateTeacherWarning(dist, isChased) {
    const warning = document.getElementById('teacher-warning');
    if (isChased) {
      warning.style.display = 'block';
      warning.querySelector('span').textContent = '⚠ 추격당하고 있다! 도망쳐!';
    } else if (dist < 10) {
      warning.style.display = 'block';
      warning.querySelector('span').textContent = '⚠ 선생님이 근처에 있다...';
    } else {
      warning.style.display = 'none';
    }
  }

  // ─── 랜덤 이벤트 ─────────────────────────────
  _updateRandomEvents(deltaTime) {
    this.randomEventTimer += deltaTime;

    // 15~30초마다 랜덤 이벤트
    if (this.randomEventTimer > 15 + Math.random() * 15) {
      this.randomEventTimer = 0;

      const events = [
        () => { this.audio.playDoorSlam(); this._showMessage('...쾅! (어디선가 문 닫히는 소리)'); },
        () => { this.audio.playFlicker(); },
        () => { /* 조용한 순간 */ },
      ];

      const event = events[Math.floor(Math.random() * events.length)];
      event();
    }
  }

  // ─── HUD 업데이트 ─────────────────────────────
  _updateHUD() {
    if (!this.player) return;

    // 배터리
    const batteryBar = document.getElementById('battery-bar');
    const batteryPct = (this.player.battery / CONFIG.FLASHLIGHT_BATTERY_MAX) * 100;
    batteryBar.style.width = `${batteryPct}%`;
    if (batteryPct < 20) {
      batteryBar.style.background = 'linear-gradient(90deg, #ff2200, #ff4400)';
    } else {
      batteryBar.style.background = 'linear-gradient(90deg, #ffaa00, #ffdd00)';
    }

    // 스태미나
    const staminaBar = document.getElementById('stamina-bar');
    const staminaPct = (this.player.stamina / CONFIG.STAMINA_MAX) * 100;
    staminaBar.style.width = `${staminaPct}%`;

    // 인벤토리 힌트
    const invHint = document.getElementById('inventory-hint');
    invHint.textContent = `[Tab] 인벤토리 (${this.player.inventory.length}/${CONFIG.INVENTORY_MAX})`;
  }

  // ─── 인벤토리 ─────────────────────────────
  _toggleInventory() {
    this.isInventoryOpen = !this.isInventoryOpen;
    const screen = document.getElementById('inventory-screen');

    if (this.isInventoryOpen) {
      screen.style.display = 'block';
      this._renderInventory();
    } else {
      screen.style.display = 'none';
    }
  }

  _renderInventory() {
    const slots = document.getElementById('inventory-slots');
    slots.innerHTML = '';

    for (let i = 0; i < CONFIG.INVENTORY_MAX; i++) {
      const slot = document.createElement('div');
      slot.className = 'inv-slot';

      if (i < this.player.inventory.length) {
        const item = this.player.inventory[i];
        slot.innerHTML = `<span class="item-icon">${item.icon}</span><span class="item-name">${item.name}</span>`;
        slot.title = item.description;
        slot.onclick = () => {
          const result = this.player.useItem(i);
          if (result) {
            this._handleItemUse(result);
            this._renderInventory();
          }
        };
      } else {
        slot.textContent = '비어있음';
      }

      slots.appendChild(slot);
    }
  }

  // ─── 은신 비네팅 ─────────────────────────────
  _addHidingVignette() {
    if (this.hideVignette) return;
    this.hideVignette = document.createElement('div');
    this.hideVignette.className = 'hiding-vignette';
    document.body.appendChild(this.hideVignette);
  }

  _removeHidingVignette() {
    if (this.hideVignette) {
      this.hideVignette.remove();
      this.hideVignette = null;
    }
  }

  // ─── 메시지 표시 ─────────────────────────────
  _showMessage(text) {
    this.messageText = text;
    this.messageTimer = 3;

    // 간단하게 HUD 위에 메시지 표시
    let msgEl = document.getElementById('game-message');
    if (!msgEl) {
      msgEl = document.createElement('div');
      msgEl.id = 'game-message';
      msgEl.style.cssText = `
        position: fixed; bottom: 150px; left: 50%; transform: translateX(-50%);
        background: rgba(0,0,0,0.7); color: #fff; padding: 10px 24px;
        border-radius: 6px; font-size: 1rem; z-index: 15;
        border: 1px solid rgba(255,255,255,0.15);
        pointer-events: none; transition: opacity 0.5s;
      `;
      document.body.appendChild(msgEl);
    }
    msgEl.textContent = text;
    msgEl.style.opacity = '1';

    setTimeout(() => {
      msgEl.style.opacity = '0';
    }, 2500);
  }

  // ─── 게임 상태 전환 ─────────────────────────
  pause() {
    this.state = GAME_STATE.PAUSED;
    document.getElementById('pause-screen').style.display = 'block';
    document.getElementById('mobile-controls').style.display = 'none';
    if (!this.isMobile) document.exitPointerLock();
  }

  resume() {
    this.state = GAME_STATE.PLAYING;
    document.getElementById('pause-screen').style.display = 'none';
    if (this.isMobile) {
      document.getElementById('mobile-controls').style.display = 'block';
      this.input.isPointerLocked = true;
    } else {
      this.input.requestPointerLock(this.canvas);
    }
  }

  gameOver() {
    this.state = GAME_STATE.GAMEOVER;
    this.audio.stopAll();
    this.audio.playGameOver();
    if (!this.isMobile) document.exitPointerLock();
    document.getElementById('mobile-controls').style.display = 'none';

    this._removeHidingVignette();

    // 화면 흔들림 효과
    this.canvas.classList.add('screen-shake');
    setTimeout(() => this.canvas.classList.remove('screen-shake'), 300);

    // 빨간 플래시
    const flash = document.createElement('div');
    flash.className = 'damage-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);

    setTimeout(() => {
      document.getElementById('hud').style.display = 'none';
      const stats = this.player.getStats();
      document.getElementById('gameover-subtitle').textContent =
        `생존 시간: ${stats.time} | 발각 횟수: ${stats.detections}`;
      document.getElementById('gameover-screen').style.display = 'flex';
    }, 800);
  }

  gameClear() {
    this.state = GAME_STATE.CLEAR;
    this.audio.stopAll();
    this.audio.playClear();
    if (!this.isMobile) document.exitPointerLock();
    document.getElementById('mobile-controls').style.display = 'none';

    this._removeHidingVignette();

    document.getElementById('hud').style.display = 'none';
    const stats = this.player.getStats();
    document.getElementById('clear-stats').innerHTML = `
      <p>탈출 시간: ${stats.time}</p>
      <p>발각 횟수: ${stats.detections}</p>
      <p>난이도: ${this.difficulty.name}</p>
    `;
    document.getElementById('clear-screen').style.display = 'flex';
  }

  showTitle() {
    this.state = GAME_STATE.TITLE;
    this.audio.stopAll();
    if (!this.isMobile) document.exitPointerLock();
    document.getElementById('mobile-controls').style.display = 'none';

    this._removeHidingVignette();

    document.getElementById('hud').style.display = 'none';
    document.getElementById('gameover-screen').style.display = 'none';
    document.getElementById('clear-screen').style.display = 'none';
    document.getElementById('pause-screen').style.display = 'none';
    document.getElementById('inventory-screen').style.display = 'none';
    document.getElementById('title-screen').style.display = 'flex';

    // 씬 정리
    if (this.scene) {
      this.teachers.forEach(t => t.destroy());
      this.teachers = [];
      this.scene.clear();
      this.scene = null;
    }
  }
}

// ─── 게임 실행 ────────────────────────────────
const game = new Game();
