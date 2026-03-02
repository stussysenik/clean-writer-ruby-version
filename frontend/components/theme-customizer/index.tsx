import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { RisoTheme, SavedCustomTheme } from "@/types";
import {
  BUILD_IDENTITY,
  FONT_OPTIONS,
  FONT_CATEGORIES,
  FontId,
  THEMES,
} from "@/constants";
import SaveThemeForm from "./SaveThemeForm";
import {
  getContrastRatio,
  formatContrastRatio,
  isDarkBackground,
} from "@/utils/colorContrast";
import { generateHarmonyColors, generateOklchHarmony } from "@/utils/colorHarmony";
import HexInput from "./ColorPicker/HexInput";
import TouchButton from "@/components/shared/TouchButton";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Reset icon component
const IconReset: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

// Shuffle icon
const IconShuffle: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" y1="15" x2="21" y2="21" />
    <line x1="4" y1="4" x2="9" y2="9" />
  </svg>
);

interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  theme: RisoTheme;
  hasCustomizations: boolean;
  onSetColor: (path: string, color: string) => void;
  onResetToPreset: () => void;
  onResetColor?: (path: string) => void;
  isColorCustomized?: (path: string) => boolean;
  currentFontId: FontId;
  onFontChange: (fontId: FontId) => void;
  hiddenThemeIds?: string[];
  onToggleThemeVisibility?: (id: string) => void;
  utf8DisplayEnabled: boolean;
  onToggleUtf8Display: (enabled: boolean) => void;
  themeOrder?: string[];
  onReorderThemes?: (fromIndex: number, toIndex: number) => void;
  rhymeColors?: string[];
  onSetRhymeColor?: (index: number, color: string) => void;
  onResetRhymeColor?: (index: number) => void;
  isRhymeColorCustomized?: (index: number) => boolean;
  rhymeHighlightRadius?: number;
  onRhymeHighlightRadiusChange?: (radius: number) => void;
  rhymeBoldEnabled?: boolean;
  onRhymeBoldEnabledChange?: (enabled: boolean) => void;
  customThemeNames?: Record<string, string>;
  onThemeRename?: (themeId: string, newName: string) => void;
  onSelectThemeForEditing?: (themeId: string) => void;
  hasOverridesForTheme?: (id: string) => boolean;
  songMode?: boolean;
  initialTab?: string | null;
  onInitialTabConsumed?: () => void;
  savedCustomThemes?: SavedCustomTheme[];
  onSaveCustomTheme?: (name: string, theme: RisoTheme, rhymeColors?: string[]) => SavedCustomTheme | null;
  onDeleteCustomTheme?: (id: string) => void;
  onRenameCustomTheme?: (id: string, newName: string) => void;
  isCustomTheme?: boolean;
  onShowToast?: (message: string, type?: "success" | "warning") => void;
  letterSpacing?: number;
  onLetterSpacingChange?: (v: number) => void;
  lineHeight?: number;
  onLineHeightChange?: (v: number) => void;
}

const RHYME_COLOR_LABELS = [
  "Red", "Blue", "Green", "Orange", "Purple", "Teal", "Pink", "Yellow",
];

// Pre-computed OKLCH palettes (8 evenly-spaced hues from base hue, L=0.55, C=0.14)
const OKLCH_SUNSET = generateOklchHarmony(30, 8, "#ffffff");
const OKLCH_FOREST = generateOklchHarmony(140, 8, "#ffffff");
const OKLCH_BERRY = generateOklchHarmony(320, 8, "#ffffff");
const OKLCH_JEWEL = generateOklchHarmony(270, 8, "#ffffff");

const RHYME_PRESETS: { name: string; colors: string[] }[] = [
  { name: "Default", colors: ["#00859e","#3072c1","#7f5bb6","#a84b84","#b54c3d","#a06200","#687c00","#008a5d"] },
  { name: "Billboard", colors: ["#E53935","#1E88E5","#43A047","#FB8C00","#8E24AA","#00ACC1","#D81B60","#FFD600"] },
  { name: "Neon", colors: ["#FF006E","#3A86FF","#8AC926","#FF5400","#9B5DE5","#00F5D4","#F72585","#FFBE0B"] },
  { name: "Earth", colors: ["#A0522D","#4682B4","#6B8E23","#CD853F","#708090","#2E8B57","#BC8F8F","#DAA520"] },
  { name: "Pastel", colors: ["#FF9AA2","#B5EAD7","#C7CEEA","#FFDAC1","#E2B4BD","#9DE0D0","#FFB7B2","#F3E8C0"] },
  { name: "Sunset", colors: OKLCH_SUNSET },
  { name: "Forest", colors: OKLCH_FOREST },
  { name: "Berry", colors: OKLCH_BERRY },
  { name: "Jewel", colors: OKLCH_JEWEL },
];

