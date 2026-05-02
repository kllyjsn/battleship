import { useState, useEffect, useRef, memo } from 'react';
import { type CellState } from '../engine/types';
import { ROW_LABELS, COL_LABELS } from '../engine/constants';

/**
 * Lifetime of one-shot cell animations (hit explosion, miss ripple, sunk
 * flash). Must be ≥ the longest CSS animation duration referenced in
 * index.css for those keyframes (currently 0.6s).
 */
const CELL_ANIM_DURATION_MS = 600;

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
  animating?: 'hit' | 'miss' | 'sunk' | null;
  isCursor?: boolean;
  /**
   * If true, the cell becomes the single tab-stop for the grid's roving
   * tabindex. Page-level keyboard handlers move the cursor with arrow keys,
   * so only the active cell needs to be tabbable.
   */
  isTabStop?: boolean;
}

const PARTICLE_DIRECTIONS = [
  { dx: '-15px', dy: '-18px' },
  { dx: '15px', dy: '-18px' },
  { dx: '-20px', dy: '-5px' },
  { dx: '20px', dy: '-5px' },
  { dx: '-10px', dy: '15px' },
  { dx: '10px', dy: '15px' },
  { dx: '0px', dy: '-22px' },
  { dx: '0px', dy: '18px' },
];

export const Cell = memo(function Cell({
  row,
  col,
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
  animating = null,
  isCursor = false,
  isTabStop = false,
}: CellProps) {
  const [activeAnim, setActiveAnim] = useState<'hit' | 'miss' | 'sunk' | null>(null);
  const prevStateRef = useRef<CellState>(state);

  useEffect(() => {
    if (animating) {
      setActiveAnim(animating);
      const timer = setTimeout(() => setActiveAnim(null), CELL_ANIM_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [animating]);

  // Detect state changes from empty/ship to hit/miss/sunk so the cell can
  // self-trigger the right animation even when the parent doesn't pass an
  // explicit `animating` prop (e.g. multiplayer attack results that arrive
  // through a network message).
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;
    if ((prev === 'empty' || prev === 'ship') && (state === 'hit' || state === 'miss' || state === 'sunk')) {
      setActiveAnim(state);
      const timer = setTimeout(() => setActiveAnim(null), CELL_ANIM_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const getClassName = () => {
    // Fluid cell sizing: 38px floor (WCAG 2.5.5 minimum is 24px; Apple HIG &
    // WCAG 2.5.8 AAA recommend 44px). We can't reach 44px on a 10×10 board at
    // 320px-wide viewports, so we scale up to 44px wherever the viewport
    // allows it. `touch-manipulation` removes the 300ms tap delay.
    const base =
      'w-[clamp(38px,9.4vw,44px)] h-[clamp(38px,9.4vw,44px)] sm:w-10 sm:h-10 md:w-11 md:h-11 border relative transition-all duration-150 select-none overflow-hidden touch-manipulation';

    if (isPreview) {
      return `${base} ${isInvalid ? 'bg-red-500/30 border-red-400/60' : 'bg-green-500/20 border-green-400/50'} cursor-pointer`;
    }

    switch (state) {
      case 'empty':
        return `${base} ${
          !isPlayerBoard && !isPlacing && !disabled
            ? 'cell-ocean-shimmer border-[var(--cell-empty-border)] hover:bg-[var(--cell-hover)] hover:border-[var(--cell-hover-border)] cursor-crosshair'
            : isPlacing && isPlayerBoard
              ? 'cell-ocean-shimmer border-[var(--cell-empty-border)] hover:bg-[var(--cell-hover)] cursor-pointer'
              : 'cell-ocean-shimmer border-[var(--cell-empty-border)]'
        }`;
      case 'ship':
        return `${base} ${isPlayerBoard ? (hideShipFill ? 'bg-[var(--cell-empty)]/80 border-[var(--cell-empty-border)]' : 'bg-[var(--cell-ship)] border-[var(--cell-ship-border)]') : 'cell-ocean-shimmer border-[var(--cell-empty-border)] hover:bg-[var(--cell-hover)] hover:border-[var(--cell-hover-border)] cursor-crosshair'}`;
      case 'hit':
        return `${base} bg-[var(--cell-hit)] border-red-700/50 cell-hit`;
      case 'miss':
        return `${base} bg-[var(--cell-miss)] border-[var(--cell-empty-border)] cell-miss`;
      case 'sunk':
        return `${base} bg-[var(--cell-sunk)] border-red-700/50 cell-sunk`;
      default:
        return `${base} bg-[var(--cell-empty)] border-[var(--cell-empty-border)]`;
    }
  };

  // Build an accessible label: "Row A, Column 3 — hit"
  const cellLabel = `Row ${ROW_LABELS[row]}, Column ${COL_LABELS[col]} — ${state}`;

  return (
    <div
      className={`${getClassName()}${isCursor ? ' cell-cursor' : ''}`}
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={onHover}
      onDragOver={onDragOver}
      onDrop={onDrop}
      role={!disabled && onClick ? 'gridcell' : undefined}
      // Roving tabindex: only the active cursor cell (or one fallback per
      // grid) is in the tab order. Arrow-key navigation is wired up at the
      // page level. This keeps the tab sequence sane (≤2 stops per board)
      // for screen-reader and keyboard-only users.
      tabIndex={!disabled && onClick ? (isTabStop || isCursor ? 0 : -1) : undefined}
      aria-label={cellLabel}
      onKeyDown={(e) => {
        // Activate on Enter OR Space — both are conventional for ARIA buttons/gridcells
        if (!disabled && onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Hit explosion particles */}
      {activeAnim === 'hit' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          {PARTICLE_DIRECTIONS.map((dir, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-orange-400"
              style={{
                '--dx': dir.dx,
                '--dy': dir.dy,
                animation: `explosionParticle 0.5s ease-out ${i * 0.03}s forwards`,
                boxShadow: '0 0 4px rgba(255, 150, 0, 0.8)',
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Miss ripple rings */}
      {activeAnim === 'miss' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full border border-green-400/50"
              style={{
                animation: `waterSplash 0.6s ease-out ${i * 0.15}s forwards`,
              }}
            />
          ))}
        </div>
      )}

      {/* Sunk flash + bubbles */}
      {activeAnim === 'sunk' && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div
            className="absolute inset-0 bg-red-500/60"
            style={{ animation: 'sinkingSequence 0.6s ease-out forwards' }}
          />
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-blue-300/60"
              style={{
                left: `${20 + i * 18}%`,
                bottom: '10%',
                animation: `bubbleRise 0.8s ease-out ${i * 0.12}s forwards`,
              }}
            />
          ))}
        </div>
      )}

      {/* Static hit indicator */}
      {state === 'hit' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-4 h-4 rounded-full bg-red-500/80 ${activeAnim ? '' : 'animate-pulse'}`} style={{ boxShadow: '0 0 8px rgba(255, 60, 60, 0.6)' }} />
        </div>
      )}
      {/* Static miss indicator */}
      {state === 'miss' && !activeAnim && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-slate-400/40 ring-1 ring-slate-400/25" />
        </div>
      )}
      {/* Static sunk indicator */}
      {state === 'sunk' && !activeAnim && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 text-red-400 flex items-center justify-center font-bold text-xs font-mono-crt" style={{ textShadow: '0 0 6px rgba(255,60,60,0.5)' }}>&#10005;</div>
        </div>
      )}
      {state === 'ship' && isPlayerBoard && !hideShipFill && (
        <div className="absolute inset-1 rounded-sm bg-[#3a4a5a]/50" />
      )}
    </div>
  );
});
