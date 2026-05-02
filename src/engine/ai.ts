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

function getRandomUntried(board: Board, tried: Set<string>, checkerboard: boolean): Position | null {
  const candidates: Position[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (tried.has(posKey(r, c))) continue;
      const state = board[r][c].state;
      if (state !== 'empty' && state !== 'ship') continue;
      if (checkerboard && (r + c) % 2 !== 0) continue;
      candidates.push({ row: r, col: c });
    }
  }

  if (candidates.length === 0 && checkerboard) {
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

/**
 * Probability-density targeting (Admiral AI).
 *
 * For each remaining (un-sunk) ship size, count every legal placement on the
 * board and increment a density score on each covered cell. The cell with the
 * highest density is the most likely to hide a ship. Ties are broken randomly.
 *
 * Cells are treated as "blocking" a hypothetical placement when:
 *   - 'miss' or 'sunk' (definitively no ship of any kind there), or
 *   - 'hit' (already occupied by a different, not-yet-sunk ship — no
 *     remaining ship can also occupy that cell). Treating 'hit' as available
 *     would inflate density around partial hits and cause the AI to fire at
 *     cells that can't possibly hold a *new* ship.
 */
function probabilityDensity(board: Board, tried: Set<string>, ships: Ship[]): Position | null {
  const density: number[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(0)
  );
  const remainingShips = ships.filter(s => !s.sunk);
  const shipSizes = remainingShips.length > 0
    ? remainingShips.map(s => s.size)
    : SHIPS.map(s => s.size);

  const isBlocked = (r: number, c: number): boolean => {
    const state = board[r][c].state;
    return state === 'miss' || state === 'sunk' || state === 'hit';
  };

  for (const size of shipSizes) {
    // horizontal
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c <= BOARD_SIZE - size; c++) {
        let valid = true;
        for (let i = 0; i < size; i++) {
          if (isBlocked(r, c + i)) {
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
          if (isBlocked(r + i, c)) {
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
    // ── Target mode ──
    // We've scored at least one hit and are now trying to sink the ship.
    // Strategy:
    //   1. If orientation is still unknown, probe the 4 cells adjacent to
    //      the most recent hit. The first additional hit reveals the line.
    //   2. Once the orientation is known (set by updateAIAfterResult), walk
    //      outward along that line — past any contiguous 'hit' cells, which
    //      represent the rest of the same ship — until we find an untried
    //      cell. We try both directions before giving up on a candidate.
    //   3. If we exhaust all options around a candidate, pop it from the
    //      hitStack and try the next one. When the stack empties we fall
    //      back to hunt mode.
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
          // Boxed in by the edge or by misses — abandon this hit.
          newState.hitStack.pop();
        }
      } else {
        const dirs = newState.orientation === 'horizontal'
          ? [[0, -1], [0, 1]]
          : [[-1, 0], [1, 0]];

        let found = false;
        for (const [dr, dc] of dirs) {
          // Walk along the line from the most recent hit. Skip past
          // contiguous already-hit cells (same ship) until we find either
          // an untried cell to fire at or a wall/miss/sunk that closes
          // off this direction.
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
          // Both directions exhausted — pop and re-evaluate orientation.
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
      // Medium and hard use checkerboard pattern in hunt mode to cover more ground.
      target = getRandomUntried(board, newState.triedPositions, difficulty === 'medium' || difficulty === 'hard');
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
