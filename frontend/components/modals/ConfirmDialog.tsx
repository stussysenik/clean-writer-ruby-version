import React from "react";
import { RisoTheme } from "@/types";

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  theme: RisoTheme;
  title?: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  theme,
  title = "Start Fresh?",
  message,
  confirmLabel = "CLEAR PAGE",
  cancelLabel = "CANCEL",
}) => {
  if (!isOpen) return null;

  const defaultMessage = (
    <>
      This will wipe the page clean. <br />
      <span className="opacity-50 text-xs uppercase tracking-wider">
        This action cannot be undone.
      </span>
    </>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className="relative bg-white p-8 rounded-lg shadow-xl max-w-sm w-full border-2 transform transition-all scale-100 opacity-100"
        style={{
          borderColor: theme.accent,
          fontFamily: '"Space Mono", monospace',
          backgroundColor: theme.background,
          color: theme.text,
        }}
      >
        <h2
          className="text-xl font-bold mb-4"
          style={{ color: theme.highlight.verb }}
        >
          {title}
        </h2>
        <p className="mb-8 opacity-70 text-sm leading-relaxed">
          {message || defaultMessage}
        </p>

        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-bold opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: theme.text }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 text-sm font-bold text-white rounded shadow-sm hover:scale-105 transition-transform"
            style={{ backgroundColor: theme.highlight.verb }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
