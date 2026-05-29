"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import {
  IconChevronDown,
  IconList,
  IconCloudDownload,
  IconMoon,
  IconFocus2,
} from "@tabler/icons-react";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
import { useUIStore } from "@/stores";
import { useSettingsStore } from "@/stores/settingsStore";
import { useDominantColor } from "@/hooks/useDominantColor";
import { AlbumCover } from "./AlbumCover";
import { PlayerControls } from "./PlayerControls";
import { ProgressBar } from "./ProgressBar";
import { LyricsView } from "./LyricsView";
import { VolumeSlider } from "./VolumeSlider";
import { QueuePanel } from "./QueuePanel";
import { VisualizerDisplay } from "./VisualizerDisplay";
import { IconButton } from "@/components/ui/IconButton";
import { SleepTimerPanel } from "./SleepTimerPanel";
import { useFocusStore } from "@/stores/focusStore";
import { hapticService } from "@/services/haptics";
import {
  rubberBand,
  createVelocityTracker,
  shouldDismiss,
} from "@/lib/gestures/GestureUtils";
import type { PlayMode } from "@/types";

const DISMISS_VELOCITY_THRESHOLD = 0.5; // px/ms
const DISMISS_DISTANCE_THRESHOLD = 120; // px
const RUBBER_BAND_LIMIT = 80;

