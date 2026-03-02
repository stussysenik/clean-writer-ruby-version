import React, { useState, useMemo } from "react";
import { RisoTheme, SyntaxAnalysis, HighlightConfig } from "@/types";
import TouchButton from "@/components/shared/TouchButton";

interface WordCountReceiptProps {
  count: number;
  theme: RisoTheme;
  syntaxData?: SyntaxAnalysis;
  content?: string;
  highlightConfig?: HighlightConfig;
}

interface WordTypeCount {
  key: string;
  label: string;
  count: number;
  colorKey: keyof RisoTheme["highlight"];
}

const WordCountReceipt: React.FC<WordCountReceiptProps> = ({
  count,
  theme,
  syntaxData,
  content,
  highlightConfig,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate word type counts based on actual content
  const wordTypeCounts = useMemo((): WordTypeCount[] => {
    if (!content || !syntaxData) return [];

    const words = content.toLowerCase().match(/\b[a-z]+\b/g) || [];
    const wordSet = new Set(words);

    const counts: WordTypeCount[] = [
      {
        key: "nouns",
        label: "Nouns",
        count: syntaxData.nouns.filter((w) => wordSet.has(w.toLowerCase()))
          .length,
        colorKey: "noun",
      },
      {
        key: "verbs",
        label: "Verbs",
        count: syntaxData.verbs.filter((w) => wordSet.has(w.toLowerCase()))
          .length,
        colorKey: "verb",
      },
      {
        key: "adjectives",
        label: "Adj",
        count: syntaxData.adjectives.filter((w) => wordSet.has(w.toLowerCase()))
          .length,
        colorKey: "adjective",
      },
      {
        key: "adverbs",
        label: "Adv",
        count: syntaxData.adverbs.filter((w) => wordSet.has(w.toLowerCase()))
          .length,
        colorKey: "adverb",
      },
      {
        key: "pronouns",
        label: "Pron",
        count: syntaxData.pronouns.filter((w) => wordSet.has(w.toLowerCase()))
          .length,
        colorKey: "pronoun",
      },
      {
        key: "prepositions",
        label: "Prep",
        count: syntaxData.prepositions.filter((w) =>
          wordSet.has(w.toLowerCase()),
        ).length,
        colorKey: "preposition",
      },
      {
        key: "conjunctions",
        label: "Conj",
        count: syntaxData.conjunctions.filter((w) =>
          wordSet.has(w.toLowerCase()),
        ).length,
        colorKey: "conjunction",
      },
      {
        key: "articles",
        label: "Art",
        count: syntaxData.articles.filter((w) => wordSet.has(w.toLowerCase()))
          .length,
        colorKey: "article",
      },
      {
        key: "interjections",
        label: "Intj",
        count: syntaxData.interjections.filter((w) =>
          wordSet.has(w.toLowerCase()),
        ).length,
        colorKey: "interjection",
      },
    ];

    // Only return counts that are > 0 and enabled in highlight config
    return counts.filter((c) => {
      const configKey = c.key as keyof HighlightConfig;
      return c.count > 0 && (!highlightConfig || highlightConfig[configKey]);
    });
  }, [content, syntaxData, highlightConfig]);

  const hasBreakdown = wordTypeCounts.length > 0;

  return (
    <div
      className="bg-black/5 rounded-lg backdrop-blur-sm flex-shrink-0 transition-all duration-200"
      style={{
        fontFamily: "monospace",
      }}
    >
      {/* Main count - clickable to expand */}
      <TouchButton
        onClick={() => hasBreakdown && setIsExpanded(!isExpanded)}
        className={`px-3 py-1 md:px-4 md:py-2 flex items-center gap-2 w-full ${
          hasBreakdown ? "cursor-pointer hover:bg-black/5" : ""
        }`}
        disabled={!hasBreakdown}
      >
        <span
          className="text-xl md:text-3xl font-bold tracking-tighter"
          style={{ color: theme.text }}
        >
          {count}
        </span>
        <span className="text-[10px] md:text-xs uppercase tracking-widest opacity-50">
          words
        </span>
        {hasBreakdown && (
          <span
            className="ml-auto text-xs opacity-50 transition-transform duration-200"
            style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            ▼
          </span>
        )}
      </TouchButton>

      {/* Expanded breakdown */}
      {isExpanded && hasBreakdown && (
        <div className="px-3 pb-2 md:px-4 md:pb-3 border-t border-current/10 mt-1 pt-2">
          {/* Dashed separator line */}
          <div
            className="text-[10px] tracking-widest opacity-30 mb-2 overflow-hidden whitespace-nowrap"
            style={{ color: theme.text }}
          >
            - - - - - - - - - - - -
          </div>

          {/* Word type breakdown */}
          <div className="space-y-0.5">
            {wordTypeCounts.map(({ label, count: typeCount, colorKey }) => (
              <div
                key={label}
                className="flex justify-between items-center text-xs"
              >
                <span
                  className="font-medium"
                  style={{ color: theme.highlight[colorKey] }}
                >
                  {label}
                </span>
                <span className="opacity-70 tabular-nums">{typeCount}x</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WordCountReceipt;
