import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  THEMES,
  FONT_OPTIONS,
  RHYME_COLORS,
  FRESH_LOAD_TEXT,
  type FontId,
} from "@/constants";
import { countWords } from "@/services/localSyntaxService";
import {
  SyntaxAnalysis,
  ViewMode,
  HighlightConfig,
  toSyntaxSets,
  SongAnalysis,
} from "@/types";
import { useSyntaxWorker } from "@/hooks/useSyntaxWorker";
import Typewriter from "@/components/typewriter/Typewriter";
import MarkdownPreview from "@/components/shared/MarkdownPreview";
import ConfirmDialog from "@/components/modals/ConfirmDialog";
import Toolbar from "@/components/toolbar";
import ThemeSelector from "@/components/toolbar/ThemeSelector";
import ThemeCustomizer from "@/components/theme-customizer";
import UnifiedSyntaxPanel from "@/components/syntax-panel";
import Toast from "@/components/shared/Toast";
import TouchButton from "@/components/shared/TouchButton";
import Tooltip from "@/components/shared/Tooltip";
import HelpModal from "@/components/modals/HelpModal";
import MobileWelcome from "@/components/modals/MobileWelcome";
import Kbd from "@/components/shared/Kbd";
import { IconSettings } from "@/components/toolbar/Icons";
import useSelectionPersistence from "@/hooks/useSelectionPersistence";
import { getIconColor } from "@/utils/contrastAwareColor";
import {
  applyStrikethrough,
  hasStrikethroughBlocks,
  removeStrikethroughBlocks,
} from "@/utils/strikethroughUtils";
import useResponsiveBreakpoint from "@/hooks/useResponsiveBreakpoint";

// NERV components
import NervCRTOverlay from "@/components/nerv/NervCRTOverlay";
import NervBootScreen from "@/components/nerv/NervBootScreen";
import NervStatusBar from "@/components/nerv/NervStatusBar";

// API client for server persistence
import { autosaveDocument, updateSettings } from "@/services/apiClient";

// Keyboard shortcut mapping (1-9 for word types)
const NUMBER_KEY_MAP: { [key: string]: keyof HighlightConfig } = {
  "1": "nouns",
  "2": "verbs",
  "3": "adjectives",
  "4": "adverbs",
  "5": "pronouns",
  "6": "prepositions",
  "7": "conjunctions",
  "8": "articles",
  "9": "interjections",
};

interface InitialState {
  document: {
    id: string;
    content: string;
    word_count: number;
    view_mode: string;
    max_width: number;
    font_id: string;
    font_size_offset: number;
    highlight_config: Record<string, boolean>;
    solo_mode: boolean;
    song_mode: boolean;
    show_syllable_annotations: boolean;
    utf8_display_enabled: boolean;
  };
  themes: Array<{
    id: string;
    slug: string;
    name: string;
    theme_type: string;
    text_color: string;
    background_color: string;
    highlight_colors: Record<string, string>;
    accent_color: string;
    cursor_color: string;
    strikethrough_color: string;
    selection_color: string;
    rhyme_colors: string[];
    position: number;
    hidden: boolean;
  }>;
  settings: {
    id: string;
    active_theme_slug: string;
    theme_order: string[];
    hidden_theme_ids: string[];
    has_seen_syntax_panel: boolean;
    mobile_welcome_seen: boolean;
    rhyme_highlight_radius: number;
    rhyme_bold_enabled: boolean;
    custom_theme_names: Record<string, string>;
  };
}

interface AppProps {
  initialState: InitialState;
}

