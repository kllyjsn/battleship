import { useState, useEffect } from 'react';
import { MainMenu } from './components/MainMenu';
import { SinglePlayer } from './pages/SinglePlayer';
import { MultiplayerPage } from './pages/Multiplayer';
import type { Difficulty } from './engine/types';
import { loadTheme, applyTheme } from './lib/themes';

type Screen = 'menu' | 'single' | 'multiplayer';

function getRoomCodeFromURL(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('room');
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
    // Clear URL params when going back
    if (window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
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