export function PlayerFullscreen() {
  const currentSong = useMusicPlayerStore((s) => s.currentSong);
  const isPlaying = useMusicPlayerStore((s) => s.isPlaying);
  const loadingState = useMusicPlayerStore((s) => s.loadingState);
  const currentTime = useMusicPlayerStore((s) => s.currentTime);
  const duration = useMusicPlayerStore((s) => s.duration);
  const volume = useMusicPlayerStore((s) => s.volume);
  const isMuted = useMusicPlayerStore((s) => s.isMuted);
  const playMode = useMusicPlayerStore((s) => s.playMode);
  const lyrics = useMusicPlayerStore((s) => s.lyrics);

  const collapsePlayer = useUIStore((s) => s.collapsePlayer);
  const isQueuePanelOpen = useUIStore((s) => s.isQueuePanelOpen);
  const toggleQueuePanel = useUIStore((s) => s.toggleQueuePanel);

  const dominantColor = useDominantColor(currentSong?.cover_url);

  // ==================== Swipe-down dismiss gesture ====================
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const dragStartRef = useRef(0);
  const velocityTracker = useRef(createVelocityTracker());

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const target = e.target as HTMLElement;

      if (target.closest("[data-scrollable]")) return;
      if (target.closest("[data-no-swipe]")) return;

      dragStartRef.current = touch.clientY;
      velocityTracker.current.reset();
      velocityTracker.current.record(touch.clientY, Date.now());
      setIsDragging(true);
    },
    [],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      if (!touch) return;
      const rawDelta = touch.clientY - dragStartRef.current;

      velocityTracker.current.record(touch.clientY, Date.now());

      // 只允许向下拉
      if (rawDelta < 0) {
        setDragY(0);
        return;
      }

      const damped = rubberBand(rawDelta, RUBBER_BAND_LIMIT);
      setDragY(damped);
    },
    [isDragging],
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const velocity = velocityTracker.current.getVelocity();
    velocityTracker.current.reset();

    if (shouldDismiss(dragY, velocity, DISMISS_VELOCITY_THRESHOLD, DISMISS_DISTANCE_THRESHOLD)) {
      hapticService.medium();
      setIsDismissing(true);
      const vh = window.innerHeight;
      setDragY(vh);
      setTimeout(() => {
        collapsePlayer();
        setDragY(0);
        setIsDismissing(false);
      }, 350);
    } else {
      // 弹回
      hapticService.light();
      setDragY(0);
    }
  }, [isDragging, dragY, collapsePlayer]);

  // 清理
  useEffect(() => {
    return () => {
      velocityTracker.current.reset();
    };
  }, []);

  const modeForControls: PlayMode = playMode;

  const handleTogglePlay = useCallback(() => {
    useMusicPlayerStore.getState().togglePlay();
  }, []);

  const handleNext = useCallback(() => {
    useMusicPlayerStore.getState().next();
  }, []);

  const handlePrev = useCallback(() => {
    useMusicPlayerStore.getState().prev();
  }, []);

  const handleSeek = useCallback((time: number) => {
    useMusicPlayerStore.getState().seek(time);
  }, []);

  const handleCycleMode = useCallback(() => {
    useMusicPlayerStore.getState().cycleMode();
  }, []);

  const handleVolumeChange = useCallback((vol: number) => {
    useMusicPlayerStore.getState().setVolume(vol);
  }, []);

  const handleToggleMute = useCallback(() => {
    useMusicPlayerStore.getState().toggleMute();
  }, []);

  const showLyrics = lyrics.length > 0;
  const visualizationMode = useSettingsStore((s) => s.visualizationMode);

  // 拖动时的透明度和缩放
  const dragProgress = Math.min(dragY / DISMISS_DISTANCE_THRESHOLD, 1);
  const dragOpacity = 1 - dragProgress * 0.5;
  const dragScale = 1 - dragProgress * 0.08;

  if (!currentSong) return null;

  return (
    <>
      <div
        ref={containerRef}
        className="fixed inset-0 z-50 overflow-hidden"
        style={{
          animation: isDismissing ? undefined : "fadeIn 0.25s ease-out",
          backgroundColor: dominantColor ? dominantColor : "#0a0a0a",
          transition: isDismissing
            ? "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)"
            : isDragging
              ? "none"
              : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          transform: dragY > 0 ? `translateY(${dragY}px)` : "translateY(0)",
          opacity: isDismissing ? 0 : 1,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 模糊封面背景 */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-110"
          style={{
            backgroundImage: currentSong.cover_url
              ? `url(${currentSong.cover_url})`
              : undefined,
          }}
        />
        {/* 渐变覆盖 */}
        <div
          className="absolute inset-0"
          style={{
            background: dominantColor
              ? `linear-gradient(to bottom, ${dominantColor}66 0%, transparent 50%, #0a0a0a 100%)`
              : "linear-gradient(to bottom, transparent 0%, #0a0a0a 100%)",
          }}
        />
        <div className="absolute inset-0 bg-black/40" />

        {/* 内容 */}
        <div
          className="relative z-10 flex h-full flex-col"
          style={{
            opacity: dragOpacity,
            transform: `scale(${dragScale})`,
            transition: isDragging
              ? "none"
              : "opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* 顶部栏 + 下拉指示器 */}
          <div className="flex items-center justify-between px-4 py-3 pt-[env(safe-area-inset-top,12px)]">
            <IconButton onClick={collapsePlayer}>
              <IconChevronDown size={22} />
            </IconButton>
            <div className="text-center">
              <p className="text-xs text-text-secondary/60 uppercase tracking-wide">
                正在播放
              </p>
              <p className="text-sm font-medium text-text-secondary">
                {currentSong.album || "未知专辑"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <IconButton onClick={() => setShowSleepTimer(!showSleepTimer)}>
                <IconMoon size={20} />
              </IconButton>
              <IconButton onClick={() => useFocusStore.getState().enter()}>
                <IconFocus2 size={20} />
              </IconButton>
              <IconButton onClick={toggleQueuePanel}>
                <IconList size={20} />
              </IconButton>
            </div>
          </div>

          {/* 中间区域 */}
          <div className="flex-1 flex items-center justify-center px-8">
            {showLyrics ? (
              <div className="h-full w-full py-4">
                <LyricsView />
              </div>
            ) : (
              <div className="w-full max-w-[280px]">
                <AlbumCover
                  src={currentSong.cover_url}
                  alt={currentSong.title}
                  size="xl"
                  isPlaying={isPlaying}
                />
                <div className="mt-8 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h1 className="text-truncate text-xl font-semibold text-text-primary">
                      {currentSong.title}
                    </h1>
                    <p className="text-truncate text-sm text-text-secondary">
                      {currentSong.artist}
                    </p>
                  </div>
                  <div className="ml-4 flex gap-1">
                    <IconButton size="sm">
                      <IconCloudDownload size={16} />
                    </IconButton>
                    <IconButton size="sm" onClick={toggleQueuePanel}>
                      <IconList size={16} />
                    </IconButton>
                  </div>
                </div>
                {/* Phase 18A — Audio Visualization (below cover art when no lyrics) */}
                {visualizationMode !== "off" && (
                  <div className="mt-4">
                    <VisualizerDisplay
                      mode={visualizationMode}
                      className="h-12 w-full rounded-lg overflow-hidden"
                      targetFPS={15}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 底部控制区 */}
          <div data-no-swipe className="px-6 pb-8 pb-[env(safe-area-inset-bottom,8px)] space-y-4">
            <div className="space-y-1">
              <ProgressBar
                currentTime={currentTime}
                duration={duration}
                onSeek={handleSeek}
              />
              {loadingState === "loading" && (
                <div className="flex items-center justify-center">
                  <div className="h-1 w-16 animate-pulse-glow rounded-full bg-text-tertiary/30" />
                </div>
              )}
            </div>

            <PlayerControls
              isPlaying={isPlaying}
              isLoading={loadingState === "loading"}
              mode={modeForControls}
              canPlay
              onTogglePlay={handleTogglePlay}
              onNext={handleNext}
              onPrev={handlePrev}
              onCycleMode={handleCycleMode}
              size="lg"
            />

            <VolumeSlider
              volume={volume}
              isMuted={isMuted}
              onVolumeChange={handleVolumeChange}
              onToggleMute={handleToggleMute}
            />
          </div>
        </div>
      </div>

      {showSleepTimer && <SleepTimerPanel />}
      {isQueuePanelOpen && <QueuePanel />}
    </>
  );
}
