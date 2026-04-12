/**
 * Haptic feedback hook using the Vibration API.
 * Falls back silently on devices that don't support it.
 */

function vibrate(pattern: number | number[]): void {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Vibration API not available or blocked
  }
}

export function useHaptics() {
  return {
    /** Short tap — cell click / miss */
    tap: () => vibrate(15),
    /** Medium pulse — hit */
    hit: () => vibrate(40),
    /** Strong double-pulse — ship sunk */
    sunk: () => vibrate([60, 50, 80]),
    /** Victory rumble */
    win: () => vibrate([30, 40, 30, 40, 100]),
    /** Defeat thud */
    lose: () => vibrate([100, 50, 60]),
    /** Light tap for UI interactions */
    light: () => vibrate(8),
  };
}
