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
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  disabled?: boolean;
  hideShipFill?: boolean;
}

export function Cell({
  state,
  isPlayerBoard,
  isPlacing,
  isPreview = false,
  isInvalid = false,
  onClick,
  onHover,
  onDragOver,
  onDrop,
  disabled = false,
  hideShipFill = false,
}: CellProps) {
  const getClassName = () => {
    const base =
      'w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 border relative transition-all duration-150 select-none';

    if (isPreview) {
      return `${base} ${isInvalid ? 'bg-red-500/30 border-red-400/60' : 'bg-green-500/20 border-green-400/50'} cursor-pointer`;
    }

    switch (state) {
      case 'empty':
        return `${base} ${
          !isPlayerBoard && !isPlacing && !disabled
            ? 'bg-[#0d1520] border-[#1a2535] hover:bg-[#142030] hover:border-green-500/30 cursor-crosshair'
            : isPlacing && isPlayerBoard
              ? 'bg-[#0d1520] border-[#1a2535] hover:bg-[#142030] cursor-pointer'
              : 'bg-[#0d1520] border-[#1a2535]'
        }`;
      case 'ship':
        return `${base} ${isPlayerBoard ? (hideShipFill ? 'bg-[#0d1520]/80 border-[#1a2535]' : 'bg-[#2a3040] border-[#3a4a5a]') : 'bg-[#0d1520] border-[#1a2535] hover:bg-[#142030] hover:border-green-500/30 cursor-crosshair'}`;
      case 'hit':
        return `${base} bg-red-900/60 border-red-700/50 cell-hit`;
      case 'miss':
        return `${base} bg-[#0f1825] border-[#1e3045] cell-miss`;
      case 'sunk':
        return `${base} bg-red-900/70 border-red-700/50 cell-sunk`;
      default:
        return `${base} bg-[#0d1520] border-[#1a2535]`;
    }
  };

  return (
    <div
      className={getClassName()}
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={onHover}
      onDragOver={onDragOver}
      onDrop={onDrop}
      role={!disabled && onClick ? 'button' : undefined}
      tabIndex={!disabled && onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !disabled && onClick) onClick();
      }}
    >
      {state === 'hit' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-red-500/80 animate-pulse" style={{ boxShadow: '0 0 8px rgba(255, 60, 60, 0.6)' }} />
        </div>
      )}
      {state === 'miss' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-slate-400/40 ring-1 ring-slate-400/25" />
        </div>
      )}
      {state === 'sunk' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 text-red-400 flex items-center justify-center font-bold text-xs font-mono-crt" style={{ textShadow: '0 0 6px rgba(255,60,60,0.5)' }}>✕</div>
        </div>
      )}
      {state === 'ship' && isPlayerBoard && !hideShipFill && (
        <div className="absolute inset-1 rounded-sm bg-[#3a4a5a]/50" />
      )}
    </div>
  );
}
