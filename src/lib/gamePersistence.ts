import type { Board, Ship, Difficulty, GamePhase, BattleLogEntry, Orientation } from '../engine/types';
import { STORAGE_KEYS, getSessionName, getApiBase } from './storageKeys';

/**
 * Serialisable snapshot of a single-player game in progress.
 * Stored in localStorage (and synced to MongoDB) so the player can resume
 * after a page refresh. Both placement *and* battle phases are persisted —
 * this means a player who refreshes mid-placement will not lose their
 * partially-placed fleet.
 *
 * Bumping `version` invalidates older saves.
 */
export interface SavedGameState {
  version: 2;
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
  /** Selected placing ship (placement phase only). */
  selectedShipId: string | null;
  /** Current placement orientation (placement phase only). */
  orientation: Orientation;
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

/** Phases of a single-player game that are eligible to be persisted. */
const RESUMABLE_PHASES: GamePhase[] = ['placement', 'battle'];

/**
 * Validate a parsed object as a non-stale SavedGameState. Returns the same
 * object (now narrowly typed) if valid, otherwise null. Centralising the
 * check keeps the load/fetch paths in agreement.
 */
function isValidSave(parsed: unknown): parsed is SavedGameState {
  if (!parsed || typeof parsed !== 'object') return false;
  const s = parsed as Partial<SavedGameState>;
  if (s.version !== 2) return false;
  if (!s.phase || !RESUMABLE_PHASES.includes(s.phase)) return false;
  return true;
}

/** Persist the current game state to localStorage cache and MongoDB. */
export function saveGameState(state: SavedGameState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SAVED_GAME, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — silently ignore
  }
  // Primary persistence: sync to MongoDB
  syncGameSaveOnline(state).catch(() => {});
}

/** Load a previously saved game from localStorage cache, or null if none exists / data is corrupt. */
export function loadSavedGame(): SavedGameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_GAME);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isValidSave(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Fetch saved game from MongoDB and update local cache.
 * Falls back to local cache on failure.
 */
export async function fetchSavedGame(): Promise<SavedGameState | null> {
  const playerName = getSessionName();
  if (!playerName) return loadSavedGame();
  try {
    const resp = await fetch(`${getApiBase()}/game-save?player=${encodeURIComponent(playerName)}`);
    if (!resp.ok) return loadSavedGame();
    const data = await resp.json() as { gameState: unknown };
    if (data.gameState && isValidSave(data.gameState)) {
      try { localStorage.setItem(STORAGE_KEYS.SAVED_GAME, JSON.stringify(data.gameState)); } catch { /* ignore */ }
      return data.gameState;
    }
    return loadSavedGame();
  } catch {
    return loadSavedGame();
  }
}

/** Remove saved game data from both localStorage cache and MongoDB. */
export function clearSavedGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.SAVED_GAME);
  } catch {
    // ignore
  }
  // Also remove from MongoDB
  clearGameSaveOnline().catch(() => {});
}

/** Check whether a saved game exists in local cache without fully parsing it. */
export function hasSavedGame(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.SAVED_GAME) !== null;
  } catch {
    return false;
  }
}

// ── MongoDB sync helpers ──

async function syncGameSaveOnline(state: SavedGameState): Promise<void> {
  const playerName = getSessionName();
  if (!playerName) return;
  try {
    await fetch(`${getApiBase()}/game-save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName, gameState: state }),
    });
  } catch {
    // Silently fail — local cache is already saved
  }
}

async function clearGameSaveOnline(): Promise<void> {
  const playerName = getSessionName();
  if (!playerName) return;
  try {
    await fetch(`${getApiBase()}/game-save?player=${encodeURIComponent(playerName)}`, {
      method: 'DELETE',
    });
  } catch {
    // Silently fail
  }
}
