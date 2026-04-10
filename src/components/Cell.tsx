import { type CellState } from '../engine/types';

interface CellProps {
  row: number;
  col: number;
  state: CellState;
  isPlayerBoard: boolean;
  isPlacing: boolean;
  isPreview?: boolean;
  isInvalid?: boolean;
  onClick?: () => void;
  onHover?: () => void;
  disabled?: boolean;
}

export function Cell({
  state,
  isPlayerBoard,
  isPlacing,
  isPreview = false,
  isInvalid = false,
  onClick,
  onHover,
  disabled = false,
}: CellProps) {
  const getClassName = () => {
    const base =
      'w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 border border-cyan-900/30 relative transition-all duration-150 select-none';

    if (isPreview) {
      return `${base} ${isInvalid ? 'bg-red-500/40 border-red-400' : 'bg-emerald-500/40 border-emerald-400'} cursor-pointer`;
    }

    switch (state) {
      case 'empty':
        return `${base} ${
          !isPlayerBoard && !isPlacing && !disabled
            ? 'bg-cyan-950/60 hover:bg-cyan-700/50 cursor-crosshair'
            : isPlacing && isPlayerBoard
              ? 'bg-cyan-950/60 hover:bg-cyan-800/50 cursor-pointer'
              : 'bg-cyan-950/60'
        }`;
      case 'ship':
        return `${base} ${isPlayerBoard ? 'bg-slate-500/70 border-slate-400/50' : 'bg-cyan-950/60 hover:bg-cyan-700/50 cursor-crosshair'}`;
      case 'hit':
        return `${base} bg-red-600/70 border-red-500/60 cell-hit`;
      case 'miss':
        return `${base} bg-cyan-900/40 border-cyan-800/30 cell-miss`;
      case 'sunk':
        return `${base} bg-red-800/80 border-red-600/60 cell-sunk`;
      default:
        return `${base} bg-cyan-950/60`;
    }
  };

  return (
    <div
      className={getClassName()}
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={onHover}
      role={!disabled && onClick ? 'button' : undefined}
      tabIndex={!disabled && onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !disabled && onClick) onClick();
      }}
    >
      {state === 'hit' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50" />
        </div>
      )}
      {state === 'miss' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-slate-400/60 ring-1 ring-slate-400/30" />
        </div>
      )}
      {state === 'sunk' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 text-red-300 flex items-center justify-center font-bold text-xs">✕</div>
        </div>
      )}
      {state === 'ship' && isPlayerBoard && (
        <div className="absolute inset-1 rounded-sm bg-slate-400/50" />
      )}
    </div>
  );
}
