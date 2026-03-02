import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  useMemo,
} from "react";
import { RisoTheme, SyntaxSets, HighlightConfig, SongAnalysis } from "@/types";
import { useIMEComposition } from "@/hooks/useIMEComposition";
import { useBlinkCursor } from "@/hooks/useBlinkCursor";
import {
  isHashtagToken,
  isNumberToken,
  isUrlToken,
  normalizeTokenForSyntaxLookup,
} from "@/utils/syntaxPatterns";
import { replaceEmojisWithUTF } from "@/utils/emojiUtils";
import { isDarkBackground } from "@/utils/colorContrast";

interface TypewriterProps {
  content: string;
  setContent: (s: string) => void;
  theme: RisoTheme;
  syntaxSets: SyntaxSets;
  highlightConfig: HighlightConfig;
  fontSize: string;
  maxWidth: number;
  fontFamily: string;
  showUtfEmojiCodes?: boolean;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  hoveredCategory?: keyof HighlightConfig | null;
  persistedSelection?: { start: number; end: number } | null;
  songMode?: boolean;
  songData?: SongAnalysis | null;
  rhymeColors?: readonly string[];
  showSyllableAnnotations?: boolean;
  rhymeHighlightRadius?: number;
  rhymeBoldEnabled?: boolean;
  focusedRhymeKey?: string | null;
  hoveredRhymeKey?: string | null;
  disabledRhymeKeys?: Set<string>;
  letterSpacing?: number;
  lineHeight?: number;
}

// Known non-text keys to reject (control, navigation, function keys).
// Everything else is treated as text input, which correctly handles
// emoji (multi-codepoint), CJK, and other Unicode input.
const NON_TEXT_KEYS = new Set([
  "Backspace",
  "Delete",
  "Tab",
  "Escape",
  "Enter",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "Insert",
  "PrintScreen",
  "ScrollLock",
  "Pause",
  "CapsLock",
  "NumLock",
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "ContextMenu",
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
  "F7",
  "F8",
  "F9",
  "F10",
  "F11",
  "F12",
  "AudioVolumeUp",
  "AudioVolumeDown",
  "AudioVolumeMute",
  "MediaPlayPause",
  "MediaTrackNext",
  "MediaTrackPrevious",
  "MediaStop",
  "Unidentified",
  "Process",
  "Dead",
]);

function isTextInputKey(key: string): boolean {
  return !NON_TEXT_KEYS.has(key);
}

