import { useEffect, useRef } from 'react';

/**
 * Traps keyboard focus inside a container element while it is mounted.
 * Returns a ref to attach to the container div/dialog.
 *
 * Pressing Tab / Shift+Tab cycles through focusable elements within the
 * container. On mount the first focusable element (or the container itself)
 * receives focus; on unmount focus returns to the previously active element.
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>() {
  const containerRef = useRef<T>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const container = containerRef.current;
    if (!container) return;

    // Move focus into the trap on mount
    const focusableSelector =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const focusFirst = () => {
      const first = container.querySelector<HTMLElement>(focusableSelector);
      if (first) {
        first.focus();
      } else {
        container.setAttribute('tabindex', '-1');
        container.focus();
      }
    };

    // Small delay to let React finish rendering children
    const rafId = requestAnimationFrame(focusFirst);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelector)
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(rafId);
      container.removeEventListener('keydown', handleKeyDown);
      // Restore focus to the element that was focused before the trap
      previousFocusRef.current?.focus();
    };
  }, []);

  return containerRef;
}
