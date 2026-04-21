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
 * Hunt-mode random sampler.
 *
 * When `parityStride` is >= 2 we only sample cells on a parity lattice —
 * `(r + c) % stride === 0`. Any ship of length >= stride must cross at least
 * one such cell, so we can reach every surviving ship with ~1/stride as many
 * shots. The stride should be the size of the smallest ship still afloat,
 * which lets the pattern get coarser (more efficient) as the shortest ships
 * sink. Stride <= 1 means "no parity filter" (easy mode / fallback).
 *
 * If the lattice is fully exhausted we fall back to any remaining cell so
 * the AI never stalls.
 */
function getRandomUntried(
  board: Board,
  tried: Set<string>,
  parityStride: number,
): Position | null {
  const useParity = parityStride >= 2;
  const candidates: Position[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (tried.has(posKey(r, c))) continue;
      const state = board[r][c].state;
      if (state !== 'empty' && state !== 'ship') continue;
      if (useParity && (r + c) % parityStride !== 0) continue;
      candidates.push({ row: r, col: c });
    }
  }

  if (candidates.length === 0 && useParity) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (tried.has(posKey(r, c))) continue;
        const state = board[r][c].state;
        if (state !== 'empty' && state !== 'ship') continue;
        candidates.push({ row: r, col: c });
      }
    }
  }

  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/** Smallest surviving ship size, clamped to >= 1. Used to pick the parity
 *  stride for hunt-mode sampling. */
function smallestRemainingSize(ships: Ship[]): number {
  const afloat = ships.filter(s => !s.sunk).map(s => s.size);
  const pool = afloat.length > 0 ? afloat : SHIPS.map(s => s.size);
  return Math.max(1, Math.min(...pool));
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
    target = getRandomUntried(board, newState.triedPositions, 1);
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
    if (difficulty === 'hard') {
      target = probabilityDensity(board, newState.triedPositions, opponentShips);
    }
    if (!target) {
      // Medium and hard use an adaptive parity lattice in hunt mode. The
      // stride equals the smallest surviving ship's length, so the pattern
      // tightens when only the 2-deck destroyer is left but can relax to
      // stride-3 or stride-5 when longer ships are afloat.
      const stride =
        difficulty === 'medium' || difficulty === 'hard'
          ? smallestRemainingSize(opponentShips)
          : 1;
      target = getRandomUntried(board, newState.triedPositions, stride);
    }
  }

  if (!target) {
    target = getRandomUntried(board, newState.triedPositions, 1);
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
