import { useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { SinglePlayer } from './pages/SinglePlayer';
import { MultiplayerPage } from './pages/Multiplayer';
import type { Difficulty } from './engine/types';

type Screen = 'menu' | 'single' | 'multiplayer';

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

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

  switch (screen) {
    case 'single':
      return <SinglePlayer difficulty={difficulty} onBack={handleBack} />;
    case 'multiplayer':
      return <MultiplayerPage onBack={handleBack} />;
    default:
      return (
        <MainMenu
          onStartSinglePlayer={handleStartSinglePlayer}
          onStartMultiplayer={handleStartMultiplayer}
        />
      );
  }
}

export default App;