const WORD_TYPE_LABELS: {
  key: keyof RisoTheme["highlight"];
  label: string;
  short: string;
}[] = [
  { key: "noun", label: "Nouns", short: "Noun" },
  { key: "verb", label: "Verbs", short: "Verb" },
  { key: "adjective", label: "Adjectives", short: "Adj" },
  { key: "adverb", label: "Adverbs", short: "Adv" },
  { key: "pronoun", label: "Pronouns", short: "Pron" },
  { key: "preposition", label: "Prepositions", short: "Prep" },
  { key: "conjunction", label: "Conjunctions", short: "Conj" },
  { key: "article", label: "Articles", short: "Art" },
  { key: "interjection", label: "Interjections", short: "Intj" },
  { key: "url", label: "URLs", short: "URL" },
  { key: "number", label: "Numbers", short: "Num" },
  { key: "hashtag", label: "Hashtags", short: "#Tag" },
];

const MIN_CONTRAST_RATIO = 3;

type TabId = "colors" | "typography" | "themes" | "display";

const TABS: { id: TabId; label: string }[] = [
  { id: "colors", label: "Colors" },
  { id: "typography", label: "Type" },
  { id: "themes", label: "Themes" },
  { id: "display", label: "Display" },
];

/** Compact single-row color editor with 44px touch target */
const CompactColorRow: React.FC<{
  label: string;
  color: string;
  path: string;
  bgColor: string;
  showContrast?: boolean;
  isCustomized?: boolean;
  onSetColor: (path: string, color: string) => void;
  onResetColor?: (path: string) => void;
}> = ({
  label,
  color,
  path,
  bgColor,
  showContrast = false,
  isCustomized = false,
  onSetColor,
  onResetColor,
}) => {
  const ratio = showContrast ? getContrastRatio(color, bgColor) : null;
  const lowContrast = ratio !== null && ratio < MIN_CONTRAST_RATIO;

  return (
    <div className="flex items-center gap-2" style={{ minHeight: "44px" }}>
      <span className="text-xs uppercase tracking-wide opacity-70 w-[72px] flex-shrink-0 truncate">
        {label}
      </span>
      <input
        type="color"
        value={color}
        onChange={(e) => onSetColor(path, e.target.value)}
        className="cursor-pointer rounded border-0 p-0 bg-transparent flex-shrink-0"
        style={{
          minWidth: "44px",
          minHeight: "44px",
          width: "44px",
          height: "44px",
        }}
      />
      <HexInput value={color} onChange={(c) => onSetColor(path, c)} />
      {lowContrast && (
        <span
          className="px-1 py-0.5 text-[9px] font-medium rounded whitespace-nowrap flex-shrink-0"
          style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}
          title={`Contrast ${formatContrastRatio(ratio!)} below ${MIN_CONTRAST_RATIO}:1`}
        >
          !
        </span>
      )}
      {onResetColor && (
        <TouchButton
          onClick={() => onResetColor(path)}
          disabled={!isCustomized}
          className={`p-2 rounded transition-all flex-shrink-0 ${
            isCustomized
              ? "opacity-60 hover:opacity-100"
              : "opacity-20 cursor-not-allowed"
          }`}
          title={
            isCustomized
              ? `Reset ${label.toLowerCase()}`
              : `${label} is using preset value`
          }
        >
          <IconReset size={12} />
        </TouchButton>
      )}
    </div>
  );
};

/** Thin section label (flat, always-visible) */
const SectionLabel: React.FC<{
  title: string;
  trailing?: React.ReactNode;
  theme: RisoTheme;
}> = ({ title, trailing, theme }) => (
  <div
    className="flex items-center gap-2 pt-4 pb-2 border-b"
    style={{ borderColor: `${theme.text}10` }}
  >
    <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] opacity-40 flex-1">
      {title}
    </h3>
    {trailing}
  </div>
);

