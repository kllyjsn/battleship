import { useEffect } from 'react';

/**
 * Module-level stack of escape handlers. Only the most recently
 * registered (topmost) handler fires when Escape is pressed.
 * This prevents nested dialogs from all closing at once.
 */
const escapeStack: Array<() => void> = [];

function globalEscapeHandler(e: KeyboardEvent): void {
  if (e.key === 'Escape' && escapeStack.length > 0) {
    e.stopPropagation();
    escapeStack[escapeStack.length - 1]();
  }
}

let listenerAttached = false;

function ensureListener(): void {
  if (!listenerAttached) {
    window.addEventListener('keydown', globalEscapeHandler);
    listenerAttached = true;
  }
}

/**
 * Calls `onEscape` when the Escape key is pressed.
 * Uses a global stack so only the topmost handler fires,
 * allowing nested dialogs (e.g. ConfirmDialog inside SettingsPanel)
 * to close one at a time.
 */
export function useEscapeKey(onEscape: () => void): void {
  useEffect(() => {
    ensureListener();
    escapeStack.push(onEscape);
    return () => {
      const idx = escapeStack.lastIndexOf(onEscape);
      if (idx !== -1) escapeStack.splice(idx, 1);
    };
  }, [onEscape]);
}
