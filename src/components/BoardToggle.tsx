import { Crosshair, Shield } from 'lucide-react';

interface BoardToggleProps {
  activeBoard: 'player' | 'opponent';
  onToggle: (board: 'player' | 'opponent') => void;
}

export function BoardToggle({ activeBoard, onToggle }: BoardToggleProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      onToggle(activeBoard === 'player' ? 'opponent' : 'player');
    }
  };

  return (
    <div className="flex lg:hidden justify-center gap-2 mb-3" role="tablist" aria-label="Board view">
      <button
        role="tab"
        aria-selected={activeBoard === 'player'}
        aria-controls="player-board-panel"
        id="player-board-tab"
        tabIndex={activeBoard === 'player' ? 0 : -1}
        onClick={() => onToggle('player')}
        onKeyDown={handleKeyDown}
        className={`flex items-center gap-1.5 px-4 py-2 rounded text-xs font-mono-crt transition-all touch-manipulation ${
          activeBoard === 'player'
            ? 'metal-panel text-glow-green border-green-500/40'
            : 'metal-panel-light text-slate-500 hover:text-slate-300'
        }`}
      >
        <Shield size={14} />
        YOUR FLEET
      </button>
      <button
        role="tab"
        aria-selected={activeBoard === 'opponent'}
        aria-controls="opponent-board-panel"
        id="opponent-board-tab"
        tabIndex={activeBoard === 'opponent' ? 0 : -1}
        onClick={() => onToggle('opponent')}
        onKeyDown={handleKeyDown}
        className={`flex items-center gap-1.5 px-4 py-2 rounded text-xs font-mono-crt transition-all touch-manipulation ${
          activeBoard === 'opponent'
            ? 'metal-panel text-glow-amber border-amber-500/40'
            : 'metal-panel-light text-slate-500 hover:text-slate-300'
        }`}
      >
        <Crosshair size={14} />
        ENEMY WATERS
      </button>
    </div>
  );
}
