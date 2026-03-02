import { useState, useEffect, useCallback } from "react";
import { RisoTheme, HighlightConfig, SavedCustomTheme } from "@/types";
import { THEMES } from "@/constants";

const STORAGE_KEY_V1 = "clean_writer_custom_theme";
const STORAGE_KEY_V2 = "clean_writer_theme_overrides_v2";

interface ThemeOverrides {
  overrides: Partial<{
    background: string;
    text: string;
    cursor: string;
    selection: string;
    highlight: Partial<RisoTheme["highlight"]>;
  }>;
  rhymeColorOverrides?: Record<number, string>;
}

/** Per-theme override map: { "classic": { overrides: {...} }, "midnight": { overrides: {...} } } */
type OverrideMap = Record<string, ThemeOverrides>;

interface PersistedState {
  overrideMap: OverrideMap;
  wordVisibility: HighlightConfig;
}

const defaultVisibility: HighlightConfig = {
  nouns: true,
  pronouns: true,
  verbs: true,
  adjectives: true,
  adverbs: true,
  prepositions: true,
  conjunctions: true,
  articles: true,
  interjections: true,
  urls: true,
  numbers: true,
  hashtags: true,
};

/** Migrate from v1 single-theme format to v2 per-theme map */
function migrateV1(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V1);
    if (!raw) return null;
    const v1 = JSON.parse(raw);
    if (!v1 || !v1.baseThemeId) return null;

    const overrideMap: OverrideMap = {};
    if (v1.overrides && Object.keys(v1.overrides).length > 0) {
      overrideMap[v1.baseThemeId] = {
        overrides: v1.overrides,
        rhymeColorOverrides: v1.rhymeColorOverrides,
      };
    }

    const state: PersistedState = {
      overrideMap,
      wordVisibility: v1.wordVisibility || defaultVisibility,
    };

    // Write v2 and remove v1
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(state));
    localStorage.removeItem(STORAGE_KEY_V1);

    return state;
  } catch {
    return null;
  }
}

function loadPersistedState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V2);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        overrideMap: parsed.overrideMap || {},
        wordVisibility: parsed.wordVisibility || defaultVisibility,
      };
    }
  } catch {}

  // Try migrate from v1
  const migrated = migrateV1();
  if (migrated) return migrated;

  return { overrideMap: {}, wordVisibility: defaultVisibility };
}

const highlightKeys: (keyof RisoTheme["highlight"])[] = [
  "noun", "pronoun", "verb", "adjective", "adverb",
  "preposition", "conjunction", "article", "interjection",
  "url", "number", "hashtag",
];

