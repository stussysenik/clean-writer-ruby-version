import React, { useState, useRef, useEffect } from "react";
import { RisoTheme, SyntaxAnalysis } from "@/types";

interface AnalysisDrawerProps {
  syntaxData: SyntaxAnalysis;
  content: string;
  theme: RisoTheme;
}

const WORD_TYPE_CONFIG = [
  { key: "nouns", label: "Nouns", abbrev: "n", colorKey: "noun" },
  { key: "verbs", label: "Verbs", abbrev: "v", colorKey: "verb" },
  {
    key: "adjectives",
    label: "Adjectives",
    abbrev: "adj",
    colorKey: "adjective",
  },
  { key: "adverbs", label: "Adverbs", abbrev: "adv", colorKey: "adverb" },
  { key: "pronouns", label: "Pronouns", abbrev: "pron", colorKey: "pronoun" },
  {
    key: "prepositions",
    label: "Prepositions",
    abbrev: "prep",
    colorKey: "preposition",
  },
  {
    key: "conjunctions",
    label: "Conjunctions",
    abbrev: "conj",
    colorKey: "conjunction",
  },
  { key: "articles", label: "Articles", abbrev: "art", colorKey: "article" },
  {
    key: "interjections",
    label: "Interjections",
    abbrev: "int",
    colorKey: "interjection",
  },
] as const;

const AnalysisDrawer: React.FC<AnalysisDrawerProps> = ({
  syntaxData,
  content,
  theme,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startTranslateRef = useRef(0);

  const wordCount =
    content.trim() === "" ? 0 : content.trim().split(/\s+/).length;

  // Get counts for each word type
  const getCounts = () => {
    return WORD_TYPE_CONFIG.map((config) => ({
      ...config,
      count: syntaxData[config.key as keyof SyntaxAnalysis].length,
    })).filter((item) => item.count > 0);
  };

  const counts = getCounts();

  // Build equation string
  const buildEquation = () => {
    return counts.map((item) => `${item.count}${item.abbrev}`).join(" + ");
  };

  // Handle touch/mouse drag
  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    startXRef.current = clientX;
    startTranslateRef.current = isOpen ? 0 : 280;
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging || !drawerRef.current) return;

    const delta = startXRef.current - clientX;
    const newTranslate = Math.max(
      0,
      Math.min(280, startTranslateRef.current + delta),
    );
    drawerRef.current.style.transform = `translateX(${280 - newTranslate}px)`;
  };

  const handleDragEnd = (clientX: number) => {
    if (!isDragging || !drawerRef.current) return;

    const delta = startXRef.current - clientX;
    const threshold = 60;

    if (isOpen) {
      // If open, check if we should close
      if (delta < -threshold) {
        setIsOpen(false);
      }
    } else {
      // If closed, check if we should open
      if (delta > threshold) {
        setIsOpen(true);
      }
    }

    // Reset to proper position
    drawerRef.current.style.transform = "";
    setIsDragging(false);
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    handleDragEnd(e.changedTouches[0].clientX);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientX);
    };

    const handleMouseUp = (e: MouseEvent) => {
      handleDragEnd(e.clientX);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        drawerRef.current &&
        !drawerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Don't render if no content
  if (wordCount === 0) return null;

  return (
    <div
      ref={drawerRef}
      className={`fixed right-0 top-1/2 -translate-y-1/2 z-50 flex transition-transform duration-300 ease-out ${
        isDragging ? "transition-none" : ""
      }`}
      style={{
        transform: isOpen ? "translateX(0)" : "translateX(280px)",
      }}
    >
      {/* Tab Handle */}
      <div
        className="flex-shrink-0 cursor-pointer select-none touch-manipulation"
        onClick={() => !isDragging && setIsOpen(!isOpen)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        style={{
          writingMode: "vertical-rl",
          textOrientation: "mixed",
        }}
      >
        <div
          className="px-2 py-4 rounded-l-lg shadow-lg font-mono text-xs font-medium tracking-wider uppercase flex items-center gap-2"
          style={{
            backgroundColor: theme.background,
            color: theme.text,
            borderLeft: `3px solid ${theme.accent}`,
            boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
          }}
        >
          <span className="rotate-180">{isOpen ? "\u2192" : "\u2190"}</span>
          <span className="rotate-180">Analysis</span>
        </div>
      </div>

      {/* Drawer Content */}
      <div
        className="w-[280px] shadow-lg overflow-hidden font-mono text-sm"
        style={{
          backgroundColor: theme.background,
          color: theme.text,
          boxShadow: "-4px 0 12px rgba(0,0,0,0.15)",
        }}
      >
        {/* Receipt Header */}
        <div
          className="px-4 pt-4 pb-2 text-center border-b border-dashed"
          style={{ borderColor: `${theme.text}30` }}
        >
          <div className="text-xs tracking-[0.3em] uppercase opacity-60 mb-1">
            Word Analysis
          </div>
          <div className="text-2xl font-bold">{wordCount}</div>
          <div className="text-xs opacity-60">words total</div>
        </div>

        {/* Breakdown */}
        <div className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider opacity-50 mb-2">
            Breakdown
          </div>
          <div className="space-y-1.5">
            {counts.map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        theme.highlight[
                          item.colorKey as keyof typeof theme.highlight
                        ],
                    }}
                  />
                  <span className="opacity-80">{item.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold">{item.count}</span>
                  <span className="text-xs opacity-50">&times;</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Equation */}
        {counts.length > 0 && (
          <div
            className="px-4 py-3 border-t border-dashed"
            style={{ borderColor: `${theme.text}30` }}
          >
            <div className="text-[10px] uppercase tracking-wider opacity-50 mb-2">
              Equation
            </div>
            <div
              className="text-xs p-2 rounded overflow-x-auto whitespace-nowrap"
              style={{ backgroundColor: `${theme.text}08` }}
            >
              = {buildEquation()}
            </div>
          </div>
        )}

        {/* Receipt Footer */}
        <div
          className="px-4 py-3 text-center text-[10px] opacity-40 border-t border-dashed"
          style={{ borderColor: `${theme.text}30` }}
        >
          <div className="tracking-[0.2em]">*** CLEAN TYPEWRITER ***</div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDrawer;
