import { useCallback, useRef, useState } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import TitleScreen from './components/TitleScreen';
import HUD from './components/HUD';
import Dialog from './components/Dialog';
import CodePanel from './components/CodePanel';
import HintSystem from './components/HintSystem';
import EndingScreen from './components/EndingScreen';
import FadeOverlay from './components/FadeOverlay';
import FlashMessage from './components/FlashMessage';
import MobileControls from './components/MobileControls';
import styles from './App.module.css';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const {
    state,
    startGame,
    closeDialog,
    codePress,
    closeCodePanel,
    showHint,
    interact,
    requestPointerLock,
    handleMobileLook,
    setMobileMove,
    getItemName,
    engineRef,
  } = useGameEngine();

  const handleStart = useCallback(() => {
    if (!containerRef.current) return;
    startGame(containerRef.current);
    setStarted(true);
    setIsMobile(engineRef.current?.getIsMobile() ?? false);
  }, [startGame, engineRef]);

  const handleResume = useCallback(() => {
    requestPointerLock();
  }, [requestPointerLock]);

  return (
    <>
      <div ref={containerRef} className={styles.gameContainer} />

      {/* Title / Pause screen */}
      {!started && (
        <TitleScreen
          mode="title"
          isMobile={false}
          onStart={handleStart}
          onResume={handleResume}
        />
      )}
      {started && state.screen === 'paused' && (
        <TitleScreen
          mode="paused"
          isMobile={isMobile}
          onStart={handleStart}
          onResume={handleResume}
        />
      )}

      {/* HUD - visible when playing */}
      {started && state.screen === 'playing' && (
        <HUD
          timerDisplay={state.timerDisplay}
          roomName={state.roomName}
          interactPrompt={state.interactPrompt}
          inventory={state.inventory}
          getItemName={getItemName}
        />
      )}

      {/* Dialog */}
      <Dialog
        open={state.dialogOpen}
        title={state.dialogTitle}
        content={state.dialogContent}
        onClose={() => closeDialog()}
      />

      {/* Code Panel */}
      <CodePanel
        open={state.codePanelOpen}
        title={state.codePanelTitle}
        subtitle={state.codePanelSubtitle}
        display={state.codeDisplay}
        resultText={state.codeResultText}
        resultColor={state.codeResultColor}
        onPress={(key) => codePress(key)}
        onClose={() => closeCodePanel()}
      />

      {/* Hint system */}
      {started && (
        <HintSystem
          hintText={state.hintText}
          hintVisible={state.hintVisible}
          onShowHint={() => showHint()}
        />
      )}

      {/* Mobile controls */}
      {started && isMobile && state.screen === 'playing' && (
        <MobileControls
          onInteract={() => interact()}
          onLook={(dx, dy) => handleMobileLook(dx, dy)}
          onMove={(f, b, l, r) => setMobileMove(f, b, l, r)}
        />
      )}

      {/* Flash message */}
      <FlashMessage text={state.flashMessage} />

      {/* Fade overlay */}
      <FadeOverlay visible={state.fadeVisible} duration={state.fadeDuration} />

      {/* Ending screen */}
      <EndingScreen
        visible={state.endingVisible}
        elapsed={state.endingElapsed}
        hintsUsed={state.endingHints}
        discoveredClues={state.endingClues}
      />
    </>
  );
}
