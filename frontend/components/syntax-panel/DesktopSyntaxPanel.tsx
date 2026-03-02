import React, { useRef } from "react";
import {
  RisoTheme,
  SyntaxAnalysis,
  SyntaxSets,
  HighlightConfig,
  SongAnalysis,
} from "@/types";
import PanelBody from "./PanelBody";

interface DesktopSyntaxPanelProps {
  theme: RisoTheme;
  wordCount: number;
  content: string;
  syntaxSets: SyntaxSets;
  syntaxData: SyntaxAnalysis;
  highlightConfig: HighlightConfig;
  onToggleHighlight: (key: keyof HighlightConfig) => void;
  soloMode: keyof HighlightConfig | null;
  onSoloToggle: (key: keyof HighlightConfig | null) => void;
  onCategoryHover?: (category: keyof HighlightConfig | null) => void;
  songMode?: boolean;
  onToggleSongMode?: () => void;
  songData?: SongAnalysis | null;
  rhymeColors?: readonly string[];
  showSyllableAnnotations?: boolean;
  onToggleSyllableAnnotations?: () => void;
  focusedRhymeKey?: string | null;
  onFocusRhymeKey?: (key: string | null) => void;
  hoveredRhymeKey?: string | null;
  onHoverRhymeKey?: (key: string | null) => void;
  disabledRhymeKeys?: Set<string>;
  onToggleRhymeKey?: (key: string) => void;
}

const DesktopSyntaxPanel: React.FC<DesktopSyntaxPanelProps> = ({
  theme,
  wordCount,
  content,
  syntaxSets,
  syntaxData,
  highlightConfig,
  onToggleHighlight,
  soloMode,
  onSoloToggle,
  onCategoryHover,
  songMode,
  onToggleSongMode,
  songData,
  rhymeColors,
  showSyllableAnnotations,
  onToggleSyllableAnnotations,
  focusedRhymeKey,
  onFocusRhymeKey,
  hoveredRhymeKey,
  onHoverRhymeKey,
  disabledRhymeKeys,
  onToggleRhymeKey,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={panelRef}
      data-testid="desktop-syntax-panel"
      className="fixed right-[21px] bottom-[21px] lg:right-[34px] lg:bottom-[34px] z-50 rounded-2xl overflow-hidden no-scrollbar"
      style={{
        // Glassmorphism: semi-transparent background with blur
        backgroundColor: `${theme.background}E6`, // ~90% opacity
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        // Glass border effect
        border: `1px solid ${theme.text}15`,
        // Enhanced shadow with glass effect
        boxShadow: `0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08), inset 0 0 0 1px ${theme.text}08`,
        opacity: 1,
        maxHeight: "calc(100vh - 120px)",
        overflowY: "auto",
      }}
    >
      {/* Paper grain texture */}
      <div
        data-overlap-ignore
        className="absolute inset-0 pointer-events-none opacity-15 mix-blend-multiply rounded-2xl"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paperNoise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paperNoise)' opacity='0.08'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Glass highlight at top edge */}
      <div
        data-overlap-ignore
        className="absolute left-0 right-0 top-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(to right,
            transparent 0%,
            ${theme.text}20 20%,
            ${theme.text}20 80%,
            transparent 100%)`,
        }}
      />

      {/* Content */}
      <PanelBody
        theme={theme}
        wordCount={wordCount}
        content={content}
        syntaxSets={syntaxSets}
        syntaxData={syntaxData}
        highlightConfig={highlightConfig}
        onToggleHighlight={onToggleHighlight}
        soloMode={soloMode}
        onSoloToggle={onSoloToggle}
        isOpen={true}
        onCategoryHover={onCategoryHover}
        songMode={songMode}
        onToggleSongMode={onToggleSongMode}
        songData={songData}
        rhymeColors={rhymeColors}
        showSyllableAnnotations={showSyllableAnnotations}
        onToggleSyllableAnnotations={onToggleSyllableAnnotations}
        focusedRhymeKey={focusedRhymeKey}
        onFocusRhymeKey={onFocusRhymeKey}
        hoveredRhymeKey={hoveredRhymeKey}
        onHoverRhymeKey={onHoverRhymeKey}
        disabledRhymeKeys={disabledRhymeKeys}
        onToggleRhymeKey={onToggleRhymeKey}
      />
    </div>
  );
};

export default DesktopSyntaxPanel;
