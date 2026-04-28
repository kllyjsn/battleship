import { useEffect } from 'react';
import { X, Map } from 'lucide-react';
import { BOARD_SIZE, ROW_LABELS, COL_LABELS } from '../engine/constants';
import type { Board } from '../engine/types';

interface AttackHeatmapProps {
  board: Board;
  onClose: () => void;
  title?: string;
}

export function AttackHeatmap({ board, onClose, title = 'TACTICAL MAP' }: AttackHeatmapProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  let hits = 0;
  let misses = 0;
  let total = 0;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const s = board[r][c].state;
      if (s === 'hit' || s === 'sunk') { hits++; total++; }
      else if (s === 'miss') { misses++; total++; }
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="metal-panel rounded-xl p-5 max-w-sm w-full mx-4 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-green-400 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center justify-center gap-2 mb-3">
          <Map size={18} className="text-glow-green" />
          <h2 className="text-lg font-bold font-mono-crt text-glow-green">{title}</h2>
        </div>

        {/* Stats summary */}
        <div className="flex items-center justify-center gap-4 mb-3 text-xs font-mono-crt">
          <span className="text-green-400">HITS: <span className="font-bold">{hits}</span></span>
          <span className="text-slate-500">MISS: <span className="font-bold">{misses}</span></span>
          <span className="text-amber-400">ACC: <span className="font-bold">{total > 0 ? ((hits / total) * 100).toFixed(0) : 0}%</span></span>
        </div>

        {/* Mini grid */}
        <div className="inline-flex flex-col items-center">
          {/* Column headers */}
          <div className="flex">
            <div className="w-5 h-5" />
            {COL_LABELS.map(label => (
              <div key={label} className="w-5 h-5 flex items-center justify-center text-[10px] font-mono-crt text-slate-600">
                {label}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {board.map((row, rowIdx) => (
            <div key={rowIdx} className="flex">
              <div className="w-5 h-5 flex items-center justify-center text-[10px] font-mono-crt text-slate-600">
                {ROW_LABELS[rowIdx]}
              </div>
              {row.map((cell, colIdx) => {
                const s = cell.state;
                let bgColor = 'bg-[#0d1520]'; // untouched
                let borderColor = 'border-[#1a2535]/50';
                let glow = '';

                if (s === 'hit') {
                  bgColor = 'bg-orange-500/70';
                  borderColor = 'border-orange-600/50';
                  glow = 'shadow-[0_0_3px_rgba(255,150,0,0.4)]';
                } else if (s === 'sunk') {
                  bgColor = 'bg-red-600/80';
                  borderColor = 'border-red-700/50';
                  glow = 'shadow-[0_0_4px_rgba(255,60,60,0.5)]';
                } else if (s === 'miss') {
                  bgColor = 'bg-slate-700/40';
                  borderColor = 'border-slate-600/30';
                }

                return (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    className={`w-5 h-5 border ${bgColor} ${borderColor} ${glow} transition-colors`}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-3 mt-3 text-[11px] font-mono-crt text-slate-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-600/80" /> SUNK
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-orange-500/70" /> HIT
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-slate-700/40" /> MISS
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#0d1520] border border-[#1a2535]/50" /> NONE
          </span>
        </div>

        <button
          onClick={onClose}
          className="mt-4 px-6 py-2 rounded metal-panel-light text-green-300 font-semibold font-mono-crt text-sm hover:ring-1 hover:ring-green-400/40 transition-all"
        >
          DISMISS
        </button>
      </div>
    </div>
  );
}
