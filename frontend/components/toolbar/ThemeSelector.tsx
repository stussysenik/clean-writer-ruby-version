import React, {
  useRef,
  useEffect,
} from "react";
import { RisoTheme } from "@/types";
import { THEMES } from "@/constants";
import Tooltip from "@/components/shared/Tooltip";

interface ThemeSelectorProps {
  currentTheme: RisoTheme;
  themeId: string;
  onThemeChange: (id: string) => void;
  hiddenThemeIds?: string[];
  orderedThemes?: typeof THEMES;
  hasOverridesForTheme?: (id: string) => boolean;
}

// Shared swatch circle used for preset themes
const SwatchCircle = ({
  id, name, color, isSelected, hasEdits, isCustom, currentTheme, onClick,
}: {
  id: string; name: string; color: string;
  isSelected: boolean; hasEdits?: boolean; isCustom?: boolean;
  currentTheme: RisoTheme;
  onClick: () => void;
}) => (
  <div className="relative group flex-shrink-0">
    <Tooltip content={name} position="bottom">
      <button
        onClick={onClick}
        data-theme-id={id}
        className={`relative w-9 h-9 rounded-full transition-all duration-200 touch-manipulation ${
          isSelected ? "" : "hover:scale-110 opacity-80 hover:opacity-100"
        }`}
        style={{
          backgroundColor: color,
          transform: isSelected ? "scale(1.15)" : undefined,
          outline: isSelected
            ? `2px solid ${currentTheme.text}`
            : "2px solid transparent",
          outlineOffset: "2px",
          transition: "all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        aria-label={name}
      >
        {isCustom && (
          <span
            className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center"
            style={{
              width: "10px",
              height: "10px",
              backgroundColor: currentTheme.background,
              borderRadius: "50%",
            }}
          >
            <svg width="6" height="6" viewBox="0 0 10 10" fill={currentTheme.text}>
              <path d="M5 0L6.12 3.88L10 5L6.12 6.12L5 10L3.88 6.12L0 5L3.88 3.88Z" />
            </svg>
          </span>
        )}
      </button>
    </Tooltip>
  </div>
);

const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  themeId,
  onThemeChange,
  hiddenThemeIds = [],
  orderedThemes = THEMES,
  hasOverridesForTheme,
}) => {
  const MAX_VISIBLE = 10;
  const visibleThemes = orderedThemes
    .filter((t) => !hiddenThemeIds.includes(t.id))
    .slice(0, MAX_VISIBLE);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll active theme into view on mount & when themeId changes
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const active = container.querySelector(`[data-theme-id="${themeId}"]`);
    if (active) {
      active.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
  }, [themeId]);

  return (
    <div className="overflow-hidden md:overflow-visible">
      {/* Mobile: horizontal scroll strip / Desktop: wrapped grid */}
      <div
        ref={scrollRef}
        className="flex gap-2.5 md:gap-3 items-center overflow-x-auto md:overflow-visible md:flex-wrap md:max-w-[336px] no-scrollbar py-3 px-2.5 md:py-[7px] md:px-[7px]"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {visibleThemes.map((t) => (
          <SwatchCircle
            key={t.id}
            id={t.id}
            name={t.name}
            color={t.accent}
            isSelected={themeId === t.id}
            hasEdits={hasOverridesForTheme?.(t.id)}
            isCustom={t.id.startsWith("custom_")}
            currentTheme={currentTheme}
            onClick={() => onThemeChange(t.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;
