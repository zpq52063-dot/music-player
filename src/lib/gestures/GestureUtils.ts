/**
 * Phase 14 — 手势工具集
 *
 * 为 Fullscreen Player、Queue Panel、Lyrics 提供原生级别的手势支持。
 * 不依赖第三方手势库，全部基于原始 Touch 事件实现。
 *
 * 特性:
 * - Rubber band 阻尼（超越边界时的弹性阻力）
 * - Velocity-based 关闭检测
 * - Inertia scrolling（惯性滚动）
 * - Seek snapping（歌词行吸附跳转）
 */

// ==================== Rubber Band ====================

/**
 * 橡皮筋阻尼函数
 * 当拖动超过边界时，施加递增阻力，模拟 iOS 弹性效果
 *
 * @param offset   当前偏移量（px）
 * @param limit    边界阈值（px），超出此值阻力急剧增大
 * @param tension  张力系数，默认 0.55
 * @returns        阻尼后的偏移量
 */
export function rubberBand(offset: number, limit: number, tension = 0.55): number {
  if (Math.abs(offset) <= limit) return offset;

  const excess = Math.abs(offset) - limit;
  const damped = limit + limit * Math.tanh((excess * tension) / limit);

  return offset > 0 ? damped : -damped;
}

// ==================== Velocity ====================

export interface VelocityTracker {
  /** 记录触摸点 */
  record(position: number, timestamp: number): void;
  /** 获取当前速度（px/ms） */
  getVelocity(): number;
  /** 重置 */
  reset(): void;
}

/**
 * 创建速度追踪器
 * 保留最近 N 个采样点，用加权平均计算速度
 */
export function createVelocityTracker(sampleCount = 5): VelocityTracker {
  const samples: Array<{ position: number; time: number }> = [];

  return {
    record(position: number, timestamp: number) {
      samples.push({ position, time: timestamp });
      if (samples.length > sampleCount) {
        samples.shift();
      }
    },

    getVelocity(): number {
      if (samples.length < 2) return 0;

      let totalWeight = 0;
      let weightedVelocity = 0;

      for (let i = 1; i < samples.length; i++) {
        const cur = samples[i]!;
        const prev = samples[i - 1]!;
        const dt = cur.time - prev.time;
        const dp = cur.position - prev.position;
        if (dt > 0) {
          // 近期样本权重更高
          const weight = i / samples.length;
          weightedVelocity += (dp / dt) * weight;
          totalWeight += weight;
        }
      }

      return totalWeight > 0 ? weightedVelocity / totalWeight : 0;
    },

    reset() {
      samples.length = 0;
    },
  };
}

// ==================== Dismiss Threshold ====================

/**
 * 判断是否应该关闭面板
 * 满足任一条件即关闭：
 * 1. 速度超过阈值且方向正确
 * 2. 位移超过阈值
 */
export function shouldDismiss(
  offset: number,
  velocity: number,
  velocityThreshold: number,
  distanceThreshold: number,
): boolean {
  const absVelocity = Math.abs(velocity);
  const absOffset = Math.abs(offset);

  const sameDirection =
    (offset > 0 && velocity > 0) || (offset < 0 && velocity < 0);

  if (absVelocity > velocityThreshold && sameDirection) return true;
  if (absOffset > distanceThreshold) return true;

  return false;
}

// ==================== Inertia Scrolling ====================

export interface InertiaState {
  /** 当前位置 */
  position: number;
  /** 当前速度 */
  velocity: number;
  /** 是否正在滚动 */
  scrolling: boolean;
}

/**
 * 惯性滚动计算
 * 每帧调用，返回新位置和剩余速度
 *
 * @param state     当前惯性状态
 * @param deltaMs   距离上一帧的毫秒数
 * @param friction  摩擦系数，默认 0.95
 * @param minVel    最小速度阈值，低于此值停止
 * @returns         更新后的状态
 */
export function applyInertia(
  state: InertiaState,
  deltaMs: number,
  friction = 0.95,
  minVel = 0.01,
): InertiaState {
  const frames = deltaMs / 16.67; // 归一化到 60fps
  let velocity = state.velocity;
  let position = state.position;

  for (let i = 0; i < Math.round(frames); i++) {
    position += velocity * 16.67;
    velocity *= friction;
  }

  const scrolling = Math.abs(velocity) > minVel;

  return { position, velocity, scrolling };
}

// ==================== Snap ====================

/**
 * 寻找最近的吸附点
 */
export function snapToNearest(value: number, snapPoints: number[]): number {
  if (snapPoints.length === 0) return value;

  let closest = snapPoints[0]!;
  let minDist = Math.abs(value - closest);

  for (let i = 1; i < snapPoints.length; i++) {
    const pt = snapPoints[i]!;
    const dist = Math.abs(value - pt);
    if (dist < minDist) {
      minDist = dist;
      closest = pt;
    }
  }

  return closest;
}

// ==================== Clamp ====================

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ==================== Easing ====================

/** Spring-like ease-out for gesture release animations */
export function springEaseOut(t: number): number {
  // custom spring: fast start, gentle settle
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 1 - Math.pow(1 - t, 3);
}
