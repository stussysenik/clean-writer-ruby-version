import React, { useState, useRef, useEffect } from "react";
import { RisoTheme } from "@/types";
import TouchButton from "@/components/shared/TouchButton";

interface SaveThemeFormProps {
  theme: RisoTheme;
  defaultName: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}

const SaveThemeForm: React.FC<SaveThemeFormProps> = ({
  theme,
  defaultName,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(defaultName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onSave(trimmed);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl p-3 border"
      style={{
        borderColor: `${theme.text}15`,
        backgroundColor: `${theme.text}05`,
      }}
    >
      <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] opacity-40 mb-1.5">
        Theme Name
      </label>
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={40}
        className="w-full bg-transparent border-b text-sm font-medium outline-none px-0 py-1.5 mb-3"
        style={{
          color: theme.text,
          borderColor: `${theme.text}30`,
        }}
        placeholder="My Custom Theme"
      />
      <div className="flex justify-end gap-2">
        <TouchButton
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-xs font-medium opacity-60 hover:opacity-100 transition-all"
          style={{ minHeight: "36px" }}
        >
          Cancel
        </TouchButton>
        <TouchButton
          onClick={() => {
            const trimmed = name.trim();
            if (trimmed) onSave(trimmed);
          }}
          disabled={!name.trim()}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            name.trim()
              ? "hover:opacity-90"
              : "opacity-40 cursor-not-allowed"
          }`}
          style={{
            backgroundColor: theme.accent,
            color: theme.background,
            minHeight: "36px",
          }}
        >
          Save Theme
        </TouchButton>
      </div>
    </form>
  );
};

export default SaveThemeForm;
