import React from "react";
import { RisoTheme } from "@/types";
import TouchButton from "@/components/shared/TouchButton";
import Kbd from "@/components/shared/Kbd";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: RisoTheme;
  isMac: boolean;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, theme, isMac }) => {
  if (!isOpen) return null;

  const cmdKey = isMac ? "\u2318" : "Ctrl";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-current/50 z-[100]"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md max-h-[80vh] overflow-y-auto z-[101] liquid-glass p-6 md:p-8"
        style={{
          backgroundColor: `${theme.background}f5`,
          color: theme.text,
          border: `1px solid ${theme.text}20`,
          boxShadow: `0 20px 60px ${theme.text}30`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Quick Guide</h2>
          <TouchButton
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-current/10 transition-colors"
            title="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </TouchButton>
        </div>

        {/* Shortcuts */}
        <section className="mb-5">
          <h3 className="text-sm font-bold uppercase tracking-wider opacity-50 mb-3">
            Shortcuts
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-1.5 border-b border-current/10">
              <span className="opacity-70">Strikethrough</span>
              <Kbd theme={theme}>{cmdKey}+Shift+X</Kbd>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-current/10">
              <span className="opacity-70">Clean struck text</span>
              <Kbd theme={theme}>{cmdKey}+Shift+K</Kbd>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-current/10">
              <span className="opacity-70">Preview</span>
              <Kbd theme={theme}>{cmdKey}+Shift+P</Kbd>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="opacity-70">Toggle word types</span>
              <Kbd theme={theme}>1-9</Kbd>
            </div>
          </div>
        </section>

        {/* Mobile */}
        <section className="mb-5">
          <h3 className="text-sm font-bold uppercase tracking-wider opacity-50 mb-3">
            Mobile
          </h3>
          <ul className="space-y-1.5 text-sm opacity-70">
            <li>Select text + tap strikethrough to mark, then "Clean" to remove</li>
            <li>Tap a color dot to switch themes, swipe to cycle</li>
            <li>Open Settings to reorder, hide, or customize themes</li>
          </ul>
        </section>

        {/* Privacy */}
        <p className="text-xs opacity-50 text-center">
          Your work stays in your browser — nothing leaves this device.
        </p>
      </div>
    </>
  );
};

export default HelpModal;
