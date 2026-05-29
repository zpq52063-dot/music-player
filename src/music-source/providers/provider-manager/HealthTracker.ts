import type { ProviderType } from "../../types/provider";
import type { ProviderHealthSnapshot, ProviderHealthMap } from "@/types/provider";

// ==================== 健康检测配置 ====================

interface HealthConfig {
  /** 滑动窗口大小 (请求次数) */
  windowSize: number;
  /** 最少请求次数 (达到后才计算成功率) */
  minRequests: number;
  /** 连续失败阈值 (超过则标记 unhealthy) */
  consecutiveFailThreshold: number;
  /** 成功率阈值 (低于此值标记 unhealthy) */
  successRateThreshold: number;
  /** 平均延迟阈值 (ms) */
  latencyThreshold: number;
  /** 延迟窗口大小 */
  latencyWindowSize: number;
}

const DEFAULT_HEALTH_CONFIG: HealthConfig = {
  windowSize: 100,
  minRequests: 10,
  consecutiveFailThreshold: 3,
  successRateThreshold: 0.5,
  latencyThreshold: 10000,
  latencyWindowSize: 10,
};

// ==================== HealthTracker ====================

export class HealthTracker {
  private config: HealthConfig;
  private latencyWindows: Map<ProviderType, number[]> = new Map();
  private successCounts: Map<ProviderType, number> = new Map();
  private failCounts: Map<ProviderType, number> = new Map();
  private consecutiveFails: Map<ProviderType, number> = new Map();
  private lastCheckTimes: Map<ProviderType, number> = new Map();
  private lastSuccessTimes: Map<ProviderType, number> = new Map();

  constructor(config?: Partial<HealthConfig>) {
    this.config = { ...DEFAULT_HEALTH_CONFIG, ...config };
  }

  /** 记录一次成功请求 */
  recordSuccess(type: ProviderType, latencyMs: number): void {
    this.ensureProvider(type);

    // 更新延迟窗口
    const latencies = this.latencyWindows.get(type)!;
    latencies.push(latencyMs);
    if (latencies.length > this.config.latencyWindowSize) {
      latencies.shift();
    }

    // 更新计数
    this.successCounts.set(type, (this.successCounts.get(type) ?? 0) + 1);
    this.consecutiveFails.set(type, 0);

    // 修剪窗口
    this.trimWindow(type);

    // 更新时间戳
    const now = Date.now();
    this.lastCheckTimes.set(type, now);
    this.lastSuccessTimes.set(type, now);
  }

  /** 记录一次失败请求 */
  recordFailure(type: ProviderType): void {
    this.ensureProvider(type);

    this.failCounts.set(type, (this.failCounts.get(type) ?? 0) + 1);
    this.consecutiveFails.set(type, (this.consecutiveFails.get(type) ?? 0) + 1);
    this.lastCheckTimes.set(type, Date.now());

    this.trimWindow(type);
  }

  /** 获取 provider 健康快照 */
  getSnapshot(type: ProviderType): ProviderHealthSnapshot {
    this.ensureProvider(type);

    const latencies = this.latencyWindows.get(type)!;
    const success = this.successCounts.get(type) ?? 0;
    const fail = this.failCounts.get(type) ?? 0;
    const total = success + fail;
    const consecutive = this.consecutiveFails.get(type) ?? 0;

    const avgLatency =
      latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;

    const successRate = total >= this.config.minRequests ? success / total : 1;

    const healthy = this.evaluateHealthy(type, consecutive, successRate, avgLatency);

    return {
      avgLatency: Math.round(avgLatency),
      successRate: Math.round(successRate * 100),
      consecutiveFailures: consecutive,
      totalRequests: total,
      totalSuccesses: success,
      healthy,
      lastCheckTime: this.lastCheckTimes.get(type) ?? 0,
      lastSuccessTime: this.lastSuccessTimes.get(type) ?? 0,
    };
  }

  /** 获取所有 provider 健康快照 */
  getAllSnapshots(): ProviderHealthMap {
    const map: ProviderHealthMap = {};
    for (const type of this.latencyWindows.keys()) {
      map[type] = this.getSnapshot(type);
    }
    return map;
  }

  /** 检查 provider 是否健康 */
  isHealthy(type: ProviderType): boolean {
    return this.getSnapshot(type).healthy;
  }

  /** 重置某个 provider 的健康数据 */
  reset(type: ProviderType): void {
    this.latencyWindows.delete(type);
    this.successCounts.delete(type);
    this.failCounts.delete(type);
    this.consecutiveFails.delete(type);
    this.lastCheckTimes.delete(type);
    this.lastSuccessTimes.delete(type);
  }

  /** 重置所有数据 */
  resetAll(): void {
    this.latencyWindows.clear();
    this.successCounts.clear();
    this.failCounts.clear();
    this.consecutiveFails.clear();
    this.lastCheckTimes.clear();
    this.lastSuccessTimes.clear();
  }

  // ==================== Private ====================

  private ensureProvider(type: ProviderType): void {
    if (!this.latencyWindows.has(type)) {
      this.latencyWindows.set(type, []);
      this.successCounts.set(type, 0);
      this.failCounts.set(type, 0);
      this.consecutiveFails.set(type, 0);
    }
  }

  private evaluateHealthy(
    type: ProviderType,
    consecutive: number,
    successRate: number,
    avgLatency: number,
  ): boolean {
    // mock provider 永远健康
    if (type === "mock") return true;

    // 连续失败过多
    if (consecutive >= this.config.consecutiveFailThreshold) return false;

    // 成功率过低 (至少有一定请求量)
    const total = (this.successCounts.get(type) ?? 0) + (this.failCounts.get(type) ?? 0);
    if (total >= this.config.minRequests && successRate < this.config.successRateThreshold) {
      return false;
    }

    // 延迟过高 (至少有一定请求量)
    if (total >= this.config.minRequests && avgLatency > this.config.latencyThreshold) {
      return false;
    }

    return true;
  }

  private trimWindow(type: ProviderType): void {
    const success = this.successCounts.get(type) ?? 0;
    const fail = this.failCounts.get(type) ?? 0;
    const total = success + fail;

    if (total > this.config.windowSize) {
      // 简单策略：超过窗口大小时减半
      this.successCounts.set(type, Math.floor(success / 2));
      this.failCounts.set(type, Math.floor(fail / 2));
    }
  }
}

/** 全局单例 */
let _healthTracker: HealthTracker | null = null;

export function getHealthTracker(): HealthTracker {
  if (!_healthTracker) _healthTracker = new HealthTracker();
  return _healthTracker;
}