const Typewriter: React.FC<TypewriterProps> = ({
  content,
  setContent,
  theme,
  syntaxSets,
  highlightConfig,
  fontSize,
  maxWidth,
  fontFamily,
  showUtfEmojiCodes = false,
  textareaRef: externalTextareaRef,
  hoveredCategory = null,
  persistedSelection = null,
  songMode = false,
  songData = null,
  rhymeColors = [],
  showSyllableAnnotations = false,
  rhymeHighlightRadius = 4,
  rhymeBoldEnabled = true,
  focusedRhymeKey = null,
  hoveredRhymeKey = null,
  disabledRhymeKeys,
  letterSpacing: letterSpacingProp = 0,
  lineHeight: lineHeightProp = 1.6,
}) => {
  const effectiveLineHeight = songMode && showSyllableAnnotations ? "2.4" : String(lineHeightProp);
  const effectiveLetterSpacing = letterSpacingProp ? `${letterSpacingProp}em` : undefined;

  const internalTextareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const selectionOverlayRef = useRef<HTMLDivElement>(null);
  const ghostVisible = useBlinkCursor();
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);

  // Use the external ref if provided, otherwise use internal ref
  const textareaRef = externalTextareaRef || internalTextareaRef;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      }
    }, 0);
  }, [textareaRef]);

  // IME composition handling for Chinese, Japanese, Korean, and other languages
  const {
    isComposing,
    handleCompositionStart,
    handleCompositionUpdate,
    handleCompositionEnd,
  } = useIMEComposition();

  // Garfield cursor: Calculate the color for the last word typed
  const lastWordColor = useMemo(() => {
    if (!content) return theme.cursor;

    const rawLastToken = content.trim().split(/\s+/).pop() || "";
    const lastWord = normalizeTokenForSyntaxLookup(rawLastToken);

    if (!lastWord) return theme.cursor;

    // Check which syntax category the last word belongs to (O(1) lookups with Sets)
    if (highlightConfig.articles && syntaxSets.articles.has(lastWord)) {
      return theme.highlight.article;
    }
    if (
      highlightConfig.urls &&
      (syntaxSets.urls.has(lastWord) || isUrlToken(lastWord))
    ) {
      return theme.highlight.url;
    }
    if (
      highlightConfig.hashtags &&
      (syntaxSets.hashtags.has(lastWord) || isHashtagToken(lastWord))
    ) {
      return theme.highlight.hashtag;
    }
    if (
      highlightConfig.numbers &&
      (syntaxSets.numbers.has(lastWord) || isNumberToken(lastWord))
    ) {
      return theme.highlight.number;
    }
    if (
      highlightConfig.interjections &&
      syntaxSets.interjections.has(lastWord)
    ) {
      return theme.highlight.interjection;
    }
    if (highlightConfig.prepositions && syntaxSets.prepositions.has(lastWord)) {
      return theme.highlight.preposition;
    }
    if (highlightConfig.conjunctions && syntaxSets.conjunctions.has(lastWord)) {
      return theme.highlight.conjunction;
    }
    if (highlightConfig.pronouns && syntaxSets.pronouns.has(lastWord)) {
      return theme.highlight.pronoun;
    }
    if (highlightConfig.adverbs && syntaxSets.adverbs.has(lastWord)) {
      return theme.highlight.adverb;
    }
    if (highlightConfig.verbs && syntaxSets.verbs.has(lastWord)) {
      return theme.highlight.verb;
    }
    if (highlightConfig.adjectives && syntaxSets.adjectives.has(lastWord)) {
      return theme.highlight.adjective;
    }
    if (highlightConfig.nouns && syntaxSets.nouns.has(lastWord)) {
      return theme.highlight.noun;
    }

    return theme.cursor;
  }, [content, syntaxSets, highlightConfig, theme]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Skip handling during IME composition (Chinese, Japanese, Korean, etc.)
    if (isComposing) {
      return;
    }

    // 1. Strictly Disable Deletion
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      return;
    }

    // 2. Allow modifiers (for paste, copy, etc.)
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    // 3. Handle character input (strictly append to end)
    if (isTextInputKey(e.key) || e.key === "Enter") {
      e.preventDefault(); // Stop default insertion at cursor position

      const char = e.key === "Enter" ? "\n" : e.key;

      // Force append to the very end
      const newContent = content + char;
      setContent(newContent);
      scrollToBottom();
    }
  };

  // Handle IME composition end - append the composed text
  const handleCompositionEndWithAppend = (
    e: React.CompositionEvent<HTMLTextAreaElement>,
  ) => {
    handleCompositionEnd(e, (composedText: string) => {
      // Append the composed text to the end of content
      const newContent = content + composedText;
      setContent(newContent);
      scrollToBottom();
    });
  };

  // Fallback for OS emoji pickers (macOS Ctrl+Cmd+Space, Windows Win+.) that
  // insert text via InputEvent without triggering keyDown. We compare the
  // textarea value against `content` to detect OS-injected text and append it.
  const handleInput = useCallback(
    (e: React.FormEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget;
      const newValue = textarea.value;

      // No change or shorter (shouldn't happen with delete blocked) — ignore
      if (newValue.length <= content.length) return;

      let inserted: string;

      if (newValue.startsWith(content)) {
        // Simple append at the end — most common emoji picker case
        inserted = newValue.slice(content.length);
      } else {
        // Inserted mid-text (e.g. OS placed cursor somewhere): use selectionStart
        const cursor = textarea.selectionStart ?? newValue.length;
        const insertLen = newValue.length - content.length;
        inserted = newValue.slice(
          Math.max(0, cursor - insertLen),
          cursor,
        );
      }

      if (inserted) {
        setContent(content + inserted);
        // Force cursor to end after OS-injected input (forward-only guarantee)
        setTimeout(() => {
          if (textareaRef.current) {
            const len = (content + inserted).length;
            textareaRef.current.selectionStart = len;
            textareaRef.current.selectionEnd = len;
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
          }
        }, 0);
      }
    },
    [content, setContent, textareaRef],
  );

  // Handle paste - append pasted text to end
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    if (pastedText) {
      setContent(content + pastedText);
      scrollToBottom();
    }
  };

  const handleScroll = useCallback(() => {
    if (!textareaRef.current) return;

    if (backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
    }

    if (selectionOverlayRef.current) {
      selectionOverlayRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  const normalizedPersistedSelection = useMemo(() => {
    if (!persistedSelection || showUtfEmojiCodes) return null;

    const start = Math.max(
      0,
      Math.min(content.length, persistedSelection.start),
    );
    const end = Math.max(0, Math.min(content.length, persistedSelection.end));

    if (start >= end) return null;

    return { start, end };
  }, [persistedSelection, content, showUtfEmojiCodes]);

  const showPersistedSelectionOverlay =
    !!normalizedPersistedSelection && !isTextareaFocused;

  // Use passive event listener for scroll performance
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener("scroll", handleScroll, { passive: true });
      return () => textarea.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  // Ensure frozen selection overlay is aligned when shown after a blur.
  useEffect(() => {
    if (
      !showPersistedSelectionOverlay ||
      !textareaRef.current ||
      !selectionOverlayRef.current
    ) {
      return;
    }
    selectionOverlayRef.current.scrollTop = textareaRef.current.scrollTop;
  }, [showPersistedSelectionOverlay, textareaRef]);

  const renderHighlights = useCallback(() => {
    if (!content) return null;

    // First, split content by strikethrough syntax "~~...~~"
    // The regex captures the delimiter and content together.
    const chunks = content.split(/(~~(?:[^~]|~(?!~))+~~)/g);

    return chunks.map((chunk, chunkIndex) => {
      // If it is a strikethrough block
      if (chunk.startsWith("~~") && chunk.endsWith("~~") && chunk.length >= 4) {
        const renderedStrikeChunk = showUtfEmojiCodes
          ? replaceEmojisWithUTF(chunk)
          : chunk;
        return (
          <span
            key={`st-${chunkIndex}`}
            style={{
              textDecoration: "line-through",
              opacity: 0.5,
              textDecorationThickness: "2px",
              textDecorationColor: theme.strikethrough,
              transition: "color 0.3s ease, text-shadow 0.3s ease",
            }}
          >
            {renderedStrikeChunk}
          </span>
        );
      }

      // If it is normal text, process syntax highlighting
      // First split on URLs to preserve them as whole tokens, then tokenize the rest
      const renderedChunk = showUtfEmojiCodes
        ? replaceEmojisWithUTF(chunk)
        : chunk;
      const urlSplitPattern =
        /((?:https?:\/\/)\S+|(?:www\.)\S+|(?:[a-zA-Z0-9-]+\.)+(?:com|org|net|io|dev|co|app|ai|edu|gov|me|info|biz)(?:\/\S*)?)/g;
      const urlTestPattern =
        /^(?:https?:\/\/)\S+$|^(?:www\.)\S+$|^(?:[a-zA-Z0-9-]+\.)+(?:com|org|net|io|dev|co|app|ai|edu|gov|me|info|biz)(?:\/\S*)?$/i;
      const urlSplit = renderedChunk.split(urlSplitPattern);
      // Flatten: for non-URL segments, split on whitespace/punctuation; URL segments stay whole
      const parts: string[] = [];
      for (const segment of urlSplit) {
        if (urlTestPattern.test(segment)) {
          parts.push(segment);
        } else {
          // Tokenize on whitespace and punctuation, preserving contractions
          const subParts = segment.split(
            /(\s+|[.,!?;:"()\-]+|(?<!\w)['']|[''](?!\w))/g,
          );
          parts.push(...subParts);
        }
      }

      return (
        <React.Fragment key={`chunk-${chunkIndex}`}>
          {parts.map((part, index) => {
            const normalizedPart = normalizeTokenForSyntaxLookup(part);
            let color = theme.text;
            let isMatch = false;
            let matchCategory: keyof HighlightConfig | null = null;

            if (!normalizedPart) {
              return (
                <span key={index} style={{ transition: "color 0.3s ease" }}>
                  {part}
                </span>
              );
            }

            // Check highlights based on config — O(1) Set.has() lookups
            // Priority: URLs → hashtags → numbers → NLP categories
            if (
              highlightConfig.urls &&
              (syntaxSets.urls.has(normalizedPart) ||
                isUrlToken(normalizedPart))
            ) {
              color = theme.highlight.url;
              isMatch = true;
              matchCategory = "urls";
            } else if (
              highlightConfig.hashtags &&
              (syntaxSets.hashtags.has(normalizedPart) ||
                isHashtagToken(normalizedPart))
            ) {
              color = theme.highlight.hashtag;
              isMatch = true;
              matchCategory = "hashtags";
            } else if (
              highlightConfig.numbers &&
              (syntaxSets.numbers.has(normalizedPart) ||
                isNumberToken(normalizedPart))
            ) {
              color = theme.highlight.number;
              isMatch = true;
              matchCategory = "numbers";
            } else if (
              highlightConfig.articles &&
              syntaxSets.articles.has(normalizedPart)
            ) {
              color = theme.highlight.article;
              isMatch = true;
              matchCategory = "articles";
            } else if (
              highlightConfig.interjections &&
              syntaxSets.interjections.has(normalizedPart)
            ) {
              color = theme.highlight.interjection;
              isMatch = true;
              matchCategory = "interjections";
            } else if (
              highlightConfig.prepositions &&
              syntaxSets.prepositions.has(normalizedPart)
            ) {
              color = theme.highlight.preposition;
              isMatch = true;
              matchCategory = "prepositions";
            } else if (
              highlightConfig.conjunctions &&
              syntaxSets.conjunctions.has(normalizedPart)
            ) {
              color = theme.highlight.conjunction;
              isMatch = true;
              matchCategory = "conjunctions";
            } else if (
              highlightConfig.pronouns &&
              syntaxSets.pronouns.has(normalizedPart)
            ) {
              color = theme.highlight.pronoun;
              isMatch = true;
              matchCategory = "pronouns";
            } else if (
              highlightConfig.adverbs &&
              syntaxSets.adverbs.has(normalizedPart)
            ) {
              color = theme.highlight.adverb;
              isMatch = true;
              matchCategory = "adverbs";
            } else if (
              highlightConfig.verbs &&
              syntaxSets.verbs.has(normalizedPart)
            ) {
              color = theme.highlight.verb;
              isMatch = true;
              matchCategory = "verbs";
            } else if (
              highlightConfig.adjectives &&
              syntaxSets.adjectives.has(normalizedPart)
            ) {
              color = theme.highlight.adjective;
              isMatch = true;
              matchCategory = "adjectives";
            } else if (
              highlightConfig.nouns &&
              syntaxSets.nouns.has(normalizedPart)
            ) {
              color = theme.highlight.noun;
              isMatch = true;
              matchCategory = "nouns";
            }

            // Check if this word should glow (matching hovered category)
            const shouldGlow =
              hoveredCategory && matchCategory === hoveredCategory;
            const glowColor = shouldGlow ? color : "transparent";

            const style: React.CSSProperties = {
              color: isMatch ? color : theme.text,
              fontWeight: isMatch ? 700 : "inherit",
              textShadow: shouldGlow
                ? `0 0 8px ${glowColor}, 0 0 16px ${glowColor}80`
                : theme.id === "blueprint" && isMatch
                  ? `0 0 1px ${color}`
                  : "none",
              transition:
                "color 0.3s ease, text-shadow 0.3s ease, font-weight 0.3s ease",
            };

            return (
              <span key={`${chunkIndex}-${index}`} style={style}>
                {part}
              </span>
            );
          })}
        </React.Fragment>
      );
    });
  }, [
    content,
    syntaxSets,
    theme,
    highlightConfig,
    hoveredCategory,
    showUtfEmojiCodes,
  ]);

  // Build a map of rhymeKey -> color for song mode
  const rhymeColorMap = useMemo(() => {
    if (!songData || !rhymeColors.length) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const group of songData.rhymeGroups) {
      map.set(group.key, rhymeColors[group.colorIndex] || rhymeColors[0]);
    }
    return map;
  }, [songData, rhymeColors]);

  const renderSongHighlights = useCallback(() => {
    if (!content || !songData) return null;

    const lines = content.split("\n");
    return lines.map((lineText, lineIdx) => {
      const songLine = songData.lines[lineIdx];
      if (!songLine || songLine.words.length === 0) {
        return (
          <React.Fragment key={`sl-${lineIdx}`}>
            {lineText}
            {lineIdx < lines.length - 1 ? "\n" : ""}
          </React.Fragment>
        );
      }

      // Tokenize the line for rendering
      const parts = lineText.split(/(\s+)/);
      let wordIdx = 0;

      const rendered = parts.map((part, partIdx) => {
        if (/^\s+$/.test(part)) {
          return <span key={`${lineIdx}-${partIdx}`}>{part}</span>;
        }

        const songWord = songLine.words[wordIdx];
        wordIdx++;

        if (!songWord) {
          return (
            <span key={`${lineIdx}-${partIdx}`} style={{ color: theme.text }}>
              {part}
            </span>
          );
        }

        const rhymeColor = rhymeColorMap.get(songWord.rhymeKey);
        const isRhymeDisabled = disabledRhymeKeys?.has(songWord.rhymeKey);
        const isRhymeFocused = focusedRhymeKey === null || focusedRhymeKey === songWord.rhymeKey;
        const isRhymeHovered = hoveredRhymeKey === songWord.rhymeKey;

        const syllableAnnotation = showSyllableAnnotations ? (
          <span
            style={{
              position: 'absolute',
              bottom: '-1.1em',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '0.55em',
              fontWeight: 600,
              color: rhymeColor || theme.text,
              opacity: rhymeColor ? 0.8 : 0.35,
              pointerEvents: 'none',
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            {songWord.syllables}
          </span>
        ) : null;

        if (rhymeColor && !isRhymeDisabled) {
          // Priority: hover > focused > dimmed
          const showFull = isRhymeHovered || isRhymeFocused;
          const markerOpacity = showFull
            ? (isDarkBackground(theme.background) ? "A0" : "88")
            : "20";
          return (
            <span key={`${lineIdx}-${partIdx}`} style={{ position: 'relative', display: 'inline' }}>
              {syllableAnnotation}
              <span
                style={{
                  backgroundColor: `${rhymeColor}${markerOpacity}`,
                  color: theme.text,
                  padding: "1px 6px",
                  borderRadius: "4px",
                  fontWeight: showFull ? 700 : "inherit",
                  boxDecorationBreak: "clone",
                  WebkitBoxDecorationBreak: "clone",
                  transition:
                    "background-color 0.3s ease, color 0.3s ease, font-weight 0.3s ease",
                }}
              >
                {part}
              </span>
            </span>
          );
        }

        return (
          <span key={`${lineIdx}-${partIdx}`} style={{ position: 'relative', display: 'inline' }}>
            {syllableAnnotation}
            <span style={{ color: theme.text, transition: "color 0.3s ease" }}>
              {part}
            </span>
          </span>
        );
      });

      return (
        <React.Fragment key={`sl-${lineIdx}`}>
          {rendered}
          {lineIdx < lines.length - 1 ? "\n" : ""}
        </React.Fragment>
      );
    });
  }, [content, songData, rhymeColorMap, theme.text, theme.background, showSyllableAnnotations, focusedRhymeKey, hoveredRhymeKey, disabledRhymeKeys]);

  return (
    <div
      className="relative w-full h-full overflow-hidden mx-auto transition-[max-width] duration-300 ease-in-out"
      style={{ maxWidth: maxWidth }}
    >
      {/* Backdrop (Visual Layer) */}
      <div
        ref={backdropRef}
        className="absolute inset-0 px-[13px] pt-[55px] pb-[89px] md:px-[21px] md:pt-[55px] lg:px-[34px] lg:pt-[55px] whitespace-pre-wrap break-words pointer-events-none z-0 overflow-hidden"
        style={{
          fontFamily,
          fontSize,
          lineHeight: effectiveLineHeight,
          letterSpacing: effectiveLetterSpacing,
          color: theme.text,
        }}
      >
        {songMode && songData ? renderSongHighlights() : renderHighlights()}
        {/* The Ghost Cursor - Always at the end, color matches last typed word (Garfield cursor) */}
        <span
          data-testid="ghost-cursor"
          style={{
            color: lastWordColor,
            opacity: ghostVisible ? 1 : 0,
            transition: "opacity 0.1s, background-color 0.3s ease",
            marginLeft: "1px",
            backgroundColor: lastWordColor,
            display: "inline-block",
            width: "10px",
            height: "1em",
            verticalAlign: "text-bottom",
          }}
        />
      </div>

      {showPersistedSelectionOverlay && normalizedPersistedSelection && (
        <div
          ref={selectionOverlayRef}
          data-testid="persisted-selection-overlay"
          className="absolute inset-0 px-[13px] pt-[55px] pb-[89px] md:px-[21px] md:pt-[55px] lg:px-[34px] lg:pt-[55px] whitespace-pre-wrap break-words pointer-events-none z-[5] overflow-hidden"
          style={{
            fontFamily,
            fontSize,
            lineHeight: effectiveLineHeight,
            letterSpacing: effectiveLetterSpacing,
            color: "transparent",
          }}
        >
          <span>{content.slice(0, normalizedPersistedSelection.start)}</span>
          <span
            style={{
              backgroundColor: theme.selection,
              borderRadius: "4px",
              boxShadow: `0 0 0 1px ${theme.accent}40`,
            }}
          >
            {content.slice(
              normalizedPersistedSelection.start,
              normalizedPersistedSelection.end,
            )}
          </span>
          <span>{content.slice(normalizedPersistedSelection.end)}</span>
        </div>
      )}

      {/* Actual Input (Logic Layer) */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={() => {}} // Handled in onKeyDown and composition events
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        onPaste={handlePaste}
        onCompositionStart={handleCompositionStart}
        onCompositionUpdate={handleCompositionUpdate}
        onCompositionEnd={handleCompositionEndWithAppend}
        onContextMenu={(e) => e.preventDefault()}
        onFocus={() => setIsTextareaFocused(true)}
        onBlur={() => setIsTextareaFocused(false)}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        autoComplete="off"
        inputMode="text"
        enterKeyHint="enter"
        autoFocus
        className="absolute inset-0 w-full h-full px-[13px] pt-[55px] pb-[89px] md:px-[21px] md:pt-[55px] lg:px-[34px] lg:pt-[55px] bg-transparent resize-none border-none outline-none z-10 whitespace-pre-wrap break-words overflow-y-auto"
        style={{
          fontFamily,
          fontSize,
          lineHeight: effectiveLineHeight,
          letterSpacing: effectiveLetterSpacing,
          color: "transparent",
          caretColor: "transparent",
          opacity: 1,
          WebkitTouchCallout: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
        }}
        placeholder="Type here..."
      />
    </div>
  );
};

export default Typewriter;
