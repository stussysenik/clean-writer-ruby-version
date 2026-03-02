import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface DragGhostProps {
  color: string;
  position: { x: number; y: number };
  positionRef?: React.RefObject<{ x: number; y: number }>;
  isVisible: boolean;
  isOverTrash: boolean;
  isDeleting?: boolean;
  isRejected?: boolean;
  originalPosition?: { x: number; y: number };
}

const DragGhost: React.FC<DragGhostProps> = ({
  color,
  position,
  positionRef,
  isVisible,
  isOverTrash,
  isDeleting = false,
  isRejected = false,
  originalPosition,
}) => {
  const [animationState, setAnimationState] = useState<
    "appearing" | "following" | "deleting" | "rejected"
  >("appearing");
  const rafRef = useRef<number | null>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const smoothRef = useRef({ x: position.x, y: position.y });

  // Initialize smooth position when becoming visible
  useEffect(() => {
    if (isVisible) {
      const target = positionRef ? positionRef.current : position;
      smoothRef.current = { x: target.x, y: target.y };
    }
  }, [isVisible]);

  // Smooth position following with easing — direct DOM writes, zero re-renders
  useEffect(() => {
    if (!isVisible) return;

    const animate = () => {
      const target = positionRef ? positionRef.current : position;
      const dx = target.x - smoothRef.current.x;
      const dy = target.y - smoothRef.current.y;
      const easing = 0.15;

      smoothRef.current.x += dx * easing;
      smoothRef.current.y += dy * easing;

      if (ghostRef.current) {
        ghostRef.current.style.left = `${smoothRef.current.x}px`;
        ghostRef.current.style.top = `${smoothRef.current.y}px`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isVisible, positionRef, position]);

  // Handle animation states
  useEffect(() => {
    if (isDeleting) {
      setAnimationState("deleting");
    } else if (isRejected) {
      setAnimationState("rejected");
      // For rejected, snap to original position via style
      if (ghostRef.current && originalPosition) {
        ghostRef.current.style.left = `${originalPosition.x}px`;
        ghostRef.current.style.top = `${originalPosition.y}px`;
      }
    } else if (isVisible) {
      setAnimationState("appearing");
      const timer = setTimeout(() => setAnimationState("following"), 200);
      return () => clearTimeout(timer);
    }
  }, [isVisible, isDeleting, isRejected, originalPosition]);

  if (
    !isVisible &&
    animationState !== "deleting" &&
    animationState !== "rejected"
  ) {
    return null;
  }

  const getTransform = () => {
    switch (animationState) {
      case "appearing":
        return "translate(-50%, -50%) scale(1.2)";
      case "following":
        return isOverTrash
          ? "translate(-50%, -50%) scale(1.0)"
          : "translate(-50%, -50%) scale(1.2)";
      case "deleting":
        return "translate(-50%, 100px) scale(0)";
      case "rejected":
        return "translate(-50%, -50%) scale(1.0)";
      default:
        return "translate(-50%, -50%) scale(1.2)";
    }
  };

  const initPos = positionRef ? positionRef.current : position;

  const ghostStyle: React.CSSProperties = {
    position: "fixed",
    left: animationState === "rejected" && originalPosition
      ? originalPosition.x
      : initPos.x,
    top: animationState === "rejected" && originalPosition
      ? originalPosition.y
      : initPos.y,
    width: 40,
    height: 40,
    borderRadius: "50%",
    backgroundColor: color,
    pointerEvents: "none",
    zIndex: 9999,
    transform: getTransform(),
    opacity: animationState === "deleting" ? 0 : isOverTrash ? 0.7 : 0.9,
    boxShadow: isOverTrash
      ? `0 8px 32px rgba(239, 68, 68, 0.5), inset 0 0 0 3px rgba(239, 68, 68, 0.5)`
      : "0 12px 40px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2)",
    transition:
      animationState === "appearing"
        ? "transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease-out"
        : animationState === "deleting"
          ? "transform 400ms cubic-bezier(0.55, 0.085, 0.68, 0.53), opacity 400ms ease-out, top 400ms cubic-bezier(0.55, 0.085, 0.68, 0.53)"
          : animationState === "rejected"
            ? "all 500ms cubic-bezier(0.34, 1.56, 0.64, 1)"
            : "transform 150ms ease-out, box-shadow 150ms ease-out, opacity 150ms ease-out",
    willChange: "transform, left, top",
  };

  return createPortal(
    <div ref={ghostRef} style={ghostStyle}>
      {/* Inner highlight for 3D effect */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "20%",
          width: "30%",
          height: "30%",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.4)",
          filter: "blur(2px)",
        }}
      />
    </div>,
    document.body,
  );
};

export default DragGhost;
