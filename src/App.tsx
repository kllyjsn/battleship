import { useState, useEffect } from 'react';
import { MainMenu } from './components/MainMenu';
import { SinglePlayer } from './pages/SinglePlayer';
import { MultiplayerPage } from './pages/Multiplayer';
import type { Difficulty } from './engine/types';
import { loadTheme, applyTheme } from './lib/themes';

type Screen = 'menu' | 'single' | 'multiplayer';

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

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
    setScreen('menu');
  };

  let content;
  switch (screen) {
    case 'single':
      content = <SinglePlayer difficulty={difficulty} onBack={handleBack} />;
      break;
    case 'multiplayer':
      content = <MultiplayerPage onBack={handleBack} />;
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
