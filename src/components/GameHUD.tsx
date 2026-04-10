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
    <div className="w-full flex items-center justify-between px-4 py-3 metal-panel" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-green-400 transition-colors font-mono-crt"
      >
        <ArrowLeft size={18} />
        <span className="text-sm hidden sm:inline">MENU</span>
      </button>

      <div className="flex flex-col items-center">
        {phase === 'battle' && (
          <div className="flex items-center gap-4 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-green-500/70 font-mono-crt">ALLY</span>
              <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--hull-dark)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(opponentHits / totalShipCells) * 100}%`, background: 'linear-gradient(90deg, #39ff14, #22cc00)' }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--hull-dark)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(playerHits / totalShipCells) * 100}%`, background: 'linear-gradient(90deg, #ff3c3c, #cc0000)' }}
                />
              </div>
              <span className="text-xs text-red-500/70 font-mono-crt">ENEMY</span>
            </div>
          </div>
        )}

        <div
          className={`text-sm font-semibold px-4 py-1 rounded font-mono-crt ${
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
      </div>

      <button
        onClick={handleToggle}
        className="text-slate-500 hover:text-green-400 transition-colors p-1"
        title={soundOn ? 'Mute Sonar' : 'Enable Sonar'}
      >
        {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>
    </div>
  );
}
