import type { Board, Ship, Difficulty, GamePhase, BattleLogEntry } from '../engine/types';
import type { AIState } from '../engine/ai';
import type { ReplayMove } from './replay';
import { STORAGE_KEYS, getSessionName, getApiBase } from './storageKeys';

/** Wire-format AI state with `Set` flattened to an array for JSON. */
export interface SerializedAIState {
  mode: 'hunt' | 'target';
  hitStack: { row: number; col: number }[];
  triedPositions: string[];
  lastHit: { row: number; col: number } | null;
  firstHit: { row: number; col: number } | null;
  orientation: 'unknown' | 'horizontal' | 'vertical';
}

export function serializeAIState(ai: AIState): SerializedAIState {
  return {
    mode: ai.mode,
    hitStack: ai.hitStack,
    triedPositions: Array.from(ai.triedPositions),
    lastHit: ai.lastHit,
    firstHit: ai.firstHit,
    orientation: ai.orientation,
  };
}

export function deserializeAIState(s: SerializedAIState): AIState {
  return {
    mode: s.mode,
    hitStack: s.hitStack,
    triedPositions: new Set(s.triedPositions),
    lastHit: s.lastHit,
    firstHit: s.firstHit,
    orientation: s.orientation,
  };
}

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
  aiState: SerializedAIState;
  /** Cumulative play time in seconds as of the snapshot — preserved across resume so post-game duration is accurate. */
  elapsedSeconds?: number;
  /** Full move history so resumed games still produce a complete replay. */
  replayMoves?: ReplayMove[];
  /** Original ship placements for replay playback. */
  playerShipPlacements?: Ship[];
  opponentShipPlacements?: Ship[];
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
    const parsed = JSON.parse(raw) as SavedGameState;
    // Basic validation: must have version 1 and be in battle phase
    if (parsed.version !== 1 || parsed.phase !== 'battle') return null;
    return parsed;
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
    const data = await resp.json() as { gameState: SavedGameState | null };
    if (data.gameState) {
      const state = data.gameState;
      if (state.version === 1 && state.phase === 'battle') {
        try { localStorage.setItem(STORAGE_KEYS.SAVED_GAME, JSON.stringify(state)); } catch { /* ignore */ }
        return state;
      }
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
