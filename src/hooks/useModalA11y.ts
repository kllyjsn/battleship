import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[role="button"]:not([aria-disabled="true"])',
].join(',');

/**
 * Baseline accessibility behaviours for a modal dialog:
 *   - traps keyboard focus inside the dialog while open
 *   - moves initial focus to the first focusable element (or the container)
 *   - restores focus to the element that opened the dialog on unmount
 *   - closes the dialog on Escape
 *
 * The caller is responsible for applying `role="dialog"`, `aria-modal="true"`,
 * and `aria-labelledby`/`aria-label` to the container element.
 */
export function useModalA11y(
  containerRef: React.RefObject<HTMLElement>,
  onClose: () => void,
) {
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    // Move focus inside: prefer the first focusable child, fall back to the
    // container itself (which must be tabindex=-1 for this to succeed).
    const container = containerRef.current;
    if (container) {
      const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      const first = focusables[0] ?? container;
      // Defer to next tick so dialogs that mount with pending child state
      // (e.g. name prompt auto-opening) can settle before we grab focus.
      requestAnimationFrame(() => first.focus());
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !container) return;

      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(el => !el.hasAttribute('data-focus-skip'));
      if (focusables.length === 0) {
        e.preventDefault();
        container.focus();
        return;
      }

      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === firstEl || !container.contains(active)) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (active === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to the element that had it before the dialog opened,
      // if it is still in the DOM and focusable.
      const prev = previouslyFocusedRef.current;
      if (prev && document.body.contains(prev)) {
        prev.focus();
      }
    };
    // We intentionally run this effect only when the hook is mounted —
    // onClose / containerRef are captured at open time and the dialog is
    // expected to unmount to trigger cleanup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
