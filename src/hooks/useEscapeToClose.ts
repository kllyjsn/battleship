import { useEffect } from 'react';

/**
 * Close a modal / dialog when the user presses Escape.
 *
 * Follows the WAI-ARIA dialog pattern: any modal should be dismissable
 * via Escape. Registered globally on `window` so focus does not have to
 * be inside the modal for the key to work (matches native `<dialog>`
 * behavior and avoids forcing focus-trap on every caller).
 *
 * Pass `active=false` to temporarily disable (e.g. for a nested dialog
 * that should swallow Escape itself).
 */
export function useEscapeToClose(onClose: () => void, active: boolean = true): void {
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, active]);
}
