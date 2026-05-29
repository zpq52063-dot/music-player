"use client";

import { useEffect, useRef, useCallback } from "react";
import { getVisualizationAnalyzer } from "@/lib/audio/webaudio";
import { getBatteryConfig } from "@/hooks/useBatteryOptimization";
import type { VisualizationMode } from "@/types";

interface VisualizerDisplayProps {
  mode: VisualizationMode;
  /** Container class name */
  className?: string;
  /** Target FPS for iPhone Safari (default 15) */
  targetFPS?: number;
}

/**
 * Phase 18A — VisualizerDisplay
 *
 * Canvas-based audio visualization. Renders waveform, frequency bars, or beat pulse.
 * Performance-optimized for iPhone Safari: small canvas, low FPS, GPU-accelerated.
 */
export function VisualizerDisplay({ mode, className = "", targetFPS = 15 }: VisualizerDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef(0);
  const visibleRef = useRef(true);
  const pulsePhaseRef = useRef(0);

  // IntersectionObserver: pause rendering when not visible
  const ioRef = useRef<IntersectionObserver | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || mode === "off") return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const batteryConfig = getBatteryConfig();
    const isReducedMotion = batteryConfig.reducedMotion;
    const isLowPower = batteryConfig.lowPowerMode;

    // Throttle: respect battery/animation settings
    const now = performance.now();
    const effectiveFPS = isLowPower ? 8 : isReducedMotion ? 5 : targetFPS;
    const frameInterval = 1000 / effectiveFPS;

    if (now - lastFrameRef.current < frameInterval) {
      rafRef.current = requestAnimationFrame(draw);
      return;
    }
    lastFrameRef.current = now;

    const w = canvas.width;
    const h = canvas.height;
    const analyzer = getVisualizationAnalyzer();

    ctx.clearRect(0, 0, w, h);

    if (mode === "waveform") {
      drawWaveform(ctx, analyzer.getTimeData(), w, h);
    } else if (mode === "bars") {
      drawBars(ctx, analyzer.getBands(32), w, h);
    } else if (mode === "pulse") {
      pulsePhaseRef.current += frameInterval / 1000;
      const beat = analyzer.detectBeat(0.6);
      if (beat) pulsePhaseRef.current = 0;
      drawPulse(ctx, w, h, pulsePhaseRef.current, beat);
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [mode, targetFPS]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Setup canvas
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap DPR for performance
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);

    // Visibility observer
    ioRef.current = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry?.isIntersecting ?? true;
      },
      { threshold: 0.1 },
    );
    ioRef.current.observe(canvas);

    // Start rendering
    if (mode !== "off") {
      rafRef.current = requestAnimationFrame(draw);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ioRef.current?.disconnect();
    };
  }, [mode, draw]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

// ==================== Drawing Functions ====================

function drawWaveform(ctx: CanvasRenderingContext2D, data: Uint8Array, w: number, h: number): void {
  ctx.beginPath();
  ctx.strokeStyle = "rgba(255, 45, 85, 0.7)";
  ctx.lineWidth = 1.5;

  const sliceWidth = w / data.length;
  let x = 0;

  for (let i = 0; i < data.length; i++) {
    const v = (data[i] ?? 128) / 128;
    const y = (v * h) / 2;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    x += sliceWidth;
  }

  ctx.lineTo(w, h / 2);
  ctx.stroke();
}

function drawBars(ctx: CanvasRenderingContext2D, bands: number[], w: number, h: number): void {
  const barCount = bands.length;
  const barWidth = Math.max(2, w / barCount - 1);
  const gap = 1;

  for (let i = 0; i < barCount; i++) {
    const value = bands[i] ?? 0;
    const barHeight = Math.max(2, value * h);

    // Gradient from accent color based on amplitude
    const intensity = value;
    ctx.fillStyle = `rgba(255, 45, 85, ${0.3 + intensity * 0.7})`;

    const x = i * (barWidth + gap);
    const y = h - barHeight;

    // Rounded top corners
    const radius = Math.min(barWidth / 2, 2);
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.lineTo(x + barWidth - radius, y);
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
    ctx.lineTo(x + barWidth, h);
    ctx.closePath();
    ctx.fill();
  }
}

function drawPulse(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  phase: number,
  beat: boolean,
): void {
  const cx = w / 2;
  const cy = h / 2;
  const maxRadius = Math.min(w, h) * 0.4;

  // Expanding ring
  const radius = (phase % 1) * maxRadius;
  const alpha = 1 - (phase % 1);

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 45, 85, ${alpha})`;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Center dot on beat
  if (beat) {
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 45, 85, 0.9)";
    ctx.fill();
  }

  // Quiet center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.fill();
}
