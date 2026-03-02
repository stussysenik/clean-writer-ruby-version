import { useState, useCallback, useRef } from "react";

interface UseIMECompositionResult {
  isComposing: boolean;
  compositionValue: string;
  handleCompositionStart: () => void;
  handleCompositionUpdate: (
    e: React.CompositionEvent<HTMLTextAreaElement>,
  ) => void;
  handleCompositionEnd: (
    e: React.CompositionEvent<HTMLTextAreaElement>,
    callback: (value: string) => void,
  ) => void;
  handleChange: (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    callback: (value: string) => void,
  ) => void;
}

/**
 * Custom hook to handle IME composition for Chinese, Japanese, Korean input
 * Prevents the "double input" bug in React controlled components
 *
 * @see https://github.com/facebook/react/issues/8683
 *
 * Supported inputs:
 * - Chinese: 你好世界 (Nǐ hǎo shìjiè)
 * - Japanese: こんにちは、ありがとう
 * - Japanese Kaomoji: (◕‿◕) ٩(◕‿◕)۶ ᕙ(⇀‸↼‶)ᕗ
 * - German: Grüße, Größe, Übung (umlauts: ä, ö, ü, ß)
 */
export function useIMEComposition(): UseIMECompositionResult {
  const [isComposing, setIsComposing] = useState(false);
  const [compositionValue, setCompositionValue] = useState("");
  const lastCompositionValueRef = useRef<string>("");

  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
    setCompositionValue("");
  }, []);

  const handleCompositionUpdate = useCallback(
    (e: React.CompositionEvent<HTMLTextAreaElement>) => {
      // Track the current composition value (in-progress text)
      setCompositionValue(e.data || "");
      lastCompositionValueRef.current = e.data || "";
    },
    [],
  );

  const handleCompositionEnd = useCallback(
    (
      e: React.CompositionEvent<HTMLTextAreaElement>,
      callback: (value: string) => void,
    ) => {
      setIsComposing(false);
      setCompositionValue("");

      // The final composed value
      const finalValue = e.data || "";

      // For some browsers/IMEs, we need to manually append the composed text
      // This handles the case where onChange fires before compositionend
      if (finalValue) {
        callback(finalValue);
      }

      lastCompositionValueRef.current = "";
    },
    [],
  );

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<HTMLTextAreaElement>,
      callback: (value: string) => void,
    ) => {
      // During IME composition, don't update state to avoid double characters
      // The final value will be set in onCompositionEnd
      if (!isComposing) {
        callback(e.target.value);
      }
    },
    [isComposing],
  );

  return {
    isComposing,
    compositionValue,
    handleCompositionStart,
    handleCompositionUpdate,
    handleCompositionEnd,
    handleChange,
  };
}

export default useIMEComposition;
