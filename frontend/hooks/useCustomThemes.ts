import { useState, useEffect, useCallback } from "react";
import { SavedCustomTheme, RisoTheme } from "@/types";

const STORAGE_KEY = "clean_writer_saved_themes_v1";
const MAX_THEMES = 20;

function generateId(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 6);
  return `custom_${ts}_${rand}`;
}

function loadSavedThemes(): SavedCustomTheme[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function useCustomThemes() {
  const [savedThemes, setSavedThemes] = useState<SavedCustomTheme[]>(loadSavedThemes);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedThemes));
    } catch {
      console.warn("Could not save custom themes");
    }
  }, [savedThemes]);

  const addTheme = useCallback(
    (name: string, theme: RisoTheme, rhymeColors?: string[]): SavedCustomTheme | null => {
      if (savedThemes.length >= MAX_THEMES) return null;
      const newTheme: SavedCustomTheme = {
        id: generateId(),
        name,
        theme: { ...theme, id: generateId(), name },
        rhymeColors,
        createdAt: Date.now(),
      };
      setSavedThemes((prev) => [...prev, newTheme]);
      return newTheme;
    },
    [savedThemes.length],
  );

  const deleteTheme = useCallback((id: string) => {
    setSavedThemes((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const renameTheme = useCallback((id: string, newName: string) => {
    setSavedThemes((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, name: newName, theme: { ...t.theme, name: newName } }
          : t,
      ),
    );
  }, []);

  const getTheme = useCallback(
    (id: string): SavedCustomTheme | undefined => {
      return savedThemes.find((t) => t.id === id);
    },
    [savedThemes],
  );

  return {
    savedThemes,
    addTheme,
    deleteTheme,
    renameTheme,
    getTheme,
  };
}

export default useCustomThemes;
