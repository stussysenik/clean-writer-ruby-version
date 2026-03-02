import { useState, useEffect } from "react";

const BLINK_MS = 530;

export function useBlinkCursor(ms = BLINK_MS): boolean {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setVisible((v) => !v), ms);
    return () => clearInterval(id);
  }, [ms]);
  return visible;
}
