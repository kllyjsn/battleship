import { useEffect } from 'react';

/**
 * Invokes `onEscape` whenever the user presses Escape while this hook is mounted.
 * Used to make modal dialogs dismissable by keyboard (WCAG 2.1.2 — no keyboard trap).
 */
export function useEscapeKey(onEscape: () => void, enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onEscape();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onEscape, enabled]);
}
