"use client";

import { IconClock, IconX } from "@tabler/icons-react";

interface SearchHistoryProps {
  history: string[];
  onSelect: (keyword: string) => void;
  onRemove: (keyword: string) => void;
  onClear: () => void;
}

export function SearchHistory({ history, onSelect, onRemove, onClear }: SearchHistoryProps) {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconClock size={18} className="text-text-secondary" />
          <h3 className="text-sm font-medium text-text-primary">最近搜索</h3>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-text-tertiary transition-colors active:text-accent-primary"
        >
          清除全部
        </button>
      </div>
      <div className="space-y-0.5">
        {history.map((kw) => (
          <div
            key={kw}
            className="flex items-center justify-between rounded-apple-lg px-3 py-2.5 transition-all active:bg-white/5"
          >
            <button
              onClick={() => onSelect(kw)}
              className="flex-1 text-left text-sm text-text-secondary"
            >
              {kw}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(kw);
              }}
              className="flex-shrink-0 rounded-full p-1 text-text-tertiary transition-colors active:text-text-primary"
            >
              <IconX size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
