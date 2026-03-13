// 키보드/마우스/터치 입력 처리
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

    // 모바일 감지
    this.isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || ('ontouchstart' in window && window.innerWidth < 1024);

    // 터치 조이스틱 상태
    this._touchMoveId = null;
    this._touchLookId = null;
    this._joystickOrigin = { x: 0, y: 0 };
    this._joystickDelta = { x: 0, y: 0 };
    this._touchLookOrigin = { x: 0, y: 0 };
    this._isRunning = false;
    this._isCrouching = false;

    this._bindEvents();

    if (this.isMobile) {
      this._setupMobileControls();
    }
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

  // ─── 모바일 터치 컨트롤 설정 ──────────────────
  _setupMobileControls() {
    document.body.classList.add('mobile');

    // 터치 영역: 왼쪽 절반 = 이동 조이스틱, 오른쪽 절반 = 시점 회전
    const canvas = document.getElementById('game-canvas');

    canvas.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
    canvas.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
    canvas.addEventListener('touchend', (e) => this._onTouchEnd(e), { passive: false });
    canvas.addEventListener('touchcancel', (e) => this._onTouchEnd(e), { passive: false });
  }

  _onTouchStart(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const x = touch.clientX;
      const halfW = window.innerWidth / 2;

      if (x < halfW && this._touchMoveId === null) {
        // 왼쪽: 이동 조이스틱
        this._touchMoveId = touch.identifier;
        this._joystickOrigin = { x: touch.clientX, y: touch.clientY };
        this._joystickDelta = { x: 0, y: 0 };
        this._showJoystick(touch.clientX, touch.clientY);
      } else if (x >= halfW && this._touchLookId === null) {
        // 오른쪽: 시점 회전
        this._touchLookId = touch.identifier;
        this._touchLookOrigin = { x: touch.clientX, y: touch.clientY };
      }
    }
  }

  _onTouchMove(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      if (touch.identifier === this._touchMoveId) {
        // 조이스틱 이동
        const dx = touch.clientX - this._joystickOrigin.x;
        const dy = touch.clientY - this._joystickOrigin.y;
        const maxDist = 50;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const clamped = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);

        this._joystickDelta = {
          x: (Math.cos(angle) * clamped) / maxDist,
          y: (Math.sin(angle) * clamped) / maxDist,
        };

        // 조이스틱 비주얼 업데이트
        this._updateJoystick(
          this._joystickOrigin.x + Math.cos(angle) * clamped,
          this._joystickOrigin.y + Math.sin(angle) * clamped,
        );

        // 멀리 밀면 자동 달리기
        this._isRunning = dist > maxDist * 0.75;

      } else if (touch.identifier === this._touchLookId) {
        // 시점 회전
        const dx = touch.clientX - this._touchLookOrigin.x;
        const dy = touch.clientY - this._touchLookOrigin.y;
        this.mouseDX += dx * 0.6;
        this.mouseDY += dy * 0.6;
        this._touchLookOrigin = { x: touch.clientX, y: touch.clientY };
      }
    }
  }

  _onTouchEnd(e) {
    for (const touch of e.changedTouches) {
      if (touch.identifier === this._touchMoveId) {
        this._touchMoveId = null;
        this._joystickDelta = { x: 0, y: 0 };
        this._isRunning = false;
        this._hideJoystick();
      }
      if (touch.identifier === this._touchLookId) {
        this._touchLookId = null;
      }
    }
  }

  // ─── 조이스틱 비주얼 ─────────────────────────
  _showJoystick(x, y) {
    let base = document.getElementById('joystick-base');
    let knob = document.getElementById('joystick-knob');

    if (!base) {
      base = document.createElement('div');
      base.id = 'joystick-base';
      document.body.appendChild(base);

      knob = document.createElement('div');
      knob.id = 'joystick-knob';
      document.body.appendChild(knob);
    }

    base.style.display = 'block';
    base.style.left = `${x - 60}px`;
    base.style.top = `${y - 60}px`;

    knob.style.display = 'block';
    knob.style.left = `${x - 25}px`;
    knob.style.top = `${y - 25}px`;
  }

  _updateJoystick(x, y) {
    const knob = document.getElementById('joystick-knob');
    if (knob) {
      knob.style.left = `${x - 25}px`;
      knob.style.top = `${y - 25}px`;
    }
  }

  _hideJoystick() {
    const base = document.getElementById('joystick-base');
    const knob = document.getElementById('joystick-knob');
    if (base) base.style.display = 'none';
    if (knob) knob.style.display = 'none';
  }

  consumeMouse() {
    const dx = this.mouseDX;
    const dy = this.mouseDY;
    this.mouseDX = 0;
    this.mouseDY = 0;
    return { dx, dy };
  }

  // 조이스틱 입력을 키보드와 통합
  get forward() {
    return this.keys['KeyW'] || this.keys['ArrowUp'] || this._joystickDelta.y < -0.2;
  }
  get backward() {
    return this.keys['KeyS'] || this.keys['ArrowDown'] || this._joystickDelta.y > 0.2;
  }
  get left() {
    return this.keys['KeyA'] || this.keys['ArrowLeft'] || this._joystickDelta.x < -0.2;
  }
  get right() {
    return this.keys['KeyD'] || this.keys['ArrowRight'] || this._joystickDelta.x > 0.2;
  }
  get run() {
    return this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this._isRunning;
  }
  get crouch() {
    return this.keys['KeyC'] || this._isCrouching;
  }

  // 모바일 버튼에서 호출
  triggerInteract() { if (this.onInteract) this.onInteract(); }
  triggerFlashlight() { if (this.onFlashlight) this.onFlashlight(); }
  triggerInventory() { if (this.onInventory) this.onInventory(); }
  triggerPause() { if (this.onPause) this.onPause(); }
  triggerCrouch() {
    this._isCrouching = !this._isCrouching;
    if (this.onCrouch) this.onCrouch();
  }
  triggerUseItem() { if (this.onUseItem) this.onUseItem(); }

  requestPointerLock(element) {
    // 모바일에서는 포인터 락 불필요
    if (this.isMobile) {
      this.isPointerLocked = true;
      return;
    }
    element.requestPointerLock();
  }
}
