"use client";

import { useCallback, useRef, useState } from "react";
import { IconPlayerPlay, IconPlayerPause, IconX } from "@tabler/icons-react";
import { useFocusStore } from "@/stores/focusStore";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
import { FocusTimer } from "./FocusTimer";

export function FocusPlayer() {
  const isActive = useFocusStore((s) => s.isActive);
  const isBlackMode = useFocusStore((s) => s.isBlackMode);
  const exit = useFocusStore((s) => s.exit);

  const currentSong = useMusicPlayerStore((s) => s.currentSong);
  const isPlaying = useMusicPlayerStore((s) => s.isPlaying);
  const togglePlay = useMusicPlayerStore((s) => s.togglePlay);

  const [showExitHint, setShowExitHint] = useState(false);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBackgroundTap = useCallback(() => {
    if (showExitHint) {
      // Second tap — exit
      exit();
      setShowExitHint(false);
    } else {
      setShowExitHint(true);
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      tapTimerRef.current = setTimeout(() => setShowExitHint(false), 2000);
    }
  }, [showExitHint, exit]);

  if (!isActive || !currentSong) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex flex-col items-center justify-center"
      style={{ backgroundColor: isBlackMode ? "#000000" : "#0a0a0a" }}
      onClick={handleBackgroundTap}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 pt-[env(safe-area-inset-top,12px)]">
        <FocusTimer />
        <button
          onClick={(e) => { e.stopPropagation(); exit(); }}
          className="text-text-tertiary/50"
        >
          <IconX size={18} />
        </button>
      </div>

      {/* Album art */}
      <div className="w-48 h-48 rounded-apple-xl overflow-hidden shadow-2xl mb-8">
        {currentSong.cover_url ? (
          <img
            src={currentSong.cover_url}
            alt={currentSong.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-white/5" />
        )}
      </div>

      {/* Song info */}
      <div className="text-center mb-8 px-8">
        <h1 className="text-lg font-medium text-text-primary truncate">{currentSong.title}</h1>
        <p className="text-sm text-text-secondary mt-1">{currentSong.artist}</p>
      </div>

      {/* Play/Pause */}
      <button
        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-text-primary transition-all active:scale-95"
      >
        {isPlaying ? <IconPlayerPause size={28} fill="currentColor" /> : <IconPlayerPlay size={28} fill="currentColor" style={{ marginLeft: 3 }} />}
      </button>

      {/* Exit hint */}
      {showExitHint && (
        <div
          className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-apple-lg bg-white/10 px-4 py-2 text-sm text-text-secondary"
          style={{ animation: "fadeIn 0.3s ease-out" }}
        >
          再次点击退出专注模式
        </div>
      )}
    </div>
  );
}
