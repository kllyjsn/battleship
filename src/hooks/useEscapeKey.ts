import { useEffect, useRef } from 'react';

interface EscapeEntry {
  handler: () => void;
}

/**
 * Module-level stack of escape entries. Only the most recently
 * registered (topmost) entry fires when Escape is pressed.
 * Entries use stable identity so callback updates don't reorder the stack.
 */
const escapeStack: EscapeEntry[] = [];

function globalEscapeHandler(e: KeyboardEvent): void {
  if (e.key === 'Escape' && escapeStack.length > 0) {
    e.stopPropagation();
    escapeStack[escapeStack.length - 1].handler();
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
 * to close one at a time. The entry's position in the stack is stable
 * even when the callback reference changes (parent re-renders).
 */
export function useEscapeKey(onEscape: () => void): void {
  const entryRef = useRef<EscapeEntry | null>(null);

  // Keep the handler reference up-to-date without moving the entry
  useEffect(() => {
    if (entryRef.current) {
      entryRef.current.handler = onEscape;
    }
  }, [onEscape]);

  // Mount/unmount: push and splice the stable entry
  useEffect(() => {
    ensureListener();
    const entry: EscapeEntry = { handler: onEscape };
    entryRef.current = entry;
    escapeStack.push(entry);
    return () => {
      const idx = escapeStack.indexOf(entry);
      if (idx !== -1) escapeStack.splice(idx, 1);
      entryRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
