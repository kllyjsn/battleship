import { type Board, type Ship, type Orientation } from '../engine/types';
import { ROW_LABELS, COL_LABELS, BOARD_SIZE, SHIPS } from '../engine/constants';
import { canPlaceShip } from '../engine/board';
import { Cell } from './Cell';
import { ShipSVG } from './ShipSVG';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useSwipe } from '../hooks/useSwipe';

interface GameBoardProps {
  board: Board;
  isPlayerBoard: boolean;
  isPlacing: boolean;
  placingShipSize?: number;
  placingShipId?: string;
  placingOrientation?: Orientation;
  onCellClick?: (row: number, col: number) => void;
  disabled?: boolean;
  title: string;
  highlight?: boolean;
  ships?: Ship[];
  onDropShip?: (row: number, col: number) => void;
  onDragSelectShip?: (shipId: string) => void;
  lastAttackResult?: 'hit' | 'miss' | 'sunk' | null;
  lastAttackPos?: { row: number; col: number } | null;
  cursorRow?: number;
  cursorCol?: number;
  showCursor?: boolean;
  hideEnemyShots?: boolean;
  onToggleHideEnemyShots?: () => void;
  onSwipeRotate?: () => void;
}

export function GameBoard({
  board,
  isPlayerBoard,
  isPlacing,
  placingShipSize,
  placingShipId,
  placingOrientation = 'horizontal',
  onCellClick,
  disabled = false,
  title,
  highlight = false,
  ships = [],
  onDropShip,
  onDragSelectShip,
  lastAttackResult = null,
  lastAttackPos = null,
  cursorRow,
  cursorCol,
  showCursor = false,
  hideEnemyShots = false,
  onToggleHideEnemyShots,
  onSwipeRotate,
}: GameBoardProps) {
  const [hoverPos, setHoverPos] = useState<{ row: number; col: number } | null>(null);
  const [shaking, setShaking] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState({ w: 40, h: 40 });
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 });

  // Screen shake on sunk
  useEffect(() => {
    if (lastAttackResult === 'sunk') {
      setShaking(true);
      const timer = setTimeout(() => setShaking(false), 400);
      return () => clearTimeout(timer);
    }
  }, [lastAttackResult, lastAttackPos]);

  // Swipe to rotate ship during placement
  const swipeHandlers = useSwipe(() => {
    if (isPlacing && onSwipeRotate) onSwipeRotate();
  }, 40);

  // Measure cell size and grid offset for ship overlays
  useEffect(() => {
    const measure = () => {
      if (cellRef.current && gridRef.current) {
        const cellRect = cellRef.current.getBoundingClientRect();
        const gridRect = gridRef.current.getBoundingClientRect();
        setCellSize({ w: cellRect.width, h: cellRect.height });
        setGridOffset({
          x: cellRect.left - gridRect.left,
          y: cellRect.top - gridRect.top,
        });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const getPreviewCells = useCallback(() => {
    if (!isPlacing || !hoverPos || !placingShipSize) return new Map<string, boolean>();
    const cells = new Map<string, boolean>();
    const valid = canPlaceShip(board, hoverPos.row, hoverPos.col, placingShipSize, placingOrientation);

    for (let i = 0; i < placingShipSize; i++) {
      const r = placingOrientation === 'vertical' ? hoverPos.row + i : hoverPos.row;
      const c = placingOrientation === 'horizontal' ? hoverPos.col + i : hoverPos.col;
      if (r < BOARD_SIZE && c < BOARD_SIZE) {
        cells.set(`${r},${c}`, valid);
      }
    }
    return cells;
  }, [board, hoverPos, placingShipSize, placingOrientation, isPlacing]);

  const previewCells = getPreviewCells();

  const handleDragOver = useCallback((e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setHoverPos({ row, col });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    const shipId = e.dataTransfer.getData('text/plain');
    if (shipId && onDragSelectShip) {
      onDragSelectShip(shipId);
    }
    // Small timeout to let state update from onDragSelectShip before placing
    setTimeout(() => {
      if (onDropShip) {
        onDropShip(row, col);
      } else if (onCellClick) {
        onCellClick(row, col);
      }
    }, 0);
  }, [onDropShip, onCellClick, onDragSelectShip]);

  // Determine which cells have ship images (for hiding default ship fill)
  const hasShipImages = isPlayerBoard && ships.length > 0;

  // Resolve the placing ship ID: use prop if given, else guess from size
  const resolvedPlacingShipId = placingShipId ?? guessShipId(placingShipSize);

  return (
    <div
      className={`flex flex-col items-center max-w-full overflow-x-auto ${highlight ? 'ring-2 ring-green-400/30 rounded-lg p-2' : 'p-2'}`}
      role="region"
      aria-label={title}
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        <h3 className="text-sm font-semibold uppercase tracking-widest font-mono-crt text-glow-green">
          {title}
        </h3>
        {onToggleHideEnemyShots && (
          <button
            onClick={onToggleHideEnemyShots}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] metal-panel-light transition-all font-mono-crt text-slate-400 hover:text-green-400"
            title={hideEnemyShots ? 'Show enemy shots' : 'Hide enemy shots'}
          >
            {hideEnemyShots ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        )}
      </div>
      <div
        ref={gridRef}
        className={`inline-flex flex-col relative ${shaking ? 'screen-shake' : ''}`}
        role="grid"
        aria-label={`${title} grid`}
        onMouseLeave={() => setHoverPos(null)}
        onTouchStart={isPlacing ? swipeHandlers.onTouchStart : undefined}
        onTouchEnd={isPlacing ? swipeHandlers.onTouchEnd : undefined}
        onDragLeave={(e) => {
          if (!gridRef.current?.contains(e.relatedTarget as Node)) {
            setHoverPos(null);
          }
        }}
      >
        {/* Column headers */}
        <div className="flex" role="row" aria-hidden="true">
          <div className="w-5 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
          {COL_LABELS.map((label) => (
            <div
              key={label}
              className="w-[var(--cell-size)] h-6 sm:w-9 sm:h-7 md:w-10 md:h-8 flex items-center justify-center text-[10px] sm:text-xs font-mono-crt"
              role="columnheader"
              style={{ color: 'var(--text-secondary)' }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Rows */}
        {board.map((row, rowIdx) => (
          <div key={rowIdx} className="flex" role="row">
            <div className="w-5 h-[var(--cell-size)] sm:w-7 sm:h-9 md:w-8 md:h-10 flex items-center justify-center text-[10px] sm:text-xs font-mono-crt" role="rowheader" style={{ color: 'var(--text-secondary)' }}>
              {ROW_LABELS[rowIdx]}
            </div>
            {row.map((cell, colIdx) => {
              const key = `${rowIdx},${colIdx}`;
              const isPreview = previewCells.has(key);
              const isValid = previewCells.get(key) ?? true;

              return (
                <div key={key} ref={rowIdx === 0 && colIdx === 0 ? cellRef : undefined} role="gridcell">
                  <Cell
                    row={rowIdx}
                    col={colIdx}
                    state={hideEnemyShots && isPlayerBoard && !isPlacing && cell.state === 'miss' ? 'empty' : cell.state}
                    isPlayerBoard={isPlayerBoard}
                    isPlacing={isPlacing}
                    isPreview={isPreview}
                    isInvalid={!isValid}
                    onClick={() => onCellClick?.(rowIdx, colIdx)}
                    onHover={() => {
                      if (isPlacing && placingShipSize) {
                        setHoverPos({ row: rowIdx, col: colIdx });
                      }
                    }}
                    onDragOver={isPlacing ? (e) => handleDragOver(e, rowIdx, colIdx) : undefined}
                    onDrop={isPlacing ? (e) => handleDrop(e, rowIdx, colIdx) : undefined}
                    disabled={disabled}
                    hideShipFill={hasShipImages}
                    animating={
                      lastAttackPos && lastAttackPos.row === rowIdx && lastAttackPos.col === colIdx
                        ? lastAttackResult
                        : null
                    }
                    isCursor={showCursor && cursorRow === rowIdx && cursorCol === colIdx}
                  />
                </div>
              );
            })}
          </div>
        ))}

        {/* Ship image overlays for placed ships */}
        {isPlayerBoard && ships.map((ship) => {
          if (!ship.positions || ship.positions.length === 0) return null;
          const isHoriz = ship.orientation === 'horizontal';
          const minRow = Math.min(...ship.positions.map(p => p.row));
          const minCol = Math.min(...ship.positions.map(p => p.col));

          const x = gridOffset.x + minCol * cellSize.w;
          const y = gridOffset.y + minRow * cellSize.h;
          const w = isHoriz ? ship.size * cellSize.w : cellSize.w;
          const h = isHoriz ? cellSize.h : ship.size * cellSize.h;

          const isSunk = ship.sunk;

          return (
            <div
              key={`ship-img-${ship.id}`}
              className="absolute pointer-events-none"
              style={{
                left: x,
                top: y,
                width: w,
                height: h,
                zIndex: 5,
                opacity: isSunk ? 0.3 : 0.9,
                filter: isSunk ? 'saturate(0.2) brightness(0.6)' : undefined,
                transition: 'opacity 0.3s, filter 0.3s',
              }}
            >
              {isHoriz ? (
                <ShipSVG shipId={ship.id} className="w-full h-full" />
              ) : (
                <div
                  style={{
                    width: h,
                    height: w,
                    transform: 'rotate(90deg)',
                    transformOrigin: '0 0',
                    position: 'absolute',
                    left: w,
                    top: 0,
                  }}
                >
                  <ShipSVG shipId={ship.id} className="w-full h-full" />
                </div>
              )}
            </div>
          );
        })}

        {/* Ghost ship preview during placement */}
        {isPlacing && hoverPos && placingShipSize && resolvedPlacingShipId && previewCells.size > 0 && (() => {
          const valid = canPlaceShip(board, hoverPos.row, hoverPos.col, placingShipSize, placingOrientation);
          const isHoriz = placingOrientation === 'horizontal';
          const x = gridOffset.x + hoverPos.col * cellSize.w;
          const y = gridOffset.y + hoverPos.row * cellSize.h;
          const w = isHoriz ? placingShipSize * cellSize.w : cellSize.w;
          const h = isHoriz ? cellSize.h : placingShipSize * cellSize.h;
          const clampW = isHoriz ? Math.min(w, (BOARD_SIZE - hoverPos.col) * cellSize.w) : w;
          const clampH = isHoriz ? h : Math.min(h, (BOARD_SIZE - hoverPos.row) * cellSize.h);

          return (
            <div
              className="absolute pointer-events-none"
              style={{
                left: x,
                top: y,
                width: clampW,
                height: clampH,
                zIndex: 15,
                opacity: valid ? 0.55 : 0.3,
                filter: valid ? undefined : 'hue-rotate(300deg) saturate(2)',
                transition: 'opacity 0.1s',
                overflow: 'hidden',
              }}
            >
              {isHoriz ? (
                <div style={{ width: w, height: h }}>
                  <ShipSVG shipId={resolvedPlacingShipId} className="w-full h-full" />
                </div>
              ) : (
                <div style={{ position: 'relative', width: w, height: h }}>
                  <div
                    style={{
                      width: h,
                      height: w,
                      transform: 'rotate(90deg)',
                      transformOrigin: '0 0',
                      position: 'absolute',
                      left: w,
                      top: 0,
                    }}
                  >
                    <ShipSVG shipId={resolvedPlacingShipId} className="w-full h-full" />
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

/** Guess ship ID from size for the ghost preview when explicit ID is not provided */
function guessShipId(size: number | undefined): string | undefined {
  if (!size) return undefined;
  return SHIPS.find(s => s.size === size)?.id;
}
