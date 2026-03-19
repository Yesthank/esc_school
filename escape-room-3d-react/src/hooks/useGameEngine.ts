import { useCallback, useEffect, useRef, useState } from 'react';
import { GameEngine } from '../engine/GameEngine';
import type { GameScreen, ItemId } from '../types/game';

export interface GameEngineState {
  screen: GameScreen;
  roomName: string;
  timerDisplay: string;
  inventory: ItemId[];
  interactPrompt: string;
  dialogTitle: string;
  dialogContent: string;
  dialogOpen: boolean;
  codePanelOpen: boolean;
  codePanelTitle: string;
  codePanelSubtitle: string;
  codeDisplay: string;
  codeResultText: string;
  codeResultColor: string;
  flashMessage: string;
  hintText: string;
  hintVisible: boolean;
  fadeVisible: boolean;
  fadeDuration: number;
  endingVisible: boolean;
  endingElapsed: number;
  endingHints: number;
  endingClues: number;
}

export function useGameEngine() {
  const engineRef = useRef<GameEngine | null>(null);
  const [state, setState] = useState<GameEngineState>({
    screen: 'title',
    roomName: '',
    timerDisplay: '00:00',
    inventory: [],
    interactPrompt: '',
    dialogTitle: '',
    dialogContent: '',
    dialogOpen: false,
    codePanelOpen: false,
    codePanelTitle: '',
    codePanelSubtitle: '',
    codeDisplay: '',
    codeResultText: '',
    codeResultColor: '',
    flashMessage: '',
    hintText: '',
    hintVisible: false,
    fadeVisible: false,
    fadeDuration: 0.8,
    endingVisible: false,
    endingElapsed: 0,
    endingHints: 0,
    endingClues: 0,
  });

  const flashTimerRef = useRef<number>(0);

  const startGame = useCallback((container: HTMLElement) => {
    if (engineRef.current) return;
    const engine = new GameEngine();
    engineRef.current = engine;

    engine.events.on('screenChange', (screen: unknown) => {
      setState((s) => ({ ...s, screen: screen as GameScreen }));
    });
    engine.events.on('roomChange', (name: unknown) => {
      setState((s) => ({ ...s, roomName: name as string }));
    });
    engine.events.on('timerUpdate', (display: unknown) => {
      setState((s) => ({ ...s, timerDisplay: display as string }));
    });
    engine.events.on('inventoryChange', (items: unknown) => {
      setState((s) => ({ ...s, inventory: items as ItemId[] }));
    });
    engine.events.on('interactPrompt', (text: unknown) => {
      setState((s) => ({ ...s, interactPrompt: text as string }));
    });
    engine.events.on('showDialog', (title: unknown, content: unknown) => {
      setState((s) => ({
        ...s,
        dialogOpen: true,
        dialogTitle: title as string,
        dialogContent: content as string,
      }));
    });
    engine.events.on('closeDialog', () => {
      setState((s) => ({ ...s, dialogOpen: false }));
    });
    engine.events.on('showCodePanel', (title: unknown, subtitle: unknown) => {
      setState((s) => ({
        ...s,
        codePanelOpen: true,
        codePanelTitle: title as string,
        codePanelSubtitle: subtitle as string,
        codeDisplay: '',
        codeResultText: '',
        codeResultColor: '',
      }));
    });
    engine.events.on('codeDisplayUpdate', (display: unknown) => {
      setState((s) => ({ ...s, codeDisplay: display as string }));
    });
    engine.events.on('codeResult', (text: unknown, color: unknown) => {
      setState((s) => ({ ...s, codeResultText: text as string, codeResultColor: color as string }));
    });
    engine.events.on('closeCodePanel', () => {
      setState((s) => ({ ...s, codePanelOpen: false }));
    });
    engine.events.on('flashMessage', (text: unknown) => {
      setState((s) => ({ ...s, flashMessage: text as string }));
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = window.setTimeout(() => {
        setState((s) => ({ ...s, flashMessage: '' }));
      }, 2500);
    });
    engine.events.on('showHint', (text: unknown) => {
      setState((s) => ({ ...s, hintText: text as string, hintVisible: true }));
    });
    engine.events.on('hideHint', () => {
      setState((s) => ({ ...s, hintVisible: false }));
    });
    engine.events.on('fadeIn', () => {
      setState((s) => ({ ...s, fadeVisible: true, fadeDuration: 0.8 }));
    });
    engine.events.on('fadeOut', (duration: unknown) => {
      setState((s) => ({
        ...s,
        fadeVisible: false,
        fadeDuration: typeof duration === 'number' ? duration : 0.8,
      }));
    });
    engine.events.on('triggerEnding', (elapsed: unknown, hints: unknown, clues: unknown) => {
      setState((s) => ({
        ...s,
        endingVisible: true,
        endingElapsed: elapsed as number,
        endingHints: hints as number,
        endingClues: clues as number,
      }));
    });

    engine.start(container);
  }, []);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  return {
    state,
    engineRef,
    startGame,
    closeDialog: () => engineRef.current?.closeDialog(),
    codePress: (key: string) => engineRef.current?.codePress(key),
    closeCodePanel: () => engineRef.current?.closeCodePanel(),
    showHint: () => engineRef.current?.showHint(),
    interact: () => engineRef.current?.interact(),
    requestPointerLock: () => engineRef.current?.requestPointerLock(),
    handleMobileLook: (dx: number, dy: number) => engineRef.current?.handleMobileLook(dx, dy),
    setMobileMove: (f: boolean, b: boolean, l: boolean, r: boolean) =>
      engineRef.current?.setMobileMove(f, b, l, r),
    getItemName: (id: string) => engineRef.current?.getItemName(id) || id,
    getIsMobile: () => engineRef.current?.getIsMobile() ?? false,
  };
}