export function useCustomTheme(baseThemeId: string, savedCustomThemes?: SavedCustomTheme[]) {
  const [state, setState] = useState<PersistedState>(loadPersistedState);

  // Resolve base theme: check presets first, then saved custom themes
  const presetTheme = THEMES.find((t) => t.id === baseThemeId);
  const customThemeEntry = !presetTheme
    ? savedCustomThemes?.find((t) => t.id === baseThemeId)
    : undefined;
  const baseTheme = presetTheme || customThemeEntry?.theme || THEMES[0];

  // Get overrides for the current theme
  const currentOverrides = state.overrideMap[baseThemeId];

  // Apply overrides to create effective theme
  const effectiveTheme: RisoTheme = currentOverrides?.overrides
    ? {
        ...baseTheme,
        background: currentOverrides.overrides.background || baseTheme.background,
        text: currentOverrides.overrides.text || baseTheme.text,
        cursor: currentOverrides.overrides.cursor || baseTheme.cursor,
        selection: currentOverrides.overrides.selection || baseTheme.selection,
        highlight: {
          ...baseTheme.highlight,
          ...currentOverrides.overrides.highlight,
        },
      }
    : baseTheme;

  const wordVisibility = state.wordVisibility;

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(state));
    } catch {
      console.warn("Could not save custom theme");
    }
  }, [state]);

  // Set a specific color
  const setColor = useCallback(
    (
      path:
        | "background"
        | "text"
        | "cursor"
        | "selection"
        | keyof RisoTheme["highlight"],
      color: string,
    ) => {
      setState((prev) => {
        const existing = prev.overrideMap[baseThemeId] || { overrides: {} };

        if (highlightKeys.includes(path as keyof RisoTheme["highlight"])) {
          return {
            ...prev,
            overrideMap: {
              ...prev.overrideMap,
              [baseThemeId]: {
                ...existing,
                overrides: {
                  ...existing.overrides,
                  highlight: {
                    ...existing.overrides?.highlight,
                    [path]: color,
                  },
                },
              },
            },
          };
        }

        return {
          ...prev,
          overrideMap: {
            ...prev.overrideMap,
            [baseThemeId]: {
              ...existing,
              overrides: {
                ...existing.overrides,
                [path]: color,
              },
            },
          },
        };
      });
    },
    [baseThemeId],
  );

  // Toggle word type visibility
  const toggleVisibility = useCallback(
    (key: keyof HighlightConfig) => {
      setState((prev) => ({
        ...prev,
        wordVisibility: {
          ...prev.wordVisibility,
          [key]: !prev.wordVisibility[key],
        },
      }));
    },
    [],
  );

  // Reset current theme to preset
  const resetToPreset = useCallback(() => {
    setState((prev) => {
      const newMap = { ...prev.overrideMap };
      delete newMap[baseThemeId];
      return { ...prev, overrideMap: newMap };
    });
  }, [baseThemeId]);

  // Reset a single color to its base theme value
  const resetColor = useCallback(
    (
      path:
        | "background"
        | "text"
        | "cursor"
        | "selection"
        | keyof RisoTheme["highlight"],
    ) => {
      setState((prev) => {
        const existing = prev.overrideMap[baseThemeId];
        if (!existing) return prev;

        if (highlightKeys.includes(path as keyof RisoTheme["highlight"])) {
          const newHighlight = { ...existing.overrides?.highlight };
          delete newHighlight[path as keyof RisoTheme["highlight"]];

          const newOverrides = {
            ...existing.overrides,
            highlight: Object.keys(newHighlight).length > 0 ? newHighlight : undefined,
          };

          // Clean up undefined highlight
          if (!newOverrides.highlight) delete newOverrides.highlight;

          // If no overrides remain, remove the theme entry entirely
          const remainingKeys = Object.keys(newOverrides).filter(
            (k) => newOverrides[k as keyof typeof newOverrides] !== undefined,
          );
          if (remainingKeys.length === 0 && !existing.rhymeColorOverrides) {
            const newMap = { ...prev.overrideMap };
            delete newMap[baseThemeId];
            return { ...prev, overrideMap: newMap };
          }

          return {
            ...prev,
            overrideMap: {
              ...prev.overrideMap,
              [baseThemeId]: { ...existing, overrides: newOverrides },
            },
          };
        }

        // Remove base color override
        const newOverrides = { ...existing.overrides };
        delete newOverrides[path as "background" | "text" | "cursor" | "selection"];

        // If no overrides remain, remove theme entry
        const hasHighlightOverrides =
          newOverrides.highlight && Object.keys(newOverrides.highlight).length > 0;
        const hasBaseOverrides = Object.keys(newOverrides).filter(
          (k) => k !== "highlight" && newOverrides[k as keyof typeof newOverrides] !== undefined,
        ).length > 0;

        if (!hasHighlightOverrides && !hasBaseOverrides && !existing.rhymeColorOverrides) {
          const newMap = { ...prev.overrideMap };
          delete newMap[baseThemeId];
          return { ...prev, overrideMap: newMap };
        }

        return {
          ...prev,
          overrideMap: {
            ...prev.overrideMap,
            [baseThemeId]: { ...existing, overrides: newOverrides },
          },
        };
      });
    },
    [baseThemeId],
  );

  // Check if a specific color has been customized
  const isColorCustomized = useCallback(
    (
      path:
        | "background"
        | "text"
        | "cursor"
        | "selection"
        | keyof RisoTheme["highlight"],
    ): boolean => {
      const entry = state.overrideMap[baseThemeId];
      if (!entry) return false;

      if (highlightKeys.includes(path as keyof RisoTheme["highlight"])) {
        return (
          entry.overrides?.highlight?.[path as keyof RisoTheme["highlight"]] !== undefined
        );
      }

      return (
        entry.overrides?.[path as "background" | "text" | "cursor" | "selection"] !== undefined
      );
    },
    [state, baseThemeId],
  );

  // Rhyme color overrides
  const rhymeColorOverrides = currentOverrides?.rhymeColorOverrides;

  const setRhymeColor = useCallback(
    (index: number, color: string) => {
      setState((prev) => {
        const existing = prev.overrideMap[baseThemeId] || { overrides: {} };
        return {
          ...prev,
          overrideMap: {
            ...prev.overrideMap,
            [baseThemeId]: {
              ...existing,
              rhymeColorOverrides: {
                ...existing.rhymeColorOverrides,
                [index]: color,
              },
            },
          },
        };
      });
    },
    [baseThemeId],
  );

  const resetRhymeColor = useCallback(
    (index: number) => {
      setState((prev) => {
        const existing = prev.overrideMap[baseThemeId];
        if (!existing) return prev;
        const newOverrides = { ...existing.rhymeColorOverrides };
        delete newOverrides[index];
        const hasRhymeOverrides = Object.keys(newOverrides).length > 0;
        return {
          ...prev,
          overrideMap: {
            ...prev.overrideMap,
            [baseThemeId]: {
              ...existing,
              rhymeColorOverrides: hasRhymeOverrides ? newOverrides : undefined,
            },
          },
        };
      });
    },
    [baseThemeId],
  );

  const isRhymeColorCustomized = useCallback(
    (index: number): boolean => {
      return state.overrideMap[baseThemeId]?.rhymeColorOverrides?.[index] !== undefined;
    },
    [state, baseThemeId],
  );

  // Check if current theme has customizations
  const hasCustomizations = !!state.overrideMap[baseThemeId];

  // Check if ANY theme has overrides (for badge display)
  const hasOverridesForTheme = useCallback(
    (id: string): boolean => {
      const entry = state.overrideMap[id];
      if (!entry) return false;
      const hasColorOverrides =
        entry.overrides && Object.keys(entry.overrides).length > 0;
      const hasHighlight =
        entry.overrides?.highlight && Object.keys(entry.overrides.highlight).length > 0;
      const hasRhyme =
        entry.rhymeColorOverrides && Object.keys(entry.rhymeColorOverrides).length > 0;
      return !!(hasColorOverrides || hasHighlight || hasRhyme);
    },
    [state],
  );

  return {
    effectiveTheme,
    wordVisibility,
    hasCustomizations,
    setColor,
    toggleVisibility,
    resetToPreset,
    resetColor,
    isColorCustomized,
    rhymeColorOverrides,
    setRhymeColor,
    resetRhymeColor,
    isRhymeColorCustomized,
    hasOverridesForTheme,
  };
}

export default useCustomTheme;
