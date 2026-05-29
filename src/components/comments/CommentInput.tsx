"use client";

import { useState, useCallback } from "react";
import { IconSend } from "@tabler/icons-react";

interface CommentInputProps {
  placeholder: string;
  onSubmit: (content: string) => void;
  compact?: boolean;
}

export function CommentInput({ placeholder, onSubmit, compact = false }: CommentInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  }, [value, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const canSubmit = value.trim().length > 0;

  return (
    <div className={`flex items-center gap-2 ${compact ? "py-2" : ""}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 rounded-full bg-white/10 px-4 py-2 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:bg-white/15"
        style={{ fontSize: "16px" }}
      />
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
          canSubmit
            ? "bg-accent-primary text-white active:scale-90"
            : "bg-white/5 text-text-tertiary"
        }`}
      >
        <IconSend size={16} />
      </button>
    </div>
  );
}
