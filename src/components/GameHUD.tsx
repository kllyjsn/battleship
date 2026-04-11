import { Volume2, VolumeX, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

interface GameHUDProps {
  isPlayerTurn: boolean;
  message: string;
  phase: 'placement' | 'battle' | 'gameover';
  onToggleSound: () => boolean;
  onBack: () => void;
  playerHits: number;
  opponentHits: number;
  totalShipCells: number;
}

export function GameHUD({
  isPlayerTurn,
  message,
  phase,
  onToggleSound,
  onBack,
  playerHits,
  opponentHits,
  totalShipCells,
}: GameHUDProps) {
  const [soundOn, setSoundOn] = useState(true);

  const handleToggle = () => {
    const newState = onToggleSound();
    setSoundOn(newState);
  };

  return (
    <div className="w-full metal-panel" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
      {/* Top row: back button, turn message, sound toggle */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3">
        <button
          onClick={onBack}
          className="flex-shrink-0 flex items-center gap-1.5 text-slate-500 hover:text-green-400 transition-colors font-mono-crt"
        >
          <ArrowLeft size={16} />
          <span className="text-sm hidden sm:inline">MENU</span>
        </button>

        <div
          className={`text-xs sm:text-sm font-semibold px-3 py-1 rounded font-mono-crt truncate max-w-[60%] sm:max-w-none text-center ${
            phase === 'gameover'
              ? 'text-glow-amber metal-panel-light'
              : isPlayerTurn
                ? 'text-glow-green metal-panel-light glow-pulse'
                : 'text-glow-amber metal-panel-light'
          }`}
          style={{ border: '1px solid var(--steel-border)' }}
        >
          {message}
        </div>

        <button
          onClick={handleToggle}
          className="flex-shrink-0 text-slate-500 hover:text-green-400 transition-colors p-1"
          title={soundOn ? 'Mute Sonar' : 'Enable Sonar'}
        >
          {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

      {/* Progress bars row - separate line to avoid overlap */}
      {phase === 'battle' && (
        <div className="flex items-center justify-center gap-3 sm:gap-4 px-3 sm:px-4 pb-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] sm:text-xs text-green-500/70 font-mono-crt">ALLY</span>
            <div className="w-16 sm:w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--hull-dark)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(opponentHits / totalShipCells) * 100}%`, background: 'linear-gradient(90deg, #39ff14, #22cc00)' }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-16 sm:w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--hull-dark)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(playerHits / totalShipCells) * 100}%`, background: 'linear-gradient(90deg, #ff3c3c, #cc0000)' }}
              />
            </div>
            <span className="text-[10px] sm:text-xs text-red-500/70 font-mono-crt">ENEMY</span>
          </div>
        </div>
      )}
    </div>
  );
}
