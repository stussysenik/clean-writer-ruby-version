import React from "react";
import { RisoTheme } from "@/types";

interface FoldContainerProps {
  theme: RisoTheme;
  isOpen: boolean;
  reducedMotion: boolean;
  children: React.ReactNode;
}

const FoldContainer: React.FC<FoldContainerProps> = ({
  theme,
  isOpen,
  reducedMotion,
  children,
}) => {
  return (
    <div
      className="relative rounded-l-2xl overflow-hidden"
      style={{
        // Glassmorphism: semi-transparent background with blur
        backgroundColor: `${theme.background}E6`, // ~90% opacity
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        // Glass border effect
        border: `1px solid ${theme.text}15`,
        borderRight: "none",
        // Slide animation
        transform: isOpen ? "translateX(0)" : "translateX(100%)",
        transition: reducedMotion
          ? "opacity 200ms ease"
          : "transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        opacity: reducedMotion ? (isOpen ? 1 : 0) : 1,
        // Enhanced shadow with glass effect
        boxShadow: isOpen
          ? `-8px 0 32px rgba(0,0,0,0.15), -2px 0 8px rgba(0,0,0,0.08), inset 0 0 0 1px ${theme.text}08`
          : "none",
        // Mobile viewport constraints
        maxHeight: "calc(100dvh - 100px)",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        // Prevent closed panel from intercepting pointer events
        pointerEvents: isOpen ? "auto" : "none",
      }}
    >
      {/* Paper grain texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-15 mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paperNoise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paperNoise)' opacity='0.08'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Glass highlight at top edge */}
      <div
        className="absolute left-0 right-0 top-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(to right,
            transparent 0%,
            ${theme.text}20 20%,
            ${theme.text}20 80%,
            transparent 100%)`,
        }}
      />

      {/* Fold crease shadow at the hinge (right edge) */}
      {isOpen && (
        <div
          className="absolute right-0 top-0 bottom-0 w-2 pointer-events-none"
          style={{
            background: `linear-gradient(to left,
              ${theme.text}10 0%,
              transparent 100%)`,
          }}
        />
      )}

      {/* Content area */}
      {children}
    </div>
  );
};

export default FoldContainer;
