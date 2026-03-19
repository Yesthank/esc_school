import * as THREE from 'three';
import { EventEmitter } from './EventEmitter';
import { createGameState } from './GameState';
import type { GameStateData, ItemId, PuzzleId } from './GameState';
import { createScene, type SceneContext } from './SceneSetup';
import { createControls, type ControlsState } from './Controls';
import { updateMovement } from './Movement';
import { updateInteraction, updateDoorVisuals } from './Interaction';
import { transitionToRoom } from './RoomManager';
import { buildRoom1 } from './rooms/Room1_Isolation';
import { buildRoom2 } from './rooms/Room2_Laboratory';
import { buildRoom3 } from './rooms/Room3_Observation';
import { PUZZLES } from './PuzzleDefinitions';
import { initAudio, sfxAmbient, sfxClick, sfxSuccess, sfxFail, sfxDoor, sfxPickup } from './AudioSystem';
import type { InteractableEntry, InteractableUserData } from '../types/game';

const ITEM_NAMES: Record<string, string> = {
  keycard: '카드키',
  note_fragment: '메모 조각',
  master_key: '마스터키',
  torn_photo2: '사진 조각',
};

export class GameEngine {
  readonly events = new EventEmitter();

  private sceneCtx!: SceneContext;
  private state!: GameStateData;
  private controls!: ControlsState;
  private euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private interactables: InteractableEntry[] = [];
  private rooms: THREE.Group[] = [];
  private cleanupControls: (() => void) | null = null;
  private flickerInterval = 0;
  private animFrameId = 0;
  private prevTime = 0;
  private lastTimerDisplay = '';
  private isMobile: boolean;
  private disposed = false;
  private inDialog = false;
  private inCodePanel = false;

  constructor() {
    this.isMobile =
      (('ontouchstart' in window) || (navigator.maxTouchPoints > 0)) &&
      window.innerWidth <= 1024;
  }

  getIsMobile(): boolean {
    return this.isMobile;
  }

  start(container: HTMLElement): void {
    initAudio();
    sfxAmbient();

    this.sceneCtx = createScene(container);
    this.state = createGameState();
    this.controls = {
      moveForward: false,
      moveBackward: false,
      moveLeft: false,
      moveRight: false,
      isLocked: false,
    };

    this.flickerInterval = buildRoom1(this.sceneCtx.scene, this.rooms, this.interactables);
    buildRoom2(this.sceneCtx.scene, this.rooms, this.interactables);
    buildRoom3(this.sceneCtx.scene, this.rooms, this.interactables);

    this.cleanupControls = createControls(
      this.sceneCtx.camera,
      this.sceneCtx.renderer,
      this.controls,
      this.euler,
      this.isMobile,
      () => this.state.paused,
      () => this.interact(),
      (locked) => this.onPointerLockChange(locked),
    );

    // Show only room 1
    this.rooms.forEach((r, i) => { r.visible = i === 0; });
    this.state.currentRoom = 0;
    this.state.startTime = Date.now();
    this.state.paused = false;

    this.events.emit('roomChange', '격리실');

    // Resize handler
    const onResize = () => {
      this.sceneCtx.camera.aspect = window.innerWidth / window.innerHeight;
      this.sceneCtx.camera.updateProjectionMatrix();
      this.sceneCtx.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // ESC key handler
    const onEsc = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (this.inDialog) {
          this.closeDialog();
          e.preventDefault();
        }
        if (this.inCodePanel) {
          this.closeCodePanel();
          e.preventDefault();
        }
      }
      if (e.code === 'KeyE') {
        if (this.inDialog) {
          this.closeDialog();
        }
      }
    };
    document.addEventListener('keydown', onEsc);

    // Store for cleanup
    (this as unknown as Record<string, unknown>)._onResize = onResize;
    (this as unknown as Record<string, unknown>)._onEsc = onEsc;

    if (this.isMobile) {
      this.controls.isLocked = true; // Simulate locked for mobile
      this.events.emit('screenChange', 'playing');
    } else {
      this.events.emit('screenChange', 'paused');
      this.sceneCtx.renderer.domElement.requestPointerLock();
    }

