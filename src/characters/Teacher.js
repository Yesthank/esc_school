import * as THREE from 'three';
import { CONFIG, TEACHER_STATE } from '../utils/Constants.js';
import { worldToGrid, isWalkable, generatePatrolPath } from '../world/SchoolMap.js';

// 선생님 AI — 유한 상태 기계 (FSM)
export class Teacher {
  constructor(scene, id, floor, spawnPos, difficulty) {
    this.scene = scene;
    this.id = id;
    this.floor = floor;
    this.difficulty = difficulty;

    // 위치 & 이동
    this.position = new THREE.Vector3(spawnPos.x, floor * CONFIG.WALL_HEIGHT + CONFIG.PLAYER_HEIGHT, spawnPos.z);
    this.rotation = 0;
    this.speed = CONFIG.TEACHER_PATROL_SPEED * difficulty.teacherSpeedMultiplier;

    // FSM 상태
    this.state = TEACHER_STATE.PATROL;
    this.lastKnownPlayerPos = null;
    this.suspicionTimer = 0;
    this.searchTimer = 0;

    // 순찰
    this.patrolPath = generatePatrolPath(floor);
    this.patrolIndex = 0;
    this.currentTarget = null;

    // 시야 & 청각
    this.fov = CONFIG.TEACHER_FOV * difficulty.visionMultiplier;
    this.visionRange = CONFIG.TEACHER_VISION_RANGE * difficulty.visionMultiplier;

    // 3D 모델 (박스 기반)
    this._createModel();

    // 디코이 추적
    this.decoyTarget = null;
    this.decoyTimer = 0;

    // 발걸음 타이머
    this.footstepTimer = 0;

    if (this.patrolPath.length > 0) {
      this.currentTarget = this.patrolPath[0];
    }
  }

  _createModel() {
    const group = new THREE.Group();

    // 몸통
    const bodyGeo = new THREE.BoxGeometry(0.6, 1.4, 0.4);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.7;
    group.add(body);

    // 머리
    const headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xDEB887 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.6;
    group.add(head);

    // 다리
    for (let i = -1; i <= 1; i += 2) {
      const legGeo = new THREE.BoxGeometry(0.2, 0.8, 0.25);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(i * 0.15, -0.1, 0);
      group.add(leg);
    }

    // 눈 (빨간색 — 공포 요소)
    for (let i = -1; i <= 1; i += 2) {
      const eyeGeo = new THREE.SphereGeometry(0.04, 6, 6);
      const eyeMat = new THREE.MeshStandardMaterial({
        color: 0xFF0000,
        emissive: 0xFF0000,
        emissiveIntensity: 0.8,
      });
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(i * 0.08, 1.65, 0.18);
      group.add(eye);
    }

    group.position.copy(this.position);
    group.castShadow = true;

    this.model = group;
    this.scene.add(group);

    // 선생님 주변 빛 (약한 빨간빛 — 분위기)
    this.auraLight = new THREE.PointLight(0xFF2200, 0.3, 8);
    this.auraLight.position.copy(this.position);
    this.auraLight.position.y += 1;
    this.scene.add(this.auraLight);
  }

