import * as THREE from 'three';
import { ROOM_CONFIGS } from '../RoomConfigs';
import type { InteractableEntry } from '../../types/game';
import { makeBox, makeRoom } from './GeometryHelpers';

export function buildRoom3(
  scene: THREE.Scene,
  rooms: THREE.Group[],
  interactables: InteractableEntry[],
): void {
  const cfg = ROOM_CONFIGS[2];
  const g = makeRoom(cfg, 2, scene, rooms);
  const [w, h, d] = cfg.size;

  // Dark atmospheric lighting
  const redLight = new THREE.PointLight(0xff2200, 0.3, 8);
  redLight.position.set(-3, h - 0.5, -3);
  g.add(redLight);

  const blueLight = new THREE.PointLight(0x2244ff, 0.4, 8);
  blueLight.position.set(3, h - 0.5, 3);
  g.add(blueLight);

  // Monitor wall (back wall - many screens)
  for (let mx = -2; mx <= 2; mx++) {
    for (let my = 0; my < 2; my++) {
      const mon = makeBox(0.8, 0.5, 0.05, 0x111122, mx * 1, 1 + my * 0.7, -d / 2 + 0.1, {
        emissive: 0x113355,
        emissiveIntensity: 0.6 + Math.random() * 0.3,
      });
      g.add(mon);
    }
  }
  // Monitor glow
  const monWallGlow = new THREE.PointLight(0x3355aa, 0.8, 6);
  monWallGlow.position.set(0, 1.5, -d / 2 + 1);
  g.add(monWallGlow);

  // Central desk
  g.add(makeBox(2, 0.06, 1, 0x2a2a3e, 0, 0.8, 1));
  g.add(makeBox(0.06, 0.8, 0.06, 0x222233, -0.9, 0.4, 0.5));
  g.add(makeBox(0.06, 0.8, 0.06, 0x222233, 0.9, 0.4, 0.5));
  g.add(makeBox(0.06, 0.8, 0.06, 0x222233, -0.9, 0.4, 1.5));
  g.add(makeBox(0.06, 0.8, 0.06, 0x222233, 0.9, 0.4, 1.5));

  // Files on desk
  const files = makeBox(0.25, 0.03, 0.35, 0xcc3333, -0.3, 0.85, 1, {
    name: 'files',
    emissive: 0x330000,
    emissiveIntensity: 0.3,
  });
  files.userData = {
    type: 'examine',
    prompt: '[E] 기밀 파일 읽기',
    dialog: {
      title: '기밀 파일 - 프로젝트 에코 최종 보고서',
      content:
        '[극비]\n\n피험자 코드명: 에코\n실제 이름: ■■■■\n\n프로젝트 개요:\n피험자는 자발적으로 기억 소거 실험에 참여.\n목적: 트라우마 기억의 선택적 제거.\n\n문제: 피험자가 실험 도중 모든 기억을 잃음.\n현재 피험자는 자신이 "갇혀있다"고 인식.\n\n진실: 피험자는 언제든 나갈 수 있었다.\n이 시설의 모든 문은... 피험자 스스로 잠근 것이다.\n\n최종 탈출 코드 생성 규칙:\n"당신이 지나온 문의 잠금장치 —\n각 해제 코드의 자릿수 합이\n당신의 기억의 무게입니다.\n두 방의 무게를 나란히 놓으세요.\n기억을 되짚으세요."',
    },
  };
  g.add(files);
  interactables.push({ mesh: files, room: 2 });

  // Monitor with CCTV view
  const cctvMon = makeBox(0.6, 0.4, 0.04, 0x111122, 0.5, 1.05, 0.5, {
    name: 'cctv',
    emissive: 0x004422,
    emissiveIntensity: 0.7,
  });
  cctvMon.userData = {
    type: 'examine',
    prompt: '[E] CCTV 모니터 확인',
    dialog: {
      title: 'CCTV 모니터',
      content:
        '모니터에 당신이 지나온 방들이 보인다.\n\n격리실... 연구실... 그리고 지금 이 방.\n\n화면에 데이터가 표시되어 있다:\n\n격리실 해제 코드: ●●●● → 자릿수 합계: ??\n연구실 해제 코드: ●●● → 자릿수 합계: ??\n최종 코드 = 두 합계를 나란히 배열\n\n모니터 아래 작은 글씨:\n"루프 횟수: 47"',
    },
  };
  g.add(cctvMon);
  interactables.push({ mesh: cctvMon, room: 2 });

  // Mirror on right wall
  const mirror = makeBox(1.2, 1.8, 0.05, 0x88aacc, w / 2 - 0.08, 1.3, 0, {
    name: 'mirror',
    roughness: 0.05,
    metalness: 0.95,
    emissive: 0x112233,
    emissiveIntensity: 0.1,
  });
  mirror.userData = {
    type: 'examine',
    prompt: '[E] 거울 보기',
    dialog: {
      title: '거울',
      content:
        '거울에 비친 모습을 본다.\n\n...낯설다. 아니, 낯설어야 하는데\n어딘가 익숙하다.\n\n연구복을 입고 있다.\n가슴에 이름표: "에코 프로젝트 - 수석 연구원"\n\n...나는 피험자가 아니라\n연구원이었던 건가?\n\n아니면... 둘 다?',
    },
  };
  g.add(mirror);
  interactables.push({ mesh: mirror, room: 2 });

  // Exit door with keypad
  const exitDoor = makeBox(1.2, 2.5, 0.1, 0x443333, 0, 1.25, d / 2 - 0.05, {
    name: 'exit_door',
    emissive: 0x110000,
    emissiveIntensity: 0.2,
  });
  exitDoor.userData = {
    type: 'puzzle',
    puzzleId: 'exit',
    prompt: '[E] 탈출구 - 비밀번호 입력',
    lockedMsg: '최종 출구. 4자리 코드가 필요하다.',
    unlockedMsg: '문이 열린다...',
  };
  g.add(exitDoor);
  interactables.push({ mesh: exitDoor, room: 2 });

  // EXIT sign
  g.add(
    makeBox(0.4, 0.15, 0.03, 0x111111, 0, 2.6, d / 2 - 0.1, {
      emissive: 0xff0000,
      emissiveIntensity: 1,
    }),
  );
  const exitGlow = new THREE.PointLight(0xff0000, 0.4, 3);
  exitGlow.position.set(0, 2.5, d / 2 - 0.5);
  g.add(exitGlow);

  // Door back to room 2
  const doorBack = makeBox(0.8, 2.1, 0.1, 0x334455, -3, 1.05, -d / 2 + 0.05, { name: 'door_back2' });
  doorBack.userData = {
    type: 'door',
    targetRoom: 1,
    prompt: '[E] 연구실로 돌아가기',
    requires: null,
    spawnLocal: { x: 0, z: -3.5 },
    faceY: Math.PI,
  };
  g.add(doorBack);
  interactables.push({ mesh: doorBack, room: 2 });

  // Chair fallen over
  const fallenChair = makeBox(0.4, 0.04, 0.4, 0x2a2a3e, -2, 0.22, 2);
  fallenChair.rotation.x = Math.PI / 2 + 0.2;
  fallenChair.rotation.z = 0.3;
  g.add(fallenChair);

  // Scattered papers on floor
  for (let i = 0; i < 5; i++) {
    const paper = makeBox(
      0.2, 0.003, 0.28, 0xddddcc,
      -1 + Math.random() * 3, 0.05, 0.5 + Math.random() * 2,
    );
    paper.rotation.y = Math.random() * Math.PI;
    g.add(paper);
  }
}
