"use client";

import { IconSearch } from "@tabler/icons-react";
import { useUIStore } from "@/stores";

export function SearchBar() {
  const toggleSearch = useUIStore((s) => s.toggleSearch);

  return (
    <button
      onClick={toggleSearch}
      className="glass flex w-full items-center gap-3 rounded-apple-xl px-4 py-3 text-text-secondary transition-all active:scale-[0.98]"
    >
      <IconSearch size={18} />
      <span className="text-sm">搜索歌曲、歌单...</span>
    </button>
  );
}
