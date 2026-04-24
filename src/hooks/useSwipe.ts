import { useRef, useCallback } from 'react';

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  /** True if the last completed touch was consumed as a swipe gesture. */
  didSwipe: React.RefObject<boolean>;
}

/**
 * Detects horizontal swipe gestures on touch devices.
 * Calls `onSwipe` when a swipe is detected (left or right).
 */
export function useSwipe(onSwipe: (direction: 'left' | 'right') => void, threshold = 50): SwipeHandlers {
  const startX = useRef(0);
  const startY = useRef(0);
  const didSwipe = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - startX.current;
    const dy = touch.clientY - startY.current;

    // Only trigger if horizontal movement exceeds threshold and is greater than vertical
    if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.5) {
      didSwipe.current = true;
      onSwipe(dx > 0 ? 'right' : 'left');
    } else {
      didSwipe.current = false;
    }
  }, [onSwipe, threshold]);

  return { onTouchStart, onTouchEnd, didSwipe };
}
