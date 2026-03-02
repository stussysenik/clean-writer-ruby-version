import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { RisoTheme } from "@/types";
import { useBlinkCursor } from "@/hooks/useBlinkCursor";

interface MarkdownPreviewProps {
  content: string;
  theme: RisoTheme;
  onBackToEdit?: () => void;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content,
  theme,
  onBackToEdit,
}) => {
  const cursorVisible = useBlinkCursor();

  return (
    <div
      className="w-full h-full p-12 overflow-y-auto prose max-w-none"
      style={{
        color: theme.text,
        fontFamily: '"Space Mono", monospace',
      }}
    >
      <style>{`
        .prose h1, .prose h2, .prose h3, .prose h4 { color: inherit; }
        .prose a { color: inherit; text-decoration: underline; }
        .prose strong { color: inherit; }
        .prose em { color: inherit; }
        .prose del { color: inherit; opacity: 0.5; text-decoration: line-through; text-decoration-thickness: 2px; }
        .prose blockquote { border-left-color: ${theme.text}40; color: inherit; }
      `}</style>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content || "*Nothing here yet...*"}
      </ReactMarkdown>
      <span
        data-testid="preview-cursor"
        style={{
          display: "inline-block",
          width: "10px",
          height: "1em",
          backgroundColor: theme.cursor,
          opacity: cursorVisible ? 1 : 0,
          verticalAlign: "text-bottom",
        }}
      />

      {onBackToEdit && (
        <div className="mt-16 mb-8 flex justify-center">
          <button
            onClick={onBackToEdit}
            className="liquid-glass px-6 py-3 text-sm font-medium uppercase tracking-widest transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              color: theme.text,
              border: `1px solid ${theme.text}20`,
            }}
          >
            ← Back to editing
          </button>
        </div>
      )}
    </div>
  );
};

export default MarkdownPreview;
