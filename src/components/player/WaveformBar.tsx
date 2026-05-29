"use client";

import { memo, useEffect, useRef } from "react";

/**
 * Phase 14 — 动态波形条
 * 模拟音频可视化的呼吸动画，非真实 FFT 数据
 * 在 Mini Player 上显示动态波形视觉反馈
 */

function generateBars(count: number): number[] {
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    bars.push(0.3 + Math.random() * 0.7);
  }
  return bars;
}

export const WaveformBar = memo(function WaveformBar({
  isPlaying,
  barCount = 5,
  className = "",
}: {
  isPlaying: boolean;
  barCount?: number;
  className?: string;
}) {
  const barsRef = useRef(generateBars(barCount));
  const animRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      // 归零高度
      if (containerRef.current) {
        const children = containerRef.current.children;
        for (let i = 0; i < children.length; i++) {
          (children[i] as HTMLElement).style.transform = "scaleY(0.2)";
        }
      }
      return;
    }

    let frame = 0;
    const animate = () => {
      frame++;
      if (containerRef.current && frame % 8 === 0) {
        barsRef.current = generateBars(barCount);
        const children = containerRef.current.children;
        for (let i = 0; i < Math.min(children.length, barCount); i++) {
          const bar = children[i] as HTMLElement;
          bar.style.transform = `scaleY(${barsRef.current[i]})`;
        }
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, barCount]);

  return (
    <div
      ref={containerRef}
      className={`flex items-end gap-[1.5px] ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: barCount }).map((_, i) => (
        <span
          key={i}
          className="inline-block w-[2px] rounded-full bg-accent-primary/60"
          style={{
            height: "10px",
            transformOrigin: "bottom",
            transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
            transform: isPlaying ? undefined : "scaleY(0.2)",
          }}
        />
      ))}
    </div>
  );
});
