import { useState, useEffect, useCallback, useMemo } from "react";

interface VirtualKeyboardState {
  isKeyboardOpen: boolean;
  keyboardHeight: number;
}

interface VirtualKeyboardAPI {
  overlaysContent: boolean;
  boundingRect: DOMRect;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

declare global {
  interface Navigator {
    virtualKeyboard?: VirtualKeyboardAPI;
  }
}

/**
 * Hook for reliable virtual keyboard detection on mobile devices.
 *
 * Uses the VirtualKeyboard API (Chrome 94+) when available,
 * with a VisualViewport fallback that uses adaptive thresholds.
 *
 * @returns { isKeyboardOpen, keyboardHeight }
 */
export function useVirtualKeyboard(): VirtualKeyboardState {
  const [state, setState] = useState<VirtualKeyboardState>({
    isKeyboardOpen: false,
    keyboardHeight: 0,
  });

  // Check for reduced motion preference
  const reducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Debounce helper for resize events
  const debounce = useCallback(
    <T extends (...args: Parameters<T>) => void>(fn: T, ms: number) => {
      let timeoutId: ReturnType<typeof setTimeout>;
      return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), ms);
      };
    },
    [],
  );

  useEffect(() => {
    // Use VirtualKeyboard API if available (Chrome 94+)
    if ("virtualKeyboard" in navigator && navigator.virtualKeyboard) {
      const vk = navigator.virtualKeyboard;

      // Enable overlay mode so we get geometry info
      vk.overlaysContent = true;

      const handleGeometryChange = () => {
        const rect = vk.boundingRect;
        const height = rect?.height || 0;
        setState({
          isKeyboardOpen: height > 0,
          keyboardHeight: height,
        });
      };

      vk.addEventListener("geometrychange", handleGeometryChange);

      // Check initial state
      handleGeometryChange();

      return () => {
        vk.removeEventListener("geometrychange", handleGeometryChange);
      };
    }

    // Fallback: VisualViewport API with adaptive threshold
    if (!window.visualViewport) {
      return;
    }

    const viewport = window.visualViewport;
    let initialHeight = window.innerHeight;
    let lastKeyboardOpen = false;

    const updateKeyboardState = () => {
      const currentHeight = viewport.height;
      const heightDiff = initialHeight - currentHeight;

      // Adaptive threshold: use percentage-based detection
      // Keyboards typically take 30-50% of screen height
      // Use a minimum threshold of 100px AND 15% of screen height
      const minThreshold = Math.max(100, initialHeight * 0.15);

      // Also check if the height diff is significant enough
      // to avoid false positives from browser chrome changes
      const isKeyboardOpen = heightDiff > minThreshold;

      // Only update if state changed (prevents unnecessary re-renders)
      if (isKeyboardOpen !== lastKeyboardOpen) {
        lastKeyboardOpen = isKeyboardOpen;
        setState({
          isKeyboardOpen,
          keyboardHeight: isKeyboardOpen ? heightDiff : 0,
        });
      }
    };

    // Debounce to avoid rapid state changes during keyboard animation
    const debouncedUpdate = reducedMotion
      ? updateKeyboardState
      : debounce(updateKeyboardState, 100);

    // Handle viewport resize
    viewport.addEventListener("resize", debouncedUpdate);

    // Also handle orientation changes which reset initial height
    const handleOrientationChange = () => {
      // Give time for the viewport to settle after rotation
      setTimeout(() => {
        initialHeight = window.innerHeight;
        updateKeyboardState();
      }, 300);
    };

    window.addEventListener("orientationchange", handleOrientationChange);

    // Initial check
    updateKeyboardState();

    return () => {
      viewport.removeEventListener("resize", debouncedUpdate);
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, [reducedMotion, debounce]);

  return state;
}

export default useVirtualKeyboard;
