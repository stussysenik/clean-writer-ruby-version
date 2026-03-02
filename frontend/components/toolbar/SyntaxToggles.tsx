import React from "react";
import { RisoTheme, HighlightConfig } from "@/types";
import {
  IconNoun,
  IconPronoun,
  IconVerb,
  IconAdj,
  IconAdverb,
  IconPreposition,
  IconConj,
  IconArticle,
  IconInterjection,
} from "./Icons";
import TouchButton from "@/components/shared/TouchButton";
import Tooltip from "@/components/shared/Tooltip";

interface SyntaxTogglesProps {
  theme: RisoTheme;
  highlightConfig: HighlightConfig;
  onToggle: (key: keyof HighlightConfig) => void;
  visible: boolean;
  soloMode?: keyof HighlightConfig | null;
  onSoloToggle?: (key: keyof HighlightConfig | null) => void;
}

interface ToggleButtonConfig {
  key: keyof HighlightConfig;
  number: number;
  icon: React.FC<{ className?: string }>;
  colorKey: keyof RisoTheme["highlight"];
  label: string;
  group: "content" | "function";
}

// Organized by semantic groups with keyboard shortcut numbers
const TOGGLE_CONFIG: ToggleButtonConfig[] = [
  // Content Words (1-4) - carry meaning
  {
    key: "nouns",
    number: 1,
    icon: IconNoun,
    colorKey: "noun",
    label: "Nouns",
    group: "content",
  },
  {
    key: "verbs",
    number: 2,
    icon: IconVerb,
    colorKey: "verb",
    label: "Verbs",
    group: "content",
  },
  {
    key: "adjectives",
    number: 3,
    icon: IconAdj,
    colorKey: "adjective",
    label: "Adjectives",
    group: "content",
  },
  {
    key: "adverbs",
    number: 4,
    icon: IconAdverb,
    colorKey: "adverb",
    label: "Adverbs",
    group: "content",
  },
  // Function Words (5-9) - structural
  {
    key: "pronouns",
    number: 5,
    icon: IconPronoun,
    colorKey: "pronoun",
    label: "Pronouns",
    group: "function",
  },
  {
    key: "prepositions",
    number: 6,
    icon: IconPreposition,
    colorKey: "preposition",
    label: "Prepositions",
    group: "function",
  },
  {
    key: "conjunctions",
    number: 7,
    icon: IconConj,
    colorKey: "conjunction",
    label: "Conjunctions",
    group: "function",
  },
  {
    key: "articles",
    number: 8,
    icon: IconArticle,
    colorKey: "article",
    label: "Articles",
    group: "function",
  },
  {
    key: "interjections",
    number: 9,
    icon: IconInterjection,
    colorKey: "interjection",
    label: "Interjections",
    group: "function",
  },
];

const contentWords = TOGGLE_CONFIG.filter((t) => t.group === "content");
const functionWords = TOGGLE_CONFIG.filter((t) => t.group === "function");

const SyntaxToggles: React.FC<SyntaxTogglesProps> = ({
  theme,
  highlightConfig,
  onToggle,
  visible,
  soloMode = null,
  onSoloToggle,
}) => {
  const handleDoubleClick = (key: keyof HighlightConfig) => {
    if (onSoloToggle) {
      // If already soloed on this key, exit solo mode
      if (soloMode === key) {
        onSoloToggle(null);
      } else {
        onSoloToggle(key);
      }
    }
  };

  const handleContextMenu = (
    e: React.MouseEvent,
    key: keyof HighlightConfig,
  ) => {
    e.preventDefault();
    handleDoubleClick(key);
  };

  const renderToggleButton = ({
    key,
    number,
    icon: Icon,
    colorKey,
    label,
  }: ToggleButtonConfig) => {
    const isSoloed = soloMode === key;
    const isDimmedBySolo = soloMode !== null && soloMode !== key;
    const isActive = highlightConfig[key];

    return (
      <Tooltip
        key={key}
        content={`${label}${soloMode ? "" : " (Double click for solo view!)"}`}
        shortcut={String(number)}
      >
        <TouchButton
          onClick={() => onToggle(key)}
          onDoubleClick={() => handleDoubleClick(key)}
          onContextMenu={(e) => handleContextMenu(e, key)}
          className={`relative p-2 rounded hover:bg-white/50 transition-all min-w-[36px] min-h-[36px] md:min-w-[32px] md:min-h-[32px] flex items-center justify-center ${
            isActive && !isDimmedBySolo ? "opacity-100" : "opacity-40 grayscale"
          } ${isSoloed ? "ring-2 ring-offset-1" : ""}`}
          style={
            {
              "--tw-ring-color": isSoloed
                ? theme.highlight[colorKey]
                : undefined,
              "--tw-ring-offset-color": theme.background,
            } as React.CSSProperties
          }
          title={`${label} (${number})`}
        >
          <span
            style={{
              color: theme.highlight[colorKey],
            }}
          >
            <Icon />
          </span>
          <span
            className="absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center"
            style={{
              backgroundColor: theme.highlight[colorKey],
              color: theme.background,
            }}
          >
            {number}
          </span>
        </TouchButton>
      </Tooltip>
    );
  };

  return (
    <div
      className="overflow-x-auto mb-2 transition-opacity duration-300"
      style={{
        opacity: visible ? 1 : 0,
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div className="flex gap-1 p-1.5 bg-black/5 rounded-lg backdrop-blur-sm w-fit min-w-max items-center">
        {/* Content Words Group */}
        {contentWords.map(renderToggleButton)}

        {/* Visual Separator */}
        <div
          className="w-px h-6 mx-1 opacity-30"
          style={{ backgroundColor: theme.text }}
        />

        {/* Function Words Group */}
        {functionWords.map(renderToggleButton)}

        {/* Solo Mode Indicator */}
        {soloMode && onSoloToggle && (
          <>
            <div
              className="w-px h-6 mx-1 opacity-30"
              style={{
                backgroundColor: theme.text,
              }}
            />
            <TouchButton
              onClick={() => onSoloToggle(null)}
              className="px-2 py-1 text-xs rounded hover:bg-white/50 transition-all opacity-70 hover:opacity-100"
              title="Exit solo mode"
            >
              Exit Solo
            </TouchButton>
          </>
        )}
      </div>
    </div>
  );
};

export default SyntaxToggles;
