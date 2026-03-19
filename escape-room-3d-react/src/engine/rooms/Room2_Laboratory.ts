import * as THREE from 'three';
import { ROOM_CONFIGS } from '../RoomConfigs';
import type { InteractableEntry } from '../../types/game';
import { makeBox, makeRoom } from './GeometryHelpers';

export function buildRoom2(
  scene: THREE.Scene,
  rooms: THREE.Group[],
  interactables: InteractableEntry[],
): void {
  const cfg = ROOM_CONFIGS[1];
  const g = makeRoom(cfg, 1, scene, rooms);
  const [w, h, d] = cfg.size;

  // Blue tinted spot lights
  const spot1 = new THREE.SpotLight(0x4488ff, 0.6, 10, Math.PI / 4, 0.5);
  spot1.position.set(-2, h - 0.3, -2);
  spot1.target.position.set(-2, 0, -2);
  g.add(spot1);
  g.add(spot1.target);

  const spot2 = new THREE.SpotLight(0x4488ff, 0.6, 10, Math.PI / 4, 0.5);
  spot2.position.set(2, h - 0.3, 2);
  spot2.target.position.set(2, 0, 2);
  g.add(spot2);
  g.add(spot2.target);

  // Lab table (center)
  g.add(makeBox(2.5, 0.06, 1, 0x778899, 0, 0.9, 0));
  g.add(makeBox(0.06, 0.9, 0.06, 0x667788, -1.1, 0.45, -0.4));
  g.add(makeBox(0.06, 0.9, 0.06, 0x667788, 1.1, 0.45, -0.4));
  g.add(makeBox(0.06, 0.9, 0.06, 0x667788, -1.1, 0.45, 0.4));
  g.add(makeBox(0.06, 0.9, 0.06, 0x667788, 1.1, 0.45, 0.4));

  // Microscope
  g.add(makeBox(0.15, 0.3, 0.15, 0x333344, -0.5, 1.1, 0));
  g.add(makeBox(0.05, 0.2, 0.05, 0x333344, -0.5, 1.35, 0.05));

  // Beakers
  const beaker1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.05, 0.15, 8),
    new THREE.MeshStandardMaterial({ color: 0x88aaff, transparent: true, opacity: 0.5, roughness: 0.1 }),
  );
  beaker1.position.set(0.3, 1.0, 0.1);
  g.add(beaker1);

  const beaker2 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.05, 0.15, 8),
    new THREE.MeshStandardMaterial({ color: 0x88ffaa, transparent: true, opacity: 0.5, roughness: 0.1 }),
  );
  beaker2.position.set(0.5, 1.0, 0.1);
  g.add(beaker2);

  // Chemical shelf (right wall)
  g.add(makeBox(2, 1.5, 0.3, 0x556677, w / 2 - 0.2, 1.2, 0));
  g.add(makeBox(1.8, 0.04, 0.25, 0x667788, w / 2 - 0.2, 0.7, 0));
  g.add(makeBox(1.8, 0.04, 0.25, 0x667788, w / 2 - 0.2, 1.2, 0));
  g.add(makeBox(1.8, 0.04, 0.25, 0x667788, w / 2 - 0.2, 1.7, 0));

  // Chemical bottles
  const bottleColors = [
    { c: 0xff3333, label: 'R-02', x: -0.6, y: 1.35 },
    { c: 0xffaa33, label: 'O-04', x: -0.3, y: 1.35 },
    { c: 0x33ff33, label: 'G-05', x: 0, y: 1.35 },
    { c: 0x33ffff, label: 'C-06', x: 0.3, y: 1.35 },
    { c: 0x3333ff, label: 'B-08', x: 0.6, y: 1.35 },
  ];

  const chemShelf = makeBox(0.01, 0.01, 0.01, 0x000000, w / 2 - 0.2, 1.35, 0.05, { name: 'chem_shelf' });
  chemShelf.userData = {
    type: 'examine',
    prompt: '[E] 약품 선반 조사',
    dialog: {
      title: '약품 선반',
      content:
        '선반에 약품들이 색깔별로 정렬되어 있다.\n\n빨강(R-02) | 주황(O-04) | 초록(G-05)\n청록(C-06) | 파랑(B-08)\n\n각 약품에 번호가 적혀있다.\n\n벽에 붙은 지시서:\n"투여 순서: RGB 프로토콜\n단, 에코 보정 적용 — 반향값을 사용할 것"',
    },
  };
  g.add(chemShelf);
  interactables.push({ mesh: chemShelf, room: 1 });

  bottleColors.forEach((b) => {
    const bottle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.04, 0.18, 8),
      new THREE.MeshStandardMaterial({
        color: b.c,
        roughness: 0.2,
        metalness: 0.1,
        emissive: b.c,
        emissiveIntensity: 0.15,
      }),
    );
    bottle.position.set(w / 2 - 0.2 + b.x, b.y, 0.05);
    g.add(bottle);
  });

  // Safe on back wall
  const safe = makeBox(0.5, 0.5, 0.3, 0x445566, 0, 1.2, -d / 2 + 0.2, {
    name: 'safe',
    emissive: 0x000000,
  });
  safe.userData = {
    type: 'puzzle',
    puzzleId: 'safe',
    prompt: '[E] 금고 열기',
    lockedMsg: '잠겨있다. 3자리 비밀번호가 필요하다.',
    unlockedMsg: '금고가 열렸다!',
  };
  g.add(safe);
  interactables.push({ mesh: safe, room: 1 });

  // Safe handle
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8),
    new THREE.MeshStandardMaterial({ color: 0x888899, metalness: 0.8, roughness: 0.2 }),
  );
  handle.position.set(0.15, 1.2, -d / 2 + 0.06);
  handle.rotation.z = Math.PI / 2;
  g.add(handle);

  // Computer monitor on left wall desk
  g.add(makeBox(1.5, 0.05, 0.6, 0x556666, -w / 2 + 0.5, 0.8, -1.5));
  g.add(makeBox(0.05, 0.8, 0.05, 0x445555, -w / 2 + 0.3, 0.4, -1.5));
  g.add(makeBox(0.05, 0.8, 0.05, 0x445555, -w / 2 + 0.7, 0.4, -1.5));

  // Monitor
  const monitor = makeBox(0.6, 0.4, 0.04, 0x111122, -w / 2 + 0.5, 1.15, -1.7, {
    name: 'monitor',
    emissive: 0x003366,
    emissiveIntensity: 0.8,
  });
  monitor.userData = {
    type: 'examine',
    prompt: '[E] 모니터 확인',
    dialog: {
      title: '실험 기록 터미널',
      content:
        '[프로젝트 에코 - 47번째 실험 기록]\n\n피험자 의식 소거 완료.\n기억 재구성 프로토콜 진행 중...\n\n에코 보정 테이블:\n원본 → 반향\n 01 → 09\n 02 → 08\n 03 → 07\n ...\n\n금고 접근 코드는 보정된 투여 순서입니다.\n\n경고: 피험자가 시설을 인식할 경우\n즉시 제08구역 봉쇄 프로토콜을 실행할 것.',
    },
  };
  g.add(monitor);
  interactables.push({ mesh: monitor, room: 1 });

  // Monitor glow
  const monGlow = new THREE.PointLight(0x3366ff, 0.5, 2);
  monGlow.position.set(-w / 2 + 0.5, 1.15, -1.5);
  g.add(monGlow);

  // Door back to room 1
  const doorBack = makeBox(0.9, 2.2, 0.1, 0x555566, -2, 1.1, d / 2 - 0.05, { name: 'door_back1' });
  doorBack.userData = {
    type: 'door',
    targetRoom: 0,
    prompt: '[E] 격리실로 돌아가기',
    requires: null,
    spawnLocal: { x: 0, z: 2.5 },
    faceY: 0,
  };
  g.add(doorBack);
  interactables.push({ mesh: doorBack, room: 1 });

  // Door to room 3
  const door2 = makeBox(0.9, 2.2, 0.1, 0x334455, 0, 1.1, -d / 2 + 0.05, {
    name: 'door2',
    emissive: 0x000000,
  });
  door2.userData = {
    type: 'door',
    targetRoom: 2,
    prompt: '[E] 문 열기',
    requires: 'master_key',
    lockedMsg: '매우 단단한 문이다. 마스터 키가 필요하다.',
    spawnLocal: { x: -3, z: -4.5 },
    faceY: Math.PI,
  };
  g.add(door2);
  interactables.push({ mesh: door2, room: 2 });

  // Frame
  g.add(makeBox(0.08, 2.3, 0.15, 0x334455, -0.5, 1.15, -d / 2 + 0.05));
  g.add(makeBox(0.08, 2.3, 0.15, 0x334455, 0.5, 1.15, -d / 2 + 0.05));
  g.add(makeBox(1.08, 0.08, 0.15, 0x334455, 0, 2.3, -d / 2 + 0.05));

  // Torn photo on table
  const photo = makeBox(0.12, 0.005, 0.1, 0xeeddcc, 0.7, 0.94, 0.2, {
    name: 'photo',
    emissive: 0x221100,
    emissiveIntensity: 0.2,
  });
  photo.userData = {
    type: 'examine',
    prompt: '[E] 찢어진 사진 조사',
    dialog: {
      title: '찢어진 사진',
      content:
        '반으로 찢긴 사진.\n한쪽에는 연구복을 입은 사람이 있지만\n얼굴 부분이 찢겨 나갔다.\n\n뒷면에 흐릿한 글씨:\n"잊지 마. 네가 선택한 거야.\n금고는 네가 직접 잠갔다.\nRGB의 반향을 기억해."',
    },
  };
  g.add(photo);
  interactables.push({ mesh: photo, room: 1 });

  // Whiteboard
  g.add(makeBox(1.5, 1, 0.04, 0xeeeeff, -w / 2 + 0.05, 1.5, 1.5));
  const wbText = makeBox(1.3, 0.8, 0.005, 0xddddee, -w / 2 + 0.07, 1.5, 1.5, {
    name: 'whiteboard',
    emissive: 0x111122,
    emissiveIntensity: 0.1,
  });
  wbText.userData = {
    type: 'examine',
    prompt: '[E] 화이트보드 읽기',
    dialog: {
      title: '화이트보드',
      content:
        '대부분 지워졌지만 일부 글씨가 남아있다:\n\n"에코 = 반향... 기억의 반향?"\n"모든 값은 되돌아온다: f(x) = 10 - x"\n"피험자가 스스로 선택하게 해야 한다"\n"최종 단계: 자기 인식"\n\n아래에 작게: "미안하다"',
    },
  };
  g.add(wbText);
  interactables.push({ mesh: wbText, room: 1 });
}
