import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { gsap } from "gsap";
import {
  RisoTheme,
  SyntaxAnalysis,
  SyntaxSets,
  HighlightConfig,
  SongAnalysis,
} from "@/types";
import { getWordTypeOccurrences } from "@/services/localSyntaxService";
import TouchButton from "@/components/shared/TouchButton";
import Kbd from "@/components/shared/Kbd";
import WordCount from "@/components/toolbar/WordCount";

interface PanelBodyProps {
  theme: RisoTheme;
  wordCount: number;
  content: string;
  syntaxSets: SyntaxSets;
  syntaxData: SyntaxAnalysis;
  highlightConfig: HighlightConfig;
  onToggleHighlight: (key: keyof HighlightConfig) => void;
  soloMode: keyof HighlightConfig | null;
  onSoloToggle: (key: keyof HighlightConfig | null) => void;
  isOpen?: boolean;
  onCategoryHover?: (category: keyof HighlightConfig | null) => void;
  songMode?: boolean;
  onToggleSongMode?: () => void;
  songData?: SongAnalysis | null;
  rhymeColors?: readonly string[];
  onClose?: () => void;
  showSyllableAnnotations?: boolean;
  onToggleSyllableAnnotations?: () => void;
  focusedRhymeKey?: string | null;
  onFocusRhymeKey?: (key: string | null) => void;
  hoveredRhymeKey?: string | null;
  onHoverRhymeKey?: (key: string | null) => void;
  disabledRhymeKeys?: Set<string>;
  onToggleRhymeKey?: (key: string) => void;
}

const WORD_TYPE_CONFIG = [
  { key: "nouns", label: "Nouns", shortKey: "1", colorKey: "noun" },
  { key: "verbs", label: "Verbs", shortKey: "2", colorKey: "verb" },
  {
    key: "adjectives",
    label: "Adjectives",
    shortKey: "3",
    colorKey: "adjective",
  },
  { key: "adverbs", label: "Adverbs", shortKey: "4", colorKey: "adverb" },
  { key: "pronouns", label: "Pronouns", shortKey: "5", colorKey: "pronoun" },
  {
    key: "prepositions",
    label: "Prepositions",
    shortKey: "6",
    colorKey: "preposition",
  },
  {
    key: "conjunctions",
    label: "Conjunctions",
    shortKey: "7",
    colorKey: "conjunction",
  },
  { key: "articles", label: "Articles", shortKey: "8", colorKey: "article" },
  {
    key: "interjections",
    label: "Interjections",
    shortKey: "9",
    colorKey: "interjection",
  },
] as const;

const EXTRAS_CONFIG = [
  { key: "urls", label: "URLs", colorKey: "url" },
  { key: "numbers", label: "Numbers", colorKey: "number" },
  { key: "hashtags", label: "Hashtags", colorKey: "hashtag" },
] as const;

type WordTypeKey = (typeof WORD_TYPE_CONFIG)[number]["key"];

const ITEM_HEIGHT = 44;
const LONG_PRESS_MS = 400;
const ORDER_STORAGE_KEY = "clean_writer_word_type_order";
const BREAKDOWN_COLLAPSED_KEY = "clean_writer_breakdown_collapsed";
const SONG_RHYMES_COLLAPSED_KEY = "clean_writer_song_rhymes_collapsed";
const SONG_LINES_COLLAPSED_KEY = "clean_writer_song_lines_collapsed";

