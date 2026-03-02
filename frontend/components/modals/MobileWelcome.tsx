import React, { useEffect, useRef } from "react";
import { RisoTheme } from "@/types";
import TouchButton from "@/components/shared/TouchButton";

interface MobileWelcomeProps {
  theme: RisoTheme;
  onDismiss: () => void;
}

const MobileWelcome: React.FC<MobileWelcomeProps> = ({ theme, onDismiss }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, 8000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onDismiss]);

  return (
    <div
      className="fixed bottom-[80px] left-4 right-4 z-[90] rounded-2xl p-5 shadow-xl"
      style={{
        backgroundColor: `${theme.background}f0`,
        border: `1px solid ${theme.text}15`,
        color: theme.text,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        maxWidth: 360,
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <h3
        className="text-sm font-bold mb-3"
        style={{ color: theme.accent }}
      >
        Welcome to Clean Writer
      </h3>
      <ul className="space-y-2 text-xs opacity-70">
        <li className="flex gap-2">
          <span style={{ color: theme.accent }}>~</span>
          <span>Your writing stays on this device — nothing is sent to the cloud</span>
        </li>
        <li className="flex gap-2">
          <span style={{ color: theme.accent }}>~</span>
          <span>Select text + tap strikethrough to mark for deletion</span>
        </li>
        <li className="flex gap-2">
          <span style={{ color: theme.accent }}>?</span>
          <span>Tap <strong>?</strong> for tips and shortcuts</span>
        </li>
      </ul>
      <TouchButton
        onClick={onDismiss}
        className="mt-4 w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
        style={{
          backgroundColor: `${theme.accent}20`,
          color: theme.accent,
          border: `1px solid ${theme.accent}30`,
        }}
      >
        Got it
      </TouchButton>
    </div>
  );
};

export default MobileWelcome;
