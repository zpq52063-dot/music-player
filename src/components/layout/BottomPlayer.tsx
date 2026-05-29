"use client";

import { useState, useCallback } from "react";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
import { useUIStore } from "@/stores/uiStore";
import { PlayerBar } from "@/components/player/PlayerBar";
import { PlayerFullscreen } from "@/components/player/PlayerFullscreen";
import { hapticService } from "@/services/haptics";

/**
 * 底部播放器容器 — mini player ↔ full player 共享元素过渡
 */
export function BottomPlayer() {
  const currentSong = useMusicPlayerStore((s) => s.currentSong);
  const isPlayerExpanded = useUIStore((s) => s.isPlayerExpanded);
  const expandPlayer = useUIStore((s) => s.expandPlayer);
  const setPlayerTransitioning = useUIStore((s) => s.setPlayerTransitioning);

  // 过渡动画状态
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState<"idle" | "expanding" | "collapsing">("idle");
  const [transOrigin, setTransOrigin] = useState({ x: 0, y: 0, w: 0, h: 0 });

  const handleExpand = useCallback(() => {
    hapticService.medium();
    const miniCover = document.querySelector("[data-mini-cover]");
    if (miniCover) {
      const rect = miniCover.getBoundingClientRect();
      setTransOrigin({ x: rect.left, y: rect.top, w: rect.width, h: rect.height });
    }

    setIsTransitioning(true);
    setTransitionPhase("expanding");
    setPlayerTransitioning(true);

    requestAnimationFrame(() => {
      expandPlayer();
      setTimeout(() => {
        setIsTransitioning(false);
        setTransitionPhase("idle");
        setPlayerTransitioning(false);
      }, 360);
    });
  }, [expandPlayer, setPlayerTransitioning]);

  if (!currentSong) return null;

  const targetSize = 280;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const targetLeft = (vw - targetSize) / 2;
  const targetTop = vh * 0.18;

  return (
    <>
      {/* 共享元素过渡浮层 */}
      {isTransitioning && transitionPhase === "expanding" && (
        <div className="pointer-events-none fixed inset-0 z-[55]">
          <div
            className="absolute rounded-full bg-surface-elevated shadow-2xl"
            style={{
              left: `${transOrigin.x}px`,
              top: `${transOrigin.y}px`,
              width: `${transOrigin.w}px`,
              height: `${transOrigin.h}px`,
              backgroundImage: currentSong.cover_url
                ? `url(${currentSong.cover_url})`
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
              willChange: "transform, left, top, width, height",
              transform: `translate(${targetLeft - transOrigin.x}px, ${targetTop - transOrigin.y}px) scale(${targetSize / (transOrigin.w || 56)})`,
            }}
          />
          <div className="absolute inset-0 bg-background" style={{ animation: "fadeIn 0.3s ease-out" }} />
        </div>
      )}

      {/* Fullscreen player */}
      {isPlayerExpanded && <PlayerFullscreen />}

      {/* Mini player — 过渡期淡出 */}
      <div
        className="fixed bottom-14 left-0 right-0 z-50"
        style={{
          opacity: transitionPhase === "expanding" ? 0 : 1,
          transition: "opacity 0.2s ease-out",
        }}
      >
        <div className="mx-auto max-w-md">
          <PlayerBar
            onExpand={handleExpand}
          />
        </div>
      </div>
    </>
  );
}
