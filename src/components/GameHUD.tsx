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
    <div className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-cyan-900/30 backdrop-blur-sm">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={18} />
        <span className="text-sm hidden sm:inline">Menu</span>
      </button>

      <div className="flex flex-col items-center">
        {phase === 'battle' && (
          <div className="flex items-center gap-4 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">YOU</span>
              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${(opponentHits / totalShipCells) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${(playerHits / totalShipCells) * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-400">ENEMY</span>
            </div>
          </div>
        )}

        <div
          className={`text-sm font-medium px-4 py-1 rounded-full ${
            phase === 'gameover'
              ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700/40'
              : isPlayerTurn
                ? 'bg-cyan-900/30 text-cyan-300 border border-cyan-700/40 animate-pulse'
                : 'bg-orange-900/30 text-orange-300 border border-orange-700/40'
          }`}
        >
          {message}
        </div>
      </div>

      <button
        onClick={handleToggle}
        className="text-slate-400 hover:text-white transition-colors p-1"
        title={soundOn ? 'Mute' : 'Unmute'}
      >
        {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>
    </div>
  );
}
