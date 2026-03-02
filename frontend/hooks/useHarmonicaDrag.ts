import { useState, useCallback, useRef, useEffect, useMemo } from "react";

export type HarmonicaStage = "closed" | "peek" | "expand" | "full";

interface HarmonicaDragState {
  stage: HarmonicaStage;
  isDragging: boolean;
  dragProgress: number; // 0-1 progress towards next stage
  dragDirection: "left" | "up" | null;
}

interface HarmonicaDragHandlers {
  onDragStart: (e: React.TouchEvent | React.MouseEvent) => void;
  onDragMove: (e: React.TouchEvent | React.MouseEvent) => void;
  onDragEnd: () => void;
}

interface UseHarmonicaDragOptions {
  reducedMotion?: boolean;
  onStageChange?: (stage: HarmonicaStage) => void;
}

interface UseHarmonicaDragReturn {
  state: HarmonicaDragState;
  handlers: HarmonicaDragHandlers;
  setStage: (stage: HarmonicaStage) => void;
  close: () => void;
}

// Cumulative distance thresholds for unified horizontal drag
// All stages use leftward drag - one continuous motion from closed to full
const STAGE_THRESHOLDS = {
  peek: 40, // 0-40px → peek (word count preview)
  expand: 120, // 40-120px → expand (breakdown header)
  full: 220, // 120-220px → full (complete panel)
};

// Snap boundaries (midpoints between thresholds)
const SNAP_BOUNDARIES = {
  toPeek: 20, // < 20px → closed, >= 20px → peek
  toExpand: 80, // < 80px → peek, >= 80px → expand
  toFull: 170, // < 170px → expand, >= 170px → full
};

// Haptic feedback patterns
const triggerHaptic = (pattern: "snap" | "fullOpen" | "resistance") => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    switch (pattern) {
      case "snap":
        navigator.vibrate([15, 5, 15]); // Double tap feel
        break;
      case "fullOpen":
        navigator.vibrate([20, 10, 20, 10, 30]); // Gear engaged
        break;
      case "resistance":
        navigator.vibrate(5); // Subtle resistance
        break;
    }
  }
};

export function useHarmonicaDrag(
  options: UseHarmonicaDragOptions = {},
): UseHarmonicaDragReturn {
  const { reducedMotion = false, onStageChange } = options;

  const [stage, setStageInternal] = useState<HarmonicaStage>("closed");
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const [dragDirection, setDragDirection] = useState<"left" | "up" | null>(
    null,
  );

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastHapticRef = useRef<number>(0);

  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return reducedMotion;
    return (
      reducedMotion ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, [reducedMotion]);

  const setStage = useCallback(
    (newStage: HarmonicaStage) => {
      setStageInternal(newStage);
      onStageChange?.(newStage);
    },
    [onStageChange],
  );

  const close = useCallback(() => {
    setStage("closed");
    setDragProgress(0);
  }, [setStage]);

  const getClientCoords = (
    e: React.TouchEvent | React.MouseEvent,
  ): { x: number; y: number } => {
    if ("touches" in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const onDragStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const coords = getClientCoords(e);
    dragStartRef.current = coords;
    setIsDragging(true);
    setDragProgress(0);
    setDragDirection(null);
  }, []);

  const onDragMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!dragStartRef.current || !isDragging) return;

      const coords = getClientCoords(e);
      const deltaX = dragStartRef.current.x - coords.x; // Positive = dragging left

      // Unified horizontal drag - calculate progress towards full (0-1)
      const progress = Math.max(0, Math.min(1, deltaX / STAGE_THRESHOLDS.full));

      setDragProgress(progress);
      setDragDirection(deltaX > 0 ? "left" : null);

      // Trigger haptic feedback at stage boundaries during drag
      if (!prefersReducedMotion) {
        const now = Date.now();
        if (now - lastHapticRef.current > 150) {
          // Haptic at each threshold crossing
          if (
            deltaX >= STAGE_THRESHOLDS.peek - 5 &&
            deltaX <= STAGE_THRESHOLDS.peek + 5
          ) {
            triggerHaptic("resistance");
            lastHapticRef.current = now;
          } else if (
            deltaX >= STAGE_THRESHOLDS.expand - 5 &&
            deltaX <= STAGE_THRESHOLDS.expand + 5
          ) {
            triggerHaptic("resistance");
            lastHapticRef.current = now;
          }
        }
      }
    },
    [isDragging, prefersReducedMotion],
  );

  const onDragEnd = useCallback(() => {
    if (!isDragging || !dragStartRef.current) return;

    // Calculate total drag distance
    const dragDistance = dragProgress * STAGE_THRESHOLDS.full;

    // Snap to nearest stage based on drag distance
    let newStage: HarmonicaStage;
    if (dragDistance >= SNAP_BOUNDARIES.toFull) {
      newStage = "full";
    } else if (dragDistance >= SNAP_BOUNDARIES.toExpand) {
      newStage = "expand";
    } else if (dragDistance >= SNAP_BOUNDARIES.toPeek) {
      newStage = "peek";
    } else {
      newStage = "closed";
    }

    // Only trigger haptic and update if stage changed
    if (newStage !== stage) {
      setStage(newStage);
      if (!prefersReducedMotion) {
        if (newStage === "full") {
          triggerHaptic("fullOpen");
        } else {
          triggerHaptic("snap");
        }
      }
    }

    // Reset drag state
    setIsDragging(false);
    setDragProgress(0);
    setDragDirection(null);
    dragStartRef.current = null;
  }, [isDragging, dragProgress, stage, prefersReducedMotion, setStage]);

  // Global event listeners for drag continuation outside element
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      const coords =
        "touches" in e
          ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
          : { x: e.clientX, y: e.clientY };

      if (!dragStartRef.current) return;

      const deltaX = dragStartRef.current.x - coords.x; // Positive = dragging left

      // Unified horizontal drag - progress towards full (0-1)
      const progress = Math.max(0, Math.min(1, deltaX / STAGE_THRESHOLDS.full));
      setDragProgress(progress);
      setDragDirection(deltaX > 0 ? "left" : null);
    };

    const handleGlobalEnd = () => {
      onDragEnd();
    };

    document.addEventListener("mousemove", handleGlobalMove);
    document.addEventListener("mouseup", handleGlobalEnd);
    document.addEventListener("touchmove", handleGlobalMove, { passive: true });
    document.addEventListener("touchend", handleGlobalEnd);

    return () => {
      document.removeEventListener("mousemove", handleGlobalMove);
      document.removeEventListener("mouseup", handleGlobalEnd);
      document.removeEventListener("touchmove", handleGlobalMove);
      document.removeEventListener("touchend", handleGlobalEnd);
    };
  }, [isDragging, onDragEnd]);

  return {
    state: {
      stage,
      isDragging,
      dragProgress,
      dragDirection,
    },
    handlers: {
      onDragStart,
      onDragMove,
      onDragEnd,
    },
    setStage,
    close,
  };
}

export default useHarmonicaDrag;
