import React from "react";
import { RisoTheme } from "@/types";

interface WordCountProps {
  count: number;
  theme: RisoTheme;
}

const WordCount: React.FC<WordCountProps> = ({ count, theme }) => {
  return (
    <div
      className="px-3 py-1 md:px-4 md:py-2 flex-shrink-0"
      role="status"
      aria-live="polite"
    >
      <span
        className="text-xl md:text-3xl font-bold font-mono tracking-tighter"
        style={{ color: theme.text }}
      >
        {count}
      </span>
      <span className="text-[10px] md:text-xs uppercase tracking-widest ml-2 opacity-50">
        words
      </span>
    </div>
  );
};

export default WordCount;
