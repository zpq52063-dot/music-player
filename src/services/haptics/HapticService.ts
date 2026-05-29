/**
 * Phase 14 — 触觉反馈服务
 *
 * iOS Safari 优先，使用 navigator.vibrate（短期振动模拟）
 * 统一入口，所有触觉反馈通过此服务调用
 */

type HapticStyle = "light" | "medium" | "heavy" | "selection" | "success" | "warning" | "error";

// 振动时长映射（ms）
const DURATION: Record<HapticStyle, number> = {
  light: 10,
  medium: 15,
  heavy: 20,
  selection: 5,
  success: [10, 30, 10] as unknown as number, // pattern
  warning: 30,
  error: [20, 50, 20] as unknown as number,
};

class HapticService {
  private static instance: HapticService | null = null;
  private enabled = true;

  static getInstance(): HapticService {
    if (!HapticService.instance) {
      HapticService.instance = new HapticService();
    }
    return HapticService.instance;
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
  }

  trigger(style: HapticStyle): void {
    if (!this.enabled) return;

    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        const duration = DURATION[style];
        if (Array.isArray(duration)) {
          navigator.vibrate(duration);
        } else {
          navigator.vibrate(duration);
        }
      }
      // iOS fallback: no vibrate API, silently ignore
    } catch {
      // best effort
    }
  }

  // 便捷方法
  light(): void {
    this.trigger("light");
  }
  medium(): void {
    this.trigger("medium");
  }
  heavy(): void {
    this.trigger("heavy");
  }
  selection(): void {
    this.trigger("selection");
  }
  success(): void {
    this.trigger("success");
  }
  warning(): void {
    this.trigger("warning");
  }
  error(): void {
    this.trigger("error");
  }
}

export const hapticService = HapticService.getInstance();