const App: React.FC<AppProps> = ({ initialState }) => {
  const doc = initialState.document;
  const settings = initialState.settings;
  const documentId = doc.id;

  // Content state — seeded from server
  const [content, setContent] = useState<string>(doc.content || FRESH_LOAD_TEXT);

  const [maxWidth, setMaxWidth] = useState<number>(doc.max_width || 800);

  const [themeId, setThemeId] = useState<string>(settings.active_theme_slug || "classic");

  const [fontId, setFontId] = useState<FontId>((doc.font_id || "courier-prime") as FontId);

  const [viewMode, setViewMode] = useState<ViewMode>((doc.view_mode || "write") as ViewMode);

  const [syntaxData, setSyntaxData] = useState<SyntaxAnalysis>({
    nouns: [], pronouns: [], verbs: [], adjectives: [], adverbs: [],
    prepositions: [], conjunctions: [], articles: [], interjections: [],
    urls: [], numbers: [], hashtags: [],
  });

  const defaultHighlightConfig: HighlightConfig = {
    nouns: true, pronouns: true, verbs: true, adjectives: true,
    adverbs: true, prepositions: true, conjunctions: true, articles: true,
    interjections: true, urls: true, numbers: true, hashtags: true,
  };

  const [highlightConfig, setHighlightConfig] = useState<HighlightConfig>(() => {
    const saved = doc.highlight_config;
    if (saved && typeof saved === "object" && "nouns" in saved) {
      return { ...defaultHighlightConfig, ...saved } as HighlightConfig;
    }
    return defaultHighlightConfig;
  });

  const [fontSizeOffset, setFontSizeOffset] = useState<number>(doc.font_size_offset || 0);
  const [lineHeightValue, setLineHeightValue] = useState<number>(1.6);
  const [letterSpacing, setLetterSpacing] = useState<number>(0);
  const [paragraphSpacing, setParagraphSpacing] = useState<number>(0.5);
  const [customThemeNames, setCustomThemeNames] = useState<Record<string, string>>(settings.custom_theme_names || {});

  const fluidFontSize = fontSizeOffset === 0
    ? "clamp(18px, 10px + 1.1vw, 24px)"
    : `calc(clamp(18px, 10px + 1.1vw, 24px) + ${fontSizeOffset}px)`;

  const handleFontSizeChange = useCallback((offset: number) => {
    setFontSizeOffset(Math.max(-6, Math.min(12, offset)));
  }, []);

  const handleSelectThemeForEditing = useCallback((id: string) => {
    setThemeId(id);
    setCustomizerInitialTab("colors");
  }, []);

  const handleThemeRename = useCallback((tid: string, newName: string) => {
    setCustomThemeNames(prev => {
      const next = { ...prev };
      if (newName.trim()) { next[tid] = newName.trim(); }
      else { delete next[tid]; }
      return next;
    });
  }, []);

  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isSampleDialogOpen, setIsSampleDialogOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [customizerInitialTab, setCustomizerInitialTab] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showMobileWelcome, setShowMobileWelcome] = useState(false);
  const [utf8DisplayEnabled, setUtf8DisplayEnabled] = useState<boolean>(doc.utf8_display_enabled || false);

  // Song Mode state
  const [songMode, setSongMode] = useState(doc.song_mode || false);
  const [songData, setSongData] = useState<SongAnalysis | null>(null);
  const [showSyllableAnnotations, setShowSyllableAnnotations] = useState<boolean>(doc.show_syllable_annotations ?? true);

  // Rhyme group interaction state
  const [focusedRhymeKey, setFocusedRhymeKey] = useState<string | null>(null);
  const [hoveredRhymeKey, setHoveredRhymeKey] = useState<string | null>(null);
  const [disabledRhymeKeys, setDisabledRhymeKeys] = useState<Set<string>>(new Set());

  const [rhymeHighlightRadius, setRhymeHighlightRadius] = useState<number>(settings.rhyme_highlight_radius ?? 4);
  const [rhymeBoldEnabled, setRhymeBoldEnabled] = useState<boolean>(settings.rhyme_bold_enabled ?? true);

  // Solo mode state
  const [soloMode, setSoloMode] = useState<keyof HighlightConfig | null>(null);

  const [hasSeenSyntaxPanel, setHasSeenSyntaxPanel] = useState<boolean>(settings.has_seen_syntax_panel || false);
  const [hoveredCategory, setHoveredCategory] = useState<keyof HighlightConfig | null>(null);

  // NERV boot screen state
  const isNervTheme = themeId === "nerv";
  const [showBootScreen, setShowBootScreen] = useState(false);
  const [hasBooted, setHasBooted] = useState(false);

  // Show boot screen on first NERV theme activation
  useEffect(() => {
    if (isNervTheme && !hasBooted) {
      setShowBootScreen(true);
    }
  }, [isNervTheme, hasBooted]);

  const handleBootComplete = useCallback(() => {
    setShowBootScreen(false);
    setHasBooted(true);
  }, []);

  // Get the effective theme from the THEMES constant
  const currentTheme = useMemo(() => {
    return THEMES.find(t => t.id === themeId) || THEMES[0];
  }, [themeId]);

  const effectiveRhymeColors = useMemo(() => [...RHYME_COLORS], []);

  const orderedThemes = useMemo(() => THEMES, []);
  const hiddenThemeIds = useMemo(() => settings.hidden_theme_ids || [], [settings.hidden_theme_ids]);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Web Worker for background NLP processing
  const { analyze: analyzeInWorker, analyzeSong: analyzeSongInWorker } = useSyntaxWorker();

  // Selection persistence for mobile strikethrough
  const { saveSelection, getSavedSelection, savedSelection, clearSelection } = useSelectionPersistence(textareaRef);

  // Toast state
  const [showLastThemeToast, setShowLastThemeToast] = useState(false);
  const [showExportToast, setShowExportToast] = useState(false);
  const [customThemeToast, setCustomThemeToast] = useState<{ message: string; type: "success" | "warning" } | null>(null);

  const handleShowToast = useCallback((message: string, type: "success" | "warning" = "success") => {
    setCustomThemeToast({ message, type });
  }, []);

  const currentFont = FONT_OPTIONS.find(f => f.id === fontId) || FONT_OPTIONS[0];
  const displayFontFamily = useMemo(
    () => `${currentFont.family}, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "PingFang SC", "Hiragino Sans", "Yu Gothic", "Malgun Gothic", sans-serif`,
    [currentFont.family],
  );
  const wordCount = countWords(content);

  // Effective highlight config with solo mode
  const effectiveHighlightConfig = useMemo((): HighlightConfig => {
    if (!soloMode) return highlightConfig;
    return {
      nouns: soloMode === "nouns", pronouns: soloMode === "pronouns",
      verbs: soloMode === "verbs", adjectives: soloMode === "adjectives",
      adverbs: soloMode === "adverbs", prepositions: soloMode === "prepositions",
      conjunctions: soloMode === "conjunctions", articles: soloMode === "articles",
      interjections: soloMode === "interjections", urls: soloMode === "urls",
      numbers: soloMode === "numbers", hashtags: soloMode === "hashtags",
    };
  }, [soloMode, highlightConfig]);

  const syntaxSets = useMemo(() => toSyntaxSets(syntaxData), [syntaxData]);

  // Toggle highlight handler
  const toggleHighlight = useCallback((key: keyof HighlightConfig) => {
    if (soloMode === key) { setSoloMode(null); return; }
    if (soloMode) { setSoloMode(key); return; }
    setHighlightConfig(prev => ({ ...prev, [key]: !prev[key] }));
  }, [soloMode]);

  const handleSoloToggle = useCallback((key: keyof HighlightConfig | null) => {
    setSoloMode(key);
  }, []);

  const handleSyntaxPanelSeen = useCallback(() => {
    if (!hasSeenSyntaxPanel) {
      setHasSeenSyntaxPanel(true);
      updateSettings({ has_seen_syntax_panel: true }).catch(() => {});
    }
  }, [hasSeenSyntaxPanel]);

  const handleThemeChange = useCallback((id: string) => {
    setThemeId(id);
    updateSettings({ active_theme_slug: id }).catch(() => {});
  }, []);

  // Keyboard shortcuts for word type toggles (1-9)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable || e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key;
      if (key in NUMBER_KEY_MAP) {
        e.preventDefault();
        toggleHighlight(NUMBER_KEY_MAP[key]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleHighlight]);

  const shortcutActionsRef = useRef<{ handleStrikethrough: () => void; handleCleanStrikethroughs: () => void; handleExport: () => void }>(null!);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || !e.shiftKey) return;
      const a = shortcutActionsRef.current;
      switch (e.key.toLowerCase()) {
        case "x": e.preventDefault(); a.handleStrikethrough(); break;
        case "k": e.preventDefault(); a.handleCleanStrikethroughs(); break;
        case "p": e.preventDefault(); setViewMode(v => v === "write" ? "preview" : "write"); break;
        case "e": e.preventDefault(); a.handleExport(); break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const { isDesktop, isMobile } = useResponsiveBreakpoint();

  // Mobile welcome
  useEffect(() => {
    if (!isMobile || settings.mobile_welcome_seen) return;
    const timer = setTimeout(() => setShowMobileWelcome(true), 1000);
    return () => clearTimeout(timer);
  }, [isMobile, settings.mobile_welcome_seen]);

  const dismissMobileWelcome = useCallback(() => {
    setShowMobileWelcome(false);
    updateSettings({ mobile_welcome_seen: true }).catch(() => {});
  }, []);

  // Hold-Tab cheat sheet
  const [tabHeld, setTabHeld] = useState(false);
  useEffect(() => {
    if (isMobile) { setTabHeld(false); return; }
    const down = (e: KeyboardEvent) => { if (e.key === "Tab" && !e.repeat) { e.preventDefault(); setTabHeld(true); } };
    const up = (e: KeyboardEvent) => { if (e.key === "Tab") setTabHeld(false); };
    const blur = () => setTabHeld(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, [isMobile]);

  const isMac = useMemo(() => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent), []);

  // Sync selection color CSS custom property
  useEffect(() => {
    document.documentElement.style.setProperty("--selection-color", currentTheme.selection);
  }, [currentTheme]);

  // Sync theme-color meta tag
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", currentTheme.background);
  }, [currentTheme]);

  // Autosave content to server (debounced 2s)
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      autosaveDocument(documentId, content, countWords(content)).catch(e => {
        console.warn("Autosave failed:", e);
      });
    }, 2000);
    return () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current); };
  }, [content, documentId]);

  // Syntax analysis (runs in Web Worker)
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (content.length > 0) {
        try {
          const result = await analyzeInWorker(content);
          setSyntaxData(result);
        } catch (error) {
          console.warn("Syntax analysis failed:", error);
        }
      }
    }, 150);
    return () => clearTimeout(handler);
  }, [content, analyzeInWorker]);

  // Song analysis
  useEffect(() => {
    if (!songMode || content.length === 0) { setSongData(null); return; }
    const handler = setTimeout(async () => {
      try {
        const result = await analyzeSongInWorker(content);
        setSongData(result);
      } catch (error) {
        console.warn("Song analysis failed:", error);
      }
    }, 200);
    return () => clearTimeout(handler);
  }, [content, songMode, analyzeSongInWorker]);

  // Reset rhyme interaction state on new analysis
  useEffect(() => {
    setFocusedRhymeKey(null);
    setDisabledRhymeKeys(new Set());
  }, [songData]);

  const handleToggleRhymeKey = useCallback((key: string) => {
    setDisabledRhymeKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleExport = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clean-writer.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportToast(true);
  };

  const handleClearRequest = () => setIsClearDialogOpen(true);
  const handleConfirmClear = () => {
    setContent("");
    setSyntaxData({
      nouns: [], pronouns: [], verbs: [], adjectives: [], adverbs: [],
      prepositions: [], conjunctions: [], articles: [], interjections: [],
      urls: [], numbers: [], hashtags: [],
    });
    setIsClearDialogOpen(false);
  };

  const handleSampleTextRequest = () => setIsSampleDialogOpen(true);
  const handleConfirmSampleText = () => { setContent(FRESH_LOAD_TEXT); setIsSampleDialogOpen(false); };

  const handleStrikethrough = useCallback(() => {
    const textarea = textareaRef.current || document.querySelector("textarea");
    if (!textarea) return;
    const savedSel = getSavedSelection();
    const start = savedSel ? savedSel.start : textarea.selectionStart;
    const end = savedSel ? savedSel.end : textarea.selectionEnd;
    if (savedSel) clearSelection();
    if (start === end) return;
    const newContent = applyStrikethrough(content, start, end);
    setContent(newContent);
    setTimeout(() => textarea.focus(), 10);
  }, [content, getSavedSelection, clearSelection]);

  const toggleViewMode = () => setViewMode(viewMode === "write" ? "preview" : "write");

  const handleStrikethroughPointerDown = useCallback(() => { saveSelection(); }, [saveSelection]);

  const hasStrikethroughs = useMemo(() => hasStrikethroughBlocks(content), [content]);
  const handleCleanStrikethroughs = useCallback(() => {
    const cleaned = removeStrikethroughBlocks(content);
    if (cleaned !== content) setContent(cleaned);
  }, [content]);

  shortcutActionsRef.current = { handleStrikethrough, handleCleanStrikethroughs, handleExport };

  return (
    <div
      className="w-full h-[100dvh] flex flex-col relative overflow-x-hidden transition-colors duration-500"
      style={{
        backgroundColor: currentTheme.background,
        color: currentTheme.text,
        fontFamily: displayFontFamily,
      }}
    >
      {/* NERV Boot Screen */}
      {showBootScreen && <NervBootScreen onComplete={handleBootComplete} />}

      {/* NERV CRT Overlay (only for NERV theme) */}
      <NervCRTOverlay enabled={isNervTheme} />

      {/* NERV Status Bar (only for NERV theme) */}
      {isNervTheme && (
        <NervStatusBar wordCount={wordCount} songMode={songMode} connected={true} />
      )}

      {/* Background Texture */}
      <div
        data-overlap-ignore
        className="absolute inset-0 pointer-events-none opacity-20 mix-blend-multiply z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Top fade */}
      <div
        data-overlap-ignore
        className="absolute top-0 left-0 right-0 h-[144px] pointer-events-none z-[59]"
        style={{
          background: `linear-gradient(to bottom, ${currentTheme.background} 0%, ${currentTheme.background}00 100%)`,
        }}
      />

      <ConfirmDialog
        isOpen={isClearDialogOpen}
        onConfirm={handleConfirmClear}
        onCancel={() => setIsClearDialogOpen(false)}
        theme={currentTheme}
      />

      <ConfirmDialog
        isOpen={isSampleDialogOpen}
        onConfirm={handleConfirmSampleText}
        onCancel={() => setIsSampleDialogOpen(false)}
        theme={currentTheme}
        title="Load Sample Text?"
        message={
          <>
            This will replace your current content with a sample excerpt. <br />
            <span className="opacity-50 text-xs uppercase tracking-wider">
              Your existing text will be lost.
            </span>
          </>
        }
        confirmLabel="LOAD SAMPLE"
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        theme={currentTheme}
        isMac={isMac}
      />

      <ThemeCustomizer
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        theme={currentTheme}
        hasCustomizations={false}
        onSetColor={() => {}}
        onResetToPreset={() => {}}
        onResetColor={() => {}}
        isColorCustomized={() => false}
        currentFontId={fontId}
        onFontChange={setFontId}
        hiddenThemeIds={hiddenThemeIds}
        onToggleThemeVisibility={() => {}}
        utf8DisplayEnabled={utf8DisplayEnabled}
        onToggleUtf8Display={setUtf8DisplayEnabled}
        themeOrder={settings.theme_order || []}
        onReorderThemes={() => {}}
        rhymeColors={effectiveRhymeColors}
        onSetRhymeColor={() => {}}
        onResetRhymeColor={() => {}}
        isRhymeColorCustomized={() => false}
        rhymeHighlightRadius={rhymeHighlightRadius}
        onRhymeHighlightRadiusChange={setRhymeHighlightRadius}
        rhymeBoldEnabled={rhymeBoldEnabled}
        onRhymeBoldEnabledChange={setRhymeBoldEnabled}
        customThemeNames={customThemeNames}
        onThemeRename={handleThemeRename}
        onSelectThemeForEditing={handleSelectThemeForEditing}
        hasOverridesForTheme={() => false}
        songMode={songMode}
        initialTab={customizerInitialTab}
        onInitialTabConsumed={() => setCustomizerInitialTab(null)}
        savedCustomThemes={[]}
        onSaveCustomTheme={() => null}
        onDeleteCustomTheme={() => {}}
        onRenameCustomTheme={() => {}}
        isCustomTheme={themeId.startsWith("custom_")}
        onShowToast={handleShowToast}
        letterSpacing={letterSpacing}
        onLetterSpacingChange={setLetterSpacing}
        lineHeight={lineHeightValue}
        onLineHeightChange={setLineHeightValue}
      />

      {/* Toasts */}
      <Toast message="You need at least one theme" isVisible={showLastThemeToast} onDismiss={() => setShowLastThemeToast(false)} type="warning" />
      <Toast message="Exported clean-writer.md" isVisible={showExportToast} onDismiss={() => setShowExportToast(false)} type="success" />
      <Toast message={customThemeToast?.message || ""} isVisible={!!customThemeToast} onDismiss={() => setCustomThemeToast(null)} type={customThemeToast?.type || "success"} />

      {/* Top Bar */}
      <div className={`absolute ${isNervTheme ? 'top-6' : 'top-0'} left-0 right-0 flex justify-between items-center p-[13px] md:p-[21px] z-[60] pointer-events-none`}>
        <div className="pointer-events-auto flex items-center min-h-[44px] min-w-0 flex-1 mr-2">
          <ThemeSelector
            currentTheme={currentTheme}
            themeId={themeId}
            onThemeChange={handleThemeChange}
            hiddenThemeIds={hiddenThemeIds}
            orderedThemes={orderedThemes}
            hasOverridesForTheme={() => false}
          />
        </div>
        {!isCustomizerOpen && (
          <div className="pointer-events-auto flex items-center gap-2 min-h-[44px]">
            <div
              className="flex items-center gap-0 rounded-lg overflow-hidden"
              style={{
                backgroundColor: `${currentTheme.background}80`,
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <TouchButton
                onClick={() => handleFontSizeChange(fontSizeOffset - 2)}
                disabled={fontSizeOffset <= -6}
                className={`px-1.5 py-0.5 text-xs font-bold transition-all ${fontSizeOffset <= -6 ? "opacity-25 cursor-not-allowed" : "opacity-60 hover:opacity-100 hover:bg-current/5"}`}
                style={{ color: currentTheme.text }}
                aria-label="Decrease font size"
              >
                A−
              </TouchButton>
              <TouchButton
                onClick={() => handleFontSizeChange(0)}
                disabled={fontSizeOffset === 0}
                className={`px-1.5 py-0.5 text-[10px] font-medium tabular-nums transition-all ${fontSizeOffset === 0 ? "opacity-25 cursor-not-allowed" : "opacity-60 hover:opacity-100 hover:bg-current/5"}`}
                style={{ color: currentTheme.text, minWidth: "24px", textAlign: "center" }}
                aria-label="Reset font size"
              >
                {fontSizeOffset === 0 ? "0" : fontSizeOffset > 0 ? `+${fontSizeOffset}` : `${fontSizeOffset}`}
              </TouchButton>
              <TouchButton
                onClick={() => handleFontSizeChange(fontSizeOffset + 2)}
                disabled={fontSizeOffset >= 12}
                className={`px-1.5 py-0.5 text-xs font-bold transition-all ${fontSizeOffset >= 12 ? "opacity-25 cursor-not-allowed" : "opacity-60 hover:opacity-100 hover:bg-current/5"}`}
                style={{ color: currentTheme.text }}
                aria-label="Increase font size"
              >
                A+
              </TouchButton>
            </div>
            <div className="flex items-center gap-0.5">
              <Tooltip content="Help & Shortcuts" position="bottom">
                <TouchButton
                  onClick={() => setIsHelpOpen(true)}
                  className="p-2 rounded-xl hover:bg-current/5 transition-all duration-200"
                  aria-label="Help and shortcuts"
                  style={{ color: getIconColor(currentTheme) }}
                >
                  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </TouchButton>
              </Tooltip>
              <Tooltip content="Settings" position="bottom">
                <TouchButton
                  onClick={() => setIsCustomizerOpen(true)}
                  className="p-2 rounded-xl hover:bg-current/5 transition-all duration-200"
                  title="Customize Theme"
                  style={{ color: getIconColor(currentTheme) }}
                >
                  <IconSettings />
                </TouchButton>
              </Tooltip>
            </div>
          </div>
        )}
      </div>

      {/* Main Area */}
      <main
        className={`flex-1 w-full h-full relative z-10 ${isNervTheme ? 'pt-[115px]' : 'pt-[89px]'} md:pt-[89px] lg:pt-[89px] transition-all duration-300 ease-in-out`}
        style={{
          paddingRight: isDesktop && content.length > 0 ? 360 : undefined,
        }}
      >
        {viewMode === "write" ? (
          <Typewriter
            content={content}
            setContent={setContent}
            theme={currentTheme}
            syntaxSets={syntaxSets}
            highlightConfig={effectiveHighlightConfig}
            fontSize={fluidFontSize}
            maxWidth={maxWidth}
            fontFamily={displayFontFamily}
            showUtfEmojiCodes={utf8DisplayEnabled}
            textareaRef={textareaRef}
            hoveredCategory={hoveredCategory}
            persistedSelection={savedSelection}
            songMode={songMode}
            songData={songData}
            rhymeColors={effectiveRhymeColors}
            showSyllableAnnotations={songMode && showSyllableAnnotations}
            rhymeHighlightRadius={rhymeHighlightRadius}
            rhymeBoldEnabled={rhymeBoldEnabled}
            focusedRhymeKey={focusedRhymeKey}
            hoveredRhymeKey={hoveredRhymeKey}
            disabledRhymeKeys={disabledRhymeKeys}
            letterSpacing={letterSpacing}
            lineHeight={lineHeightValue}
          />
        ) : (
          <div
            className="mx-auto h-full relative z-10 transition-[max-width] duration-300 ease-in-out px-4 py-8 md:px-0 md:py-0"
            style={{ maxWidth }}
          >
            <MarkdownPreview content={content} theme={currentTheme} onBackToEdit={toggleViewMode} />
          </div>
        )}
      </main>

      {/* Unified Syntax Panel */}
      <UnifiedSyntaxPanel
        content={content}
        theme={currentTheme}
        syntaxData={syntaxData}
        syntaxSets={syntaxSets}
        highlightConfig={effectiveHighlightConfig}
        onToggleHighlight={toggleHighlight}
        soloMode={soloMode}
        onSoloToggle={handleSoloToggle}
        hasSeenPanel={hasSeenSyntaxPanel}
        onPanelSeen={handleSyntaxPanelSeen}
        onCategoryHover={setHoveredCategory}
        songMode={songMode}
        onToggleSongMode={() => setSongMode(prev => !prev)}
        songData={songData}
        rhymeColors={effectiveRhymeColors}
        showSyllableAnnotations={showSyllableAnnotations}
        onToggleSyllableAnnotations={() => setShowSyllableAnnotations(prev => !prev)}
        focusedRhymeKey={focusedRhymeKey}
        onFocusRhymeKey={setFocusedRhymeKey}
        hoveredRhymeKey={hoveredRhymeKey}
        onHoverRhymeKey={setHoveredRhymeKey}
        disabledRhymeKeys={disabledRhymeKeys}
        onToggleRhymeKey={handleToggleRhymeKey}
      />

      {/* Bottom Toolbar */}
      <Toolbar
        theme={currentTheme}
        viewMode={viewMode}
        maxWidth={maxWidth}
        hasStrikethroughs={hasStrikethroughs}
        fontSizeOffset={fontSizeOffset}
        onFontSizeChange={handleFontSizeChange}
        onToggleView={toggleViewMode}
        onStrikethrough={handleStrikethrough}
        onStrikethroughPointerDown={handleStrikethroughPointerDown}
        onCleanStrikethroughs={handleCleanStrikethroughs}
        onExport={handleExport}
        onClear={handleClearRequest}
        onWidthChange={setMaxWidth}
        onSampleText={handleSampleTextRequest}
      />

      {/* Mobile Welcome */}
      {showMobileWelcome && <MobileWelcome theme={currentTheme} onDismiss={dismissMobileWelcome} />}

      {/* Hold-Tab shortcut cheat sheet */}
      {tabHeld && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
          <div
            className="rounded-2xl px-8 py-6 shadow-2xl border backdrop-blur-xl"
            style={{
              backgroundColor: `${currentTheme.background}cc`,
              borderColor: `${currentTheme.text}15`,
              color: currentTheme.text,
              maxWidth: 360,
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4 text-center" style={{ opacity: 0.5 }}>
              Keyboard Shortcuts
            </h3>
            <div className="grid gap-2 text-sm items-center" style={{ gridTemplateColumns: "auto 1fr" }}>
              {[
                [isMac ? "⌘⇧X" : "Ctrl+Shift+X", "Strikethrough"],
                [isMac ? "⌘⇧K" : "Ctrl+Shift+K", "Clean struck text"],
                [isMac ? "⌘⇧P" : "Ctrl+Shift+P", "Toggle preview"],
                [isMac ? "⌘⇧E" : "Ctrl+Shift+E", "Export markdown"],
                ["1 – 9", "Toggle word types"],
              ].map(([key, desc]) => (
                <React.Fragment key={key}>
                  <span className="text-right pr-3"><Kbd theme={currentTheme}>{key}</Kbd></span>
                  <span style={{ opacity: 0.7 }}>{desc}</span>
                </React.Fragment>
              ))}
            </div>
            <p className="text-[10px] text-center mt-4 uppercase tracking-widest" style={{ opacity: 0.3 }}>
              Release Tab to dismiss
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
