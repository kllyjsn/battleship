import { Crosshair, Shield } from 'lucide-react';

interface BoardToggleProps {
  activeBoard: 'player' | 'opponent';
  onToggle: (board: 'player' | 'opponent') => void;
}

export function BoardToggle({ activeBoard, onToggle }: BoardToggleProps) {
  return (
    <div className="flex lg:hidden justify-center gap-2 mb-3">
      <button
        onClick={() => onToggle('player')}
        aria-pressed={activeBoard === 'player'}
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
        onClick={() => onToggle('opponent')}
        aria-pressed={activeBoard === 'opponent'}
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