  update(deltaTime, playerInfo, colliders) {
    const prevState = this.state;

    switch (this.state) {
      case TEACHER_STATE.PATROL:
        this._patrol(deltaTime);
        if (this._canSeePlayer(playerInfo)) {
          this.state = TEACHER_STATE.CHASE;
          this.lastKnownPlayerPos = playerInfo.position.clone();
        } else if (this._canHearPlayer(playerInfo)) {
          this.lastKnownPlayerPos = playerInfo.noiseSource.clone();
          this.state = TEACHER_STATE.SUSPICIOUS;
          this.suspicionTimer = 0;
        }
        this.speed = CONFIG.TEACHER_PATROL_SPEED * this.difficulty.teacherSpeedMultiplier;
        break;

      case TEACHER_STATE.SUSPICIOUS:
        if (this.lastKnownPlayerPos) {
          this._moveToward(this.lastKnownPlayerPos, deltaTime);
        }
        this.suspicionTimer += deltaTime;
        if (this._canSeePlayer(playerInfo)) {
          this.state = TEACHER_STATE.CHASE;
          this.lastKnownPlayerPos = playerInfo.position.clone();
        } else if (this.suspicionTimer > CONFIG.TEACHER_SUSPICION_TIME) {
          this.suspicionTimer = 0;
          this.state = TEACHER_STATE.RETURN;
        }
        this.speed = CONFIG.TEACHER_SUSPICIOUS_SPEED * this.difficulty.teacherSpeedMultiplier;
        break;

      case TEACHER_STATE.CHASE:
        this._moveToward(playerInfo.position, deltaTime);
        this.lastKnownPlayerPos = playerInfo.position.clone();

        if (this._distanceTo(playerInfo.position) < CONFIG.TEACHER_CATCH_DISTANCE) {
          return 'CAUGHT'; // 게임오버
        }

        if (!this._canSeePlayer(playerInfo)) {
          this.lastKnownPlayerPos = playerInfo.position.clone();
          this.state = TEACHER_STATE.SEARCH;
          this.searchTimer = 0;
        }
        this.speed = CONFIG.TEACHER_CHASE_SPEED * this.difficulty.teacherSpeedMultiplier;
        break;

      case TEACHER_STATE.SEARCH:
        if (this.lastKnownPlayerPos) {
          this._searchAround(this.lastKnownPlayerPos, deltaTime);
        }
        this.searchTimer += deltaTime;
        if (this._canSeePlayer(playerInfo)) {
          this.state = TEACHER_STATE.CHASE;
          this.lastKnownPlayerPos = playerInfo.position.clone();
        } else if (this.searchTimer > CONFIG.TEACHER_SEARCH_TIME) {
          this.searchTimer = 0;
          this.state = TEACHER_STATE.RETURN;
        }
        this.speed = CONFIG.TEACHER_SEARCH_SPEED * this.difficulty.teacherSpeedMultiplier;
        break;

      case TEACHER_STATE.RETURN:
        const nearestPatrol = this._getNearestPatrolPoint();
        if (nearestPatrol) {
          this._moveToward(nearestPatrol, deltaTime);
          if (this._distanceTo(nearestPatrol) < 1) {
            this.state = TEACHER_STATE.PATROL;
            this.patrolIndex = this.patrolPath.indexOf(nearestPatrol);
          }
        } else {
          this.state = TEACHER_STATE.PATROL;
        }

        if (this._canSeePlayer(playerInfo)) {
          this.state = TEACHER_STATE.CHASE;
          this.lastKnownPlayerPos = playerInfo.position.clone();
        } else if (this._canHearPlayer(playerInfo)) {
          this.lastKnownPlayerPos = playerInfo.noiseSource.clone();
          this.state = TEACHER_STATE.SUSPICIOUS;
          this.suspicionTimer = 0;
        }
        this.speed = CONFIG.TEACHER_PATROL_SPEED * this.difficulty.teacherSpeedMultiplier;
        break;
    }

    // 디코이 대응
    if (this.decoyTarget) {
      this.decoyTimer += deltaTime;
      this.lastKnownPlayerPos = this.decoyTarget.clone();
      if (this.state !== TEACHER_STATE.CHASE) {
        this.state = TEACHER_STATE.SUSPICIOUS;
      }
      if (this.decoyTimer > 5) {
        this.decoyTarget = null;
        this.decoyTimer = 0;
      }
    }

    // 모델 업데이트
    this.model.position.copy(this.position);
    this.model.rotation.y = this.rotation;
    this.auraLight.position.copy(this.position);
    this.auraLight.position.y += 1;

    // 추격 시 아우라 강화
    if (this.state === TEACHER_STATE.CHASE) {
      this.auraLight.intensity = 0.6;
      this.auraLight.color.setHex(0xFF0000);
    } else if (this.state === TEACHER_STATE.SUSPICIOUS || this.state === TEACHER_STATE.SEARCH) {
      this.auraLight.intensity = 0.4;
      this.auraLight.color.setHex(0xFF4400);
    } else {
      this.auraLight.intensity = 0.2;
      this.auraLight.color.setHex(0xFF2200);
    }

    // 발걸음
    this.footstepTimer += deltaTime;
    const footstepInterval = this.state === TEACHER_STATE.CHASE ? 0.25 : 0.5;
    if (this.footstepTimer >= footstepInterval) {
      this.footstepTimer = 0;
      return prevState !== this.state ? `STATE_${this.state}` : 'FOOTSTEP';
    }

    return prevState !== this.state ? `STATE_${this.state}` : null;
  }

  _patrol(deltaTime) {
    if (this.patrolPath.length === 0) return;

    if (!this.currentTarget) {
      this.currentTarget = this.patrolPath[this.patrolIndex];
    }

    this._moveToward(this.currentTarget, deltaTime);

    if (this._distanceTo(this.currentTarget) < 1) {
      this.patrolIndex = (this.patrolIndex + 1) % this.patrolPath.length;
      this.currentTarget = this.patrolPath[this.patrolIndex];
    }
  }

