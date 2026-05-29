/**
 * Phase 17 — Provider Telemetry (增强版)
 * Phase 20C — Production Telemetry Cleanup (sampling, production-safe, privacy-safe)
 *
 * 在 TelemetryService 基础上新增精细化的 Provider 指标:
 * - success rate / failure rate
 * - average latency / P50 / P95
 * - timeout count
 * - fallback count
 * - hourly breakdown
 *
 * Phase 20C additions:
 * - Sampling: only records fraction of events in production
 * - Production-safe: no console.* in production, structured data only
 * - Privacy-safe: no PII, no user-identifiable data, anonymous aggregation
 *
 * 存储: localStorage 环形 buffer
 */

import type { ProviderMetricsV2, ProviderTelemetrySnapshot } from "@/types";
import { getTelemetry } from "@/system/telemetry/TelemetryService";

const STORAGE_KEY = "music_provider_telemetry";
const MAX_LATENCY_SAMPLES = 100;
const MAX_HOURLY_BUCKETS = 48;

// Phase 20C: Sampling & privacy configuration
const PRODUCTION_SAMPLE_RATE = 0.1; // 10% sampling in production
const DEV_SAMPLE_RATE = 1.0; // 100% sampling in dev

function createMetrics(providerType: string): ProviderMetricsV2 {
  return {
    providerType,
    totalRequests: 0,
    totalSuccesses: 0,
    totalFailures: 0,
    totalTimeouts: 0,
    totalFallbacks: 0,
    avgLatencyMs: 0,
    p50LatencyMs: 0,
    p95LatencyMs: 0,
    lastRequestTime: 0,
    successRate: 1,
    failureRate: 0,
    recentLatencies: [],
    hourlyRequests: [],
  };
}

export class ProviderTelemetry {
  private static instance: ProviderTelemetry | null = null;

  private snapshot: ProviderTelemetrySnapshot;
  private saveTimer: ReturnType<typeof setInterval> | null = null;
  private sampleRate: number;

  private constructor() {
    this.snapshot = this.loadFromStorage() ?? {
      providers: {},
      globalFallbackCount: 0,
      totalRequests: 0,
      timestamp: Date.now(),
    };
    this.sampleRate =
      process.env.NODE_ENV === "production" ? PRODUCTION_SAMPLE_RATE : DEV_SAMPLE_RATE;
  }

  static getInstance(): ProviderTelemetry {
    if (!ProviderTelemetry.instance) {
      ProviderTelemetry.instance = new ProviderTelemetry();
    }
    return ProviderTelemetry.instance;
  }

  // ==================== Lifecycle ====================

  start(): void {
    this.saveTimer = setInterval(() => this.persist(), 60000); // Phase 20C: reduced from 30s to 60s
  }

  stop(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
    this.persist();
  }

  // Phase 20C: Set sample rate dynamically (e.g. reduce on low-power)
  setSampleRate(rate: number): void {
    this.sampleRate = Math.max(0, Math.min(1, rate));
  }

  getSampleRate(): number {
    return this.sampleRate;
  }

  // ==================== Record ====================

  /** Phase 20C: Now samples events based on configured rate. Always records fallbacks/timeouts. */
  recordRequest(params: {
    providerType: string;
    success: boolean;
    latencyMs: number;
    isTimeout: boolean;
    isFallback: boolean;
  }): void {
    const { providerType, success, latencyMs, isTimeout, isFallback } = params;

    // Phase 20C: Always record errors/fallbacks; sample successes
    const isImportant = !success || isTimeout || isFallback;
    if (!isImportant && Math.random() > this.sampleRate) return;

    let metrics = this.snapshot.providers[providerType];
    if (!metrics) {
      metrics = createMetrics(providerType);
      this.snapshot.providers[providerType] = metrics;
    }

    // 基础计数
    metrics.totalRequests++;
    if (success) {
      metrics.totalSuccesses++;
    } else {
      metrics.totalFailures++;
    }
    if (isTimeout) metrics.totalTimeouts++;
    if (isFallback) metrics.totalFallbacks++;

    metrics.lastRequestTime = Date.now();

    // 延迟统计
    metrics.recentLatencies.push(latencyMs);
    if (metrics.recentLatencies.length > MAX_LATENCY_SAMPLES) {
      metrics.recentLatencies = metrics.recentLatencies.slice(-MAX_LATENCY_SAMPLES);
    }

    // EMA 平均延迟
    metrics.avgLatencyMs = metrics.avgLatencyMs * 0.7 + latencyMs * 0.3;

    // P50 / P95
    metrics.p50LatencyMs = this.percentile(metrics.recentLatencies, 50);
    metrics.p95LatencyMs = this.percentile(metrics.recentLatencies, 95);

    // 成功率/失败率
    metrics.successRate =
      metrics.totalRequests > 0 ? metrics.totalSuccesses / metrics.totalRequests : 1;
    metrics.failureRate =
      metrics.totalRequests > 0 ? metrics.totalFailures / metrics.totalRequests : 0;

    // 小时桶
    this.recordHourly(metrics, success);

    // Global
    this.snapshot.totalRequests++;
    if (isFallback) this.snapshot.globalFallbackCount++;

    this.snapshot.timestamp = Date.now();

    // 同步到 TelemetryService
    getTelemetry().recordProviderRequest(providerType, success, latencyMs);
  }

