import { useCallback, useRef } from "react";

type HapticIntensity = "light" | "medium" | "heavy";

interface UseTouchOptions {
  onTap?: () => void;
  onLongPress?: () => void;
  hapticFeedback?: HapticIntensity;
  longPressDelay?: number;
}

const HAPTIC_PATTERNS: Record<HapticIntensity, number[]> = {
  light: [10],
  medium: [20],
  heavy: [40],
};

export function useTouch(options: UseTouchOptions = {}) {
  const {
    onTap,
    onLongPress,
    hapticFeedback = "light",
    longPressDelay = 500,
  } = options;

  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isTouching = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const triggerHaptic = useCallback(
    (intensity: HapticIntensity = hapticFeedback) => {
      if ("vibrate" in navigator) {
        navigator.vibrate(HAPTIC_PATTERNS[intensity]);
      }
    },
    [hapticFeedback],
  );

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartPos.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        isTouching.current = true;
        didLongPress.current = false;

        // Start long press timer if handler provided
        if (onLongPress) {
          longPressTimer.current = setTimeout(() => {
            if (isTouching.current && touchStartPos.current) {
              didLongPress.current = true;
              triggerHaptic("medium");
              onLongPress();
            }
          }, longPressDelay);
        }
      }
    },
    [onLongPress, longPressDelay, triggerHaptic],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartPos.current || !isTouching.current) return;

      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStartPos.current.x);
      const dy = Math.abs(touch.clientY - touchStartPos.current.y);

      // If moved more than 10px, cancel both tap and long press
      if (dx > 10 || dy > 10) {
        isTouching.current = false;
        touchStartPos.current = null;
        clearLongPressTimer();
      }
    },
    [clearLongPressTimer],
  );

  const onTouchEnd = useCallback(() => {
    clearLongPressTimer();

    // Only trigger tap if we didn't long press
    if (isTouching.current && touchStartPos.current && !didLongPress.current) {
      triggerHaptic();
      onTap?.();
    }

    isTouching.current = false;
    touchStartPos.current = null;
    didLongPress.current = false;
  }, [onTap, triggerHaptic, clearLongPressTimer]);

  const onTouchCancel = useCallback(() => {
    clearLongPressTimer();
    isTouching.current = false;
    touchStartPos.current = null;
    didLongPress.current = false;
  }, [clearLongPressTimer]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
  };
}