/** Single sortable theme item */
const SortableThemeItem: React.FC<{
  t: typeof THEMES[number];
  isHidden: boolean;
  hasEdits: boolean;
  onToggleThemeVisibility: (id: string) => void;
  theme: RisoTheme;
  canDrag: boolean;
  displayName?: string;
  onRename?: (themeId: string, newName: string) => void;
  onSelectForEditing?: (themeId: string) => void;
  isCustom?: boolean;
  onDelete?: (id: string) => void;
}> = ({ t, isHidden, hasEdits, onToggleThemeVisibility, theme, canDrag, displayName, onRename, onSelectForEditing, isCustom, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: t.id });

  const dark = isDarkBackground(theme.background);
  const accentOk = getContrastRatio(theme.accent, theme.background) >= 3;
  const checkboxAccent = accentOk ? theme.accent : dark ? "#ffffff" : "#1a1a1a";

  const dotShadow = dark
    ? "0 0 0 0.5px rgba(255,255,255,0.25)"
    : "0 0 0 0.5px rgba(0,0,0,0.15)";

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : isHidden ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const name = displayName || t.name;

  const startEditing = () => {
    setEditValue(name);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = () => {
    setIsEditing(false);
    if (onRename && editValue.trim() !== name) {
      onRename(t.id, editValue.trim() || "");
    }
  };

  const handleRowClick = () => {
    if (!isEditing && onSelectForEditing) {
      onSelectForEditing(t.id);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="select-none">
      <div
        className="flex items-center gap-2 p-3 rounded-lg hover:bg-current/5 transition-colors cursor-pointer"
        style={{ minHeight: "44px" }}
        onClick={handleRowClick}
      >
        {canDrag && (
          <div
            className="flex items-center justify-center flex-shrink-0 cursor-grab active:cursor-grabbing"
            data-testid="drag-handle"
            style={{ width: "44px", height: "44px", touchAction: "none" }}
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
          >
            <svg
              width="10"
              height="14"
              viewBox="0 0 10 14"
              className="transition-opacity"
              style={{ opacity: 0.4, color: theme.text }}
            >
              <circle cx="3" cy="2" r="1.2" fill="currentColor"/>
              <circle cx="7" cy="2" r="1.2" fill="currentColor"/>
              <circle cx="3" cy="7" r="1.2" fill="currentColor"/>
              <circle cx="7" cy="7" r="1.2" fill="currentColor"/>
              <circle cx="3" cy="12" r="1.2" fill="currentColor"/>
              <circle cx="7" cy="12" r="1.2" fill="currentColor"/>
            </svg>
          </div>
        )}
        <label className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={!isHidden}
            onChange={() => onToggleThemeVisibility(t.id)}
            className="w-5 h-5 rounded flex-shrink-0 cursor-pointer"
            style={{
              accentColor: checkboxAccent,
              borderWidth: "2px",
              borderColor: `${theme.text}40`,
            }}
          />
          <span
            className="w-5 h-5 rounded-full flex-shrink-0"
            style={{
              backgroundColor: t.accent,
              boxShadow: dotShadow,
            }}
          />
        </label>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit();
                if (e.key === "Escape") { setIsEditing(false); }
              }}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-medium bg-transparent border-b border-current/30 outline-none px-0 py-0 w-full"
              style={{ color: theme.text }}
            />
          ) : (
            <>
              <span
                className="text-sm font-medium truncate"
                onDoubleClick={(e) => { e.stopPropagation(); startEditing(); }}
                title="Double-click to rename"
              >
                {name}
              </span>
            </>
          )}
          <div
            className="flex flex-wrap flex-shrink-0 ml-auto"
            style={{ gap: "2px", maxWidth: "52px" }}
          >
            {WORD_TYPE_LABELS.map(({ key }) => (
              <span
                key={key}
                className="rounded-full"
                style={{
                  width: "7px",
                  height: "7px",
                  backgroundColor: t.highlight[key as keyof typeof t.highlight],
                  boxShadow: dotShadow,
                }}
              />
            ))}
          </div>
          {isCustom && onDelete && (
            <span onClick={(e) => e.stopPropagation()}>
              <TouchButton
                onClick={() => onDelete(t.id)}
                className="p-1.5 rounded-md opacity-40 hover:opacity-80 transition-opacity flex-shrink-0"
                title="Delete custom theme"
                aria-label="Delete custom theme"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </TouchButton>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/** Draggable themes list for the Themes tab */
const ThemesTab: React.FC<{
  theme: RisoTheme;
  hiddenThemeIds: string[];
  onToggleThemeVisibility: (id: string) => void;
  themeOrder?: string[];
  onReorderThemes?: (fromIndex: number, toIndex: number) => void;
  customThemeNames?: Record<string, string>;
  onThemeRename?: (themeId: string, newName: string) => void;
  onSelectThemeForEditing?: (themeId: string) => void;
  hasOverridesForTheme?: (id: string) => boolean;
  savedCustomThemes?: SavedCustomTheme[];
  onDeleteCustomTheme?: (id: string) => void;
  onRenameCustomTheme?: (id: string, newName: string) => void;
}> = ({ theme, hiddenThemeIds, onToggleThemeVisibility, themeOrder, onReorderThemes, customThemeNames, onThemeRename, onSelectThemeForEditing, hasOverridesForTheme, savedCustomThemes, onDeleteCustomTheme, onRenameCustomTheme }) => {
  const listRef = useRef<HTMLDivElement>(null);

  const orderedThemeList = useMemo(() => {
    if (!themeOrder) return THEMES;
    return [...THEMES].sort((a, b) => {
      const ia = themeOrder.indexOf(a.id);
      const ib = themeOrder.indexOf(b.id);
      return ia - ib;
    });
  }, [themeOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !onReorderThemes) return;
      const oldIndex = orderedThemeList.findIndex((t) => t.id === active.id);
      const newIndex = orderedThemeList.findIndex((t) => t.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderThemes(oldIndex, newIndex);
      }
    },
    [orderedThemeList, onReorderThemes],
  );

  const themeIds = useMemo(() => orderedThemeList.map((t) => t.id), [orderedThemeList]);

  // Check if the list can scroll
  const [canScroll, setCanScroll] = useState(false);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const check = () => setCanScroll(el.scrollHeight > el.clientHeight + 10);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [orderedThemeList]);

  return (
    <section className="py-4">
      <h3 className="text-xs font-medium uppercase tracking-widest mb-1 opacity-50">
        Visible Presets
      </h3>
      <p className="text-[10px] opacity-30 mb-2">Click to edit colors. Double-click name to rename.</p>

      {/* Scroll-to buttons */}
      {canScroll && (
        <div className="flex justify-end gap-1 mb-1">
          <TouchButton
            onClick={() => listRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
            className="p-1.5 rounded-md opacity-40 hover:opacity-80 transition-opacity"
            aria-label="Scroll to top"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </TouchButton>
          <TouchButton
            onClick={() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })}
            className="p-1.5 rounded-md opacity-40 hover:opacity-80 transition-opacity"
            aria-label="Scroll to bottom"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </TouchButton>
        </div>
      )}

      <div ref={listRef} className="max-h-[60vh] overflow-y-auto" data-testid="themes-list">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={themeIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {orderedThemeList.map((t) => (
                <SortableThemeItem
                  key={t.id}
                  t={t}
                  isHidden={hiddenThemeIds.includes(t.id)}
                  hasEdits={!!hasOverridesForTheme?.(t.id)}
                  onToggleThemeVisibility={onToggleThemeVisibility}
                  theme={theme}
                  canDrag={!!onReorderThemes}
                  displayName={customThemeNames?.[t.id]}
                  onRename={onThemeRename}
                  onSelectForEditing={onSelectThemeForEditing}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Custom Themes */}
      {savedCustomThemes && savedCustomThemes.length > 0 && (
        <>
          <h3 className="text-xs font-medium uppercase tracking-widest mt-4 mb-1 opacity-50">
            Custom Themes
          </h3>
          <p className="text-[10px] opacity-30 mb-2">Click to edit. Double-click name to rename.</p>
          <div className="space-y-1">
            {savedCustomThemes.map((ct) => (
              <div
                key={ct.id}
                className="flex items-center gap-2 p-3 rounded-lg hover:bg-current/5 transition-colors cursor-pointer"
                style={{ minHeight: "44px" }}
                onClick={() => onSelectThemeForEditing?.(ct.id)}
              >
                <span
                  className="w-5 h-5 rounded-full flex-shrink-0 relative"
                  style={{
                    backgroundColor: ct.theme.accent,
                    boxShadow: isDarkBackground(theme.background)
                      ? "0 0 0 0.5px rgba(255,255,255,0.25)"
                      : "0 0 0 0.5px rgba(0,0,0,0.15)",
                  }}
                >
                  <span
                    className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center"
                    style={{
                      width: "8px",
                      height: "8px",
                      backgroundColor: theme.background,
                      borderRadius: "50%",
                    }}
                  >
                    <svg width="5" height="5" viewBox="0 0 10 10" fill={theme.text} opacity="0.6">
                      <path d="M5 0L6.12 3.88L10 5L6.12 6.12L5 10L3.88 6.12L0 5L3.88 3.88Z" />
                    </svg>
                  </span>
                </span>
                <span className="text-sm font-medium truncate flex-1"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    const newName = prompt("Rename theme:", ct.name);
                    if (newName?.trim() && onRenameCustomTheme) {
                      onRenameCustomTheme(ct.id, newName.trim());
                    }
                  }}
                  title="Double-click to rename"
                >
                  {ct.name}
                </span>
                <div
                  className="flex flex-wrap flex-shrink-0 ml-auto"
                  style={{ gap: "2px", maxWidth: "52px" }}
                >
                  {WORD_TYPE_LABELS.map(({ key }) => (
                    <span
                      key={key}
                      className="rounded-full"
                      style={{
                        width: "7px",
                        height: "7px",
                        backgroundColor: ct.theme.highlight[key as keyof typeof ct.theme.highlight],
                        boxShadow: isDarkBackground(theme.background)
                          ? "0 0 0 0.5px rgba(255,255,255,0.25)"
                          : "0 0 0 0.5px rgba(0,0,0,0.15)",
                      }}
                    />
                  ))}
                </div>
                {onDeleteCustomTheme && (
                  <span onClick={(e) => e.stopPropagation()}>
                    <TouchButton
                      onClick={() => onDeleteCustomTheme(ct.id)}
                      className="p-1.5 rounded-md opacity-40 hover:opacity-80 transition-opacity flex-shrink-0"
                      title="Delete custom theme"
                      aria-label="Delete custom theme"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </TouchButton>
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

/** Active theme header with inline rename */
const ActiveThemeHeader: React.FC<{
  theme: RisoTheme;
  isCustomTheme: boolean;
  customThemeNames?: Record<string, string>;
  onThemeRename?: (themeId: string, newName: string) => void;
  onRenameCustomTheme?: (id: string, newName: string) => void;
}> = ({ theme, isCustomTheme, customThemeNames, onThemeRename, onRenameCustomTheme }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const displayName = customThemeNames?.[theme.id] || theme.name;

  const startEditing = () => {
    setEditValue(displayName);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = () => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    if (trimmed === displayName) return;
    if (isCustomTheme && onRenameCustomTheme) {
      onRenameCustomTheme(theme.id, trimmed || theme.name);
    } else if (onThemeRename) {
      onThemeRename(theme.id, trimmed);
    }
  };

  return (
    <div className="px-4 py-3 flex items-center gap-3 border-b border-current/10 flex-shrink-0">
      <div
        className="w-10 h-10 rounded-xl flex-shrink-0 border"
        style={{
          backgroundColor: theme.background,
          borderColor: `${theme.text}20`,
        }}
      >
        <div className="w-full h-full rounded-xl flex items-center justify-center">
          <span className="text-xs font-bold" style={{ color: theme.accent }}>
            Aa
          </span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") setIsEditing(false);
            }}
            maxLength={40}
            className="text-sm font-semibold bg-transparent border-b border-current/30 outline-none px-0 py-0 w-full"
            style={{ color: theme.text }}
          />
        ) : (
          <span
            className="text-sm font-semibold truncate block cursor-pointer hover:opacity-80 transition-opacity"
            onClick={startEditing}
            title="Click to rename"
          >
            {displayName}
            {isCustomTheme && (
              <span className="ml-1.5 text-[9px] font-medium uppercase opacity-40">custom</span>
            )}
          </span>
        )}
        <div className="flex flex-wrap gap-1 mt-1">
          {WORD_TYPE_LABELS.map(({ key }) => (
            <span
              key={key}
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: theme.highlight[key] }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/** Group fonts by category */
const groupedFonts = FONT_CATEGORIES.map((cat) => ({
  category: cat,
  fonts: FONT_OPTIONS.filter((f) => f.category === cat),
}));

const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({
  isOpen,
  onClose,
  theme,
  hasCustomizations,
  onSetColor,
  onResetToPreset,
  onResetColor,
  isColorCustomized,
  currentFontId,
  onFontChange,
  hiddenThemeIds = [],
  onToggleThemeVisibility,
  utf8DisplayEnabled,
  onToggleUtf8Display,
  themeOrder,
  onReorderThemes,
  rhymeColors,
  onSetRhymeColor,
  onResetRhymeColor,
  isRhymeColorCustomized,
  customThemeNames,
  onThemeRename,
  onSelectThemeForEditing,
  hasOverridesForTheme,
  songMode,
  initialTab,
  onInitialTabConsumed,
  savedCustomThemes,
  onSaveCustomTheme,
  onDeleteCustomTheme,
  onRenameCustomTheme,
  isCustomTheme,
  onShowToast,
  letterSpacing = 0,
  onLetterSpacingChange,
  lineHeight = 1.6,
  onLineHeightChange,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>("colors");
  const [showSaveForm, setShowSaveForm] = useState(false);

  // Handle initialTab from parent (e.g. click theme row -> switch to colors)
  useEffect(() => {
    if (initialTab && isOpen) {
      setActiveTab(initialTab as TabId);
      onInitialTabConsumed?.();
    }
  }, [initialTab, isOpen, onInitialTabConsumed]);

  // Handle theme select for editing (activate + switch to colors tab)
  const handleSelectForEditing = useCallback((themeId: string) => {
    if (onSelectThemeForEditing) {
      onSelectThemeForEditing(themeId);
    }
    setActiveTab("colors");
  }, [onSelectThemeForEditing]);

  if (!isOpen) return null;

  const dark = isDarkBackground(theme.background);
  const dotShadow = dark
    ? "0 0 0 0.5px rgba(255,255,255,0.25)"
    : "0 0 0 0.5px rgba(0,0,0,0.15)";

  const checkCustomized = (path: string) => isColorCustomized?.(path) ?? false;

  // Count edited word colors for badge
  const editedWordCount = WORD_TYPE_LABELS.filter(({ key }) => checkCustomized(key)).length;
  const hasBaseEdits = ["background", "text", "cursor"].some(checkCustomized);

  // Shuffle handler: random hue -> harmony colors for all word types
  const handleShuffle = () => {
    const hue = Math.round(Math.random() * 360);
    const colors = generateHarmonyColors(hue, "analogous", theme.background);
    for (const [key, value] of Object.entries(colors)) {
      onSetColor(key, value);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-current/50 z-[100]" onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 w-full max-w-md z-[101] flex flex-col"
        data-testid="theme-customizer-panel"
        style={{
          backgroundColor: theme.background,
          color: theme.text,
          boxShadow: "-4px 0 20px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b border-current/10 flex-shrink-0"
          style={{ backgroundColor: theme.background }}
        >
          <h2 className="text-lg font-bold">Customize</h2>
          <TouchButton
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-current/10 transition-colors"
            title="Close"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </TouchButton>
        </div>

        {/* Active Preview Swatch with inline rename */}
        <ActiveThemeHeader
          theme={theme}
          isCustomTheme={!!isCustomTheme}
          customThemeNames={customThemeNames}
          onThemeRename={onThemeRename}
          onRenameCustomTheme={onRenameCustomTheme}
        />

        {/* Tab Bar */}
        <div className="flex border-b border-current/10 flex-shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-3 text-xs font-medium uppercase tracking-wider transition-all relative"
              style={{
                color: activeTab === tab.id ? theme.accent : theme.text,
                opacity: activeTab === tab.id ? 1 : 0.5,
                minHeight: "44px",
              }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                  style={{ backgroundColor: theme.accent }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content — scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-1">
          <div
            key={activeTab}
            className="animate-tab-fade-in"
          >
          {/* Colors Tab */}
          {activeTab === "colors" && (
            <>
              {/* Editor Colors — flat, always visible */}
              <SectionLabel title="Editor Colors" theme={theme} />
              <div className="space-y-1 pb-2">
                <CompactColorRow
                  label="Background"
                  color={theme.background}
                  path="background"
                  bgColor={theme.background}
                  isCustomized={checkCustomized("background")}
                  onSetColor={onSetColor}
                  onResetColor={onResetColor}
                />
                <CompactColorRow
                  label="Text"
                  color={theme.text}
                  path="text"
                  bgColor={theme.background}
                  showContrast
                  isCustomized={checkCustomized("text")}
                  onSetColor={onSetColor}
                  onResetColor={onResetColor}
                />
                <CompactColorRow
                  label="Cursor"
                  color={theme.cursor}
                  path="cursor"
                  bgColor={theme.background}
                  isCustomized={checkCustomized("cursor")}
                  onSetColor={onSetColor}
                  onResetColor={onResetColor}
                />
              </div>

              {/* Word Colors — flat, always visible */}
              <SectionLabel
                title="Word Colors"
                theme={theme}
                trailing={
                  <TouchButton
                    onClick={handleShuffle}
                    className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md transition-all opacity-60 hover:opacity-100"
                    style={{
                      backgroundColor: `${theme.text}08`,
                      border: `1px solid ${theme.text}15`,
                      color: theme.text,
                    }}
                    title="Generate random harmony colors"
                  >
                    <IconShuffle size={11} />
                    Shuffle
                  </TouchButton>
                }
              />
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 pb-2 pt-2">
                {WORD_TYPE_LABELS.map(({ key, short }) => (
                  <div key={key} className="flex items-center gap-1.5" style={{ minHeight: "44px" }}>
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: theme.highlight[key], boxShadow: dotShadow }}
                    />
                    <span className="text-xs uppercase tracking-wide opacity-60 flex-shrink-0 min-w-[2.5rem]">
                      {short}
                    </span>
                    <input
                      type="color"
                      value={theme.highlight[key]}
                      onChange={(e) => onSetColor(key, e.target.value)}
                      className="cursor-pointer rounded border-0 p-0 bg-transparent flex-shrink-0"
                      style={{
                        minWidth: "44px",
                        minHeight: "44px",
                        width: "44px",
                        height: "44px",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Song Colors — flat, always visible */}
              {rhymeColors && onSetRhymeColor && (
                <>
                  <SectionLabel title="Song Colors" theme={theme} />
                  {/* Preset palette strip */}
                  <div className="flex gap-2 overflow-x-auto pb-1 mb-3 pt-2">
                    {RHYME_PRESETS.map((preset) => {
                      const isActive = rhymeColors.every((c, i) => c.toLowerCase() === preset.colors[i]?.toLowerCase());
                      return (
                        <button
                          key={preset.name}
                          onClick={() => {
                            preset.colors.forEach((c, i) => onSetRhymeColor!(i, c));
                          }}
                          className="flex-shrink-0 rounded-lg p-2 border transition-all text-center"
                          style={{
                            borderColor: isActive ? `${theme.accent}60` : `${theme.text}15`,
                            backgroundColor: isActive ? `${theme.accent}15` : "transparent",
                            minWidth: "56px",
                          }}
                        >
                          <div className="grid grid-cols-4 gap-0.5 mx-auto" style={{ width: "fit-content" }}>
                            {preset.colors.map((c, i) => (
                              <span
                                key={i}
                                className="rounded-full"
                                style={{ width: "8px", height: "8px", backgroundColor: c }}
                              />
                            ))}
                          </div>
                          <span
                            className="block mt-1 font-medium"
                            style={{
                              fontSize: "9px",
                              letterSpacing: "0.05em",
                              textTransform: "uppercase" as const,
                              color: isActive ? theme.accent : theme.text,
                              opacity: isActive ? 1 : 0.5,
                            }}
                          >
                            {preset.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] opacity-40">Individual colors</span>
                    <TouchButton
                      onClick={() => {
                        const hue = Math.round(Math.random() * 360);
                        const generated = generateOklchHarmony(hue, 8, theme.background);
                        generated.forEach((color, i) => onSetRhymeColor(i, color));
                      }}
                      className="text-[10px] px-2 py-1 rounded-md transition-all opacity-60 hover:opacity-100"
                      style={{
                        backgroundColor: `${theme.text}08`,
                        border: `1px solid ${theme.text}15`,
                        color: theme.text,
                      }}
                      title="Generate 8 perceptually uniform colors from a random hue (OKLCH)"
                    >
                      Auto-generate
                    </TouchButton>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 pb-2">
                    {rhymeColors.map((color, index) => (
                      <div key={index} className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color, boxShadow: dotShadow }}
                        />
                        <span className="text-[10px] uppercase tracking-wide opacity-60 flex-shrink-0 min-w-[3rem]">
                          {RHYME_COLOR_LABELS[index] || `C${index + 1}`}
                        </span>
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => onSetRhymeColor(index, e.target.value)}
                          className="cursor-pointer rounded border-0 p-0 bg-transparent flex-shrink-0"
                          style={{
                            minWidth: "44px",
                            minHeight: "44px",
                            width: "44px",
                            height: "44px",
                          }}
                        />
                        {onResetRhymeColor && (
                          <TouchButton
                            onClick={() => onResetRhymeColor(index)}
                            disabled={!isRhymeColorCustomized?.(index)}
                            className={`p-1 rounded transition-all flex-shrink-0 ${
                              isRhymeColorCustomized?.(index)
                                ? "opacity-60 hover:opacity-100"
                                : "opacity-20 cursor-not-allowed"
                            }`}
                            title={
                              isRhymeColorCustomized?.(index)
                                ? `Reset ${RHYME_COLOR_LABELS[index] || "color"}`
                                : "Using default"
                            }
                          >
                            <IconReset size={10} />
                          </TouchButton>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Actions */}
              <SectionLabel title="Actions" theme={theme} />
              <div className="space-y-2 py-3">
                {/* Save as Custom Theme */}
                {onSaveCustomTheme && !showSaveForm && (
                  <TouchButton
                    onClick={() => setShowSaveForm(true)}
                    disabled={!hasCustomizations && !isCustomTheme}
                    className={`w-full py-2.5 px-4 rounded-lg text-center text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      hasCustomizations || isCustomTheme
                        ? "hover:opacity-90"
                        : "opacity-40 cursor-not-allowed"
                    }`}
                    style={{
                      backgroundColor: hasCustomizations || isCustomTheme ? theme.accent : `${theme.text}10`,
                      color: hasCustomizations || isCustomTheme ? theme.background : theme.text,
                      minHeight: "44px",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    Save as Custom Theme
                  </TouchButton>
                )}
                {showSaveForm && onSaveCustomTheme && (
                  <SaveThemeForm
                    theme={theme}
                    defaultName={`${theme.name} Custom`}
                    onSave={(name) => {
                      const saved = onSaveCustomTheme(name, theme, rhymeColors);
                      setShowSaveForm(false);
                      if (saved) {
                        onShowToast?.(`Saved "${name}"`, "success");
                      } else {
                        onShowToast?.("Max 20 custom themes reached", "warning");
                      }
                    }}
                    onCancel={() => setShowSaveForm(false)}
                  />
                )}

                {/* Reset */}
                <TouchButton
                  onClick={onResetToPreset}
                  disabled={!hasCustomizations}
                  className={`w-full py-2.5 px-4 rounded-lg text-center text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    hasCustomizations
                      ? "bg-current/10 hover:bg-current/20"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                  style={{ minHeight: "44px" }}
                >
                  <IconReset size={16} />
                  Reset All to Preset
                </TouchButton>
              </div>
            </>
          )}

          {/* Typography Tab */}
          {activeTab === "typography" && (
            <section className="py-4">
              {/* Line Height control */}
              {onLineHeightChange && (
                <div className="mb-5">
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-2 opacity-40">
                    Line Height
                  </h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1.2}
                      max={2.4}
                      step={0.1}
                      value={lineHeight}
                      onChange={(e) => onLineHeightChange(Math.round(Number(e.target.value) * 10) / 10)}
                      className="spacing-slider flex-1"
                      style={{ accentColor: theme.accent, height: 20 }}
                    />
                    <span
                      className="text-[11px] font-medium tabular-nums w-[3ch] text-right"
                      style={{ opacity: 0.6 }}
                    >
                      {lineHeight.toFixed(1)}
                    </span>
                    {lineHeight !== 1.6 && (
                      <button
                        onClick={() => onLineHeightChange(1.6)}
                        className="opacity-40 hover:opacity-80 transition-opacity"
                        title="Reset to default"
                      >
                        <IconReset size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Letter Spacing control */}
              {onLetterSpacingChange && (
                <div className="mb-5">
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-2 opacity-40">
                    Letter Spacing
                  </h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={-0.05}
                      max={0.15}
                      step={0.01}
                      value={letterSpacing}
                      onChange={(e) => onLetterSpacingChange(Math.round(Number(e.target.value) * 100) / 100)}
                      className="spacing-slider flex-1"
                      style={{ accentColor: theme.accent, height: 20 }}
                    />
                    <span
                      className="text-[11px] font-medium tabular-nums w-[4ch] text-right"
                      style={{ opacity: 0.6 }}
                    >
                      {letterSpacing.toFixed(2)}
                    </span>
                    {letterSpacing !== 0 && (
                      <button
                        onClick={() => onLetterSpacingChange(0)}
                        className="opacity-40 hover:opacity-80 transition-opacity"
                        title="Reset to default"
                      >
                        <IconReset size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {groupedFonts.map(({ category, fonts }) => (
                <div key={category} className="mb-4">
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-1.5 opacity-40">
                    {category}
                  </h3>
                  <div className="space-y-1">
                    {fonts.map((font) => (
                      <button
                        key={font.id}
                        onClick={() => onFontChange(font.id)}
                        className={`w-full text-left px-3 py-3 rounded-lg transition-all ${
                          currentFontId === font.id
                            ? "ring-1 ring-current bg-current/5"
                            : "hover:bg-current/5"
                        }`}
                        style={{ fontFamily: font.family, minHeight: "44px" }}
                      >
                        <span className="text-lg leading-tight">{font.name}</span>
                        <span className="block text-sm opacity-40 mt-0.5">
                          abcdefghij 0123456789
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Themes Tab */}
          {activeTab === "themes" && onToggleThemeVisibility && (
            <ThemesTab
              theme={theme}
              hiddenThemeIds={hiddenThemeIds}
              onToggleThemeVisibility={onToggleThemeVisibility}
              themeOrder={themeOrder}
              onReorderThemes={onReorderThemes}
              customThemeNames={customThemeNames}
              onThemeRename={onThemeRename}
              onSelectThemeForEditing={handleSelectForEditing}
              hasOverridesForTheme={hasOverridesForTheme}
              savedCustomThemes={savedCustomThemes}
              onDeleteCustomTheme={onDeleteCustomTheme}
              onRenameCustomTheme={onRenameCustomTheme}
            />
          )}

          {/* Display Tab */}
          {activeTab === "display" && (
            <section className="py-4">
              <h3 className="text-xs font-medium uppercase tracking-widest mb-3 opacity-50">
                Display Options
              </h3>
              <label
                className="flex items-start gap-3 rounded-xl p-3 border border-current/10 bg-current/5 cursor-pointer"
                data-testid="utf8-display-toggle-wrapper"
                style={{ minHeight: "44px" }}
              >
                <input
                  type="checkbox"
                  checked={utf8DisplayEnabled}
                  onChange={(e) => onToggleUtf8Display(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-2 border-current/30 bg-transparent accent-current"
                  data-testid="utf8-display-toggle"
                />
                <div>
                  <p className="text-sm font-medium">UTF Emoji Display</p>
                  <p className="text-xs opacity-60 mt-0.5">
                    On: show `U+...` code points. Off: show native emoji glyphs.
                  </p>
                </div>
              </label>
            </section>
          )}
          </div>
        </div>

        {/* Sticky footer with build info */}
        <div className="flex-shrink-0 border-t border-current/10 px-4 py-3">
          <p
            className="text-xs opacity-55 text-center"
            data-testid="settings-build-footer"
          >
            Build {BUILD_IDENTITY}
          </p>
        </div>
      </div>
    </>
  );
};

export default ThemeCustomizer;