  recordTimeout(providerType: string, latencyMs: number): void {
    this.recordRequest({ providerType, success: false, latencyMs, isTimeout: true, isFallback: false });
  }

  recordFallback(fromProvider: string, toProvider: string): void {
    this.snapshot.globalFallbackCount++;
    this.snapshot.timestamp = Date.now();
    // 标记原 provider 的 fallback
    const metrics = this.snapshot.providers[fromProvider];
    if (metrics) {
      metrics.totalFallbacks++;
      metrics.totalFailures++;
      metrics.failureRate =
        metrics.totalRequests > 0 ? metrics.totalFailures / metrics.totalRequests : 0;
    }
    getTelemetry().record({
      name: "provider.fallback",
      value: 1,
      tags: { from: fromProvider, to: toProvider },
      timestamp: Date.now(),
    });
  }

  // ==================== Snapshot ====================

  getSnapshot(): ProviderTelemetrySnapshot {
    return {
      ...this.snapshot,
      providers: { ...this.snapshot.providers },
      timestamp: Date.now(),
    };
  }

  getProviderMetrics(providerType: string): ProviderMetricsV2 | null {
    return this.snapshot.providers[providerType] ?? null;
  }

  // ==================== Helpers ====================

  private recordHourly(metrics: ProviderMetricsV2, success: boolean): void {
    const hour = new Date().toISOString().slice(0, 13);
    let bucket = metrics.hourlyRequests.find((b) => b.hour === hour);
    if (!bucket) {
      bucket = { hour, requests: 0, successes: 0, failures: 0 };
      metrics.hourlyRequests.push(bucket);
      if (metrics.hourlyRequests.length > MAX_HOURLY_BUCKETS) {
        metrics.hourlyRequests = metrics.hourlyRequests.slice(-MAX_HOURLY_BUCKETS);
      }
    }
    bucket.requests++;
    if (success) {
      bucket.successes++;
    } else {
      bucket.failures++;
    }
  }

  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const arr = [...sorted].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * arr.length) - 1;
    return arr[Math.max(0, Math.min(idx, arr.length - 1))] ?? 0;
  }

  // ==================== Persistence (Phase 20C: production-safe) ====================

  private persist(): void {
    try {
      // Phase 20C: Compact data for storage — strip detailed latencies in production
      const isProd = process.env.NODE_ENV === "production";
      const compact: ProviderTelemetrySnapshot = {
        providers: Object.fromEntries(
          Object.entries(this.snapshot.providers).map(([k, v]) => [
            k,
            {
              ...v,
              recentLatencies: isProd ? v.recentLatencies.slice(-5) : v.recentLatencies.slice(-20),
              hourlyRequests: v.hourlyRequests.slice(-24),
            },
          ]),
        ),
        globalFallbackCount: this.snapshot.globalFallbackCount,
        totalRequests: this.snapshot.totalRequests,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compact));
    } catch {
      // localStorage full — non-critical, silently ignore
    }
  }

  private loadFromStorage(): ProviderTelemetrySnapshot | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ProviderTelemetrySnapshot;
        if (parsed.providers) return parsed;
      }
    } catch {
      // ignore — corrupt data is non-critical
    }
    return null;
  }

  clear(): void {
    this.snapshot = {
      providers: {},
      globalFallbackCount: 0,
      totalRequests: 0,
      timestamp: Date.now(),
    };
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  destroy(): void {
    this.stop();
    ProviderTelemetry.instance = null;
  }
}

export function getProviderTelemetry(): ProviderTelemetry {
  return ProviderTelemetry.getInstance();
}
