import { useState, useEffect, useMemo } from "react";

export type ScreenSize = "mobile" | "desktop";

const DESKTOP_BREAKPOINT = 1024;

/**
 * Hook to detect responsive breakpoints
 * Returns 'mobile' for screens < 1024px, 'desktop' for >= 1024px
 */
export function useResponsiveBreakpoint(): {
  screenSize: ScreenSize;
  isDesktop: boolean;
  isMobile: boolean;
} {
  const [width, setWidth] = useState(() => {
    if (typeof window === "undefined") return 0;
    return window.innerWidth;
  });

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    // Set initial value
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const screenSize = useMemo<ScreenSize>(() => {
    return width >= DESKTOP_BREAKPOINT ? "desktop" : "mobile";
  }, [width]);

  return {
    screenSize,
    isDesktop: screenSize === "desktop",
    isMobile: screenSize === "mobile",
  };
}

export default useResponsiveBreakpoint;
