/**
 * Centralised localStorage key constants.
 * Prevents typos and makes it easy to find every persistence touch-point.
 */

export const STORAGE_KEYS = {
  /** Player's chosen display name (callsign). */
  SESSION_NAME: 'battleship-session-name',
  /** Aggregate win/loss/accuracy statistics. */
  STATS: 'battleship-stats',
  /** Serialised in-progress game for resume-on-refresh. */
  SAVED_GAME: 'battleship-saved-game',
  /** Unlocked achievement list. */
  ACHIEVEMENTS: 'battleship-achievements',
  /** Leaderboard entries. */
  LEADERBOARD: 'battleship-leaderboard',
  /** Selected visual theme ID. */
  THEME: 'battleship-theme',
  /** Sound-effects mute preference (boolean stored as string). */
  SOUND_MUTED: 'battleship-sound-muted',
} as const;

// ── Shared helpers used by multiple modules ──

/** Read the player's callsign from localStorage. */
export function getSessionName(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.SESSION_NAME) || '';
  } catch {
    return '';
  }
}

/** Base path for the optional online API. */
export function getApiBase(): string {
  return '/api';
}
