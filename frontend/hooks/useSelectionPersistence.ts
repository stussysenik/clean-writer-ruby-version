import { useCallback, useEffect, useRef, useState } from "react";

interface SavedSelection {
  start: number;
  end: number;
}

interface SelectionPersistence {
  saveSelection: () => void;
  getSavedSelection: () => { start: number; end: number } | null;
  savedSelection: { start: number; end: number } | null;
  clearSelection: () => void;
}

/**
 * Hook for persisting text selection across mobile focus loss.
 *
 * On mobile devices, tapping a button causes the textarea to lose focus
 * before the click handler fires, which clears the visual selection.
 *
 * This hook captures and keeps the latest non-empty selection until it is
 * explicitly cleared (for a locked-in feel) or replaced by new user selection.
 *
 * @param textareaRef - Ref to the textarea element
 * @returns { saveSelection, getSavedSelection, clearSelection }
 */
export function useSelectionPersistence(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
): SelectionPersistence {
  const savedSelection = useRef<SavedSelection | null>(null);
  const [savedSelectionState, setSavedSelectionState] = useState<{
    start: number;
    end: number;
  } | null>(null);

  const saveCurrentSelection = useCallback(
    (textarea: HTMLTextAreaElement | null) => {
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (start !== end) {
        const next = { start, end };
        savedSelection.current = {
          start,
          end,
        };
        setSavedSelectionState(next);
        return;
      }

      // If user is actively focused in the editor and collapsed selection to a cursor,
      // treat that as intent and clear any stale persisted range.
      if (document.activeElement === textarea) {
        savedSelection.current = null;
        setSavedSelectionState(null);
      }
    },
    [],
  );

  const saveSelection = useCallback(() => {
    saveCurrentSelection(textareaRef.current);
  }, [textareaRef, saveCurrentSelection]);

  const getSavedSelection = useCallback(() => {
    const saved = savedSelection.current;
    if (!saved) return null;

    return { start: saved.start, end: saved.end };
  }, []);

  const clearSelection = useCallback(() => {
    savedSelection.current = null;
    setSavedSelectionState(null);
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleSelectionCapture = () => {
      saveCurrentSelection(textarea);
    };

    const handleDocumentSelectionChange = () => {
      const currentTextarea = textareaRef.current;
      if (!currentTextarea || document.activeElement !== currentTextarea)
        return;
      saveCurrentSelection(currentTextarea);
    };

    textarea.addEventListener("select", handleSelectionCapture);
    textarea.addEventListener("keyup", handleSelectionCapture);
    textarea.addEventListener("mouseup", handleSelectionCapture);
    textarea.addEventListener("touchend", handleSelectionCapture);
    document.addEventListener("selectionchange", handleDocumentSelectionChange);

    return () => {
      textarea.removeEventListener("select", handleSelectionCapture);
      textarea.removeEventListener("keyup", handleSelectionCapture);
      textarea.removeEventListener("mouseup", handleSelectionCapture);
      textarea.removeEventListener("touchend", handleSelectionCapture);
      document.removeEventListener(
        "selectionchange",
        handleDocumentSelectionChange,
      );
    };
  }, [textareaRef, textareaRef.current, saveCurrentSelection]);

  return {
    saveSelection,
    getSavedSelection,
    savedSelection: savedSelectionState,
    clearSelection,
  };
}

export default useSelectionPersistence;
