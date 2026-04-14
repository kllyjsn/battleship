import type { Board, Position, Difficulty, Ship } from './types';
import { BOARD_SIZE, SHIPS } from './constants';

interface AIState {
  mode: 'hunt' | 'target';
  hitStack: Position[];
  triedPositions: Set<string>;
  lastHit: Position | null;
  firstHit: Position | null;
  orientation: 'unknown' | 'horizontal' | 'vertical';
}

function posKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function createAIState(): AIState {
  return {
    mode: 'hunt',
    hitStack: [],
    triedPositions: new Set(),
    lastHit: null,
    firstHit: null,
    orientation: 'unknown',
  };
}

function getAdjacentCells(pos: Position): Position[] {
  const adj: Position[] = [];
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of dirs) {
    const r = pos.row + dr;
    const c = pos.col + dc;
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
      adj.push({ row: r, col: c });
    }
  }
  return adj;
}

function isValidTarget(board: Board, row: number, col: number, tried: Set<string>): boolean {
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return false;
  if (tried.has(posKey(row, col))) return false;
  const state = board[row][col].state;
  return state === 'empty' || state === 'ship';
}

/**
 * Check whether a cell can be part of any remaining ship placement.
 * Returns true if at least one unsunk ship could overlap this cell
 * given the current board state (misses, sunk markers, and tried shots).
 */
function canFitAnyShip(
  board: Board,
  row: number,
  col: number,
  minShipSize: number,
): boolean {
  // Try horizontal spans of length minShipSize that include (row, col)
  for (let start = Math.max(0, col - minShipSize + 1); start <= col && start + minShipSize <= BOARD_SIZE; start++) {
    let valid = true;
    for (let i = 0; i < minShipSize; i++) {
      const s = board[row][start + i].state;
      if (s === 'miss' || s === 'sunk') { valid = false; break; }
    }
    if (valid) return true;
  }
  // Try vertical spans
  for (let start = Math.max(0, row - minShipSize + 1); start <= row && start + minShipSize <= BOARD_SIZE; start++) {
    let valid = true;
    for (let i = 0; i < minShipSize; i++) {
      const s = board[start + i][col].state;
      if (s === 'miss' || s === 'sunk') { valid = false; break; }
    }
    if (valid) return true;
  }
  return false;
}

function getRandomUntried(
  board: Board,
  tried: Set<string>,
  checkerboard: boolean,
  minShipSize: number = 1,
): Position | null {
  const candidates: Position[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (tried.has(posKey(r, c))) continue;
      const state = board[r][c].state;
      if (state !== 'empty' && state !== 'ship') continue;
      if (checkerboard && (r + c) % 2 !== 0) continue;
      // Ship-length-aware pruning: skip cells that can't physically
      // fit the smallest remaining ship in any direction.
      if (minShipSize > 1 && !canFitAnyShip(board, r, c, minShipSize)) continue;
      candidates.push({ row: r, col: c });
    }
  }

  // Fall back: drop checkerboard constraint if it left no candidates.
  if (candidates.length === 0 && checkerboard) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (tried.has(posKey(r, c))) continue;
        const state = board[r][c].state;
        if (state !== 'empty' && state !== 'ship') continue;
        if (minShipSize > 1 && !canFitAnyShip(board, r, c, minShipSize)) continue;
        candidates.push({ row: r, col: c });
      }
    }
  }

  // Ultimate fall back: drop ship-size constraint too.
  if (candidates.length === 0 && minShipSize > 1) {
    return getRandomUntried(board, tried, false, 1);
  }

  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function probabilityDensity(board: Board, tried: Set<string>, ships: Ship[]): Position | null {
  const density: number[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(0)
  );
  const remainingShips = ships.filter(s => !s.sunk);
  const shipSizes = remainingShips.length > 0
    ? remainingShips.map(s => s.size)
    : SHIPS.map(s => s.size);

  for (const size of shipSizes) {
    // horizontal
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c <= BOARD_SIZE - size; c++) {
        let valid = true;
        for (let i = 0; i < size; i++) {
          const state = board[r][c + i].state;
          if (state === 'miss' || state === 'sunk') {
            valid = false;
            break;
          }
        }
        if (valid) {
          for (let i = 0; i < size; i++) {
            if (!tried.has(posKey(r, c + i))) {
              density[r][c + i]++;
            }
          }
        }
      }
    }
    // vertical
    for (let r = 0; r <= BOARD_SIZE - size; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        let valid = true;
        for (let i = 0; i < size; i++) {
          const state = board[r + i][c].state;
          if (state === 'miss' || state === 'sunk') {
            valid = false;
            break;
          }
        }
        if (valid) {
          for (let i = 0; i < size; i++) {
            if (!tried.has(posKey(r + i, c))) {
              density[r + i][c]++;
            }
          }
        }
      }
    }
  }

  let bestScore = -1;
  const topCandidates: Position[] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (tried.has(posKey(r, c))) continue;
      const state = board[r][c].state;
      if (state === 'miss' || state === 'sunk' || state === 'hit') continue;
      if (density[r][c] > bestScore) {
        bestScore = density[r][c];
        topCandidates.length = 0;
        topCandidates.push({ row: r, col: c });
      } else if (density[r][c] === bestScore && bestScore > 0) {
        topCandidates.push({ row: r, col: c });
      }
    }
  }

  if (topCandidates.length === 0) return null;
  return topCandidates[Math.floor(Math.random() * topCandidates.length)];
}

