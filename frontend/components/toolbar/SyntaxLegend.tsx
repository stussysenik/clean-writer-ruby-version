import React, { useState } from "react";
import { RisoTheme } from "@/types";
import TouchButton from "@/components/shared/TouchButton";
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
  IconInfo,
} from "./Icons";

interface SyntaxLegendProps {
  theme: RisoTheme;
}

const LEGEND_ITEMS = [
  // Content Words (1-4)
  {
    number: 1,
    key: "noun",
    icon: IconNoun,
    label: "Nouns",
    example: "cat, idea",
  },
  {
    number: 2,
    key: "verb",
    icon: IconVerb,
    label: "Verbs",
    example: "run, think",
  },
  {
    number: 3,
    key: "adjective",
    icon: IconAdj,
    label: "Adjectives",
    example: "big, happy",
  },
  {
    number: 4,
    key: "adverb",
    icon: IconAdverb,
    label: "Adverbs",
    example: "quickly, very",
  },
  // Function Words (5-9)
  {
    number: 5,
    key: "pronoun",
    icon: IconPronoun,
    label: "Pronouns",
    example: "he, they",
  },
  {
    number: 6,
    key: "preposition",
    icon: IconPreposition,
    label: "Prepositions",
    example: "in, on",
  },
  {
    number: 7,
    key: "conjunction",
    icon: IconConj,
    label: "Conjunctions",
    example: "and, but",
  },
  {
    number: 8,
    key: "article",
    icon: IconArticle,
    label: "Articles",
    example: "the, a",
  },
  {
    number: 9,
    key: "interjection",
    icon: IconInterjection,
    label: "Interjections",
    example: "wow, oh",
  },
] as const;

const SyntaxLegend: React.FC<SyntaxLegendProps> = ({ theme }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <TouchButton
        onClick={() => setIsOpen(true)}
        className="p-2.5 rounded-lg hover:bg-black/10 transition-all opacity-60 hover:opacity-100 min-w-[44px] min-h-[44px] flex items-center justify-center border border-current/20"
        title="Word Types Legend"
      >
        <IconInfo />
      </TouchButton>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-[200] backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal - Full screen on mobile, centered card on desktop */}
          <div
            className="fixed z-[201] inset-0 min-h-[100dvh] md:min-h-0 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90vw] md:max-w-2xl md:max-h-[85vh] md:rounded-xl flex flex-col overflow-hidden shadow-2xl"
            style={{
              backgroundColor: theme.background,
              color: theme.text,
            }}
          >
            {/* Sticky Header */}
            <header
              className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 md:px-6 md:py-4 border-b-2"
              style={{
                backgroundColor: theme.background,
                borderColor: `${theme.text}15`,
              }}
            >
              <h2 className="text-lg md:text-xl font-bold tracking-tight">
                Word Types
              </h2>
              <TouchButton
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-black/10 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center ml-4"
                title="Close"
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </TouchButton>
            </header>

            {/* Scrollable Content */}
            <main className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 md:px-6 md:py-6">
              {/* Scroll indicator for mobile */}
              <div
                className="md:hidden text-center text-xs mb-4 animate-pulse"
                style={{ opacity: 0.5 }}
              >
                ↓ Scroll for all word types ↓
              </div>

              {/* Content Words Section */}
              <section className="mb-6">
                <h3
                  className="text-xs font-bold uppercase tracking-wider mb-4 px-1"
                  style={{ color: theme.text, opacity: 0.7 }}
                >
                  Content Words
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {LEGEND_ITEMS.slice(0, 4).map(
                    ({ number, key, icon: Icon, label, example }) => (
                      <div
                        key={key}
                        className="flex items-center gap-3 p-3 rounded-lg transition-colors min-h-[56px]"
                        style={{
                          backgroundColor: `${theme.highlight[key as keyof typeof theme.highlight]}12`,
                        }}
                      >
                        {/* Number Badge */}
                        <span
                          className="w-8 h-8 flex items-center justify-center text-sm font-bold rounded-md flex-shrink-0"
                          style={{
                            backgroundColor: `${theme.highlight[key as keyof typeof theme.highlight]}25`,
                            color:
                              theme.highlight[
                                key as keyof typeof theme.highlight
                              ],
                          }}
                        >
                          {number}
                        </span>

                        {/* Icon */}
                        <span
                          className="flex-shrink-0"
                          style={{
                            color:
                              theme.highlight[
                                key as keyof typeof theme.highlight
                              ],
                          }}
                        >
                          <Icon />
                        </span>

                        {/* Label and Example */}
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold block">{label}</span>
                          <span
                            className="text-sm block truncate"
                            style={{ opacity: 0.6 }}
                          >
                            {example}
                          </span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </section>

              {/* Divider */}
              <div
                className="border-t my-4"
                style={{ borderColor: `${theme.text}15` }}
              />

              {/* Function Words Section */}
              <section>
                <h3
                  className="text-xs font-bold uppercase tracking-wider mb-4 px-1"
                  style={{ color: theme.text, opacity: 0.7 }}
                >
                  Function Words
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {LEGEND_ITEMS.slice(4).map(
                    ({ number, key, icon: Icon, label, example }) => (
                      <div
                        key={key}
                        className="flex items-center gap-3 p-3 rounded-lg transition-colors min-h-[56px]"
                        style={{
                          backgroundColor: `${theme.highlight[key as keyof typeof theme.highlight]}12`,
                        }}
                      >
                        {/* Number Badge */}
                        <span
                          className="w-8 h-8 flex items-center justify-center text-sm font-bold rounded-md flex-shrink-0"
                          style={{
                            backgroundColor: `${theme.highlight[key as keyof typeof theme.highlight]}25`,
                            color:
                              theme.highlight[
                                key as keyof typeof theme.highlight
                              ],
                          }}
                        >
                          {number}
                        </span>

                        {/* Icon */}
                        <span
                          className="flex-shrink-0"
                          style={{
                            color:
                              theme.highlight[
                                key as keyof typeof theme.highlight
                              ],
                          }}
                        >
                          <Icon />
                        </span>

                        {/* Label and Example */}
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold block">{label}</span>
                          <span
                            className="text-sm block truncate"
                            style={{ opacity: 0.6 }}
                          >
                            {example}
                          </span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </section>
            </main>

            {/* Footer with keyboard hint */}
            <footer
              className="sticky bottom-0 px-4 py-3 md:px-6 md:py-4 border-t text-center"
              style={{
                backgroundColor: theme.background,
                borderColor: `${theme.text}15`,
              }}
            >
              <p className="text-sm font-medium" style={{ opacity: 0.6 }}>
                Press{" "}
                <kbd
                  className="px-1.5 py-0.5 rounded border font-mono text-xs mx-0.5"
                  style={{ borderColor: `${theme.text}30` }}
                >
                  1
                </kbd>
                -
                <kbd
                  className="px-1.5 py-0.5 rounded border font-mono text-xs mx-0.5"
                  style={{ borderColor: `${theme.text}30` }}
                >
                  9
                </kbd>{" "}
                to toggle word types
              </p>
            </footer>
          </div>
        </>
      )}
    </>
  );
};

export default SyntaxLegend;
