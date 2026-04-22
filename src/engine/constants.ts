import type { ShipDefinition, Difficulty } from './types';

export const BOARD_SIZE = 10;

/** Maximum valid board index (BOARD_SIZE - 1). */
export const BOARD_MAX_INDEX = BOARD_SIZE - 1;

export const SHIPS: ShipDefinition[] = [
  { id: 'carrier', name: 'Carrier', size: 5 },
  { id: 'battleship', name: 'Battleship', size: 4 },
  { id: 'cruiser', name: 'Cruiser', size: 3 },
  { id: 'submarine', name: 'Submarine', size: 3 },
  { id: 'destroyer', name: 'Destroyer', size: 2 },
];

export const TOTAL_SHIP_CELLS = SHIPS.reduce((sum, s) => sum + s.size, 0);

export const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export const COL_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

// Scoring: points awarded per attack result
export const SCORE_HIT = 10;
export const SCORE_SUNK_BONUS = 50;
export const SCORE_MISS = 1;

/** Return the points earned for a single attack result. */
export function scoreForResult(result: 'hit' | 'miss' | 'sunk'): number {
  switch (result) {
    case 'hit':  return SCORE_HIT;
    case 'sunk': return SCORE_HIT + SCORE_SUNK_BONUS;
    case 'miss': return SCORE_MISS;
  }
}

// ── AI difficulty display names ──
const AI_NAMES: Record<Difficulty, string> = {
  easy: 'Recruit AI',
  medium: 'Captain AI',
  hard: 'Admiral AI',
};

/** Human-readable name for each AI difficulty level. */
export function getAIName(difficulty: Difficulty): string {
  return AI_NAMES[difficulty];
}

// ── Turn timing delays (ms) ──

/** Delay before showing "Opponent's turn" message. */
export const DELAY_BEFORE_AI_LABEL_MS = 500;
/** Delay before the AI actually fires. */
export const DELAY_BEFORE_AI_SHOT_MS = 600;
/** Delay after AI shot before player regains control. */
export const DELAY_AFTER_AI_SHOT_MS = 800;

// ── Animation durations (ms) ──

/** How long hit/miss/sunk particle effects play on a cell. */
export const CELL_ANIMATION_MS = 600;
/** How long the board-shake effect plays when a ship is sunk. */
export const SHAKE_ANIMATION_MS = 400;
