"use client";

import { IconFlame } from "@tabler/icons-react";

interface HotKeywordsProps {
  keywords: string[];
  onSelect: (keyword: string) => void;
}

export function HotKeywords({ keywords, onSelect }: HotKeywordsProps) {
  if (keywords.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-text-tertiary">
        <IconFlame size={32} stroke={1} />
        <p className="text-sm">热门搜索加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <IconFlame size={18} className="text-accent-primary" />
        <h3 className="text-sm font-medium text-text-primary">热门搜索</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {keywords.map((kw) => (
          <button
            key={kw}
            onClick={() => onSelect(kw)}
            className="rounded-apple-lg bg-white/8 px-3.5 py-2 text-sm text-text-secondary transition-all active:scale-95 active:bg-white/12"
          >
            {kw}
          </button>
        ))}
      </div>
    </div>
  );
}