const PanelBody: React.FC<PanelBodyProps> = ({
  theme,
  wordCount,
  content,
  syntaxSets,
  syntaxData,
  highlightConfig,
  onToggleHighlight,
  soloMode,
  onSoloToggle,
  isOpen = false,
  onCategoryHover,
  songMode = false,
  onToggleSongMode,
  songData = null,
  rhymeColors = [],
  onClose,
  showSyllableAnnotations = false,
  onToggleSyllableAnnotations,
  focusedRhymeKey = null,
  onFocusRhymeKey,
  hoveredRhymeKey = null,
  onHoverRhymeKey,
  disabledRhymeKeys = new Set(),
  onToggleRhymeKey,
}) => {
  // Count actual word occurrences per type using O(1) Set lookups
  const wordTypeCounts = useMemo(
    () => getWordTypeOccurrences(content, syntaxSets),
    [content, syntaxSets],
  );
  const dotsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const hasAnimated = useRef(false);

  // Check for reduced motion preference
  const reducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Elastic dot entrance animation using GSAP
  useEffect(() => {
    if (isOpen && !hasAnimated.current && !reducedMotion) {
      hasAnimated.current = true;
      const dots = dotsRef.current.filter(Boolean);

      // Reset dots to starting position
      gsap.set(dots, { scale: 0, opacity: 0 });

      // Animate dots with elastic spring and stagger
      gsap.to(dots, {
        scale: 1,
        opacity: 1,
        duration: 0.6,
        ease: "elastic.out(1, 0.3)",
        stagger: 0.05,
        delay: 0.1,
      });
    } else if (!isOpen) {
      // Reset for next open
      hasAnimated.current = false;
    }
  }, [isOpen, reducedMotion]);

  // Breakdown collapsed state
  const [isBreakdownCollapsed, setIsBreakdownCollapsed] = useState<boolean>(
    () => {
      try {
        const saved = localStorage.getItem(BREAKDOWN_COLLAPSED_KEY);
        return saved === "true";
      } catch {
        return false;
      }
    },
  );

  // Song section collapse state
  const [isRhymesCollapsed, setIsRhymesCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SONG_RHYMES_COLLAPSED_KEY);
      return saved === "true";
    } catch {
      return false; // default expanded
    }
  });
  const [isLinesCollapsed, setIsLinesCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SONG_LINES_COLLAPSED_KEY);
      return saved !== null ? saved === "true" : true; // default collapsed
    } catch {
      return true;
    }
  });

  // Persist collapsed state
  useEffect(() => {
    try {
      localStorage.setItem(
        BREAKDOWN_COLLAPSED_KEY,
        String(isBreakdownCollapsed),
      );
    } catch {}
  }, [isBreakdownCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(SONG_RHYMES_COLLAPSED_KEY, String(isRhymesCollapsed));
    } catch {}
  }, [isRhymesCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(SONG_LINES_COLLAPSED_KEY, String(isLinesCollapsed));
    } catch {}
  }, [isLinesCollapsed]);

  // Toggle breakdown
  const toggleBreakdown = useCallback(() => {
    setIsBreakdownCollapsed((prev) => !prev);
  }, []);

  // Reorder state
  const [wordTypeOrder, setWordTypeOrder] = useState<WordTypeKey[]>(() => {
    try {
      const saved = localStorage.getItem(ORDER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter to valid word type keys (migration from old config that included urls/numbers)
          const validKeys = new Set(
            WORD_TYPE_CONFIG.map((c) => c.key) as readonly string[],
          );
          const filtered = parsed.filter((k: string) =>
            validKeys.has(k),
          ) as WordTypeKey[];
          if (filtered.length === WORD_TYPE_CONFIG.length) {
            return filtered;
          }
        }
      }
    } catch {}
    return WORD_TYPE_CONFIG.map((c) => c.key);
  });

  const [draggedItem, setDraggedItem] = useState<WordTypeKey | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [itemPositions, setItemPositions] = useState<
    Record<WordTypeKey, number>
  >({} as Record<WordTypeKey, number>);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartYRef = useRef(0);

  // Get ordered word type config
  const orderedConfig = useMemo(() => {
    return wordTypeOrder.map((key) => {
      const config = WORD_TYPE_CONFIG.find((c) => c.key === key)!;
      return {
        ...config,
        count: wordTypeCounts[key] || 0,
      };
    });
  }, [wordTypeOrder, wordTypeCounts]);

  // Max count across word types for proportional bar visualization
  const maxCount = useMemo(() => {
    return Math.max(1, ...orderedConfig.map((item) => item.count));
  }, [orderedConfig]);

  const totalQuickStatsCount = useMemo(() => {
    return EXTRAS_CONFIG.reduce(
      (sum, item) => sum + (wordTypeCounts[item.key] || 0),
      0,
    );
  }, [wordTypeCounts]);

  const [isQuickStatsCollapsed, setIsQuickStatsCollapsed] = useState(true);

  // Auto-expand quick stats when there is real data to show
  useEffect(() => {
    if (totalQuickStatsCount > 0) {
      setIsQuickStatsCollapsed(false);
    }
  }, [totalQuickStatsCount]);

  // Persist order
  useEffect(() => {
    try {
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(wordTypeOrder));
    } catch {}
  }, [wordTypeOrder]);

  // Initialize item positions
  useEffect(() => {
    const positions: Record<WordTypeKey, number> = {} as Record<
      WordTypeKey,
      number
    >;
    wordTypeOrder.forEach((key, index) => {
      positions[key] = index * ITEM_HEIGHT;
    });
    setItemPositions(positions);
  }, [wordTypeOrder]);

  // Item drag handlers
  const handleItemDragStart = useCallback(
    (key: WordTypeKey, clientY: number) => {
      setDraggedItem(key);
      dragStartYRef.current = clientY;
      setDragOffset(0);

      const positions: Record<WordTypeKey, number> = {} as Record<
        WordTypeKey,
        number
      >;
      wordTypeOrder.forEach((k, index) => {
        positions[k] = index * ITEM_HEIGHT;
      });
      setItemPositions(positions);
    },
    [wordTypeOrder],
  );

  const handleItemDragMove = useCallback(
    (clientY: number) => {
      if (!draggedItem) return;

      const offset = clientY - dragStartYRef.current;
      setDragOffset(offset);

      const currentIndex = wordTypeOrder.indexOf(draggedItem);
      const newPosition = currentIndex * ITEM_HEIGHT + offset;
      const newIndex = Math.max(
        0,
        Math.min(
          wordTypeOrder.length - 1,
          Math.round(newPosition / ITEM_HEIGHT),
        ),
      );

      if (newIndex !== currentIndex) {
        const newOrder = [...wordTypeOrder];
        newOrder.splice(currentIndex, 1);
        newOrder.splice(newIndex, 0, draggedItem);
        setWordTypeOrder(newOrder);
        dragStartYRef.current =
          clientY -
          (newIndex * ITEM_HEIGHT - currentIndex * ITEM_HEIGHT) +
          (offset - (newIndex - currentIndex) * ITEM_HEIGHT);
      }

      // Update positions with collision effect
      const positions: Record<WordTypeKey, number> = {} as Record<
        WordTypeKey,
        number
      >;
      const draggedIndex = wordTypeOrder.indexOf(draggedItem);
      const draggedPosition = draggedIndex * ITEM_HEIGHT + offset;

      wordTypeOrder.forEach((k, index) => {
        if (k === draggedItem) {
          positions[k] = draggedPosition;
        } else {
          const itemBasePosition = index * ITEM_HEIGHT;
          const itemCenter = itemBasePosition + ITEM_HEIGHT / 2;
          const draggedCenter = draggedPosition + ITEM_HEIGHT / 2;
          const distanceFromDragged = itemCenter - draggedCenter;
          const absDistance = Math.abs(distanceFromDragged);

          const collisionRadius = ITEM_HEIGHT * 1.5;
          if (absDistance < collisionRadius) {
            const pushStrength = (1 - absDistance / collisionRadius) * 20;
            const pushDirection = distanceFromDragged > 0 ? 1 : -1;
            positions[k] = itemBasePosition + pushDirection * pushStrength;
          } else {
            positions[k] = itemBasePosition;
          }
        }
      });
      setItemPositions(positions);
    },
    [draggedItem, wordTypeOrder],
  );

  const handleItemDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOffset(0);

    const positions: Record<WordTypeKey, number> = {} as Record<
      WordTypeKey,
      number
    >;
    wordTypeOrder.forEach((k, index) => {
      positions[k] = index * ITEM_HEIGHT;
    });
    setItemPositions(positions);
  }, [wordTypeOrder]);

  const handleDoubleClick = useCallback(
    (key: keyof HighlightConfig) => {
      if (soloMode === key) {
        onSoloToggle(null);
      } else {
        onSoloToggle(key);
      }
    },
    [onSoloToggle, soloMode],
  );

  const handleItemMouseDown = useCallback(
    (key: WordTypeKey, e: React.MouseEvent | React.TouchEvent) => {
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      longPressTimerRef.current = setTimeout(() => {
        handleItemDragStart(key, clientY);
      }, LONG_PRESS_MS);
    },
    [handleItemDragStart],
  );

  const handleItemMouseUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (draggedItem) {
      handleItemDragEnd();
    }
  }, [draggedItem, handleItemDragEnd]);

  const handleItemMouseMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (draggedItem) {
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
        handleItemDragMove(clientY);
      } else if (longPressTimerRef.current) {
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
        if (Math.abs(clientY - dragStartYRef.current) > 10) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }
    },
    [draggedItem, handleItemDragMove],
  );

  // Global listeners for item drag
  useEffect(() => {
    if (!draggedItem) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      handleItemDragMove(clientY);
    };

    const handleUp = () => {
      handleItemDragEnd();
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    document.addEventListener("touchmove", handleMove);
    document.addEventListener("touchend", handleUp);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleUp);
    };
  }, [draggedItem, handleItemDragMove, handleItemDragEnd]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      className="font-mono text-sm"
      style={{
        color: theme.text,
        width: "min(320px, calc(100vw - 72px))",
        minWidth: "260px",
      }}
    >
      {/* Word Count Header */}
      <div className="w-full px-[21px] py-[21px] flex items-center justify-between">
        <WordCount count={wordCount} theme={theme} />
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Song Mode toggle pill */}
          {onToggleSongMode && (
            <TouchButton
              onClick={onToggleSongMode}
              className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
              style={{
                backgroundColor: songMode
                  ? `${theme.accent}25`
                  : `${theme.text}10`,
                color: songMode ? theme.accent : theme.text,
                opacity: songMode ? 1 : 0.5,
                border: songMode
                  ? `1px solid ${theme.accent}40`
                  : `1px solid ${theme.text}15`,
                minHeight: "32px",
              }}
            >
              Song
            </TouchButton>
          )}
          {/* Close button */}
          {onClose && (
            <TouchButton
              onClick={onClose}
              style={{ minWidth: 44, minHeight: 44 }}
              className="flex items-center justify-center"
            >
              <span style={{ color: theme.text, opacity: 0.4, fontSize: 20, fontWeight: 300 }}>×</span>
            </TouchButton>
          )}
        </div>
      </div>

      {/* Word Type Breakdown — hidden in song mode */}
      {!songMode && (
        <div className="px-[21px] pb-[13px]">
          {/* Collapsible header with toggle */}
          <button
            onClick={toggleBreakdown}
            className="w-full text-[10px] uppercase tracking-widest mb-[13px] flex items-center gap-2 cursor-pointer hover:opacity-80 transition-all focus:outline-none"
            style={{ color: theme.text, opacity: 0.5 }}
          >
            <span
              className="flex-1 h-px"
              style={{ backgroundColor: `${theme.text}20` }}
            />
            <span className="flex items-center gap-2">
              {/* Colored indicator pill */}
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] transition-all duration-200"
                style={{
                  backgroundColor: isBreakdownCollapsed
                    ? `${theme.accent}25`
                    : `${theme.accent}40`,
                  color: theme.accent,
                  transform: isBreakdownCollapsed
                    ? "rotate(-90deg)"
                    : "rotate(0deg)",
                  boxShadow: isBreakdownCollapsed
                    ? "none"
                    : `0 0 8px ${theme.accent}30`,
                }}
              >
                ▼
              </span>
              <span>Breakdown</span>
            </span>
            <span
              className="flex-1 h-px"
              style={{ backgroundColor: `${theme.text}20` }}
            />
          </button>

          {/* Collapsible content with max-height animation */}
          <div
            className="overflow-hidden transition-all duration-300 ease-out"
            style={{
              maxHeight: isBreakdownCollapsed ? "0px" : "900px",
              opacity: isBreakdownCollapsed ? 0 : 1,
            }}
          >
            {/* Draggable items container */}
            <div
              className="relative"
              style={{ height: orderedConfig.length * ITEM_HEIGHT }}
            >
              {orderedConfig.map((item, index) => {
                const isBeingDragged = draggedItem === item.key;
                const basePosition = index * ITEM_HEIGHT;
                const currentPosition = itemPositions[item.key] ?? basePosition;
                const isActive =
                  highlightConfig[item.key as keyof HighlightConfig];
                const isSoloed = soloMode === item.key;
                const isDimmed = soloMode !== null && !isSoloed;

                const displacement = currentPosition - basePosition;
                const isBeingPushed =
                  !isBeingDragged && draggedItem && Math.abs(displacement) > 2;
                const pushIntensity = Math.min(1, Math.abs(displacement) / 20);

                const categoryColor =
                  theme.highlight[
                    item.colorKey as keyof typeof theme.highlight
                  ];

                return (
                  <div
                    key={item.key}
                    className={`absolute left-0 right-0 flex items-center justify-between py-2 px-2.5 rounded-lg select-none ${
                      isBeingDragged
                        ? "z-50 cursor-grabbing"
                        : "z-10 cursor-grab"
                    }`}
                    style={{
                      height: ITEM_HEIGHT,
                      transform: `translateY(${currentPosition}px) scale(${
                        isBeingDragged
                          ? 1.05
                          : isBeingPushed
                            ? 1 - pushIntensity * 0.03
                            : 1
                      }) rotate(${isBeingPushed ? displacement * 0.1 : 0}deg)`,
                      transition: isBeingDragged
                        ? "box-shadow 150ms ease, scale 150ms ease"
                        : "transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 200ms ease, scale 200ms ease",
                      backgroundColor: isBeingDragged
                        ? theme.background
                        : isBeingPushed
                          ? `${theme.text}05`
                          : "transparent",
                      boxShadow: isBeingDragged
                        ? "0 12px 40px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15)"
                        : isBeingPushed
                          ? "0 2px 8px rgba(0,0,0,0.08)"
                          : "none",
                      opacity: isDimmed ? 0.4 : !isActive ? 0.4 : 1,
                      filter: isDimmed ? "grayscale(0.6)" : "none",
                      borderRadius: "8px",
                    }}
                    onDoubleClick={() =>
                      handleDoubleClick(item.key as keyof HighlightConfig)
                    }
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleItemMouseDown(item.key, e);
                    }}
                    onTouchStart={(e) => {
                      handleItemMouseDown(item.key, e);
                    }}
                    onMouseMove={handleItemMouseMove}
                    onTouchMove={handleItemMouseMove}
                    onMouseUp={handleItemMouseUp}
                    onTouchEnd={handleItemMouseUp}
                    onMouseEnter={() =>
                      onCategoryHover?.(item.key as keyof HighlightConfig)
                    }
                    onMouseLeave={() => onCategoryHover?.(null)}
                  >
                    {/* Proportional bar — thin bottom line */}
                    <div
                      className="absolute left-2 bottom-0 rounded-full pointer-events-none"
                      style={{
                        width:
                          item.count > 0
                            ? `${Math.max(4, (item.count / maxCount) * 60)}%`
                            : "0%",
                        height: "2px",
                        backgroundColor: categoryColor,
                        opacity: 0.3,
                        transition:
                          "width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease",
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <span
                        ref={(el) => {
                          dotsRef.current[index] = el;
                        }}
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: categoryColor,
                          transform: isBeingDragged
                            ? "scale(1.4)"
                            : isBeingPushed
                              ? `scale(${1.1 + pushIntensity * 0.15})`
                              : "scale(1)",
                          boxShadow: isBeingDragged
                            ? `0 0 16px ${categoryColor}90, 0 0 32px ${categoryColor}40`
                            : isBeingPushed
                              ? `0 0 8px ${categoryColor}50`
                              : "none",
                          transition:
                            "transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 150ms ease",
                        }}
                      />
                      <span
                        className="text-xl font-bold tabular-nums min-w-[40px] text-right"
                        style={{ color: categoryColor }}
                      >
                        {item.count}
                      </span>
                      <span className="opacity-30 text-xs font-medium">×</span>
                      <span className="font-medium">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Shortcut badge — small keyboard hint inside 44px touch target */}
                      <TouchButton
                        onClick={() =>
                          onToggleHighlight(item.key as keyof HighlightConfig)
                        }
                        className={`flex items-center justify-center transition-all ${
                          isSoloed ? "ring-2 ring-offset-1" : ""
                        }`}
                        style={
                          {
                            minWidth: "44px",
                            minHeight: "44px",
                            "--tw-ring-color": categoryColor,
                            "--tw-ring-offset-color": theme.background,
                          } as React.CSSProperties
                        }
                      >
                        <span
                          className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-mono font-bold"
                          style={{
                            backgroundColor: isActive
                              ? `${categoryColor}30`
                              : `${theme.text}10`,
                            color: isActive ? categoryColor : theme.text,
                          }}
                        >
                          {item.shortKey}
                        </span>
                      </TouchButton>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className="mt-4 rounded-lg border px-2 py-2"
              style={{
                borderColor: `${theme.text}18`,
                backgroundColor: `${theme.background}f4`,
              }}
            >
              <TouchButton
                onClick={() => setIsQuickStatsCollapsed((prev) => !prev)}
                className="w-full flex items-center justify-between text-[10px] uppercase tracking-wider font-medium px-2 py-1.5 rounded-md"
                style={{ color: theme.text, opacity: 0.72 }}
                data-testid="quick-stats-toggle"
              >
                <span>Quick Stats</span>
                <span
                  className="inline-block transition-transform duration-200"
                  style={{
                    transform: isQuickStatsCollapsed
                      ? "rotate(-90deg)"
                      : "rotate(0deg)",
                  }}
                >
                  ▼
                </span>
              </TouchButton>

              {/* Extras: URLs, Numbers, Hashtags — collapsible */}
              <div
                data-testid="quick-stats-content"
                className="overflow-hidden transition-all duration-300 ease-out"
                style={{
                  maxHeight: isQuickStatsCollapsed ? "0px" : "220px",
                  opacity: isQuickStatsCollapsed ? 0 : 1,
                }}
              >
                <div
                  className="grid grid-cols-2 gap-2 mt-2"
                  data-testid="quick-stats-grid"
                >
                  {EXTRAS_CONFIG.map((item, index) => {
                    const count = wordTypeCounts[item.key] || 0;
                    const color =
                      theme.highlight[
                        item.colorKey as keyof typeof theme.highlight
                      ];
                    const isActive =
                      highlightConfig[item.key as keyof HighlightConfig];
                    const isDimmed = soloMode !== null && soloMode !== item.key;
                    const isLast = index === EXTRAS_CONFIG.length - 1;

                    return (
                      <TouchButton
                        key={item.key}
                        onClick={() =>
                          onToggleHighlight(item.key as keyof HighlightConfig)
                        }
                        onDoubleClick={() =>
                          handleDoubleClick(item.key as keyof HighlightConfig)
                        }
                        onMouseEnter={() =>
                          onCategoryHover?.(item.key as keyof HighlightConfig)
                        }
                        onMouseLeave={() => onCategoryHover?.(null)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${isLast ? "col-span-2" : ""}`}
                        style={{
                          opacity: isDimmed ? 0.3 : 1,
                          backgroundColor: isActive
                            ? `${color}12`
                            : `${theme.background}a0`,
                          border: `1px solid ${isActive ? `${color}40` : `${theme.text}16`}`,
                          boxShadow: "none",
                          minHeight: "38px",
                        }}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs font-medium">
                          {item.label}
                        </span>
                        <span
                          className="text-sm font-bold tabular-nums ml-auto"
                          data-testid={
                            item.key === "hashtags"
                              ? "hashtags-counter"
                              : undefined
                          }
                        >
                          {count}
                        </span>
                      </TouchButton>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Song Mode: Dedicated panel view — replaces breakdown */}
      {songMode && songData && (
        <div className="px-[21px] pb-[13px]">
          {/* Non-Latin warning */}
          {songData.nonLatinWarning && (
            <div
              className="mb-3 px-3 py-2 rounded-lg text-xs"
              style={{
                backgroundColor: `${theme.text}08`,
                border: `1px solid ${theme.text}15`,
                color: theme.text,
                opacity: 0.6,
              }}
            >
              Rhyme analysis supports English only
            </div>
          )}

          {/* 1. "— SONG —" header with inline syllable toggle */}
          <div
            className="text-xs uppercase tracking-widest mb-[13px] flex items-center gap-2"
            style={{ color: theme.text, opacity: 0.5 }}
          >
            <span
              className="flex-1 h-px"
              style={{ backgroundColor: `${theme.text}20` }}
            />
            <span>Song</span>
            {onToggleSyllableAnnotations && (
              <TouchButton
                onClick={onToggleSyllableAnnotations}
                className="transition-all"
                style={{
                  opacity: showSyllableAnnotations ? 0.8 : 0.35,
                  color: showSyllableAnnotations ? theme.accent : theme.text,
                }}
                title={showSyllableAnnotations ? "Hide syllable annotations" : "Show syllable annotations"}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showSyllableAnnotations ? (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </>
                  ) : (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </>
                  )}
                </svg>
              </TouchButton>
            )}
            <span
              className="flex-1 h-px"
              style={{ backgroundColor: `${theme.text}20` }}
            />
          </div>

          {/* 2. Quick counts row — moved up, right after header */}
          <div
            className="mb-3 grid grid-cols-3 gap-2 text-center"
          >
            <div className="flex flex-col items-center">
              <span
                className="text-xl font-bold tabular-nums block"
                style={{ color: theme.accent }}
              >
                {songData.totalSyllables}
              </span>
              <span className="text-[10px] uppercase tracking-wider" style={{ color: theme.text, opacity: 0.4 }}>
                Syllables
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span
                className="text-xl font-bold tabular-nums block"
                style={{ color: theme.text, opacity: 0.7 }}
              >
                {songData.lines.filter((l) => l.words.length > 0).length}
              </span>
              <span className="text-[10px] uppercase tracking-wider" style={{ color: theme.text, opacity: 0.4 }}>
                Lines
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span
                className="text-xl font-bold tabular-nums block"
                style={{ color: rhymeColors.length > 0 ? rhymeColors[0] : theme.text }}
              >
                {songData.rhymeGroups.length}
              </span>
              <span className="text-[10px] uppercase tracking-wider" style={{ color: theme.text, opacity: 0.4 }}>
                Rhymes
              </span>
            </div>
          </div>

          {/* RHYMES section — collapsible */}
          <TouchButton
            onClick={() => setIsRhymesCollapsed(prev => !prev)}
            className="w-full text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2 cursor-pointer hover:opacity-80 transition-all"
            style={{ color: theme.text, opacity: 0.5 }}
          >
            <span
              className="flex-1 h-px"
              style={{ backgroundColor: `${theme.text}20` }}
            />
            <span className="flex items-center gap-2">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] transition-all duration-200"
                style={{
                  backgroundColor: isRhymesCollapsed ? `${theme.accent}25` : `${theme.accent}40`,
                  color: theme.accent,
                  transform: isRhymesCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                  boxShadow: isRhymesCollapsed ? "none" : `0 0 8px ${theme.accent}30`,
                }}
              >
                ▼
              </span>
              <span>Rhymes</span>
            </span>
            <span
              className="flex-1 h-px"
              style={{ backgroundColor: `${theme.text}20` }}
            />
          </TouchButton>

          <div
            className="overflow-hidden transition-all duration-300 ease-out"
            style={{
              maxHeight: isRhymesCollapsed ? "0px" : "600px",
              opacity: isRhymesCollapsed ? 0 : 1,
            }}
          >
            {/* Rhyme scheme */}
            {songData.rhymeScheme.label !== "—" && (
              <div className="mb-3 flex items-baseline justify-between gap-2 px-1">
                <span className="text-sm font-bold tracking-wider font-mono flex-1 min-w-0 truncate">
                  {(songData.rhymeScheme.pattern.length > 16
                    ? songData.rhymeScheme.pattern.slice(0, 16) + "\u2026"
                    : songData.rhymeScheme.pattern
                  ).split("").map((letter, i) => {
                    const letterIndex = letter.charCodeAt(0) - 65;
                    const color = rhymeColors && letterIndex >= 0 && letterIndex < rhymeColors.length
                      ? rhymeColors[letterIndex]
                      : theme.text;
                    return (
                      <span key={i} style={{ color, opacity: letterIndex >= rhymeColors.length ? 0.5 : 1 }}>
                        {letter}
                      </span>
                    );
                  })}
                </span>
                <span className="text-xs font-medium flex-shrink-0" style={{ color: theme.text, opacity: 0.5 }}>
                  {songData.rhymeScheme.label}
                </span>
              </div>
            )}

            {/* Rhyme groups — interactive */}
            {songData.rhymeGroups.length > 0 ? (
              <div className="grid grid-cols-1 gap-1.5">
                {songData.rhymeGroups.map((group) => {
                  const color = rhymeColors[group.colorIndex] || theme.accent;
                  const isDisabled = disabledRhymeKeys.has(group.key);
                  const isFocused = focusedRhymeKey === group.key;
                  const isDimmed = focusedRhymeKey !== null && !isFocused;
                  return (
                    <div
                      key={group.key}
                      className="flex items-center gap-1.5 min-h-[28px] px-1 rounded-md cursor-pointer select-none transition-all duration-150"
                      style={{
                        opacity: isDimmed ? 0.35 : isDisabled ? 0.35 : 1,
                        filter: isDimmed ? "grayscale(0.5)" : "none",
                        backgroundColor: isFocused ? `${color}15` : "transparent",
                        boxShadow: isFocused ? `inset 0 0 0 1.5px ${color}40` : "none",
                      }}
                      onClick={() => onToggleRhymeKey?.(group.key)}
                      onDoubleClick={() => {
                        onFocusRhymeKey?.(focusedRhymeKey === group.key ? null : group.key);
                      }}
                      onMouseEnter={() => onHoverRhymeKey?.(group.key)}
                      onMouseLeave={() => onHoverRhymeKey?.(null)}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs flex-1 min-w-0 truncate" style={{ color: theme.text, opacity: 0.6 }}>
                        {group.words.slice(0, 5).join(", ")}
                        {group.words.length > 5
                          ? ` +${group.words.length - 5}`
                          : ""}
                      </span>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <span
                          className="text-[10px] tabular-nums font-medium leading-none rounded-full px-1.5 py-0.5"
                          style={{ backgroundColor: `${color}18`, color }}
                        >
                          {group.words.length}
                        </span>
                        <span
                          className="w-3 text-[9px] text-center flex-shrink-0"
                          style={{ color: theme.text, opacity: group.approximate ? 0.4 : 0 }}
                          title={group.approximate ? "Approximate rhyme (word not in dictionary)" : undefined}
                        >
                          {group.approximate ? "~" : ""}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-center py-2" style={{ color: theme.text, opacity: 0.4 }}>
                No rhyme groups detected yet
              </p>
            )}
          </div>

          {/* LINES section — collapsible */}
          {songData.lines.filter((l) => l.totalSyllables > 0).length > 0 && (() => {
            const syllableCounts = songData.lines
              .filter((l) => l.totalSyllables > 0)
              .map((l) => l.totalSyllables);
            const maxSyl = Math.max(...syllableCounts, 1);
            const minSyl = Math.min(...syllableCounts, 0);
            return (
              <>
                <TouchButton
                  onClick={() => setIsLinesCollapsed(prev => !prev)}
                  className="w-full text-[10px] uppercase tracking-widest mt-3 mb-2 flex items-center gap-2 cursor-pointer hover:opacity-80 transition-all"
                  style={{ color: theme.text, opacity: 0.5 }}
                >
                  <span
                    className="flex-1 h-px"
                    style={{ backgroundColor: `${theme.text}20` }}
                  />
                  <span className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] transition-all duration-200"
                      style={{
                        backgroundColor: isLinesCollapsed ? `${theme.accent}25` : `${theme.accent}40`,
                        color: theme.accent,
                        transform: isLinesCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                        boxShadow: isLinesCollapsed ? "none" : `0 0 8px ${theme.accent}30`,
                      }}
                    >
                      ▼
                    </span>
                    <span>Lines</span>
                  </span>
                  <span
                    className="flex-1 h-px"
                    style={{ backgroundColor: `${theme.text}20` }}
                  />
                </TouchButton>

                <div
                  className="overflow-hidden transition-all duration-300 ease-out"
                  style={{
                    maxHeight: isLinesCollapsed ? "0px" : "300px",
                    opacity: isLinesCollapsed ? 0 : 1,
                  }}
                >
                  <div className="relative">
                    <div
                      className="overflow-y-auto space-y-0.5"
                      style={{ maxHeight: "200px" }}
                    >
                      {songData.lines.map((line, i) => {
                        if (line.totalSyllables === 0) return null;
                        const density = maxSyl > minSyl
                          ? (line.totalSyllables - minSyl) / (maxSyl - minSyl)
                          : 0.5;
                        const countOpacity = 0.35 + density * 0.55;
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between text-xs min-h-[20px]"
                            style={{ color: theme.text }}
                          >
                            <span className="truncate flex-1 mr-3" style={{ opacity: 0.45 }}>
                              {line.text.trim()}
                            </span>
                            <span
                              className="tabular-nums font-medium text-right min-w-[24px]"
                              style={{
                                color: density > 0.7 ? theme.accent : theme.text,
                                opacity: countOpacity,
                                fontVariantNumeric: "tabular-nums",
                              }}
                            >
                              {line.totalSyllables}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Bottom fade mask when content overflows */}
                    {songData.lines.filter((l) => l.totalSyllables > 0).length > 12 && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none"
                        style={{
                          background: `linear-gradient(transparent, ${theme.background}E6)`,
                        }}
                      />
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Keyboard Hint Footer */}
      <div
        className="px-6 py-3 text-center border-t"
        style={{ borderColor: `${theme.text}10` }}
      >
        <p className="text-xs opacity-40 mt-1">
          {songMode ? (
            "Rhyme groups highlighted"
          ) : (
            <>
              Press{" "}
              <Kbd theme={theme}>1</Kbd>
              {" - "}
              <Kbd theme={theme}>9</Kbd>{" "}
              to toggle
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default PanelBody;
