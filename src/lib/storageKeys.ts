/**
 * Centralised localStorage key constants.
 * localStorage is used only as a fast local cache; MongoDB (via API) is the
 * primary persistence layer for all player data.
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

/** Read the player's callsign from localStorage (cache). */
export function getSessionName(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.SESSION_NAME) || '';
  } catch {
    return '';
  }
}

/** Save the player's callsign to both localStorage cache and MongoDB. */
export function setSessionName(name: string): void {
  try {
    if (name.trim()) {
      localStorage.setItem(STORAGE_KEYS.SESSION_NAME, name.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION_NAME);
    }
  } catch {
    // Storage unavailable
  }
  // Fire-and-forget sync to MongoDB
  syncSessionNameOnline(name.trim()).catch(() => {});
}

/** Read the sound-mute preference from localStorage (cache). */
export function isSoundEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.SOUND_MUTED) !== 'true';
  } catch {
    return true;
  }
}

/** Base path for the online API. */
export function getApiBase(): string {
  return '/api';
}

// ── MongoDB sync helpers ──

async function syncSessionNameOnline(name: string): Promise<void> {
  if (!name) return;
  try {
    await fetch(`${getApiBase()}/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: name }),
    });
  } catch {
    // Silently fail — local cache is already saved
  }
}
