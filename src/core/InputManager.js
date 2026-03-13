// 키보드/마우스 입력 처리
export class InputManager {
  constructor() {
    this.keys = {};
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.isPointerLocked = false;
    this.onInteract = null;
    this.onFlashlight = null;
    this.onInventory = null;
    this.onPause = null;
    this.onCrouch = null;
    this.onUseItem = null;

    this._bindEvents();
  }

  _bindEvents() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.code === 'KeyE' && this.onInteract) this.onInteract();
      if (e.code === 'KeyF' && this.onFlashlight) this.onFlashlight();
      if (e.code === 'Tab') {
        e.preventDefault();
        if (this.onInventory) this.onInventory();
      }
      if (e.code === 'Escape' && this.onPause) this.onPause();
      if (e.code === 'KeyC' && this.onCrouch) this.onCrouch();
      if (e.code === 'KeyQ' && this.onUseItem) this.onUseItem();
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked) {
        this.mouseDX += e.movementX;
        this.mouseDY += e.movementY;
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = !!document.pointerLockElement;
    });
  }

  consumeMouse() {
    const dx = this.mouseDX;
    const dy = this.mouseDY;
    this.mouseDX = 0;
    this.mouseDY = 0;
    return { dx, dy };
  }

  get forward() { return this.keys['KeyW'] || this.keys['ArrowUp']; }
  get backward() { return this.keys['KeyS'] || this.keys['ArrowDown']; }
  get left() { return this.keys['KeyA'] || this.keys['ArrowLeft']; }
  get right() { return this.keys['KeyD'] || this.keys['ArrowRight']; }
  get run() { return this.keys['ShiftLeft'] || this.keys['ShiftRight']; }
  get crouch() { return this.keys['KeyC']; }

  requestPointerLock(element) {
    element.requestPointerLock();
  }
}
