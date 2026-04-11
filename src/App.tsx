import { useState, useEffect } from 'react';
import { MainMenu } from './components/MainMenu';
import { SinglePlayer } from './pages/SinglePlayer';
import { MultiplayerPage } from './pages/Multiplayer';
import type { Difficulty } from './engine/types';
import { loadTheme, applyTheme } from './lib/themes';

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

  // Load and apply saved theme on mount
  useEffect(() => {
    const themeId = loadTheme();
    applyTheme(themeId);
  }, []);

  const handleStartSinglePlayer = (diff: Difficulty) => {
    setDifficulty(diff);
    setScreen('single');
  };

  const handleStartMultiplayer = () => {
    setScreen('multiplayer');
  };

  const handleBack = () => {
    setJoinRoomCode(null);
    // Clear join path or query params when going back
    if (window.location.pathname !== '/' || window.location.search) {
      window.history.replaceState({}, '', '/');
    }
    setScreen('menu');
  };

  let content;
  switch (screen) {
    case 'single':
      content = <SinglePlayer difficulty={difficulty} onBack={handleBack} />;
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
    </>
  );
}

export default App;
