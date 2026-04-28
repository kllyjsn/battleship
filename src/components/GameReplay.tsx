import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, SkipForward, SkipBack, Gauge } from 'lucide-react';
import type { Board, Ship, Cell } from '../engine/types';
import type { ReplayData } from '../lib/replay';
import { BOARD_SIZE } from '../engine/constants';

interface GameReplayProps {
  replayData: ReplayData;
  onClose: () => void;
}

function createEmptyReplayBoard(): Board {
  const board: Board = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    const rowCells: Cell[] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      rowCells.push({ row, col, state: 'empty', shipId: null });
    }
    board.push(rowCells);
  }
  return board;
}

function placeShipsOnBoard(board: Board, ships: Ship[]): Board {
  const newBoard = board.map(r => r.map(c => ({ ...c })));
  for (const ship of ships) {
    for (const pos of ship.positions) {
      newBoard[pos.row][pos.col] = {
        ...newBoard[pos.row][pos.col],
        state: 'ship',
        shipId: ship.id,
      };
    }
  }
  return newBoard;
}

function coordLabel(row: number, col: number): string {
  return `${String.fromCharCode(65 + row)}${col + 1}`;
}

export function GameReplay({ replayData, onClose }: GameReplayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalMoves = replayData.moves.length;

  // Build boards up to currentStep
  const buildBoards = useCallback((step: number) => {
    let playerBoard = placeShipsOnBoard(createEmptyReplayBoard(), replayData.playerShipPlacements);
    let opponentBoard = placeShipsOnBoard(createEmptyReplayBoard(), replayData.opponentShipPlacements);

    for (let i = 0; i < step; i++) {
      const move = replayData.moves[i];
      const targetBoard = move.player === 'player' ? opponentBoard : playerBoard;
      const newBoard = targetBoard.map(r => r.map(c => ({ ...c })));

      if (move.result === 'sunk' && move.shipPositions) {
        for (const pos of move.shipPositions) {
          newBoard[pos.row][pos.col] = {
            ...newBoard[pos.row][pos.col],
            state: 'sunk',
            shipId: move.shipId || null,
          };
        }
      } else if (move.result === 'hit') {
        newBoard[move.row][move.col] = {
          ...newBoard[move.row][move.col],
          state: 'hit',
        };
      } else {
        newBoard[move.row][move.col] = {
          ...newBoard[move.row][move.col],
          state: 'miss',
        };
      }

      if (move.player === 'player') {
        opponentBoard = newBoard;
      } else {
        playerBoard = newBoard;
      }
    }

    return { playerBoard, opponentBoard };
  }, [replayData]);

  const { playerBoard, opponentBoard } = buildBoards(currentStep);

  // Keyboard shortcuts: Escape to close, Space for play/pause, Arrow keys for stepping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (currentStep >= totalMoves) setCurrentStep(0);
        setIsPlaying(prev => !prev);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentStep(prev => Math.min(totalMoves, prev + 1));
        setIsPlaying(false);
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentStep(prev => Math.max(0, prev - 1));
        setIsPlaying(false);
        return;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, currentStep, totalMoves]);

  // Auto-play
  useEffect(() => {
    if (isPlaying && currentStep < totalMoves) {
      timerRef.current = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 1000 / speed);
    } else if (currentStep >= totalMoves) {
      setIsPlaying(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStep, totalMoves, speed]);

  const currentMove = currentStep > 0 ? replayData.moves[currentStep - 1] : null;

  const highlightPos = currentMove ? { row: currentMove.row, col: currentMove.col } : null;
  const highlightBoard = currentMove?.player === 'player' ? 'opponent' : currentMove?.player === 'opponent' ? 'player' : null;

  const renderMiniBoard = (board: Board, title: string, isHighlighted: boolean) => (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-mono-crt text-slate-400 uppercase tracking-wider">{title}</span>
      <div
        className="grid gap-px p-1 rounded"
        style={{
          gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
          background: 'var(--hull-dark)',
          border: '1px solid var(--steel-border)',
        }}
      >
        {board.map((row, ri) =>
          row.map((cell, ci) => {
            const isCurrentMove = isHighlighted && highlightPos?.row === ri && highlightPos?.col === ci;
            let bg = 'rgba(26, 31, 46, 0.6)';
            if (cell.state === 'ship') bg = 'rgba(57, 255, 20, 0.15)';
            else if (cell.state === 'hit') bg = 'rgba(255, 60, 60, 0.7)';
            else if (cell.state === 'sunk') bg = 'rgba(120, 20, 20, 0.8)';
            else if (cell.state === 'miss') bg = 'rgba(100, 116, 139, 0.3)';

            return (
              <div
                key={`${ri}-${ci}`}
                className="w-5 h-5 sm:w-6 sm:h-6"
                style={{
                  background: bg,
                  boxShadow: isCurrentMove ? '0 0 8px rgba(57, 255, 20, 0.8), inset 0 0 4px rgba(57, 255, 20, 0.4)' : undefined,
                  border: isCurrentMove ? '2px solid var(--crt-green)' : '1px solid rgba(71, 85, 105, 0.15)',
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="metal-panel rounded-xl p-6 max-w-3xl w-full mx-4 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-mono-crt text-glow-green">GAME REPLAY</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-green-400 transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Boards */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          {renderMiniBoard(playerBoard, 'Your Fleet', highlightBoard === 'player')}
          {renderMiniBoard(opponentBoard, 'Enemy Waters', highlightBoard === 'opponent')}
        </div>

        {/* Move info */}
        <div className="text-center font-mono-crt text-sm h-6">
          {currentMove ? (
            <span>
              <span className="text-slate-500">Move #{currentStep}:</span>{' '}
              <span className={currentMove.player === 'player' ? 'text-green-400' : 'text-amber-400'}>
                {currentMove.player === 'player' ? 'YOU' : 'ENEMY'}
              </span>{' '}
              <span className="text-slate-500">{'\u2192'}</span>{' '}
              <span className="text-slate-300">{coordLabel(currentMove.row, currentMove.col)}</span>{' '}
              <span className={
                currentMove.result === 'miss' ? 'text-slate-500' :
                currentMove.result === 'sunk' ? 'text-red-400 text-glow-red' : 'text-red-400'
              }>
                {currentMove.result === 'sunk' ? `SUNK ${currentMove.shipName || ''}!` : currentMove.result.toUpperCase()}
              </span>
            </span>
          ) : (
            <span className="text-slate-600">Press play to start replay</span>
          )}
        </div>

        {/* Progress slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono-crt text-slate-500 w-8 text-right">{currentStep}</span>
          <input
            type="range"
            min={0}
            max={totalMoves}
            value={currentStep}
            onChange={(e) => {
              setCurrentStep(Number(e.target.value));
              setIsPlaying(false);
            }}
            className="flex-1 accent-green-500"
          />
          <span className="text-xs font-mono-crt text-slate-500 w-8">{totalMoves}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => { setCurrentStep(prev => Math.max(0, prev - 1)); setIsPlaying(false); }}
            disabled={currentStep === 0}
            className="p-2 rounded metal-panel-light text-slate-400 hover:text-green-400 transition-colors disabled:opacity-30"
          >
            <SkipBack size={18} />
          </button>
          <button
            onClick={() => {
              if (currentStep >= totalMoves) {
                setCurrentStep(0);
              }
              setIsPlaying(!isPlaying);
            }}
            className="p-3 rounded-full metal-panel-light text-green-400 hover:text-green-300 transition-colors"
            style={{ boxShadow: '0 0 10px rgba(57, 255, 20, 0.1)' }}
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} />}
          </button>
          <button
            onClick={() => { setCurrentStep(prev => Math.min(totalMoves, prev + 1)); setIsPlaying(false); }}
            disabled={currentStep >= totalMoves}
            className="p-2 rounded metal-panel-light text-slate-400 hover:text-green-400 transition-colors disabled:opacity-30"
          >
            <SkipForward size={18} />
          </button>
          <div className="ml-4 flex items-center gap-2">
            <Gauge size={14} className="text-slate-500" />
            {[1, 2, 4].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-0.5 rounded text-xs font-mono-crt transition-colors ${
                  speed === s ? 'text-green-400 metal-panel-light' : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
