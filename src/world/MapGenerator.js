import * as THREE from 'three';
import { FLOOR_MAPS, gridToWorld, isWall } from './SchoolMap.js';
import { CONFIG, TILE, ITEMS } from '../utils/Constants.js';

// 그리드 맵 → 3D 지오메트리 변환
export class MapGenerator {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];       // 벽 충돌용
    this.doors = [];           // 문 오브젝트
    this.hideSpots = [];       // 은신 장소
    this.items = [];           // 아이템 오브젝트
    this.lights = [];          // 형광등
    this.stairsUp = [];        // 올라가는 계단
    this.stairsDown = [];      // 내려가는 계단
    this.exitPosition = null;  // 탈출구

    this._createMaterials();
  }

  _createMaterials() {
    // 한국 학교 느낌 머티리얼
    this.materials = {
      wall: new THREE.MeshStandardMaterial({ color: 0xE8E0D0, roughness: 0.9 }),
      floor: new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.7 }),
      ceiling: new THREE.MeshStandardMaterial({ color: 0xF5F5F0, roughness: 0.8 }),
      door: new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.6 }),
      doorLocked: new THREE.MeshStandardMaterial({ color: 0x8B0000, roughness: 0.6 }),
      classroom: new THREE.MeshStandardMaterial({ color: 0xD4C4A0, roughness: 0.85 }),
      locker: new THREE.MeshStandardMaterial({ color: 0x556B2F, metalness: 0.3, roughness: 0.4 }),
      hideSpot: new THREE.MeshStandardMaterial({ color: 0x3a5a3a, metalness: 0.2, roughness: 0.5 }),
      stairs: new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.4, roughness: 0.3 }),
      item: new THREE.MeshStandardMaterial({ color: 0xFFDD00, emissive: 0xFFAA00, emissiveIntensity: 0.5 }),
      exit: new THREE.MeshStandardMaterial({ color: 0x00FF44, emissive: 0x00FF44, emissiveIntensity: 0.3 }),
    };
  }

  generateAllFloors() {
    for (const floorNum of Object.keys(FLOOR_MAPS)) {
      this.generateFloor(parseInt(floorNum));
    }
  }

  generateFloor(floorNum) {
    const map = FLOOR_MAPS[floorNum];
    if (!map) return;

    const grid = map.grid;
    const floorY = floorNum * CONFIG.WALL_HEIGHT;

    for (let z = 0; z < grid.length; z++) {
      for (let x = 0; x < grid[z].length; x++) {
        const cell = grid[z][x];
        const wx = x * CONFIG.CELL_SIZE;
        const wz = z * CONFIG.CELL_SIZE;

        if (cell === TILE.WALL) {
          this._createWall(wx, floorY, wz);
        } else {
          // 바닥
          this._createFloor(wx, floorY, wz, cell === 'C' ? 'classroom' : 'floor');
          // 천장
          this._createCeiling(wx, floorY + CONFIG.WALL_HEIGHT, wz);

          if (cell === 'U') {
            this._createStairs(wx, floorY, wz, 'up', floorNum);
          } else if (cell === 'W') {
            this._createStairs(wx, floorY, wz, 'down', floorNum);
          } else if (cell === 'H') {
            this._createHideSpotVisual(wx, floorY, wz, floorNum);
          } else if (cell === 'X') {
            this._createExit(wx, floorY, wz);
          }
        }
      }
    }

    // 문 생성
    if (map.doors) {
      for (const doorData of map.doors) {
        this._createDoor(doorData, floorNum);
      }
    }

    // 아이템 생성
    if (map.items) {
      for (const itemData of map.items) {
        this._createItem(itemData, floorNum);
      }
    }

    // 은신 장소 데이터 등록
    if (map.hideSpots) {
      for (const hs of map.hideSpots) {
        const pos = gridToWorld(hs.gridX, hs.gridZ, floorNum);
        this.hideSpots.push({
          position: new THREE.Vector3(pos.x, pos.y, pos.z),
          floor: floorNum,
          type: hs.type,
          occupied: false,
        });
      }
    }

    // 형광등 배치 (복도에 간격을 두고)
    this._addFluorescentLights(grid, floorNum);
  }

  _createWall(x, y, z) {
    const geo = new THREE.BoxGeometry(CONFIG.CELL_SIZE, CONFIG.WALL_HEIGHT, CONFIG.CELL_SIZE);
    const mesh = new THREE.Mesh(geo, this.materials.wall);
    mesh.position.set(x, y + CONFIG.WALL_HEIGHT / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    this.colliders.push({
      min: new THREE.Vector3(
        x - CONFIG.CELL_SIZE / 2,
        y,
        z - CONFIG.CELL_SIZE / 2
      ),
      max: new THREE.Vector3(
        x + CONFIG.CELL_SIZE / 2,
        y + CONFIG.WALL_HEIGHT,
        z + CONFIG.CELL_SIZE / 2
      ),
    });
  }

  _createFloor(x, y, z, type = 'floor') {
    const geo = new THREE.PlaneGeometry(CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);
    const mesh = new THREE.Mesh(geo, this.materials[type]);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  _createCeiling(x, y, z) {
    const geo = new THREE.PlaneGeometry(CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);
    const mesh = new THREE.Mesh(geo, this.materials.ceiling);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
  }

  _createDoor(doorData, floorNum) {
    const pos = gridToWorld(doorData.gridX, doorData.gridZ, floorNum);
    const geo = new THREE.BoxGeometry(CONFIG.CELL_SIZE * 0.9, CONFIG.WALL_HEIGHT * 0.85, 0.15);
    const mat = doorData.locked ? this.materials.doorLocked : this.materials.door;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, floorNum * CONFIG.WALL_HEIGHT + CONFIG.WALL_HEIGHT * 0.42, pos.z);
    mesh.castShadow = true;
    this.scene.add(mesh);

    const door = {
      mesh,
      position: new THREE.Vector3(pos.x, pos.y, pos.z),
      floor: floorNum,
      locked: doorData.locked || false,
      keyRequired: doorData.keyRequired || null,
      isExit: doorData.isExit || false,
      isOpen: false,
      gridX: doorData.gridX,
      gridZ: doorData.gridZ,
    };

    // 잠긴 문은 콜라이더 추가
    if (doorData.locked) {
      this.colliders.push({
        min: new THREE.Vector3(
          pos.x - CONFIG.CELL_SIZE / 2,
          floorNum * CONFIG.WALL_HEIGHT,
          pos.z - CONFIG.CELL_SIZE / 2
        ),
        max: new THREE.Vector3(
          pos.x + CONFIG.CELL_SIZE / 2,
          floorNum * CONFIG.WALL_HEIGHT + CONFIG.WALL_HEIGHT,
          pos.z + CONFIG.CELL_SIZE / 2
        ),
        isDoor: true,
        door: door,
      });
    }

    this.doors.push(door);
  }

  _createStairs(x, y, z, direction, floorNum) {
    // 계단 시각적 표현
    const geo = new THREE.BoxGeometry(CONFIG.CELL_SIZE * 0.8, 0.3, CONFIG.CELL_SIZE * 0.8);
    const mesh = new THREE.Mesh(geo, this.materials.stairs);
    mesh.position.set(x, y + 0.15, z);
    this.scene.add(mesh);

    // 화살표 표시
    const arrowGeo = new THREE.ConeGeometry(0.3, 0.5, 4);
    const arrowMat = new THREE.MeshStandardMaterial({
      color: direction === 'up' ? 0x00ff88 : 0xff8800,
      emissive: direction === 'up' ? 0x00ff88 : 0xff8800,
      emissiveIntensity: 0.3,
    });
    const arrow = new THREE.Mesh(arrowGeo, arrowMat);
    arrow.position.set(x, y + 0.8, z);
    if (direction === 'down') arrow.rotation.x = Math.PI;
    this.scene.add(arrow);

    const stairData = {
      position: new THREE.Vector3(x, y + CONFIG.PLAYER_HEIGHT, z),
      floor: floorNum,
      direction,
      targetFloor: direction === 'up' ? floorNum + 1 : floorNum - 1,
    };

    if (direction === 'up') {
      this.stairsUp.push(stairData);
    } else {
      this.stairsDown.push(stairData);
    }
  }

  _createHideSpotVisual(x, y, z, floorNum) {
    // 사물함 형태
    const geo = new THREE.BoxGeometry(CONFIG.CELL_SIZE * 0.6, CONFIG.WALL_HEIGHT * 0.7, CONFIG.CELL_SIZE * 0.4);
    const mesh = new THREE.Mesh(geo, this.materials.hideSpot);
    mesh.position.set(x, y + CONFIG.WALL_HEIGHT * 0.35, z);
    mesh.castShadow = true;
    this.scene.add(mesh);
  }

  _createExit(x, y, z) {
    // 출구 표시 — 초록색 글로우
    const light = new THREE.PointLight(0x00FF44, 0.8, 8);
    light.position.set(x, y + 2.5, z);
    this.scene.add(light);

    // EXIT 표시판
    const geo = new THREE.PlaneGeometry(1.5, 0.5);
    const mesh = new THREE.Mesh(geo, this.materials.exit);
    mesh.position.set(x, y + 2.6, z);
    this.scene.add(mesh);

    this.exitPosition = new THREE.Vector3(x, y, z);
  }

  _createItem(itemData, floorNum) {
    const pos = gridToWorld(itemData.gridX, itemData.gridZ, floorNum);
    const geo = new THREE.SphereGeometry(0.2, 8, 8);
    const mesh = new THREE.Mesh(geo, this.materials.item);
    mesh.position.set(pos.x, floorNum * CONFIG.WALL_HEIGHT + 0.8, pos.z);
    this.scene.add(mesh);

    // 아이템 빛
    const light = new THREE.PointLight(0xFFAA00, 0.5, 4);
    light.position.copy(mesh.position);
    light.position.y += 0.3;
    this.scene.add(light);

    const itemDef = Object.values(ITEMS).find(i => i.id === itemData.type);

    this.items.push({
      mesh,
      light,
      position: new THREE.Vector3(pos.x, pos.y, pos.z),
      floor: floorNum,
      type: itemData.type,
      name: itemDef?.name || itemData.type,
      icon: itemDef?.icon || '?',
      description: itemDef?.description || '',
      collected: false,
    });
  }

  _addFluorescentLights(grid, floorNum) {
    const floorY = floorNum * CONFIG.WALL_HEIGHT;

    for (let z = 0; z < grid.length; z++) {
      for (let x = 0; x < grid[z].length; x++) {
        const cell = grid[z][x];
        if (cell !== TILE.WALL && x % 6 === 3 && z % 4 === 2) {
          const wx = x * CONFIG.CELL_SIZE;
          const wz = z * CONFIG.CELL_SIZE;

          // 형광등 (불안정하게 켜짐)
          const light = new THREE.PointLight(0xFFFFEE, 2.5, 20);
          light.position.set(wx, floorY + CONFIG.WALL_HEIGHT - 0.2, wz);
          light.castShadow = false;
          this.scene.add(light);

          // 형광등 튜브 메시
          const tubeGeo = new THREE.BoxGeometry(1.2, 0.05, 0.1);
          const tubeMat = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            emissive: 0xCCFFCC,
            emissiveIntensity: 1.0,
          });
          const tube = new THREE.Mesh(tubeGeo, tubeMat);
          tube.position.copy(light.position);
          this.scene.add(tube);

          this.lights.push({
            light,
            tube,
            baseIntensity: 0.8,
            flickerTimer: Math.random() * 10,
            flickerSpeed: 0.5 + Math.random() * 2,
            isNearTeacher: false,
          });
        }
      }
    }

    // 비상등 (복도 끝, 계단 근처) — 빨간 약한 빛
    for (let z = 0; z < grid.length; z++) {
      for (let x = 0; x < grid[z].length; x++) {
        const cell = grid[z][x];
        if (cell === 'U' || cell === 'W') {
          const wx = x * CONFIG.CELL_SIZE;
          const wz = z * CONFIG.CELL_SIZE;
          const emLight = new THREE.PointLight(0xFF2200, 0.3, 6);
          emLight.position.set(wx, floorY + CONFIG.WALL_HEIGHT - 0.3, wz);
          this.scene.add(emLight);
        }
      }
    }
  }

  // 형광등 업데이트 (깜빡임)
  updateLights(deltaTime, teacherPositions) {
    for (const fl of this.lights) {
      fl.flickerTimer += deltaTime * fl.flickerSpeed;

      // 선생님 근처의 형광등은 더 심하게 깜빡임
      let nearTeacher = false;
      for (const tp of teacherPositions) {
        const dist = fl.light.position.distanceTo(tp);
        if (dist < 12) {
          nearTeacher = true;
          break;
        }
      }

      if (nearTeacher) {
        // 선생님 접근 시 형광등 불안정
        if (Math.random() < 0.15) {
          fl.light.intensity = Math.random() > 0.3 ? fl.baseIntensity * 1.5 : 0;
          fl.tube.material.emissiveIntensity = fl.light.intensity > 0 ? 0.8 : 0;
        }
      } else {
        // 일반 깜빡임 (드물게)
        if (Math.sin(fl.flickerTimer * 10) > 0.95) {
          fl.light.intensity = 0;
          fl.tube.material.emissiveIntensity = 0;
        } else {
          fl.light.intensity = fl.baseIntensity;
          fl.tube.material.emissiveIntensity = 0.5;
        }
      }
    }
  }

  // 문 열기
  openDoor(door) {
    if (!door || door.isOpen) return false;
    door.isOpen = true;
    door.mesh.visible = false;

    // 콜라이더 제거
    const idx = this.colliders.findIndex(c => c.isDoor && c.door === door);
    if (idx !== -1) this.colliders.splice(idx, 1);

    return true;
  }

  // 아이템 수집
  collectItem(item) {
    if (item.collected) return false;
    item.collected = true;
    item.mesh.visible = false;
    item.light.visible = false;
    return true;
  }

  // 아이템 회전 애니메이션
  updateItems(deltaTime) {
    for (const item of this.items) {
      if (!item.collected) {
        item.mesh.rotation.y += deltaTime * 2;
        item.mesh.position.y = item.floor * CONFIG.WALL_HEIGHT + 0.8 + Math.sin(Date.now() * 0.003) * 0.1;
      }
    }
  }
}