  _moveToward(target, deltaTime) {
    const dir = new THREE.Vector3();
    dir.x = target.x - this.position.x;
    dir.z = target.z - this.position.z;

    const dist = Math.sqrt(dir.x * dir.x + dir.z * dir.z);
    if (dist < 0.1) return;

    dir.x /= dist;
    dir.z /= dist;

    // 간단한 벽 회피
    const nextX = this.position.x + dir.x * this.speed * deltaTime;
    const nextZ = this.position.z + dir.z * this.speed * deltaTime;

    const gridNext = worldToGrid(nextX, nextZ);
    if (isWalkable(this.floor, gridNext.gridX, gridNext.gridZ)) {
      this.position.x = nextX;
      this.position.z = nextZ;
    } else {
      // 벽에 부딪히면 좌/우로 우회 시도
      const perpX = this.position.x + dir.z * this.speed * deltaTime;
      const perpZ = this.position.z - dir.x * this.speed * deltaTime;
      const gridPerp = worldToGrid(perpX, perpZ);
      if (isWalkable(this.floor, gridPerp.gridX, gridPerp.gridZ)) {
        this.position.x = perpX;
        this.position.z = perpZ;
      }
    }

    // 회전 (목표 방향을 바라봄)
    this.rotation = Math.atan2(dir.x, dir.z);
  }

  _searchAround(center, deltaTime) {
    // 마지막으로 플레이어를 본 위치 주변을 원형으로 탐색
    const time = this.searchTimer;
    const radius = 3;
    const target = new THREE.Vector3(
      center.x + Math.cos(time * 1.5) * radius,
      center.y,
      center.z + Math.sin(time * 1.5) * radius,
    );
    this._moveToward(target, deltaTime);
  }

  _canSeePlayer(playerInfo) {
    // 은신 중이면 감지 안됨 (같은 방에서 오래 수색하지 않는 한)
    if (playerInfo.isHiding) return false;

    // 다른 층이면 감지 안됨
    if (playerInfo.floor !== this.floor) return false;

    const dirToPlayer = new THREE.Vector3();
    dirToPlayer.subVectors(playerInfo.position, this.position);
    dirToPlayer.y = 0;

    const distance = dirToPlayer.length();
    if (distance > this.visionRange) return false;

    dirToPlayer.normalize();

    // 전방 벡터
    const forward = new THREE.Vector3(Math.sin(this.rotation), 0, Math.cos(this.rotation));
    const angle = forward.angleTo(dirToPlayer);

    if (angle > this.fov / 2) return false;

    // 손전등이 켜져 있으면 더 멀리서 감지
    if (playerInfo.flashlightOn && distance < this.visionRange * 1.5) {
      return true;
    }

    // 간단한 레이캐스트 (벽 가림 체크)
    return !this._isBlockedByWall(playerInfo.position);
  }

  _canHearPlayer(playerInfo) {
    if (playerInfo.floor !== this.floor) return false;
    if (playerInfo.noiseLevel <= 0) return false;

    const distance = this._distanceTo(playerInfo.position);
    if (distance < 0.5) return true;

    const effectiveNoise = playerInfo.noiseLevel / distance;
    return effectiveNoise > CONFIG.TEACHER_HEARING_THRESHOLD;
  }

  _isBlockedByWall(targetPos) {
    // 간단한 레이 마치 — 직선 경로에 벽이 있는지 확인
    const steps = 10;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const checkX = this.position.x + (targetPos.x - this.position.x) * t;
      const checkZ = this.position.z + (targetPos.z - this.position.z) * t;
      const grid = worldToGrid(checkX, checkZ);
      if (!isWalkable(this.floor, grid.gridX, grid.gridZ)) {
        return true;
      }
    }
    return false;
  }

  _distanceTo(target) {
    const dx = this.position.x - target.x;
    const dz = this.position.z - target.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  _getNearestPatrolPoint() {
    let nearest = null;
    let minDist = Infinity;
    for (const point of this.patrolPath) {
      const dist = this._distanceTo(point);
      if (dist < minDist) {
        minDist = dist;
        nearest = point;
      }
    }
    return nearest;
  }

  // 디코이에 반응
  reactToDecoy(position) {
    this.decoyTarget = position.clone();
    this.decoyTimer = 0;
    this.state = TEACHER_STATE.SUSPICIOUS;
    this.lastKnownPlayerPos = position.clone();
  }

  getPosition() {
    return this.position.clone();
  }

  destroy() {
    this.scene.remove(this.model);
    this.scene.remove(this.auraLight);
  }
}