    // Start animation loop
    this.prevTime = performance.now();
    this.animate();
  }

  private onPointerLockChange(locked: boolean): void {
    if (locked) {
      this.state.paused = false;
      document.body.classList.add('playing');
      this.events.emit('screenChange', 'playing');
    } else {
      document.body.classList.remove('playing');
      if (!this.inDialog && !this.inCodePanel) {
        this.state.paused = true;
        this.events.emit('screenChange', 'paused');
      }
    }
  }

  requestPointerLock(): void {
    if (!this.isMobile && this.sceneCtx) {
      this.sceneCtx.renderer.domElement.requestPointerLock();
    }
  }

  private animate = (): void => {
    if (this.disposed) return;
    this.animFrameId = requestAnimationFrame(this.animate);

    const time = performance.now();
    const delta = (time - this.prevTime) / 1000;
    this.prevTime = time;

    if (!this.state.paused) {
      updateMovement(Math.min(delta, 0.1), this.sceneCtx.camera, this.controls, this.state.currentRoom);
      updateInteraction(
        this.sceneCtx.camera,
        this.sceneCtx.raycaster,
        this.interactables,
        this.state,
        (text) => this.events.emit('interactPrompt', text),
      );
      this.updateTimer();
    }

    this.sceneCtx.renderer.render(this.sceneCtx.scene, this.sceneCtx.camera);
  };

  private updateTimer(): void {
    if (!this.state.startTime) return;
    this.state.elapsed = Math.floor((Date.now() - this.state.startTime) / 1000);
    const m = String(Math.floor(this.state.elapsed / 60)).padStart(2, '0');
    const s = String(this.state.elapsed % 60).padStart(2, '0');
    const display = m + ':' + s;
    if (display !== this.lastTimerDisplay) {
      this.lastTimerDisplay = display;
      this.events.emit('timerUpdate', display);
    }
  }

  interact(): void {
    const obj = this.state.interactTarget;
    if (!obj) return;

    sfxClick();
    const data = obj.userData as InteractableUserData;

    switch (data.type) {
      case 'examine':
        if (data.dialog) {
          this.showDialog(data.dialog.title, data.dialog.content);
          if (obj.name) this.state.discoveredClues.add(obj.name);
        }
        break;

      case 'puzzle': {
        const puzzleId = data.puzzleId!;
        if (this.state.solvedPuzzles.has(puzzleId)) {
          this.events.emit('flashMessage', '이미 열려있다.');
          return;
        }
        const puzzle = PUZZLES[puzzleId];
        this.state.codeTarget = puzzleId;
        this.state.codeBuffer = '';
        this.state.codeLength = puzzle.answer.length;

        const title =
          puzzleId === 'drawer' ? '서랍 잠금장치' :
          puzzleId === 'safe' ? '금고 잠금장치' : '탈출구 키패드';
        const subtitle = puzzle.answer.length + '자리 숫자를 입력하세요';

        this.inCodePanel = true;
        this.events.emit('showCodePanel', title, subtitle);
        this.state.paused = true;
        document.body.classList.remove('playing');
        if (!this.isMobile) document.exitPointerLock();
        break;
      }

      case 'door':
        if (data.requires && !this.state.inventory.includes(data.requires as ItemId)) {
          this.events.emit('flashMessage', data.lockedMsg || '잠겨있다.');
          sfxFail();
          return;
        }
        sfxDoor();
        transitionToRoom(
          data.targetRoom!,
          data.spawnLocal,
          data.faceY,
          this.rooms,
          this.sceneCtx.scene,
          this.sceneCtx.camera,
          this.sceneCtx.renderer,
          this.euler,
          this.isMobile,
          (room) => { this.state.currentRoom = room; },
          (paused) => { this.state.paused = paused; },
          () => this.events.emit('fadeIn'),
          () => this.events.emit('fadeOut'),
          (name) => this.events.emit('roomChange', name),
        );
        break;
    }
  }

  codePress(key: string): void {
    if (key === 'clear') {
      this.state.codeBuffer = '';
      this.events.emit('codeDisplayUpdate', '');
      this.events.emit('codeResult', '', '');
      sfxClick();
      return;
    }
    if (key === 'enter') {
      this.checkCode();
      return;
    }
    if (this.state.codeBuffer.length < this.state.codeLength) {
      this.state.codeBuffer += key;
      this.events.emit('codeDisplayUpdate', this.state.codeBuffer);
      sfxClick();
    }
  }

  private checkCode(): void {
    const puzzleId = this.state.codeTarget!;
    const puzzle = PUZZLES[puzzleId];

    if (this.state.codeBuffer === puzzle.answer) {
      sfxSuccess();
      this.state.solvedPuzzles.add(puzzleId);
      this.events.emit('codeResult', '해제 성공!', '#00e5ff');

      if (puzzleId === 'drawer') {
        this.addItem('keycard');
        this.addItem('note_fragment');
        setTimeout(() => this.events.emit('flashMessage', '서랍에서 카드키와 메모 조각을 발견했다.'), 500);
      } else if (puzzleId === 'safe') {
        this.addItem('master_key');
        this.addItem('torn_photo2');
        setTimeout(() => this.events.emit('flashMessage', '금고에서 마스터 키와 사진 조각을 발견했다.'), 500);
      } else if (puzzleId === 'exit') {
        setTimeout(() => {
          this.closeCodePanel();
          this.triggerEnding();
        }, 800);
        return;
      }

      updateDoorVisuals(this.interactables, this.state.inventory);
      setTimeout(() => this.closeCodePanel(), 1200);
    } else {
      sfxFail();
      this.events.emit('codeResult', '틀렸습니다', '#ff4444');
      this.state.codeBuffer = '';
      setTimeout(() => {
        this.events.emit('codeDisplayUpdate', '');
        this.events.emit('codeResult', '', '');
      }, 1000);
    }
  }

  closeCodePanel(): void {
    this.inCodePanel = false;
    this.events.emit('closeCodePanel');
    this.state.codeTarget = null;
    this.state.codeBuffer = '';
    this.state.paused = false;
    if (!this.isMobile) {
      setTimeout(() => this.sceneCtx.renderer.domElement.requestPointerLock(), 100);
    }
  }

  private showDialog(title: string, content: string): void {
    this.inDialog = true;
    this.events.emit('showDialog', title, content);
    this.state.paused = true;
    document.body.classList.remove('playing');
    if (!this.isMobile) document.exitPointerLock();
  }

  closeDialog(): void {
    this.inDialog = false;
    this.events.emit('closeDialog');
    this.state.paused = false;
    if (!this.isMobile) {
      setTimeout(() => this.sceneCtx.renderer.domElement.requestPointerLock(), 100);
    }
  }

  private addItem(id: ItemId): void {
    if (this.state.inventory.includes(id)) return;
    this.state.inventory.push(id);
    sfxPickup();
    this.events.emit('inventoryChange', [...this.state.inventory]);
  }

  showHint(): void {
    let currentPuzzle: PuzzleId | null = null;
    if (this.state.currentRoom === 0 && !this.state.solvedPuzzles.has('drawer')) {
      currentPuzzle = 'drawer';
    } else if (this.state.currentRoom === 1 && !this.state.solvedPuzzles.has('safe')) {
      currentPuzzle = 'safe';
    } else if (this.state.currentRoom === 2 && !this.state.solvedPuzzles.has('exit')) {
      currentPuzzle = 'exit';
    } else if (this.state.currentRoom === 0) {
      this.events.emit('showHint', '카드키를 사용해서 문을 열어보세요.');
      this.state.hintsUsed++;
      setTimeout(() => this.events.emit('hideHint'), 5000);
      return;
    }

    if (!currentPuzzle) {
      this.events.emit('showHint', '주변을 더 탐색해보세요.');
      setTimeout(() => this.events.emit('hideHint'), 4000);
      return;
    }

    const puzzle = PUZZLES[currentPuzzle];
    const hintLevel = Math.min(this.state.hintsUsed, 2);
    this.events.emit('showHint', puzzle.hints[hintLevel]);
    this.state.hintsUsed++;
    setTimeout(() => this.events.emit('hideHint'), 6000);
  }

  private triggerEnding(): void {
    this.events.emit('fadeIn');
    if (!this.isMobile) document.exitPointerLock();
    this.state.paused = true;

    setTimeout(() => {
      this.events.emit(
        'triggerEnding',
        this.state.elapsed,
        this.state.hintsUsed,
        this.state.discoveredClues.size,
      );
      this.events.emit('fadeOut', 2);
    }, 2500);
  }

  // Mobile look control
  handleMobileLook(dx: number, dy: number): void {
    const sensitivity = 0.004;
    this.euler.setFromQuaternion(this.sceneCtx.camera.quaternion);
    this.euler.y += dx * sensitivity;
    this.euler.x += dy * sensitivity;
    this.euler.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.euler.x));
    this.sceneCtx.camera.quaternion.setFromEuler(this.euler);
  }

  // Mobile joystick control
  setMobileMove(forward: boolean, backward: boolean, left: boolean, right: boolean): void {
    this.controls.moveForward = forward;
    this.controls.moveBackward = backward;
    this.controls.moveLeft = left;
    this.controls.moveRight = right;
  }

  getItemName(id: string): string {
    return ITEM_NAMES[id] || id;
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.animFrameId);
    if (this.flickerInterval) clearInterval(this.flickerInterval);
    if (this.cleanupControls) this.cleanupControls();

    const onResize = (this as unknown as Record<string, unknown>)._onResize as EventListener;
    const onEsc = (this as unknown as Record<string, unknown>)._onEsc as EventListener;
    if (onResize) window.removeEventListener('resize', onResize);
    if (onEsc) document.removeEventListener('keydown', onEsc);

    this.events.removeAll();

    if (this.sceneCtx) {
      this.sceneCtx.renderer.dispose();
      this.sceneCtx.renderer.domElement.remove();
    }
  }
}
