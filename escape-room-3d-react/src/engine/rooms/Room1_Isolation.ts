import * as THREE from 'three';
import { ROOM_CONFIGS } from '../RoomConfigs';
import type { InteractableEntry } from '../../types/game';
import { makeBox, makeRoom } from './GeometryHelpers';

export function buildRoom1(
  scene: THREE.Scene,
  rooms: THREE.Group[],
  interactables: InteractableEntry[],
): number {
  const cfg = ROOM_CONFIGS[0];
  const g = makeRoom(cfg, 0, scene, rooms);
  const [w, h, d] = cfg.size;

  // Flickering light effect
  const flicker = new THREE.PointLight(0xffffff, 0.3, 4);
  flicker.position.set(1, h - 0.5, -1);
  g.add(flicker);
  const flickerInterval = window.setInterval(() => {
    flicker.intensity = 0.2 + Math.random() * 0.3;
  }, 150);

  // Bed
  const bedFrame = makeBox(1.8, 0.35, 0.8, 0x8b7355, w / 2 - 1.2, 0.175, -d / 2 + 0.7, { name: 'bed' });
  g.add(bedFrame);
  const mattress = makeBox(1.7, 0.1, 0.7, 0xcccccc, w / 2 - 1.2, 0.4, -d / 2 + 0.7);
  g.add(mattress);
  const pillow = makeBox(0.35, 0.08, 0.5, 0xdddddd, w / 2 - 0.5, 0.48, -d / 2 + 0.7);
  g.add(pillow);

  // Desk
  const deskTop = makeBox(1.2, 0.05, 0.6, 0x7a6652, -(w / 2 - 0.8), 0.75, d / 2 - 0.6);
  g.add(deskTop);
  g.add(makeBox(0.05, 0.75, 0.55, 0x6a5642, -(w / 2 - 0.25), 0.375, d / 2 - 0.6));
  g.add(makeBox(0.05, 0.75, 0.55, 0x6a5642, -(w / 2 - 1.35), 0.375, d / 2 - 0.6));

  // Drawer (interactable)
  const drawer = makeBox(0.5, 0.2, 0.55, 0x8a7662, -(w / 2 - 0.55), 0.55, d / 2 - 0.6, {
    name: 'drawer',
    emissive: 0x000000,
  });
  drawer.userData = {
    type: 'puzzle',
    puzzleId: 'drawer',
    prompt: '[E] 서랍 열기',
    lockedMsg: '잠겨있다. 4자리 비밀번호가 필요하다.',
    unlockedMsg: '서랍이 열렸다!',
  };
  g.add(drawer);
  interactables.push({ mesh: drawer, room: 0 });

  // Chair
  const chairSeat = makeBox(0.4, 0.04, 0.4, 0x6a5642, -(w / 2 - 0.8), 0.45, d / 2 - 1.4);
  g.add(chairSeat);
  g.add(makeBox(0.04, 0.45, 0.04, 0x5a4632, -(w / 2 - 1), 0.225, d / 2 - 1.6));
  g.add(makeBox(0.04, 0.45, 0.04, 0x5a4632, -(w / 2 - 0.6), 0.225, d / 2 - 1.6));
  g.add(makeBox(0.04, 0.45, 0.04, 0x5a4632, -(w / 2 - 1), 0.225, d / 2 - 1.2));
  g.add(makeBox(0.04, 0.45, 0.04, 0x5a4632, -(w / 2 - 0.6), 0.225, d / 2 - 1.2));
  const chairBack = makeBox(0.4, 0.5, 0.04, 0x6a5642, -(w / 2 - 0.8), 0.7, d / 2 - 1.6);
  g.add(chairBack);

  // Wall scratches (visual hint)
  const scratchMark = makeBox(0.01, 0.4, 0.8, 0x999999, -w / 2 + 0.08, 1.3, 0, {
    name: 'wall_scratches',
    emissive: 0x222222,
    emissiveIntensity: 0.3,
  });
  scratchMark.userData = {
    type: 'examine',
    prompt: '[E] 벽의 긁힌 자국 조사',
    dialog: {
      title: '벽의 긁힌 자국',
      content:
        '누군가 손톱으로 벽을 긁어 숫자를 새겨놓았다.\n\n깊게 파인 자국이 선명하다:\n\n「 3 - 7 - 1 - 9 」\n\n그 아래에 더 작고 흐릿한 글씨:\n「 이것이 아니다 」\n\n...같은 손으로 쓴 건가, 다른 사람인가?',
    },
  };
  g.add(scratchMark);
  interactables.push({ mesh: scratchMark, room: 0 });

  // Spotlight on scratches
  const scratchLight = new THREE.SpotLight(0xffffcc, 0.8, 5, Math.PI / 6, 0.5);
  scratchLight.position.set(-w / 2 + 1.5, 2.5, 0);
  scratchLight.target.position.set(-w / 2, 1.3, 0);
  g.add(scratchLight);
  g.add(scratchLight.target);

  // Note on bed
  const note = makeBox(0.2, 0.005, 0.15, 0xffffee, w / 2 - 1.5, 0.46, -d / 2 + 0.7, {
    name: 'note1',
    emissive: 0x333300,
    emissiveIntensity: 0.2,
  });
  note.userData = {
    type: 'examine',
    prompt: '[E] 메모 읽기',
    dialog: {
      title: '구겨진 메모',
      content:
        '피험자 제17호 격리 보고서\n\n제04구역, 제9차 실험 프로토콜에 따라\n기억 소거가 완료될 때까지 외부 접촉을 차단한다.\n격리 기간: 무기한\n\n경고: 피험자가 벽에 거짓 코드를 새기는\n행동이 관찰됨. 탈출 시도 감지 시\n즉시 제08구역으로 이송할 것.\n\n- 에코 프로젝트 관리자',
    },
  };
  g.add(note);
  interactables.push({ mesh: note, room: 0 });

  // Under pillow clue
  const pillowClue = makeBox(0.15, 0.003, 0.1, 0xeeeedd, w / 2 - 0.5, 0.43, -d / 2 + 0.7, {
    name: 'pillow_clue',
    emissive: 0x222200,
    emissiveIntensity: 0.15,
  });
  pillowClue.userData = {
    type: 'examine',
    prompt: '[E] 베개 밑 확인',
    dialog: {
      title: '베개 밑의 쪽지',
      content:
        '이건... 내 필체다. 이전 루프의 내가 남긴 건가?\n\n"벽의 코드는 네가 의도적으로 남긴 함정이다.\n다음 루프의 자신을 시험하기 위해.\n\n진짜 코드는 이 방의 관리 번호들 안에 있다.\n피험자 번호, 구역, 실험 차수.\n\n순서는: 구역 → 차수 → 피험자.\n\n기억해. 모든 것은 네가 설계했다."',
    },
  };
  g.add(pillowClue);
  interactables.push({ mesh: pillowClue, room: 0 });

  // Door to room 2
  const door = makeBox(0.9, 2.2, 0.1, 0x555566, 0, 1.1, d / 2 - 0.05, {
    name: 'door1',
    emissive: 0x000000,
  });
  door.userData = {
    type: 'door',
    targetRoom: 1,
    prompt: '[E] 문 열기',
    requires: 'keycard',
    lockedMsg: '잠겨있다. 카드키가 필요한 것 같다.',
    spawnLocal: { x: -2, z: 3.5 },
    faceY: 0,
  };
  g.add(door);
  interactables.push({ mesh: door, room: 0 });

  // Door frame
  g.add(makeBox(0.08, 2.3, 0.15, 0x444455, -0.5, 1.15, d / 2 - 0.05));
  g.add(makeBox(0.08, 2.3, 0.15, 0x444455, 0.5, 1.15, d / 2 - 0.05));
  g.add(makeBox(1.08, 0.08, 0.15, 0x444455, 0, 2.3, d / 2 - 0.05));

  // Card reader next to door
  g.add(
    makeBox(0.12, 0.18, 0.04, 0x222233, 0.6, 1.3, d / 2 - 0.05, {
      name: 'card_reader',
      emissive: 0xff0000,
      emissiveIntensity: 0.5,
    }),
  );

  // Overturned cup
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.04, 0.1, 8),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }),
  );
  cup.position.set(-(w / 2 - 0.5), 0.78, d / 2 - 0.5);
  cup.rotation.z = Math.PI / 2 + 0.3;
  g.add(cup);

  // Spill mark
  g.add(makeBox(0.15, 0.002, 0.12, 0x5a4020, -(w / 2 - 0.35), 0.76, d / 2 - 0.5));

  return flickerInterval;
}
