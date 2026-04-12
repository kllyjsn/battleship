import { useState, useEffect } from 'react';
import { MainMenu } from './components/MainMenu';
import { SinglePlayer } from './pages/SinglePlayer';
import { MultiplayerPage } from './pages/Multiplayer';
import type { Difficulty } from './engine/types';
import { loadTheme, applyTheme } from './lib/themes';
import { loadSavedGame, clearSavedGame } from './lib/gamePersistence';
import type { SavedGameState } from './lib/gamePersistence';
import { ConfirmDialog } from './components/ConfirmDialog';

type Screen = 'menu' | 'single' | 'multiplayer';

function getRoomCodeFromURL(): string | null {
  // Support /join/CODE path format
  const match = window.location.pathname.match(/^\/join\/([A-Za-z0-9]+)$/);
  if (match) return match[1].toUpperCase();
  // Fallback: support ?room=CODE query param
  const params = new URLSearchParams(window.location.search);
  return params.get('room')?.toUpperCase() || null;
}

function App() {
  const initialRoom = getRoomCodeFromURL();
  const [screen, setScreen] = useState<Screen>(initialRoom ? 'multiplayer' : 'menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [joinRoomCode, setJoinRoomCode] = useState<string | null>(initialRoom);
  const [resumeState, setResumeState] = useState<SavedGameState | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [pendingSave, setPendingSave] = useState<SavedGameState | null>(null);

  // Load and apply saved theme on mount
  useEffect(() => {
    const themeId = loadTheme();
    applyTheme(themeId);
  }, []);

  // On mount, check for a saved game and prompt the user
  useEffect(() => {
    if (initialRoom) return; // Don't interrupt multiplayer join flow
    const saved = loadSavedGame();
    if (saved) {
      setPendingSave(saved);
      setShowResumePrompt(true);
    }
  }, []);

  const handleResume = () => {
    if (pendingSave) {
      setDifficulty(pendingSave.difficulty);
      setResumeState(pendingSave);
      setScreen('single');
    }
    setShowResumePrompt(false);
    setPendingSave(null);
  };

  const handleDeclineResume = () => {
    clearSavedGame();
    setShowResumePrompt(false);
    setPendingSave(null);
  };

  const handleStartSinglePlayer = (diff: Difficulty) => {
    setDifficulty(diff);
    setResumeState(null);
    setScreen('single');
  };

  const handleStartMultiplayer = () => {
    setScreen('multiplayer');
  };

  const handleBack = () => {
    setJoinRoomCode(null);
    setResumeState(null);
    // Clear join path or query params when going back
    if (window.location.pathname !== '/' || window.location.search) {
      window.history.replaceState({}, '', '/');
    }
    setScreen('menu');
  };

  let content;
  switch (screen) {
    case 'single':
      content = <SinglePlayer difficulty={difficulty} onBack={handleBack} resumeState={resumeState} />;
      break;
    case 'multiplayer':
      content = <MultiplayerPage onBack={handleBack} initialRoomCode={joinRoomCode} />;
      break;
    default:
      content = (
        <MainMenu
          onStartSinglePlayer={handleStartSinglePlayer}
          onStartMultiplayer={handleStartMultiplayer}
        />
      );
  }

  return (
    <>
      {content}
      <div className="crt-overlay" />
      {showResumePrompt && (
        <ConfirmDialog
          title="RESUME MISSION"
          message={`A ${pendingSave?.difficulty?.toUpperCase() ?? ''} game in progress was found. Resume where you left off?`}
          confirmLabel="Resume"
          cancelLabel="New Game"
          onConfirm={handleResume}
          onCancel={handleDeclineResume}
        />
      )}
    </>
  );
}

export default App;
