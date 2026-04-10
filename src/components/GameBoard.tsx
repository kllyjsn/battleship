import { type Board, type Orientation } from '../engine/types';
import { ROW_LABELS, COL_LABELS, BOARD_SIZE } from '../engine/constants';
import { canPlaceShip } from '../engine/board';
import { Cell } from './Cell';
import { useState, useCallback } from 'react';

interface GameBoardProps {
  board: Board;
  isPlayerBoard: boolean;
  isPlacing: boolean;
  placingShipSize?: number;
  placingOrientation?: Orientation;
  onCellClick?: (row: number, col: number) => void;
  disabled?: boolean;
  title: string;
  highlight?: boolean;
}

export function GameBoard({
  board,
  isPlayerBoard,
  isPlacing,
  placingShipSize,
  placingOrientation = 'horizontal',
  onCellClick,
  disabled = false,
  title,
  highlight = false,
}: GameBoardProps) {
  const [hoverPos, setHoverPos] = useState<{ row: number; col: number } | null>(null);

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

  return (
    <div className={`flex flex-col items-center ${highlight ? 'ring-2 ring-cyan-400/50 rounded-xl p-2' : 'p-2'}`}>
      <h3 className="text-sm font-semibold text-cyan-300 uppercase tracking-widest mb-2">
        {title}
      </h3>
      <div className="inline-flex flex-col" onMouseLeave={() => setHoverPos(null)}>
        {/* Column headers */}
        <div className="flex">
          <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
          {COL_LABELS.map((label) => (
            <div
              key={label}
              className="w-8 h-6 sm:w-9 sm:h-7 md:w-10 md:h-8 flex items-center justify-center text-xs text-cyan-400/70 font-mono"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Rows */}
        {board.map((row, rowIdx) => (
          <div key={rowIdx} className="flex">
            <div className="w-6 h-8 sm:w-7 sm:h-9 md:w-8 md:h-10 flex items-center justify-center text-xs text-cyan-400/70 font-mono">
              {ROW_LABELS[rowIdx]}
            </div>
            {row.map((cell, colIdx) => {
              const key = `${rowIdx},${colIdx}`;
              const isPreview = previewCells.has(key);
              const isValid = previewCells.get(key) ?? true;

              return (
                <Cell
                  key={key}
                  row={rowIdx}
                  col={colIdx}
                  state={cell.state}
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
                  disabled={disabled}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
