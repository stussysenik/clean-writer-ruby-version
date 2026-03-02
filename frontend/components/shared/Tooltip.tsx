import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: string;
  shortcut?: string;
  children: React.ReactNode;
  position?: "top" | "bottom";
  delay?: number;
  disabled?: boolean;
}

interface Position {
  top: number;
  left: number;
}

// Detect primary touch device (no fine pointer = phone/tablet)
const isTouchPrimary = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(pointer: coarse)").matches;

const Tooltip: React.FC<TooltipProps> = ({
  content,
  shortcut,
  children,
  position = "top",
  delay = 300,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<Position>({
    top: 0,
    left: 0,
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  // Track recent touch to suppress focus-triggered tooltips
  const recentTouchRef = useRef(false);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let top: number;
    let left: number;

    // Center horizontally relative to trigger
    left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;

    // Position above or below
    if (position === "top") {
      top = triggerRect.top - tooltipRect.height - 8;
    } else {
      top = triggerRect.bottom + 8;
    }

    // Keep tooltip within viewport
    const padding = 8;
    if (left < padding) {
      left = padding;
    } else if (left + tooltipRect.width > window.innerWidth - padding) {
      left = window.innerWidth - tooltipRect.width - padding;
    }

    if (top < padding) {
      // Flip to bottom if not enough space on top
      top = triggerRect.bottom + 8;
    } else if (top + tooltipRect.height > window.innerHeight - padding) {
      // Flip to top if not enough space on bottom
      top = triggerRect.top - tooltipRect.height - 8;
    }

    setTooltipPosition({ top, left });
  }, [position]);

  const showTooltip = useCallback(() => {
    if (disabled || isTouchPrimary()) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [delay, disabled]);

  const showTooltipFromFocus = useCallback(() => {
    // Suppress tooltip when focus follows a recent touch event
    if (recentTouchRef.current) return;
    showTooltip();
  }, [showTooltip]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  }, []);

  const handleTouchStart = useCallback(() => {
    recentTouchRef.current = true;
    hideTooltip();
    // Reset after a short window
    setTimeout(() => {
      recentTouchRef.current = false;
    }, 500);
  }, [hideTooltip]);

  // Update position when tooltip becomes visible
  useEffect(() => {
    if (isVisible) {
      // Use requestAnimationFrame to ensure tooltip is rendered before measuring
      requestAnimationFrame(() => {
        updatePosition();
      });
    }
  }, [isVisible, updatePosition]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const displayText = shortcut ? `${content} (${shortcut})` : content;

  const tooltipContent = isVisible ? (
    <div
      ref={tooltipRef}
      role="tooltip"
      className="fixed z-[9999] px-2 py-1 text-xs font-medium whitespace-nowrap rounded shadow-lg pointer-events-none bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
      style={{
        top: tooltipPosition.top,
        left: tooltipPosition.left,
        animation: "fadeIn 0.15s ease-out",
      }}
    >
      {displayText}
    </div>
  ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-flex"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltipFromFocus}
        onBlur={hideTooltip}
        onTouchStart={handleTouchStart}
      >
        {children}
      </div>
      {tooltipContent && createPortal(tooltipContent, document.body)}
    </>
  );
};

export default Tooltip;
