import * as THREE from 'three';
import { CONFIG, ITEMS } from '../utils/Constants.js';
import { worldToGrid, isWall } from '../world/SchoolMap.js';

// 1인칭 플레이어 컨트롤러
export class Player {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;

    // 위치 & 회전
    this.position = new THREE.Vector3();
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.velocity = new THREE.Vector3();

    // 상태
    this.stamina = CONFIG.STAMINA_MAX;
    this.battery = CONFIG.FLASHLIGHT_BATTERY_MAX;
    this.isRunning = false;
    this.isCrouching = false;
    this.isHiding = false;
    this.noiseLevel = 0;
    this.currentFloor = 0;
    this.hasIndoorShoes = false;

    // 인벤토리
    this.inventory = [];

    // 손전등
    this.flashlightOn = true;
    this.flashlight = new THREE.SpotLight(0xFFFFDD, 1.5, 20, Math.PI / 6, 0.3, 1);
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.flashlight.castShadow = true;
    this.scene.add(this.flashlight);

    // 발걸음 타이머
    this.footstepTimer = 0;
    this.footstepInterval = 0.5;

    // 헤드밥
    this.headBobTimer = 0;
    this.headBobAmount = 0;

    // 통계
    this.startTime = Date.now();
    this.detectionCount = 0;
  }

  spawn(pos) {
    this.position.set(pos.x, pos.y, pos.z);
    this.camera.position.copy(this.position);
    this.currentFloor = 0;
  }

  update(deltaTime, input, colliders) {
    if (this.isHiding) return;

    // 마우스 회전
    const mouse = input.consumeMouse();
    this.euler.y -= mouse.dx * 0.002;
    this.euler.x -= mouse.dy * 0.002;
    this.euler.x = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.euler.x));
    this.camera.quaternion.setFromEuler(this.euler);

    // 이동 방향
    const direction = new THREE.Vector3();
    if (input.forward) direction.z -= 1;
    if (input.backward) direction.z += 1;
    if (input.left) direction.x -= 1;
    if (input.right) direction.x += 1;

    const isMoving = direction.length() > 0;
    if (isMoving) direction.normalize();

    // 카메라 방향 기준 이동
    const moveDir = direction.clone();
    moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.euler.y);

    // 달리기 & 웅크리기 판정
    this.isRunning = input.run && this.stamina > 0 && isMoving && !this.isCrouching;

    // 속도 결정
    let speed;
    if (this.isCrouching) {
      speed = CONFIG.CROUCH_SPEED;
      this.noiseLevel = CONFIG.NOISE_CROUCH;
    } else if (this.isRunning) {
      speed = CONFIG.RUN_SPEED;
      this.noiseLevel = CONFIG.NOISE_RUN;
      this.stamina -= CONFIG.STAMINA_DRAIN * deltaTime;
      if (this.stamina < 0) this.stamina = 0;
    } else {
      speed = CONFIG.WALK_SPEED;
      this.noiseLevel = isMoving ? CONFIG.NOISE_WALK : 0;
    }

    // 실내화 효과
    if (this.hasIndoorShoes) {
      this.noiseLevel *= 0.7;
    }

    // 스태미나 회복
    if (!this.isRunning) {
      this.stamina = Math.min(CONFIG.STAMINA_MAX, this.stamina + CONFIG.STAMINA_RECOVER * deltaTime);
    }

    // 배터리 소모
    if (this.flashlightOn) {
      this.battery -= CONFIG.FLASHLIGHT_DRAIN * deltaTime;
      if (this.battery <= 0) {
        this.battery = 0;
        this.flashlightOn = false;
        this.flashlight.intensity = 0;
      }
    }

    // 이동 적용 (충돌 체크)
    if (isMoving) {
      const moveAmount = moveDir.clone().multiplyScalar(speed * deltaTime);
      const newPos = this.position.clone().add(moveAmount);

      // X축 충돌 체크
      const testX = this.position.clone();
      testX.x = newPos.x;
      if (!this._checkCollision(testX, colliders)) {
        this.position.x = newPos.x;
      }

      // Z축 충돌 체크
      const testZ = this.position.clone();
      testZ.z = newPos.z;
      if (!this._checkCollision(testZ, colliders)) {
        this.position.z = newPos.z;
      }

      // 헤드밥
      this.headBobTimer += deltaTime * (this.isRunning ? 12 : 7);
      this.headBobAmount = Math.sin(this.headBobTimer) * (this.isRunning ? 0.06 : 0.03);

      // 발걸음 타이머
      this.footstepTimer += deltaTime;
      const interval = this.isRunning ? 0.3 : this.isCrouching ? 0.8 : 0.5;
      if (this.footstepTimer >= interval) {
        this.footstepTimer = 0;
        return 'footstep';
      }
    } else {
      this.headBobAmount *= 0.9;
    }

    // 높이 설정
    const targetHeight = this.isCrouching ? CONFIG.PLAYER_CROUCH_HEIGHT : CONFIG.PLAYER_HEIGHT;
    const currentHeight = this.camera.position.y - this.currentFloor * CONFIG.WALL_HEIGHT;
    const newHeight = currentHeight + (targetHeight - currentHeight) * 0.1;

    this.position.y = this.currentFloor * CONFIG.WALL_HEIGHT + newHeight;

    // 카메라 업데이트
    this.camera.position.set(
      this.position.x,
      this.position.y + this.headBobAmount,
      this.position.z
    );

    // 손전등 업데이트
    this._updateFlashlight();

    return null;
  }

  _checkCollision(testPos, colliders) {
    const r = CONFIG.PLAYER_RADIUS;
    for (const col of colliders) {
      if (
        testPos.x + r > col.min.x && testPos.x - r < col.max.x &&
        testPos.z + r > col.min.z && testPos.z - r < col.max.z &&
        testPos.y > col.min.y && testPos.y < col.max.y + 1
      ) {
        return true;
      }
    }

    // 맵 벽 충돌 체크
    const grid = worldToGrid(testPos.x, testPos.z);
    if (isWall(this.currentFloor, grid.gridX, grid.gridZ)) {
      return true;
    }

    return false;
  }

  _updateFlashlight() {
    this.flashlight.position.copy(this.camera.position);

    // 손전등 방향 = 카메라 전방
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.camera.quaternion);
    this.flashlightTarget.position.copy(this.camera.position).add(forward.multiplyScalar(10));

    // 손전등 켜짐/꺼짐
    this.flashlight.intensity = this.flashlightOn ? 1.5 : 0;

    // 배터리 낮을 때 깜빡임
    if (this.flashlightOn && this.battery < 20) {
      if (Math.random() < 0.05) {
        this.flashlight.intensity = 0;
      }
    }
  }

  toggleFlashlight() {
    if (this.battery > 0) {
      this.flashlightOn = !this.flashlightOn;
    }
  }

  toggleCrouch() {
    this.isCrouching = !this.isCrouching;
  }

  // 인벤토리에 아이템 추가
  addItem(item) {
    if (this.inventory.length >= CONFIG.INVENTORY_MAX) return false;
    this.inventory.push({
      type: item.type,
      name: item.name,
      icon: item.icon,
      description: item.description,
    });

    // 특수 아이템 즉시 효과
    if (item.type === 'indoor_shoes') {
      this.hasIndoorShoes = true;
    }

    return true;
  }

  // 아이템 사용
  useItem(index) {
    if (index < 0 || index >= this.inventory.length) return null;
    const item = this.inventory[index];

    switch (item.type) {
      case 'battery':
        this.battery = Math.min(CONFIG.FLASHLIGHT_BATTERY_MAX, this.battery + CONFIG.BATTERY_RECHARGE);
        this.inventory.splice(index, 1);
        return { type: 'battery', message: '배터리를 충전했다!' };

      case 'energy_drink':
        this.stamina = CONFIG.STAMINA_MAX;
        this.inventory.splice(index, 1);
        return { type: 'energy_drink', message: '스태미나가 회복되었다!' };

      case 'decoy':
        this.inventory.splice(index, 1);
        return { type: 'decoy', message: '핸드폰을 던졌다!', position: this._getThrowPosition() };

      default:
        return null;
    }
  }

  // 열쇠 보유 확인
  hasKey(keyType) {
    return this.inventory.some(item => item.type === keyType);
  }

  // 열쇠 사용 (인벤토리에서 제거하지 않음)
  useKey(keyType) {
    return this.hasKey(keyType);
  }

  _getThrowPosition() {
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.camera.quaternion);
    forward.y = 0;
    forward.normalize();
    return this.position.clone().add(forward.multiplyScalar(8));
  }

  // 은신 시작
  enterHiding() {
    this.isHiding = true;
    this.noiseLevel = 0;
  }

  // 은신 해제
  exitHiding() {
    this.isHiding = false;
  }

  // 층 변경 (계단)
  changeFloor(newFloor, stairPosition) {
    this.currentFloor = newFloor;
    this.position.y = newFloor * CONFIG.WALL_HEIGHT + CONFIG.PLAYER_HEIGHT;
  }

  // 노이즈 정보 (선생님 AI에 전달)
  getNoiseInfo() {
    return {
      position: this.position.clone(),
      noiseSource: this.position.clone(),
      noiseLevel: this.noiseLevel,
      flashlightOn: this.flashlightOn,
      isHiding: this.isHiding,
      floor: this.currentFloor,
    };
  }

  // 게임 통계
  getStats() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const minutes = Math.floor(elapsed / 60);
    const seconds = Math.floor(elapsed % 60);
    return {
      time: `${minutes}분 ${seconds}초`,
      detections: this.detectionCount,
    };
  }
}
