/**
 * Phase 9 — 遥测服务
 *
 * 职责:
 * - 收集 Provider 指标 (请求数/成功率/延迟)
 * - 收集播放指标 (播放次数/卡顿/跳过/错误)
 * - 收集缓存指标 (命中率/驱逐量/大小)
 * - 收集启动指标 (TTI/恢复时间)
 * - 导出 JSON (仅debug模式)
 *
 * 环形buffer存储, localStorage持久化(限制大小)
 */

import type { TelemetryMetric, TelemetrySnapshot } from "@/types";

const STORAGE_KEY = "music_telemetry";
const MAX_METRICS = 1000;

function createEmptySnapshot(): TelemetrySnapshot {
  return {
    provider: {},
    playback: {
      totalPlays: 0,
      totalStalls: 0,
      totalSkips: 0,
      totalErrors: 0,
      totalWatchdogRecoveries: 0,
      avgSessionDurationMs: 0,
      sessionStartTime: Date.now(),
    },
    cache: {
      memoryHitRate: 0,
      indexedDBHitRate: 0,
      swHitRate: 0,
      totalEvictions: 0,
      totalSizeEstimate: 0,
    },
    startup: {
      appStartTime: Date.now(),
      timeToInteractive: 0,
      recoveryTime: 0,
      lastStartupTimestamp: 0,
    },
    timestamp: Date.now(),
  };
}

export class TelemetryService {
  private static instance: TelemetryService | null = null;

  private metrics: TelemetryMetric[] = [];
  private snapshot: TelemetrySnapshot;
  private saveTimer: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    this.snapshot = this.loadFromStorage() ?? createEmptySnapshot();
  }

  static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  // ==================== Lifecycle ====================

  start(): void {
    this.snapshot.startup.appStartTime = Date.now();
    this.snapshot.startup.lastStartupTimestamp = Date.now();

    // 定期持久化
    this.saveTimer = setInterval(() => {
      this.persist();
    }, 30000);
  }

  stop(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
    this.persist();
  }

  // ==================== Record ====================

  record(metric: TelemetryMetric): void {
    metric.timestamp = metric.timestamp || Date.now();
    this.metrics.push(metric);

    if (this.metrics.length > MAX_METRICS) {
      this.metrics = this.metrics.slice(-MAX_METRICS);
    }

    // 更新快照中的对应指标
    this.updateSnapshotFromMetric(metric);
  }

  /** 便捷方法: 记录播放事件 */
  recordPlay(songId: string): void {
    this.snapshot.playback.totalPlays++;
    this.record({
      name: "playback.play",
      value: 1,
      tags: { songId },
      timestamp: Date.now(),
    });
  }

  /** 便捷方法: 记录卡顿 */
  recordStall(songId: string): void {
    this.snapshot.playback.totalStalls++;
    this.record({
      name: "playback.stall",
      value: 1,
      tags: { songId },
      timestamp: Date.now(),
    });
  }

  /** 便捷方法: 记录跳过 */
  recordSkip(songId: string): void {
    this.snapshot.playback.totalSkips++;
    this.record({
      name: "playback.skip",
      value: 1,
      tags: { songId },
      timestamp: Date.now(),
    });
  }

  /** 便捷方法: 记录错误 */
  recordError(category: string, error: string): void {
    this.snapshot.playback.totalErrors++;
    this.record({
      name: `error.${category}`,
      value: 1,
      tags: { error },
      timestamp: Date.now(),
    });
  }

  /** 便捷方法: 记录看门狗恢复 */
  recordWatchdogRecovery(action: string, success: boolean): void {
    if (success) {
      this.snapshot.playback.totalWatchdogRecoveries++;
    }
    this.record({
      name: "watchdog.recovery",
      value: success ? 1 : 0,
      tags: { action },
      timestamp: Date.now(),
    });
  }

  /** 便捷方法: 记录 Provider 请求 */
  recordProviderRequest(type: string, success: boolean, latencyMs: number): void {
    const existing = this.snapshot.provider[type];
    if (existing) {
      existing.totalRequests++;
      if (success) {
        existing.totalSuccesses++;
      } else {
        existing.totalFailures++;
      }
      // 指数移动平均延迟
      existing.avgLatencyMs = existing.avgLatencyMs * 0.7 + latencyMs * 0.3;
      existing.lastRequestTime = Date.now();
    } else {
      this.snapshot.provider[type] = {
        providerType: type,
        totalRequests: 1,
        totalSuccesses: success ? 1 : 0,
        totalFailures: success ? 0 : 1,
        avgLatencyMs: latencyMs,
        lastRequestTime: Date.now(),
      };
    }
    this.record({
      name: "provider.request",
      value: latencyMs,
      tags: { type, success: String(success) },
      timestamp: Date.now(),
    });
  }

  /** 便捷方法: 记录缓存操作 */
  recordCacheHit(layer: "memory" | "indexeddb" | "sw"): void {
    this.record({
      name: `cache.hit.${layer}`,
      value: 1,
      tags: { layer },
      timestamp: Date.now(),
    });
  }

  recordCacheMiss(layer: "memory" | "indexeddb" | "sw"): void {
    this.record({
      name: `cache.miss.${layer}`,
      value: 1,
      tags: { layer },
      timestamp: Date.now(),
    });
  }

  // ==================== Snapshot ====================

  getSnapshot(): TelemetrySnapshot {
    return {
      ...this.snapshot,
      timestamp: Date.now(),
    };
  }

  updateSnapshot(partial: Partial<TelemetrySnapshot>): void {
    this.snapshot = {
      ...this.snapshot,
      ...partial,
      timestamp: Date.now(),
    };
  }

  setTimeToInteractive(ms: number): void {
    this.snapshot.startup.timeToInteractive = ms;
  }

  setRecoveryTime(ms: number): void {
    this.snapshot.startup.recoveryTime = ms;
  }

  // ==================== Export ====================

  exportJSON(): string {
    return JSON.stringify({
      snapshot: this.snapshot,
      metricsCount: this.metrics.length,
      metrics: this.metrics.slice(-200), // 只导出最近200条
    }, null, 2);
  }

  clear(): void {
    this.metrics = [];
    this.snapshot = createEmptySnapshot();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // silently fail
    }
  }

  // ==================== Persistence ====================

  private persist(): void {
    try {
      const data = {
        snapshot: this.snapshot,
        metricsCount: this.metrics.length,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage full
    }
  }

  private loadFromStorage(): TelemetrySnapshot | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { snapshot: TelemetrySnapshot };
        if (parsed.snapshot) return parsed.snapshot;
      }
    } catch {
      // silently fail
    }
    return null;
  }

  // ==================== Private ====================

  private updateSnapshotFromMetric(metric: TelemetryMetric): void {
    // 缓存命中率计算
    if (metric.name.startsWith("cache.")) {
      const layer = metric.tags.layer as "memory" | "indexeddb" | "sw" | undefined;
      if (layer) {
        if (metric.name.includes(".hit.")) {
          const existing = this.snapshot.cache;
          const currentRate =
            layer === "memory"
              ? existing.memoryHitRate
              : layer === "indexeddb"
                ? existing.indexedDBHitRate
                : existing.swHitRate;

          const newRate = currentRate * 0.9 + 1 * 0.1; // EMA
          if (layer === "memory") existing.memoryHitRate = newRate;
          else if (layer === "indexeddb") existing.indexedDBHitRate = newRate;
          else existing.swHitRate = newRate;
        }
      }
    }
  }

  destroy(): void {
    this.stop();
    TelemetryService.instance = null;
  }
}

export function getTelemetry(): TelemetryService {
  return TelemetryService.getInstance();
}
