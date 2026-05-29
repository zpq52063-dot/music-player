/**
 * Phase 9 — Release Mode 管理
 *
 * 三种模式:
 * - debug: 全部功能开启 (开发)
 * - internal: 调试功能隐藏, 遥测开启 (内部测试)
 * - release: 最小集合, 仅核心系统 (生产)
 *
 * 模式决定:
 * - NEXT_PUBLIC_RELEASE_MODE=debug|internal|release
 * - 默认: debug (开发模式)
 */

import type { ReleaseMode, ReleaseConfig } from "@/types";
import { RELEASE_CONFIGS } from "@/types";

export function getReleaseMode(): ReleaseMode {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_RELEASE_MODE as ReleaseMode ?? "debug";
  }
  return (process.env.NEXT_PUBLIC_RELEASE_MODE as ReleaseMode) ?? "debug";
}

export function getReleaseConfig(): ReleaseConfig {
  const mode = getReleaseMode();
  return RELEASE_CONFIGS[mode] ?? RELEASE_CONFIGS.debug;
}

export function isFeatureEnabled(feature: keyof ReleaseConfig["features"]): boolean {
  const config = getReleaseConfig();
  return config.features[feature] ?? false;
}

export function isDebugMode(): boolean {
  return getReleaseMode() === "debug";
}

export function isReleaseMode(): boolean {
  return getReleaseMode() === "release";
}
