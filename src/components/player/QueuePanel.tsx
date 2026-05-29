"use client";

import { useCallback, useRef, useState } from "react";
import {
  IconX,
  IconTrash,
  IconGripVertical,
  IconChevronUp,
  IconChevronDown,
  IconHistory,
  IconPlayerPlay,
  IconRepeat,
  IconRepeatOnce,
  IconArrowsShuffle,
} from "@tabler/icons-react";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
import { useUIStore } from "@/stores/uiStore";
import { clsx } from "clsx";
import { hapticService } from "@/services/haptics";
import {
  rubberBand,
  createVelocityTracker,
  shouldDismiss,
} from "@/lib/gestures/GestureUtils";

const modeIcons = {
  sequential: IconRepeat,
  repeat: IconRepeat,
  "repeat-one": IconRepeatOnce,
  shuffle: IconArrowsShuffle,
} as const;

const modeLabels = {
  sequential: "顺序播放",
  repeat: "列表循环",
  "repeat-one": "单曲循环",
  shuffle: "随机播放",
} as const;

const DISMISS_DISTANCE = 100;
const DISMISS_VELOCITY = 0.4;
const RUBBER_LIMIT = 60;

export function QueuePanel() {
  const queue = useMusicPlayerStore((s) => s.queue);
  const queueIndex = useMusicPlayerStore((s) => s.queueIndex);
  const playMode = useMusicPlayerStore((s) => s.playMode);
  const playHistory = useMusicPlayerStore((s) => s.playHistory);
  const autoContinue = useMusicPlayerStore((s) => s.autoContinue);
  const closeQueuePanel = useUIStore((s) => s.closeQueuePanel);

  // ==================== Swipe-down dismiss ====================
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const dragStartRef = useRef(0);
  const velocityTracker = useRef(createVelocityTracker());

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    const firstTouch = e.touches[0];
    if (!firstTouch) return;
    // 只在拖拽手柄或顶部区域响应
    if (!target.closest("[data-drag-handle]") && !target.closest("[data-drag-area]")) return;

    dragStartRef.current = firstTouch.clientY;
    velocityTracker.current.reset();
    velocityTracker.current.record(firstTouch.clientY, Date.now());
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      const firstTouch = e.touches[0];
      if (!firstTouch) return;
      const rawDelta = firstTouch.clientY - dragStartRef.current;
      velocityTracker.current.record(firstTouch.clientY, Date.now());

      if (rawDelta < 0) {
        setDragY(0);
        return;
      }

      setDragY(rubberBand(rawDelta, RUBBER_LIMIT));
    },
    [isDragging],
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const velocity = velocityTracker.current.getVelocity();
    velocityTracker.current.reset();

    if (shouldDismiss(dragY, velocity, DISMISS_VELOCITY, DISMISS_DISTANCE)) {
      hapticService.medium();
      setIsDismissing(true);
      setDragY(window.innerHeight);
      setTimeout(() => {
        closeQueuePanel();
        setDragY(0);
        setIsDismissing(false);
      }, 350);
    } else {
      hapticService.light();
      setDragY(0);
    }
  }, [isDragging, dragY, closeQueuePanel]);

  const handlePlay = useCallback((index: number) => {
    const song = useMusicPlayerStore.getState().queue[index];
    if (song) {
      useMusicPlayerStore.getState().play(song);
    }
  }, []);

  const handleRemove = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    useMusicPlayerStore.getState().removeFromQueue(index);
    hapticService.selection();
  }, []);

  const handleMoveUp = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    useMusicPlayerStore.getState().reorderQueue(index, index - 1);
    hapticService.selection();
  }, []);

  const handleMoveDown = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    useMusicPlayerStore.getState().reorderQueue(index, index + 1);
    hapticService.selection();
  }, []);

  const handleClear = useCallback(() => {
    useMusicPlayerStore.getState().clearQueue();
    hapticService.warning();
    closeQueuePanel();
  }, [closeQueuePanel]);

  const handleCycleMode = useCallback(() => {
    useMusicPlayerStore.getState().cycleMode();
    hapticService.light();
  }, []);

  const handleAutoContinue = useCallback(() => {
    useMusicPlayerStore.getState().setAutoContinue(!autoContinue);
  }, [autoContinue]);

  const dragProgress = Math.min(dragY / DISMISS_DISTANCE, 1);

  const ModeIcon = modeIcons[playMode];

  return (
    <div
      className="fixed inset-0 z-[55] flex flex-col bg-background"
      style={{
        animation: isDismissing ? undefined : "slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: dragY > 0 ? `translateY(${dragY}px)` : "translateY(0)",
        opacity: isDismissing ? 0 : 1 - dragProgress * 0.3,
        transition: isDismissing
          ? "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease-out"
          : isDragging
            ? "none"
            : "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 拖拽手柄 */}
      <div
        data-drag-handle
        className="flex justify-center pt-2 pb-1"
      >
        <div className="h-1 w-10 rounded-full bg-text-tertiary/30" />
      </div>

      {/* Header */}
      <div data-drag-area className="flex items-center justify-between px-4 py-3">
        <button
          onClick={closeQueuePanel}
          className="rounded-full p-1.5 text-text-tertiary active:scale-90 transition-transform"
        >
          <IconX size={22} />
        </button>
        <h2 className="text-base font-semibold text-text-primary">播放列表</h2>
        <div className="flex items-center gap-1">
          <span className="text-xs text-text-tertiary">{queue.length} 首</span>
        </div>
      </div>

      {/* Mode + Continue toggles */}
      <div className="flex items-center gap-3 px-4 pb-3">
        <button
          onClick={handleCycleMode}
          className="flex items-center gap-1.5 rounded-full bg-surface-highlight px-3 py-1.5 text-xs text-text-secondary active:scale-95 transition-transform"
        >
          <ModeIcon size={14} />
          <span>{modeLabels[playMode]}</span>
        </button>
        <button
          onClick={handleAutoContinue}
          className={clsx(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs active:scale-95 transition-all",
            autoContinue
              ? "bg-accent-primary/15 text-accent-primary"
              : "bg-surface-highlight text-text-tertiary",
          )}
        >
          {autoContinue ? "自动续播: 开" : "自动续播: 关"}
        </button>
      </div>

      {/* Queue list */}
      <div className="flex-1 overflow-y-auto px-4">
        {queue.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-text-tertiary">播放列表为空</p>
          </div>
        ) : (
          <div className="space-y-1">
            {queue.map((song, i) => {
              const isCurrent = i === queueIndex;
              return (
                <div
                  key={`${song.id}-${i}`}
                  className={clsx(
                    "flex items-center gap-3 rounded-apple-lg px-3 py-2 transition-colors active:bg-surface-highlight",
                    isCurrent
                      ? "bg-accent-primary/10"
                      : "hover:bg-surface-highlight/50",
                  )}
                >
                  <div className="flex shrink-0 flex-col items-center gap-0.5">
                    <button
                      onClick={(e) => handleMoveUp(i, e)}
                      disabled={i === 0}
                      className="text-text-tertiary disabled:opacity-20 active:text-text-primary"
                    >
                      <IconChevronUp size={12} />
                    </button>
                    <IconGripVertical size={12} className="text-text-tertiary/40" />
                    <button
                      onClick={(e) => handleMoveDown(i, e)}
                      disabled={i === queue.length - 1}
                      className="text-text-tertiary disabled:opacity-20 active:text-text-primary"
                    >
                      <IconChevronDown size={12} />
                    </button>
                  </div>

                  <button
                    onClick={() => handlePlay(i)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p
                      className={clsx(
                        "text-truncate text-sm",
                        isCurrent ? "font-semibold text-accent-primary" : "text-text-primary",
                      )}
                    >
                      {song.title}
                    </p>
                    <p className="text-truncate text-xs text-text-tertiary">{song.artist}</p>
                  </button>

                  <button
                    onClick={(e) => handleRemove(i, e)}
                    className="shrink-0 rounded-full p-1 text-text-tertiary/60 active:text-red-400 active:scale-90 transition-all"
                  >
                    <IconTrash size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Play history */}
        {playHistory.length > 0 && (
          <div className="mt-6 mb-4">
            <div className="mb-2 flex items-center gap-2">
              <IconHistory size={14} className="text-text-tertiary" />
              <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                最近播放
              </h3>
            </div>
            <div className="space-y-1">
              {playHistory.slice(0, 10).map((song) => (
                <button
                  key={`hist-${song.id}`}
                  onClick={() => {
                    useMusicPlayerStore.getState().play(song);
                    closeQueuePanel();
                  }}
                  className="flex w-full items-center gap-3 rounded-apple-lg px-3 py-2 text-left active:bg-surface-highlight transition-colors"
                >
                  <IconPlayerPlay size={12} className="shrink-0 text-text-tertiary/50" />
                  <div className="min-w-0 flex-1">
                    <p className="text-truncate text-sm text-text-secondary">{song.title}</p>
                    <p className="text-truncate text-xs text-text-tertiary/60">{song.artist}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      {queue.length > 0 && (
        <div className="px-4 py-3 pb-[env(safe-area-inset-bottom,8px)]">
          <button
            onClick={handleClear}
            className="flex w-full items-center justify-center gap-2 rounded-apple-lg bg-red-500/10 py-3 text-sm font-medium text-red-400 active:scale-[0.97] active:bg-red-500/20 transition-all"
          >
            <IconTrash size={16} />
            清空播放列表
          </button>
        </div>
      )}
    </div>
  );
}