export function getAIMove(
  board: Board,
  aiState: AIState,
  difficulty: Difficulty,
  opponentShips: Ship[]
): { position: Position; newState: AIState } {
  const newState = {
    ...aiState,
    hitStack: [...aiState.hitStack],
    triedPositions: new Set(aiState.triedPositions),
  };

  let target: Position | null = null;

  if (difficulty === 'easy') {
    // Easy mode still tracks tried positions to avoid re-attacking the same cell.
    target = getRandomUntried(board, newState.triedPositions, false);
  } else if (newState.mode === 'target' && newState.hitStack.length > 0) {
    // Target mode: try to sink a ship we've hit
    while (newState.hitStack.length > 0 && !target) {
      const candidate = newState.hitStack[newState.hitStack.length - 1];

      if (newState.orientation === 'unknown') {
        const adj = getAdjacentCells(candidate);
        const validAdj = adj.filter(p =>
          isValidTarget(board, p.row, p.col, newState.triedPositions)
        );
        if (validAdj.length > 0) {
          target = validAdj[Math.floor(Math.random() * validAdj.length)];
        } else {
          newState.hitStack.pop();
        }
      } else {
        // We know the orientation, try to extend in that direction
        const dirs = newState.orientation === 'horizontal'
          ? [[0, -1], [0, 1]]
          : [[-1, 0], [1, 0]];

        let found = false;
        for (const [dr, dc] of dirs) {
          // Walk along the line from firstHit
          let r = candidate.row + dr;
          let c = candidate.col + dc;
          while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
            if (board[r][c].state === 'hit') {
              r += dr;
              c += dc;
              continue;
            }
            if (isValidTarget(board, r, c, newState.triedPositions)) {
              target = { row: r, col: c };
              found = true;
              break;
            }
            break;
          }
          if (found) break;
        }

        if (!found) {
          newState.hitStack.pop();
          newState.orientation = 'unknown';
          newState.firstHit = null;
        }
      }
    }

    if (!target) {
      // Defensive reset: all target-mode options exhausted, fall back to hunt.
      newState.mode = 'hunt';
      newState.hitStack = [];
      newState.orientation = 'unknown';
      newState.firstHit = null;
    }
  }

  if (!target) {
    // Determine the smallest unsunk ship size so hunt-mode can prune
    // cells that can't physically fit any remaining vessel.
    const remainingShips = opponentShips.filter(s => !s.sunk);
    const minShipSize = remainingShips.length > 0
      ? Math.min(...remainingShips.map(s => s.size))
      : 2; // default to destroyer size

    if (difficulty === 'hard') {
      target = probabilityDensity(board, newState.triedPositions, opponentShips);
    }
    if (!target) {
      // Medium and hard use checkerboard + ship-length-aware pruning
      // in hunt mode to cover more ground efficiently.
      target = getRandomUntried(
        board,
        newState.triedPositions,
        difficulty === 'medium' || difficulty === 'hard',
        difficulty !== 'easy' ? minShipSize : 1,
      );
    }
  }

  if (!target) {
    target = getRandomUntried(board, newState.triedPositions, false);
  }

  if (!target) {
    target = { row: 0, col: 0 };
  }

  newState.triedPositions.add(posKey(target.row, target.col));

  return { position: target, newState };
}

export function updateAIAfterResult(
  aiState: AIState,
  position: Position,
  result: 'hit' | 'miss' | 'sunk',
  difficulty: Difficulty,
  sunkShipPositions?: Position[]
): AIState {
  if (difficulty === 'easy') return aiState;

  const newState = {
    ...aiState,
    hitStack: [...aiState.hitStack],
    triedPositions: new Set(aiState.triedPositions),
  };

  if (result === 'hit') {
    if (newState.mode === 'hunt') {
      newState.mode = 'target';
      newState.firstHit = position;
      newState.orientation = 'unknown';
      newState.hitStack.push(position);
    } else {
      newState.hitStack.push(position);
      if (newState.firstHit && newState.orientation === 'unknown') {
        if (position.row === newState.firstHit.row) {
          newState.orientation = 'horizontal';
        } else if (position.col === newState.firstHit.col) {
          newState.orientation = 'vertical';
        }
      }
    }
  } else if (result === 'sunk') {
    // Remove only the sunk ship's positions from the hitStack
    if (sunkShipPositions && sunkShipPositions.length > 0) {
      const sunkSet = new Set(sunkShipPositions.map(p => posKey(p.row, p.col)));
      newState.hitStack = newState.hitStack.filter(
        p => !sunkSet.has(posKey(p.row, p.col))
      );
    } else {
      newState.hitStack = [];
    }

    newState.orientation = 'unknown';
    newState.firstHit = null;

    if (newState.hitStack.length === 0) {
      newState.mode = 'hunt';
    } else {
      // Still have hits from another ship — stay in target mode
      newState.mode = 'target';
      newState.firstHit = newState.hitStack[0];
    }
  }

  return newState;
}
