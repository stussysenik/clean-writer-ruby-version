import React, { useRef, useEffect, useMemo } from "react";
import { gsap } from "gsap";
import { RisoTheme } from "@/types";
import { HarmonicaStage } from "@/hooks/useHarmonicaDrag";

interface HarmonicaContainerProps {
  theme: RisoTheme;
  stage: HarmonicaStage;
  isDragging: boolean;
  dragProgress: number;
  reducedMotion: boolean;
  children: {
    tab: React.ReactNode;
    peek: React.ReactNode;
    expand: React.ReactNode;
    full: React.ReactNode;
  };
}

// Stage dimensions
const STAGE_DIMENSIONS: Record<
  HarmonicaStage,
  { width: number; height: number | "auto" }
> = {
  closed: { width: 56, height: 80 },
  peek: { width: 140, height: 80 },
  expand: { width: 140, height: 180 },
  full: { width: 320, height: 480 },
};

const HarmonicaContainer: React.FC<HarmonicaContainerProps> = ({
  theme,
  stage,
  isDragging,
  dragProgress,
  reducedMotion,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const prevStageRef = useRef<HarmonicaStage>(stage);

  // Calculate current dimensions based on stage and drag progress
  const dimensions = useMemo(() => {
    const current = STAGE_DIMENSIONS[stage];

    if (!isDragging) return current;

    // During drag, interpolate towards next stage
    const stageOrder: HarmonicaStage[] = ["closed", "peek", "expand", "full"];
    const currentIndex = stageOrder.indexOf(stage);
    const nextIndex = Math.min(currentIndex + 1, stageOrder.length - 1);
    const nextStage = stageOrder[nextIndex];
    const next = STAGE_DIMENSIONS[nextStage];

    // Apply resistance effect before 50% threshold
    const easeProgress =
      dragProgress < 0.5
        ? dragProgress * 0.3 // Resistance: only 30% of drag translates to expansion
        : 0.15 + (dragProgress - 0.5) * 1.7; // After 50%, accelerate

    return {
      width: current.width + (next.width - current.width) * easeProgress,
      height:
        typeof current.height === "number" && typeof next.height === "number"
          ? current.height + (next.height - current.height) * easeProgress
          : current.height,
    };
  }, [stage, isDragging, dragProgress]);

  // Animate stage transitions with GSAP spring
  useEffect(() => {
    if (!containerRef.current || prevStageRef.current === stage) return;

    const targetDimensions = STAGE_DIMENSIONS[stage];

    if (reducedMotion) {
      // Instant transition for reduced motion
      gsap.set(containerRef.current, {
        width: targetDimensions.width,
        height:
          typeof targetDimensions.height === "number"
            ? targetDimensions.height
            : "auto",
      });
    } else {
      // Mechanical spring animation with overshoot
      gsap.to(containerRef.current, {
        width: targetDimensions.width,
        height:
          typeof targetDimensions.height === "number"
            ? targetDimensions.height
            : "auto",
        duration: 0.35,
        ease: "back.out(1.2)", // Overshoot for mechanical feel
      });
    }

    prevStageRef.current = stage;
  }, [stage, reducedMotion]);

  // During drag, apply dimensions directly (no animation)
  useEffect(() => {
    if (!containerRef.current || !isDragging) return;

    gsap.set(containerRef.current, {
      width: dimensions.width,
      height:
        typeof dimensions.height === "number" ? dimensions.height : "auto",
    });
  }, [dimensions, isDragging]);

  // Determine which content sections to show (mutually exclusive to prevent overlaps)
  const showPeek = stage === "peek";
  const showExpand = stage === "expand";
  const showFull = stage === "full";

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-l-2xl"
      style={{
        width: isDragging ? dimensions.width : STAGE_DIMENSIONS[stage].width,
        height: isDragging
          ? typeof dimensions.height === "number"
            ? dimensions.height
            : "auto"
          : typeof STAGE_DIMENSIONS[stage].height === "number"
            ? STAGE_DIMENSIONS[stage].height
            : "auto",
        // Glassmorphism
        backgroundColor:
          stage === "closed" ? "transparent" : `${theme.background}E6`,
        backdropFilter: stage === "closed" ? "none" : "blur(10px)",
        WebkitBackdropFilter: stage === "closed" ? "none" : "blur(10px)",
        border: stage === "closed" ? "none" : `1px solid ${theme.text}15`,
        borderRight: stage === "closed" ? "none" : "none",
        boxShadow:
          stage !== "closed"
            ? `-8px 0 32px rgba(0,0,0,0.15), -2px 0 8px rgba(0,0,0,0.08)`
            : "none",
        // Resistance visual feedback during drag
        transform:
          isDragging && dragProgress < 0.5
            ? `scale(${1 - dragProgress * 0.02})`
            : "scale(1)",
        transition: isDragging ? "none" : "transform 0.2s ease",
      }}
    >
      {stage !== "closed" && (
        /* Paper grain texture */
        <div
          className="absolute inset-0 pointer-events-none opacity-15 mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paperNoise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paperNoise)' opacity='0.08'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Content container */}
      <div ref={contentRef} className="relative w-full h-full flex">
        {/* Tab (always visible) - positioned at right edge */}
        <div
          className="absolute right-0 top-0 z-10 flex-shrink-0"
          style={{
            width: STAGE_DIMENSIONS.closed.width,
            height: STAGE_DIMENSIONS.closed.height,
          }}
        >
          {children.tab}
        </div>

        {/* Peek content (word count preview) */}
        <div
          className="absolute top-0 transition-opacity duration-200"
          style={{
            left: 0,
            right: STAGE_DIMENSIONS.closed.width,
            height: STAGE_DIMENSIONS.peek.height,
            opacity: showPeek ? 1 : 0,
            visibility: showPeek ? "visible" : "hidden",
            pointerEvents: showPeek ? "auto" : "none",
          }}
        >
          {children.peek}
        </div>

        {/* Expand content (breakdown header) */}
        <div
          className="absolute transition-opacity duration-200"
          style={{
            left: 0,
            right: STAGE_DIMENSIONS.closed.width,
            top: STAGE_DIMENSIONS.peek.height,
            height:
              (STAGE_DIMENSIONS.expand.height as number) -
              (STAGE_DIMENSIONS.peek.height as number),
            opacity: showExpand ? 1 : 0,
            visibility: showExpand ? "visible" : "hidden",
            pointerEvents: showExpand ? "auto" : "none",
          }}
        >
          {children.expand}
        </div>

        {/* Full content */}
        <div
          data-testid="mobile-panel-scroll-region"
          className="absolute transition-opacity duration-200"
          style={{
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            opacity: showFull ? 1 : 0,
            visibility: showFull ? "visible" : "hidden",
            pointerEvents: showFull ? "auto" : "none",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          {children.full}
        </div>
      </div>

      {/* Fold crease shadow at the hinge (right edge) */}
      {stage !== "closed" && (
        <div
          className="absolute right-0 top-0 bottom-0 w-2 pointer-events-none"
          style={{
            background: `linear-gradient(to left,
              ${theme.text}10 0%,
              transparent 100%)`,
          }}
        />
      )}
    </div>
  );
};

export default HarmonicaContainer;
