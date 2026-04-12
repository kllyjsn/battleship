import type { ShipDefinition } from './types';

export const BOARD_SIZE = 10;

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
