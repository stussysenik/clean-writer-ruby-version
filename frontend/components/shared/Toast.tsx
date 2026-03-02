import React, { useEffect } from "react";

interface ToastProps {
  message: string;
  isVisible: boolean;
  onDismiss: () => void;
  duration?: number;
  type?: "info" | "warning" | "error" | "success";
}

const Toast: React.FC<ToastProps> = ({
  message,
  isVisible,
  onDismiss,
  duration = 3000,
  type = "warning",
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onDismiss]);

  if (!isVisible) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case "error":
        return "#ef4444";
      case "warning":
        return "#f59e0b";
      case "success":
        return "#22c55e";
      case "info":
      default:
        return "#3b82f6";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "error":
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      case "warning":
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case "success":
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        );
      case "info":
      default:
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
    }
  };

  return (
    <div
      className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
      style={{
        animation: "toastSlideIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
      role="status"
      aria-live="polite"
    >
      <div
        onClick={onDismiss}
        className="flex items-center gap-3 px-5 py-3 rounded-2xl text-white font-medium shadow-lg cursor-pointer hover:opacity-90 transition-opacity pointer-events-auto"
        style={{
          backgroundColor: getBackgroundColor(),
          boxShadow: `0 8px 32px ${getBackgroundColor()}40`,
        }}
      >
        {getIcon()}
        <span>{message}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .toast {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Toast;
