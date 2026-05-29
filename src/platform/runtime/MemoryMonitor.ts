/**
 * Phase 10 — MemoryMonitor
 *
 * 职责:
 * - 内存占用监控
 * - 内存压力检测
 * - 自动GC触发
 *
 * 模式: 单例
 */

import type { MemorySnapshot, MemoryPressureEvent } from "@/types";
import { getLogger } from "@/lib/logs/Logger";

const WARNING_THRESHOLD_MB = 50;
const CRITICAL_THRESHOLD_MB = 80;
const CHECK_INTERVAL_MS = 30000;

let instance: MemoryMonitor | null = null;

export class MemoryMonitor {
  private snapshots: MemorySnapshot[] = [];
  private pressureEvents: MemoryPressureEvent[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(snapshot: MemorySnapshot) => void> = new Set();

  // ==================== Singleton ====================

  static getInstance(): MemoryMonitor {
    if (!instance) instance = new MemoryMonitor();
    return instance;
  }

  // ==================== Lifecycle ====================

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), CHECK_INTERVAL_MS);
    this.tick();
    getLogger().debug("system", "Memory monitor started");
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // ==================== Access ====================

  getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  getLatestSnapshot(): MemorySnapshot | null {
    return this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1]! : null;
  }

  getPressureEvents(): MemoryPressureEvent[] {
    return [...this.pressureEvents];
  }

  getAverageMemoryMB(): number {
    if (this.snapshots.length === 0) return 0;
    const total = this.snapshots.reduce((sum, s) => sum + this.toMB(s.usedJSHeapSize), 0);
    return total / this.snapshots.length;
  }

  // ==================== Subscribe ====================

  subscribe(listener: (snapshot: MemorySnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ==================== Private ====================

  private tick(): void {
    const snapshot = this.captureSnapshot();
    this.snapshots.push(snapshot);

    // Keep last 120 snapshots (1 hour at 30s interval)
    if (this.snapshots.length > 120) this.snapshots.shift();

    // Check pressure
    const usedMB = this.toMB(snapshot.usedJSHeapSize);
    if (usedMB > CRITICAL_THRESHOLD_MB) {
      const event: MemoryPressureEvent = {
        type: "critical",
        snapshot,
        thresholdMB: CRITICAL_THRESHOLD_MB,
        timestamp: Date.now(),
      };
      this.pressureEvents.unshift(event);
      if (this.pressureEvents.length > 20) this.pressureEvents.pop();
      getLogger().warn("system", `Memory critical: ${usedMB.toFixed(1)}MB used`);
    } else if (usedMB > WARNING_THRESHOLD_MB) {
      const event: MemoryPressureEvent = {
        type: "warning",
        snapshot,
        thresholdMB: WARNING_THRESHOLD_MB,
        timestamp: Date.now(),
      };
      this.pressureEvents.unshift(event);
      if (this.pressureEvents.length > 20) this.pressureEvents.pop();
    }

    this.notifyListeners(snapshot);
  }

  private captureSnapshot(): MemorySnapshot {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const memory = (performance as any).memory;

    return {
      timestamp: Date.now(),
      estimatedJSHeapSize: memory?.jsHeapSizeLimit ?? 0,
      totalJSHeapSize: memory?.totalJSHeapSize ?? 0,
      usedJSHeapSize: memory?.usedJSHeapSize ?? 0,
      componentCount: typeof document !== "undefined" ? document.querySelectorAll("*").length : 0,
      storeCount: 14, // Phase 10: 11 Zustand stores + 3 React Query caches
    };
  }

  private toMB(bytes: number): number {
    return bytes / (1024 * 1024);
  }

  private notifyListeners(snapshot: MemorySnapshot): void {
    this.listeners.forEach((fn) => {
      try {
        fn(snapshot);
      } catch {
        // prevent one bad listener from breaking others
      }
    });
  }
}

export function getMemoryMonitor(): MemoryMonitor {
  return MemoryMonitor.getInstance();
}
