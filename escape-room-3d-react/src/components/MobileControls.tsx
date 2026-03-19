import { useCallback, useRef } from 'react';
import styles from './MobileControls.module.css';

interface Props {
  onInteract: () => void;
  onLook: (dx: number, dy: number) => void;
  onMove: (forward: boolean, backward: boolean, left: boolean, right: boolean) => void;
}

export default function MobileControls({ onInteract, onLook, onMove }: Props) {
  const knobRef = useRef<HTMLDivElement>(null);
  const joystickRef = useRef<HTMLDivElement>(null);
  const lookTouchIdRef = useRef<number | null>(null);
  const lookLastRef = useRef({ x: 0, y: 0 });
  const joystickActiveRef = useRef(false);
  const joystickStartRef = useRef({ x: 0, y: 0 });
  const interactBtnRef = useRef<HTMLDivElement>(null);

  // Joystick handlers
  const onJoystickTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = joystickRef.current!.getBoundingClientRect();
    joystickStartRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    joystickActiveRef.current = true;
  }, []);

  const onJoystickTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!joystickActiveRef.current) return;
    const t = e.changedTouches[0];
    const maxR = 50;
    let dx = t.clientX - joystickStartRef.current.x;
    let dy = t.clientY - joystickStartRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    if (knobRef.current) {
      knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    const ndx = dx / maxR;
    const ndy = dy / maxR;
    onMove(ndy < -0.2, ndy > 0.2, ndx < -0.2, ndx > 0.2);
  }, [onMove]);

  const onJoystickTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    joystickActiveRef.current = false;
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(0, 0)';
    }
    onMove(false, false, false, false);
  }, [onMove]);

  // Look area handlers
  const onLookTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    const jRect = joystickRef.current?.getBoundingClientRect();
    const iRect = interactBtnRef.current?.getBoundingClientRect();
    const pad = 20;
    if (jRect && t.clientX >= jRect.left - pad && t.clientX <= jRect.right + pad &&
        t.clientY >= jRect.top - pad && t.clientY <= jRect.bottom + pad) return;
    if (iRect && t.clientX >= iRect.left - pad && t.clientX <= iRect.right + pad &&
        t.clientY >= iRect.top - pad && t.clientY <= iRect.bottom + pad) return;
    if (lookTouchIdRef.current !== null) return;
    lookTouchIdRef.current = t.identifier;
    lookLastRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onLookTouchMove = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === lookTouchIdRef.current) {
        const dx = t.clientX - lookLastRef.current.x;
        const dy = t.clientY - lookLastRef.current.y;
        onLook(dx, dy);
        lookLastRef.current = { x: t.clientX, y: t.clientY };
        break;
      }
    }
  }, [onLook]);

  const onLookTouchEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchIdRef.current) {
        lookTouchIdRef.current = null;
        break;
      }
    }
  }, []);

  // Interact button
  const onInteractTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onInteract();
    if (interactBtnRef.current) {
      interactBtnRef.current.style.background = 'rgba(0,229,255,0.4)';
      setTimeout(() => {
        if (interactBtnRef.current) {
          interactBtnRef.current.style.background = 'rgba(0,229,255,0.15)';
        }
      }, 150);
    }
  }, [onInteract]);

  return (
    <div className={styles.mobileControls}>
      <div
        className={styles.lookArea}
        onTouchStart={onLookTouchStart}
        onTouchMove={onLookTouchMove}
        onTouchEnd={onLookTouchEnd}
        onTouchCancel={onLookTouchEnd}
      />
      <div
        ref={joystickRef}
        className={styles.joystick}
        onTouchStart={onJoystickTouchStart}
        onTouchMove={onJoystickTouchMove}
        onTouchEnd={onJoystickTouchEnd}
        onTouchCancel={onJoystickTouchEnd}
      >
        <div ref={knobRef} className={styles.knob} />
      </div>
      <div
        ref={interactBtnRef}
        className={styles.interactBtn}
        onTouchStart={onInteractTouch}
      >
        E
      </div>
    </div>
  );
}
