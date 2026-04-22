import { useEffect } from 'react';

/**
 * Invoke `onEscape` when the user presses the Escape key.
 * Used by modal dialogs to close themselves — a standard UX/a11y expectation.
 */
export function useEscapeKey(onEscape: () => void): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onEscape();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onEscape]);
}
