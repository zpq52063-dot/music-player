"use client";

import { isFeatureEnabled } from "@/system/monitor/ReleaseMode";
import { DebugOverlay } from "./DebugOverlay";

/**
 * 条件渲染 DebugOverlay (仅 debug 模式)
 */
export function DebugOverlayWrapper() {
  if (!isFeatureEnabled("debugOverlay")) return null;
  return <DebugOverlay />;
}
