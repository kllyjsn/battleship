import type { Board, Ship, Difficulty, GamePhase, BattleLogEntry } from '../engine/types';
import { STORAGE_KEYS } from './storageKeys';

/**
 * Serialisable snapshot of a single-player game in progress.
 * Stored in localStorage so the player can resume after a page refresh.
 */
export interface SavedGameState {
  version: 1;
  timestamp: number;
  difficulty: Difficulty;
  phase: GamePhase;
  playerBoard: Board;
  opponentBoard: Board;
  playerShips: Ship[];
  opponentShips: Ship[];
  isPlayerTurn: boolean;
  playerScore: number;
  shotCount: number;
  hitCount: number;
  turnCount: number;
  battleLog: BattleLogEntry[];
  /** Serialised AI state — the hitStack, mode, etc. */
  aiState: {
    mode: 'hunt' | 'target';
    hitStack: { row: number; col: number }[];
    triedPositions: string[];
    lastHit: { row: number; col: number } | null;
    firstHit: { row: number; col: number } | null;
    orientation: 'unknown' | 'horizontal' | 'vertical';
  };
}

/** Persist the current game state to localStorage. */
export function saveGameState(state: SavedGameState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SAVED_GAME, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

/** Load a previously saved game, or null if none exists / data is corrupt. */
export function loadSavedGame(): SavedGameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_GAME);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedGameState;
    // Basic validation: must have version 1 and be in battle phase
    if (parsed.version !== 1 || parsed.phase !== 'battle') return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Remove saved game data (called on game over or new game). */
export function clearSavedGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.SAVED_GAME);
  } catch {
    // ignore
  }
}

/** Check whether a saved game exists without fully parsing it. */
export function hasSavedGame(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.SAVED_GAME) !== null;
  } catch {
    return false;
  }
}
