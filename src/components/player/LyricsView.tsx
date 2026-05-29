"use client";

import { useRef, useEffect, useCallback } from "react";
import { clsx } from "clsx";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
import { hapticService } from "@/services/haptics";
import { snapToNearest, createVelocityTracker } from "@/lib/gestures/GestureUtils";

/**
 * 歌词视图 — Apple Music 风格 + Phase 14 手势增强
 *
 * - 当前行大字号高亮 + 弹性缩放
 * - 已播行渐隐
 * - 惯性滚动 (inertia scrolling)
 * - 松手吸附 (seek snapping)
 * - 点击行 seek
 * - 上下毛玻璃渐变遮罩
 */
export function LyricsView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lyrics = useMusicPlayerStore((s) => s.lyrics);
  const currentLyricIndex = useMusicPlayerStore((s) => s.currentLyricIndex);
  const prevIndexRef = useRef(-1);
  const autoScrollEnabled = useRef(true);
  const autoScrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inertiaAnimRef = useRef<number | null>(null);

  // 惯性滚动状态
  const velocityTracker = useRef(createVelocityTracker(5));
  const touchStartRef = useRef({ y: 0, time: 0, scrollTop: 0 });

  const scrollToLine = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container || !autoScrollEnabled.current) return;
    const children = container.querySelectorAll("[data-lyric-line]");
    const line = children[index] as HTMLElement | undefined;
    if (line) {
      line.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  useEffect(() => {
    if (currentLyricIndex >= 0 && currentLyricIndex !== prevIndexRef.current) {
      prevIndexRef.current = currentLyricIndex;
      scrollToLine(currentLyricIndex);
    }
  }, [currentLyricIndex, scrollToLine]);

  // 触摸开始：记录起始位置，禁用自动滚动
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const firstTouch = e.touches[0];
    if (!firstTouch) return;

    // 取消惯性动画
    if (inertiaAnimRef.current) {
      cancelAnimationFrame(inertiaAnimRef.current);
      inertiaAnimRef.current = null;
    }

    touchStartRef.current = {
      y: firstTouch.clientY,
      time: Date.now(),
      scrollTop: container.scrollTop,
    };
    velocityTracker.current.reset();
    velocityTracker.current.record(firstTouch.clientY, Date.now());

    // 用户手动滚动时暂停自动跟随
    autoScrollEnabled.current = false;
    if (autoScrollTimeout.current) clearTimeout(autoScrollTimeout.current);
  }, []);

  // 触摸移动：追踪速度
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const firstTouch = e.touches[0];
    if (!firstTouch) return;
    velocityTracker.current.record(firstTouch.clientY, Date.now());
  }, []);

  // 触摸结束：惯性滚动 + 吸附
  const handleTouchEnd = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const velocity = velocityTracker.current.getVelocity();
    velocityTracker.current.reset();

    // px/ms → px/frame (60fps)
    let velPerFrame = velocity * 16.67;

    // 方向反转（手指下滑 = 内容上滚 = scrollTop 增加）
    velPerFrame = -velPerFrame;

    if (Math.abs(velPerFrame) < 0.5) {
      // 速度太小，直接吸附
      snapToNearestLine(container);
      scheduleAutoScrollReenable();
      return;
    }

    // 惯性滚动
    const friction = 0.95;
    const minVel = 0.1;

    const animate = () => {
      const el = container;
      el.scrollTop += velPerFrame;
      velPerFrame *= friction;

      if (Math.abs(velPerFrame) > minVel && el.scrollTop > 0 && el.scrollTop < el.scrollHeight - el.clientHeight) {
        inertiaAnimRef.current = requestAnimationFrame(animate);
      } else {
        // 惯性结束 → 吸附到最近歌词行
        snapToNearestLine(el);
        scheduleAutoScrollReenable();
        inertiaAnimRef.current = null;
      }
    };

    inertiaAnimRef.current = requestAnimationFrame(animate);
  }, []);

  // 吸附到最近歌词行
  const snapToNearestLine = useCallback((container: HTMLElement) => {
    const children = container.querySelectorAll("[data-lyric-line]");
    if (children.length === 0) return;

    const containerCenter = container.scrollTop + container.clientHeight / 2;
    const positions: number[] = [];
    const elements: HTMLElement[] = [];

    children.forEach((child) => {
      const el = child as HTMLElement;
      const lineCenter = el.offsetTop + el.offsetHeight / 2;
      positions.push(lineCenter);
      elements.push(el);
    });

    const targetScrollTop = snapToNearest(containerCenter, positions) - container.clientHeight / 2;

    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: "smooth",
    });

    // 触觉反馈
    const closestIdx = positions.indexOf(
      snapToNearest(containerCenter, positions),
    );
    if (closestIdx >= 0 && closestIdx !== currentLyricIndex) {
      hapticService.selection();
      // seek 到对应时间
      const line = lyrics[closestIdx];
      if (line) {
        useMusicPlayerStore.getState().seek(line.time / 1000);
      }
    }
  }, [currentLyricIndex, lyrics]);

  // 用户停止操作 3 秒后恢复自动滚动
  const scheduleAutoScrollReenable = useCallback(() => {
    if (autoScrollTimeout.current) clearTimeout(autoScrollTimeout.current);
    autoScrollTimeout.current = setTimeout(() => {
      autoScrollEnabled.current = true;
    }, 3000);
  }, []);

  // 清理
  useEffect(() => {
    return () => {
      if (inertiaAnimRef.current) cancelAnimationFrame(inertiaAnimRef.current);
      if (autoScrollTimeout.current) clearTimeout(autoScrollTimeout.current);
    };
  }, []);

  const handleLineClick = useCallback((timeMs: number) => {
    useMusicPlayerStore.getState().seek(timeMs / 1000);
    hapticService.light();
  }, []);

  if (lyrics.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-text-tertiary">暂无歌词</p>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden">
      {/* 顶部渐变遮罩 */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-16 bg-gradient-to-b from-background via-background/80 to-transparent" />

      {/* 歌词列表 */}
      <div
        ref={containerRef}
        data-scrollable
        className="h-full overflow-y-auto px-6 py-16 hide-scrollbar"
        style={{ WebkitOverflowScrolling: "touch" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="h-[42vh]" />

        {lyrics.map((line, i) => {
          const isCurrent = i === currentLyricIndex;
          const isPast = i < currentLyricIndex;

          return (
            <button
              key={`${line.time}-${i}`}
              data-lyric-line
              data-index={i}
              onClick={() => handleLineClick(line.time)}
              className={clsx(
                "block w-full py-2.5 text-left outline-none",
                "transition-all duration-500 ease-out",
                isCurrent && "translate-x-0.5",
              )}
              style={{
                transitionProperty: "transform, opacity, color, font-size, font-weight",
                transitionDuration: "500ms, 500ms, 500ms, 500ms, 500ms",
                transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <span
                className={clsx(
                  "inline-block leading-relaxed",
                  "transition-all duration-500",
                  isCurrent && "text-text-primary font-semibold text-2xl scale-105",
                  isPast && !isCurrent && "text-text-tertiary/70 text-base",
                  !isCurrent && !isPast && "text-text-secondary text-lg",
                )}
                style={{
                  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                {line.text}
              </span>
              {line.translation && (
                <span
                  className={clsx(
                    "mt-1 block transition-all duration-500",
                    isCurrent ? "text-text-secondary text-sm" : "text-text-tertiary/50 text-xs",
                  )}
                  style={{
                    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  {line.translation}
                </span>
              )}
            </button>
          );
        })}

        <div className="h-[42vh]" />
      </div>

      {/* 底部渐变遮罩 */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-16 bg-gradient-to-t from-background via-background/80 to-transparent" />
    </div>
  );
}
